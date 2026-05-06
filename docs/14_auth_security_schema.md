# Supabase Auth & RLS Schema

Execute this in the Supabase SQL Editor to secure the system.

```sql
BEGIN;

-- 1. Ensure user_id is a UUID and matches auth.users
-- We already have tenant_id, but we need to link data to a real user.
-- Note: If you have existing data, you might need to handle NULLs or defaults.
ALTER TABLE public.events 
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- 2. Update existing policies or create new ones
-- We want gym isolation (tenant_id) and user-level privacy within that tenant.
-- For now, let's assume 1 user = 1 tenant for simplicity, or use a lookup table.

-- Drop the wide-open Phase 2C policy
DROP POLICY IF EXISTS "Enable public access for sync (Phase 2C)" ON public.events;

-- Policy: Users can only see events for their own user_id
CREATE POLICY "Users can select their own events"
    ON public.events
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Policy: Users can only push events for their own user_id
CREATE POLICY "Users can insert their own events"
    ON public.events
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- 3. Tenant Isolation (Gyms)
-- In a real SaaS, you'd have a `memberships` table: user_id -> tenant_id.
-- For this pass, we will ensure that the tenant_id pushed by the client 
-- matches the user's assigned tenant (stored in user metadata or a profile table).

COMMIT;
```
