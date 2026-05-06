# Supabase Server-Side Projections

Execute this in the Supabase SQL Editor to enable management-level data querying.

```sql
BEGIN;

-- 1. Create projection tables (Matches Dexie schema but for all users)
-- This allows for fast aggregation, coaching views, and analytics.

CREATE TABLE IF NOT EXISTS public.workout_sessions (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    tenant_id TEXT NOT NULL DEFAULT 'default',
    status TEXT NOT NULL, -- active, completed, abandoned
    started_at TIMESTAMPTZ NOT NULL,
    finished_at TIMESTAMPTZ,
    version INTEGER NOT NULL DEFAULT 1,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.set_logs (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
    exercise_id TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    tenant_id TEXT NOT NULL DEFAULT 'default',
    weight NUMERIC NOT NULL,
    reps INTEGER NOT NULL,
    logged_at TIMESTAMPTZ NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Indexes for fast aggregation
CREATE INDEX IF NOT EXISTS idx_sessions_user ON public.workout_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sets_session ON public.set_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_sets_user_exercise ON public.set_logs(user_id, exercise_id);

-- 3. Row Level Security (RLS)
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.set_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their own sessions" ON public.workout_sessions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can see their own sets" ON public.set_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 4. The Projection Engine (SQL Reducer)
-- This function acts like our `applyEvent.ts` but on the server.
CREATE OR REPLACE FUNCTION public.project_event_to_state()
RETURNS TRIGGER AS $$
DECLARE
    p JSONB := NEW.payload;
BEGIN
    IF NEW.type = 'SESSION_STARTED' THEN
        INSERT INTO public.workout_sessions (id, user_id, tenant_id, status, started_at, version)
        VALUES (p->>'session_id', NEW.user_id, NEW.tenant_id, 'active', (p->>'started_at')::TIMESTAMPTZ, 1)
        ON CONFLICT (id) DO UPDATE SET
            status = EXCLUDED.status,
            version = EXCLUDED.version;

    ELSIF NEW.type = 'SET_LOGGED' THEN
        INSERT INTO public.set_logs (id, session_id, exercise_id, user_id, tenant_id, weight, reps, logged_at, version)
        VALUES (p->>'set_id', p->>'session_id', p->>'exercise_id', NEW.user_id, NEW.tenant_id, (p->>'weight')::NUMERIC, (p->>'reps')::INTEGER, (p->>'logged_at')::TIMESTAMPTZ, 1)
        ON CONFLICT (id) DO NOTHING;

    ELSIF NEW.type = 'SET_EDITED' THEN
        UPDATE public.set_logs 
        SET weight = (p->>'weight')::NUMERIC, reps = (p->>'reps')::INTEGER, version = version + 1, updated_at = NOW()
        WHERE id = p->>'set_id';

    ELSIF NEW.type = 'SET_DELETED' THEN
        DELETE FROM public.set_logs WHERE id = p->>'set_id';

    ELSIF NEW.type = 'SESSION_COMPLETED' THEN
        UPDATE public.workout_sessions
        SET status = 'completed', finished_at = (p->>'finished_at')::TIMESTAMPTZ, version = version + 1, updated_at = NOW()
        WHERE id = p->>'session_id';

    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. The Trigger
-- Every time an event is synced, the server automatically updates the state tables.
DROP TRIGGER IF EXISTS trg_project_event ON public.events;
CREATE TRIGGER trg_project_event
AFTER INSERT ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.project_event_to_state();

COMMIT;
```
