# Supabase Complete Specification
# Viewora / GymApp — authoritative source of truth
# Generated: 2026-05-12
#
# PURPOSE: This document describes the EXACT state Supabase must be in.
# Audit everything in the project against this spec.
# Remove anything not listed. Add anything missing.
# No half-measures — wrong schema = broken sync, broken billing, broken auth.

---

## 0. CRITICAL BUGS TO FIX FIRST

Before auditing tables, fix these two issues that exist in the current codebase:

### BUG-1: `MEMBER_CHECKED_IN` missing from push route allowlist
File: `src/app/api/sync/push/route.ts`, line 5–12
The `VALID_EVENT_TYPES` set does not include `'MEMBER_CHECKED_IN'`.
Check-in events will be silently rejected (marked invalid, retryable: false) when
the client tries to sync them. Add `'MEMBER_CHECKED_IN'` to that set.

### BUG-2: Gym billing auth still uses legacy `admin_user_id`
File: `src/app/api/billing/initialize/route.ts`, function `initGymUpgrade`, line ~147
It checks `.eq('admin_user_id', user.id)` to verify the requester is a gym admin.
This bypasses the new `user_gym_roles` system. After migration 001 runs, this will
lock out gym_owner users who were added via user_gym_roles but whose user_id is not
in admin_user_id. Fix: also accept users with a gym_owner or gym_admin role in
user_gym_roles for this gym (use the `hasGymRole` function from `src/lib/auth/roles.ts`).

---

## 1. AUTHENTICATION SETTINGS

### Email Auth
- Provider: Email/Password → ENABLED
- Confirm email: ENABLED in production, disabled only in local dev
- Secure email change: ENABLED
- Double confirm email change: ENABLED

### Redirect URLs (must be whitelisted — add all of these)
- `http://localhost:3000/**`
- `https://app.gymapp.fun/**`
- `https://gymapp.fun/**`
- `https://www.gymapp.fun/**`
NOTE: The app uses cookie-based sessions via `@supabase/auth-helpers-nextjs`.
The callback URL is handled by Next.js, not a Supabase Edge Function.

### JWT Settings
- JWT expiry: 3600 (1 hour) — default is fine
- Refresh token rotation: ENABLED
- Refresh token reuse interval: 10 seconds

### Session
- Enable sessions: YES
- Inactivity timeout: none (PWA must not log users out while offline)

### Other providers
- All social providers (Google, Apple, etc.): DISABLED unless explicitly added later
- Phone auth: DISABLED

---

## 2. TABLES — EXACT SCHEMA

All tables are in the `public` schema unless stated otherwise.

---

### TABLE: `events`
The core append-only event log. This is synced from client → server via push route.
The pull route reads from this table. NEVER delete rows from this table.

```sql
CREATE TABLE IF NOT EXISTS public.events (
  id               uuid         NOT NULL,
  type             text         NOT NULL,
  payload          jsonb        NOT NULL DEFAULT '{}',
  session_id       text         NOT NULL,
  user_id          uuid         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id        text         NOT NULL DEFAULT 'default',
  device_id        text         NOT NULL DEFAULT 'local-browser',
  idempotency_key  text         NOT NULL,
  created_at       timestamptz  NOT NULL DEFAULT now(),
  version          int          NOT NULL DEFAULT 1,
  server_sequence  bigint       GENERATED ALWAYS AS IDENTITY,
  PRIMARY KEY (id),
  UNIQUE (idempotency_key)
);
```

**CRITICAL — `server_sequence`:**
Must be `GENERATED ALWAYS AS IDENTITY` (auto-set by Postgres, never user-supplied).
The pull route uses `.gt('server_sequence', since)` to paginate.
If this column is missing or user-writable the sync system breaks entirely.

**Valid values for `type`:**
`SESSION_STARTED`, `SET_LOGGED`, `REST_STARTED`, `SESSION_COMPLETED`,
`SET_EDITED`, `SET_DELETED`, `MEMBER_CHECKED_IN`

**Indexes:**
```sql
CREATE INDEX IF NOT EXISTS idx_events_user_seq      ON public.events (user_id, server_sequence ASC);
CREATE INDEX IF NOT EXISTS idx_events_session_id    ON public.events (session_id);
CREATE INDEX IF NOT EXISTS idx_events_idempotency   ON public.events (idempotency_key);
```
(The UNIQUE constraint on idempotency_key already creates an index. The explicit one is redundant — keep UNIQUE, skip the explicit idx_events_idempotency if it exists.)

**RLS:**
```sql
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Users can read only their own events (defense in depth — push/pull use service role)
CREATE POLICY "own_events_select" ON public.events
  FOR SELECT USING (user_id = auth.uid());

-- No INSERT/UPDATE/DELETE policies for users — all writes are via service role API only
```

---

### TABLE: `gyms`
One row per gym. `admin_user_id` is the legacy single-admin field — kept for backward
compatibility but `user_gym_roles` is now the authoritative access system.

```sql
CREATE TABLE IF NOT EXISTS public.gyms (
  id             uuid         DEFAULT gen_random_uuid() PRIMARY KEY,
  name           text         NOT NULL,
  admin_user_id  uuid         REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at     timestamptz  DEFAULT now(),
  updated_at     timestamptz  DEFAULT now()
);
```

**RLS:** (from migration 001 — verify it exists)
```sql
ALTER TABLE public.gyms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gym_admin_own_gym" ON public.gyms
  FOR ALL USING (
    admin_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.user_gym_roles ugr
      WHERE ugr.user_id = auth.uid()
        AND (ugr.gym_id = gyms.id OR ugr.role = 'super_admin')
    )
  );
```

**Trigger — `updated_at`:**
```sql
CREATE OR REPLACE TRIGGER set_gyms_updated_at
  BEFORE UPDATE ON public.gyms
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);
```

---

### TABLE: `gym_memberships`
Which users belong to which gym. This is also the source the entitlement system uses
to determine a user's primary gym (and thus their gym plan entitlements).

```sql
CREATE TABLE IF NOT EXISTS public.gym_memberships (
  id         uuid         DEFAULT gen_random_uuid() PRIMARY KEY,
  gym_id     uuid         NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  user_id    uuid         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       text         NOT NULL DEFAULT 'member'
                          CHECK (role IN ('member','trainer','gym_admin','gym_owner')),
  joined_at  timestamptz  DEFAULT now(),
  created_at timestamptz  DEFAULT now(),
  UNIQUE (user_id, gym_id)
);

CREATE INDEX IF NOT EXISTS idx_gym_memberships_user ON public.gym_memberships (user_id);
CREATE INDEX IF NOT EXISTS idx_gym_memberships_gym  ON public.gym_memberships (gym_id);
```

**RLS:** (from migration 001 — verify it exists)
```sql
ALTER TABLE public.gym_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_memberships" ON public.gym_memberships
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "gym_staff_memberships" ON public.gym_memberships
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_gym_roles ugr
      WHERE ugr.user_id = auth.uid()
        AND (ugr.gym_id = gym_memberships.gym_id OR ugr.role = 'super_admin')
        AND ugr.role IN ('super_admin','gym_owner','gym_admin','trainer')
    )
  );
```

---

### TABLE: `gym_subscriptions`
One row per gym. Upserted on conflict `gym_id` by billing routes.
Also read directly by the user-facing client (`supabase` client, not admin) in
`entitlementCache.ts` — so SELECT RLS is required.

```sql
CREATE TABLE IF NOT EXISTS public.gym_subscriptions (
  gym_id                uuid         NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  plan                  text         NOT NULL CHECK (plan IN ('start','active','elite')),
  status                text         NOT NULL DEFAULT 'active'
                                     CHECK (status IN ('active','trialing','past_due','canceled','paused','expired')),
  current_period_start  timestamptz,
  current_period_end    timestamptz,
  grace_period_end      timestamptz,
  canceled_at           timestamptz,
  updated_at            timestamptz  DEFAULT now(),
  PRIMARY KEY (gym_id)
);
```

**RLS:**
```sql
ALTER TABLE public.gym_subscriptions ENABLE ROW LEVEL SECURITY;

-- Gym members can read their gym's subscription (entitlementCache uses user client)
CREATE POLICY "gym_members_read_subscription" ON public.gym_subscriptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.gym_memberships gm
      WHERE gm.gym_id = gym_subscriptions.gym_id
        AND gm.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.user_gym_roles ugr
      WHERE ugr.user_id = auth.uid()
        AND (ugr.gym_id = gym_subscriptions.gym_id OR ugr.role = 'super_admin')
    )
  );

-- All writes are service-role only (billing routes use admin client)
```

**Trigger — `updated_at`:**
```sql
CREATE OR REPLACE TRIGGER set_gym_subscriptions_updated_at
  BEFORE UPDATE ON public.gym_subscriptions
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);
```

---

### TABLE: `user_subscriptions`
One row per user. Upserted on conflict `user_id` by billing routes.
Also read directly by user-facing client in `entitlementCache.ts`.

```sql
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  user_id               uuid         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan                  text         NOT NULL DEFAULT 'plus' CHECK (plan IN ('plus')),
  billing_period        text         NOT NULL DEFAULT 'monthly'
                                     CHECK (billing_period IN ('weekly','monthly','quarterly')),
  status                text         NOT NULL DEFAULT 'active'
                                     CHECK (status IN ('active','trialing','past_due','canceled','paused','expired')),
  current_period_start  timestamptz,
  current_period_end    timestamptz,
  grace_period_end      timestamptz,
  trial_ends_at         timestamptz,
  canceled_at           timestamptz,
  updated_at            timestamptz  DEFAULT now(),
  PRIMARY KEY (user_id)
);
```

**RLS:**
```sql
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can read their own subscription (entitlementCache uses user client)
CREATE POLICY "own_subscription_select" ON public.user_subscriptions
  FOR SELECT USING (user_id = auth.uid());

-- Super admins can read all
CREATE POLICY "super_admin_subscriptions" ON public.user_subscriptions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_gym_roles ugr
      WHERE ugr.user_id = auth.uid() AND ugr.role = 'super_admin'
    )
  );

-- All writes are service-role only (billing routes use admin client)
```

**Trigger — `updated_at`:**
```sql
CREATE OR REPLACE TRIGGER set_user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);
```

---

### TABLE: `payments`
One row per payment attempt. Reference is unique. Never modified by users.
Guards against duplicate payment activation via idempotency checks in billing routes.

```sql
CREATE TABLE IF NOT EXISTS public.payments (
  id                  uuid         DEFAULT gen_random_uuid() PRIMARY KEY,
  reference           text         NOT NULL UNIQUE,
  subject_type        text         NOT NULL
                                   CHECK (subject_type IN ('user_subscription','gym_subscription')),
  subject_id          text         NOT NULL,   -- user_id or gym_id as text
  amount_kobo         int          NOT NULL,
  currency            text         NOT NULL DEFAULT 'KES',
  status              text         NOT NULL DEFAULT 'pending'
                                   CHECK (status IN ('pending','success','failed','abandoned','reversed')),
  paystack_reference  text,
  verified_at         timestamptz,
  metadata            jsonb,
  created_at          timestamptz  DEFAULT now(),
  updated_at          timestamptz  DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_reference    ON public.payments (reference);
CREATE INDEX IF NOT EXISTS idx_payments_subject_spam ON public.payments (subject_id, status, created_at DESC);
```

**RLS:**
```sql
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- No user-facing SELECT — users never read the payments table directly
-- All access is via service role (billing API routes)
-- Super admin can read all payments
CREATE POLICY "super_admin_payments" ON public.payments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_gym_roles ugr
      WHERE ugr.user_id = auth.uid() AND ugr.role = 'super_admin'
    )
  );
```

**Trigger — `updated_at`:**
```sql
CREATE OR REPLACE TRIGGER set_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);
```

---

### TABLE: `webhook_events`
Audit log of every Paystack webhook received. Internal only — no user access.
Idempotency guard: `event_id` is unique.

```sql
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id           uuid         DEFAULT gen_random_uuid() PRIMARY KEY,
  provider     text         NOT NULL DEFAULT 'paystack',
  event_type   text         NOT NULL,
  event_id     text         NOT NULL UNIQUE,
  payload      jsonb        NOT NULL,
  processed_at timestamptz,
  created_at   timestamptz  DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id ON public.webhook_events (event_id);
```

**RLS:** (from migration 001 — verify)
```sql
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
-- No SELECT policies — internal audit records, service role only
```

---

### TABLE: `user_gym_roles`
The authoritative roles table. Replaces the legacy single `admin_user_id` column.
`gym_id = NULL` means the role is platform-wide (super_admin only).

```sql
CREATE TABLE IF NOT EXISTS public.user_gym_roles (
  id          uuid  DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid  NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gym_id      uuid  REFERENCES public.gyms(id) ON DELETE CASCADE,  -- NULL = super_admin
  role        text  NOT NULL
              CHECK (role IN ('super_admin','gym_owner','gym_admin','trainer','member')),
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  UNIQUE (user_id, gym_id, role)
);

CREATE INDEX IF NOT EXISTS idx_user_gym_roles_user ON public.user_gym_roles (user_id);
CREATE INDEX IF NOT EXISTS idx_user_gym_roles_gym  ON public.user_gym_roles (gym_id);
```

**RLS:** (from migration 001 — verify all three policies exist)
```sql
ALTER TABLE public.user_gym_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_roles_select" ON public.user_gym_roles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "super_admin_all" ON public.user_gym_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_gym_roles ugr
      WHERE ugr.user_id = auth.uid() AND ugr.role = 'super_admin'
    )
  );

CREATE POLICY "gym_admin_read_gym_roles" ON public.user_gym_roles
  FOR SELECT USING (
    gym_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.user_gym_roles ugr
      WHERE ugr.user_id = auth.uid()
        AND ugr.gym_id = user_gym_roles.gym_id
        AND ugr.role IN ('gym_owner','gym_admin')
    )
  );
```

**Trigger — `updated_at`:**
```sql
CREATE OR REPLACE TRIGGER set_user_gym_roles_updated_at
  BEFORE UPDATE ON public.user_gym_roles
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);
```

---

### TABLE: `member_check_ins`
Projection table for `MEMBER_CHECKED_IN` events. Written by the sync worker after
receiving these events server-side. The `id` column equals the `check_in_id` from
the event payload — this makes the table idempotent on re-sync.

```sql
CREATE TABLE IF NOT EXISTS public.member_check_ins (
  id               uuid         PRIMARY KEY,           -- = check_in_id from event payload
  gym_id           uuid         NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  member_user_id   uuid         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  checked_in_at    timestamptz  NOT NULL,
  method           text         NOT NULL CHECK (method IN ('qr_scan','manual')),
  staff_user_id    uuid         REFERENCES auth.users(id),
  created_at       timestamptz  DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_check_ins_gym    ON public.member_check_ins (gym_id, checked_in_at DESC);
CREATE INDEX IF NOT EXISTS idx_check_ins_member ON public.member_check_ins (member_user_id, checked_in_at DESC);
```

**RLS:** (from migration 001 — verify)
```sql
ALTER TABLE public.member_check_ins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_checkins" ON public.member_check_ins
  FOR SELECT USING (member_user_id = auth.uid());

CREATE POLICY "gym_staff_checkins" ON public.member_check_ins
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_gym_roles ugr
      WHERE ugr.user_id = auth.uid()
        AND ugr.gym_id = member_check_ins.gym_id
        AND ugr.role IN ('super_admin','gym_owner','gym_admin','trainer')
    )
  );
```

---

### TABLE: `promotion_rules`
Grants feature unlocks beyond the base plan — used for trials, coupons, and
gym-sponsored unlocks. Read directly by the user-facing client in `entitlementCache.ts`
via `.or('subject_type.eq.global,...')` query.

```sql
CREATE TABLE IF NOT EXISTS public.promotion_rules (
  id            uuid         DEFAULT gen_random_uuid() PRIMARY KEY,
  code          text         NOT NULL UNIQUE,
  features      jsonb        NOT NULL DEFAULT '[]',  -- array of Feature strings
  valid_until   timestamptz,                          -- NULL = never expires
  subject_type  text         NOT NULL DEFAULT 'global'
                             CHECK (subject_type IN ('global','user','gym')),
  subject_id    text,        -- user_id or gym_id when subject_type != global
  created_at    timestamptz  DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_promotion_rules_subject ON public.promotion_rules (subject_type, subject_id);
```

**RLS:**
```sql
ALTER TABLE public.promotion_rules ENABLE ROW LEVEL SECURITY;

-- Users can read global promos and their own targeted promos
CREATE POLICY "promotion_select" ON public.promotion_rules
  FOR SELECT USING (
    subject_type = 'global'
    OR (subject_type = 'user' AND subject_id = auth.uid()::text)
    OR (subject_type = 'gym' AND EXISTS (
      SELECT 1 FROM public.gym_memberships gm
      WHERE gm.user_id = auth.uid()
        AND gm.gym_id::text = subject_id
    ))
  );

-- All writes are super_admin or service role only
CREATE POLICY "super_admin_promotions" ON public.promotion_rules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_gym_roles ugr
      WHERE ugr.user_id = auth.uid() AND ugr.role = 'super_admin'
    )
  );
```

---

## 3. REQUIRED POSTGRES EXTENSIONS

These must be enabled in Supabase (Database → Extensions):

```sql
CREATE EXTENSION IF NOT EXISTS "moddatetime";   -- for updated_at triggers
CREATE EXTENSION IF NOT EXISTS "pgcrypto";       -- for gen_random_uuid() (usually pre-enabled)
```

---

## 4. `moddatetime` TRIGGER FUNCTION

If `moddatetime` extension is not available, use this function instead:

```sql
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

Then replace `EXECUTE FUNCTION moddatetime(updated_at)` with
`EXECUTE FUNCTION public.handle_updated_at()` in all trigger definitions above.

---

## 5. TABLES THAT MUST NOT EXIST (remove if present)

Any table not listed in section 2 is not used by this application and should be
evaluated before deletion. Common ones to check for and remove if they exist with
no other purpose:

- Any table named `profiles` — the app uses `auth.users` directly, no profiles table
- Any table named `workouts` — the app uses the event-sourced `events` table, not a workouts table
- Any table named `sessions` — same as above; app uses `events` + client-side projection
- Any table named `sets` or `set_records` — same; all set data lives in `events`
- Any table named `exercises` in Supabase — exercises are seeded to Dexie (IndexedDB) client-side, NOT stored server-side
- Any old/duplicate subscription tables (e.g., `subscriptions` alongside `user_subscriptions`) — check and consolidate

If any of these exist: verify there is no active code path reading from them.
If unused, drop them. If in doubt, disable their RLS first and audit query logs
before dropping.

---

## 6. STORAGE BUCKETS

None required at this time. Do NOT create buckets unless explicitly specified.
(Future: gym logo uploads will need a `gym-assets` bucket — add when implemented.)

---

## 7. EDGE FUNCTIONS

None deployed. All server logic runs in Next.js API routes on Vercel.
Do NOT create edge functions — they would duplicate logic already in the app.

---

## 8. REALTIME

Not used. Do NOT enable Realtime on any table.
The app uses a polling-based sync (SyncWorker with exponential backoff), not WebSocket subscriptions.
Enabling Realtime adds overhead with no benefit.

---

## 9. DATA TO SEED MANUALLY (one time, for super_admin)

After running all migrations, insert the super_admin role for the platform owner:

```sql
-- Replace <YOUR_UUID> with the actual UUID from Auth → Users
INSERT INTO public.user_gym_roles (user_id, gym_id, role)
VALUES ('<YOUR_UUID>', NULL, 'super_admin')
ON CONFLICT (user_id, gym_id, role) DO NOTHING;
```

---

## 10. COMPLETE EXECUTION ORDER

Run in this exact order to build the database from scratch:

1. Enable extensions (`moddatetime`, `pgcrypto`)
2. Create `gyms` table
3. Create `gym_memberships` table
4. Create `user_subscriptions` table
5. Create `gym_subscriptions` table
6. Create `payments` table
7. Create `webhook_events` table
8. Create `user_gym_roles` table (references gyms)
9. Create `member_check_ins` table (references gyms + auth.users)
10. Create `events` table (references auth.users)
11. Create `promotion_rules` table
12. Apply all RLS policies (section 2, per-table)
13. Apply all triggers (section 2, per-table)
14. Run the migration in `supabase/migrations/001_user_gym_roles.sql` (idempotent, safe to run after)
15. Insert super_admin row (section 9)
16. Verify: run `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
    — it should list exactly the 10 tables above and nothing else (besides Supabase internals)

---

## 11. ENVIRONMENT VARIABLES (Vercel / local .env)

These must exist for the app to function:

```
NEXT_PUBLIC_SUPABASE_URL=           # Project URL from Supabase Settings → API
NEXT_PUBLIC_SUPABASE_ANON_KEY=      # anon public key
SUPABASE_SERVICE_ROLE_KEY=          # service_role key — server only, never expose to client
PAYSTACK_SECRET_KEY=                # Paystack secret key
NEXT_PUBLIC_APP_URL=                # https://app.gymapp.fun in production
```

The `SUPABASE_SERVICE_ROLE_KEY` bypasses all RLS. It is used in:
- `getAdminSupabase()` (server.ts)
- `billing/verify/route.ts`
- `billing/webhook/route.ts`
Never put it in `NEXT_PUBLIC_*` — that would expose it to the browser.
