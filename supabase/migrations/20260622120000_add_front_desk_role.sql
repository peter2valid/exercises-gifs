-- =============================================================================
-- Migration: add 'front_desk' role
-- Run once in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
--
-- Front desk staff can scan/check in members and view check-ins, but should
-- not get the financial/staff/settings access that gym_admin has.
-- =============================================================================

-- ── 1. Allow 'front_desk' in the role CHECK constraint ───────────────────────
ALTER TABLE public.user_gym_roles DROP CONSTRAINT IF EXISTS user_gym_roles_role_check;
ALTER TABLE public.user_gym_roles ADD CONSTRAINT user_gym_roles_role_check
  CHECK (role IN ('super_admin','gym_owner','gym_admin','trainer','front_desk','member'));

-- ── 2. member_check_ins — let front_desk read their gym's check-ins ─────────
DROP POLICY IF EXISTS "gym_staff_checkins" ON public.member_check_ins;
CREATE POLICY "gym_staff_checkins" ON public.member_check_ins
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_gym_roles ugr
      WHERE ugr.user_id = auth.uid()
        AND ugr.gym_id = member_check_ins.gym_id
        AND ugr.role IN ('super_admin','gym_owner','gym_admin','trainer','front_desk')
    )
  );

-- ── 3. gym_memberships — let front_desk look up members to check them in ───
DROP POLICY IF EXISTS "gym_staff_memberships" ON public.gym_memberships;
CREATE POLICY "gym_staff_memberships" ON public.gym_memberships
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_gym_roles ugr
      WHERE ugr.user_id = auth.uid()
        AND (ugr.gym_id = gym_memberships.gym_id OR ugr.role = 'super_admin')
        AND ugr.role IN ('super_admin','gym_owner','gym_admin','trainer','front_desk')
    )
  );
