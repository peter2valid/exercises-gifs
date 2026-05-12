-- =============================================================================
-- Migration 001: user_gym_roles + RLS hardening
-- Run once in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- =============================================================================

-- ── 1. user_gym_roles table ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_gym_roles (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gym_id      uuid REFERENCES public.gyms(id) ON DELETE CASCADE, -- NULL = super_admin
  role        text NOT NULL CHECK (role IN ('super_admin','gym_owner','gym_admin','trainer','member')),
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  UNIQUE (user_id, gym_id, role)
);

CREATE INDEX IF NOT EXISTS idx_user_gym_roles_user  ON public.user_gym_roles (user_id);
CREATE INDEX IF NOT EXISTS idx_user_gym_roles_gym   ON public.user_gym_roles (gym_id);

ALTER TABLE public.user_gym_roles ENABLE ROW LEVEL SECURITY;

-- Users can read their own roles (for the client entitlement system)
CREATE POLICY "own_roles_select" ON public.user_gym_roles
  FOR SELECT USING (user_id = auth.uid());

-- Super admins can do everything
CREATE POLICY "super_admin_all" ON public.user_gym_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_gym_roles ugr
      WHERE ugr.user_id = auth.uid() AND ugr.role = 'super_admin'
    )
  );

-- Gym owners/admins can read roles within their gym
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

-- ── 2. Migrate existing gym admins from admin_user_id ────────────────────────
-- Copies every existing gym admin into user_gym_roles as gym_owner.
-- Safe to run multiple times — ON CONFLICT DO NOTHING.
INSERT INTO public.user_gym_roles (user_id, gym_id, role)
SELECT admin_user_id, id, 'gym_owner'
FROM public.gyms
WHERE admin_user_id IS NOT NULL
ON CONFLICT (user_id, gym_id, role) DO NOTHING;

-- ── 3. member_check_ins projection table ─────────────────────────────────────
-- Stores projected state from MEMBER_CHECKED_IN events for fast query.
CREATE TABLE IF NOT EXISTS public.member_check_ins (
  id               uuid PRIMARY KEY,             -- = check_in_id
  gym_id           uuid NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  member_user_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  checked_in_at    timestamptz NOT NULL,
  method           text NOT NULL CHECK (method IN ('qr_scan','manual')),
  staff_user_id    uuid REFERENCES auth.users(id),
  created_at       timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_check_ins_gym    ON public.member_check_ins (gym_id, checked_in_at DESC);
CREATE INDEX IF NOT EXISTS idx_check_ins_member ON public.member_check_ins (member_user_id, checked_in_at DESC);

ALTER TABLE public.member_check_ins ENABLE ROW LEVEL SECURITY;

-- Members can see their own check-ins
CREATE POLICY "own_checkins" ON public.member_check_ins
  FOR SELECT USING (member_user_id = auth.uid());

-- Gym staff can see check-ins for their gym
CREATE POLICY "gym_staff_checkins" ON public.member_check_ins
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_gym_roles ugr
      WHERE ugr.user_id = auth.uid()
        AND ugr.gym_id = member_check_ins.gym_id
        AND ugr.role IN ('super_admin','gym_owner','gym_admin','trainer')
    )
  );

-- ── 4. RLS on gyms — gym admins see only their gym ───────────────────────────
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

-- ── 5. RLS on gym_memberships ─────────────────────────────────────────────────
ALTER TABLE public.gym_memberships ENABLE ROW LEVEL SECURITY;

-- Members see their own memberships
CREATE POLICY "own_memberships" ON public.gym_memberships
  FOR SELECT USING (user_id = auth.uid());

-- Gym staff see memberships for their gym
CREATE POLICY "gym_staff_memberships" ON public.gym_memberships
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_gym_roles ugr
      WHERE ugr.user_id = auth.uid()
        AND (ugr.gym_id = gym_memberships.gym_id OR ugr.role = 'super_admin')
        AND ugr.role IN ('super_admin','gym_owner','gym_admin','trainer')
    )
  );

-- ── 6. Webhook events — service-role only (no user access) ──────────────────
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
-- No SELECT policies — webhook_events are internal audit records only.
-- Access via service role in API routes only.

-- =============================================================================
-- MANUAL STEP — run separately after migration
-- Replace <YOUR_USER_ID> with your actual Supabase auth.users UUID.
-- Find it in: Supabase Dashboard → Authentication → Users
-- =============================================================================
-- INSERT INTO public.user_gym_roles (user_id, gym_id, role)
-- VALUES ('<YOUR_USER_ID>', NULL, 'super_admin');
-- =============================================================================
