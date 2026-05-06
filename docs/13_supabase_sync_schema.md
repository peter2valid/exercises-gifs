# Supabase Distributed Sync Schema

Execute this in the Supabase SQL Editor to enable the persistent events store.

```sql
BEGIN;

-- 1. Create the events table
-- This is the "Immutable Log" for all application actions.
CREATE TABLE IF NOT EXISTS public.events (
    server_sequence BIGSERIAL PRIMARY KEY, -- Global order
    id UUID UNIQUE NOT NULL,               -- Client-generated deterministic ID
    type TEXT NOT NULL,                    -- Event type (SESSION_STARTED, etc.)
    payload JSONB NOT NULL,                -- Event data
    session_id TEXT NOT NULL,              -- Cross-device session identifier
    tenant_id TEXT NOT NULL DEFAULT 'default',
    device_id TEXT NOT NULL,
    idempotency_key TEXT UNIQUE NOT NULL,  -- Unique constraint for exactly-once delivery
    created_at TIMESTAMPTZ NOT NULL,       -- Client-side timestamp
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- Server-side arrival time
    version INTEGER NOT NULL DEFAULT 1
);

-- 2. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_tenant_sequence ON public.events (tenant_id, server_sequence);
CREATE INDEX IF NOT EXISTS idx_events_session ON public.events (session_id);
CREATE INDEX IF NOT EXISTS idx_events_device ON public.events (device_id);

-- 3. Row Level Security (RLS)
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Note: In Phase 2C, we allow anon access for simplicity during the first real-backend pass.
-- In Phase 2D (Auth), we will restrict this to authenticated users only.
CREATE POLICY "Enable public access for sync (Phase 2C)"
    ON public.events
    FOR ALL
    TO anon
    USING (TRUE)
    WITH CHECK (TRUE);

COMMIT;
```
