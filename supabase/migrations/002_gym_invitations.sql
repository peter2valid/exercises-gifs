-- =============================================================================
-- Migration 002: gym_invitations — invite links for staff and members
-- Run once in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.gym_invitations (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id      uuid        NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  invited_by  uuid        NOT NULL REFERENCES auth.users(id),
  email       text        NOT NULL,
  role        text        NOT NULL CHECK (role IN ('gym_admin', 'trainer', 'member')),
  token       text        NOT NULL UNIQUE,
  accepted_at timestamptz,
  expires_at  timestamptz NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gym_invitations_token  ON public.gym_invitations (token);
CREATE INDEX IF NOT EXISTS idx_gym_invitations_gym_id ON public.gym_invitations (gym_id, created_at DESC);

ALTER TABLE public.gym_invitations ENABLE ROW LEVEL SECURITY;

-- Public token lookup (anyone with the link can read invite details)
CREATE POLICY "invite_token_read" ON public.gym_invitations
  FOR SELECT USING (true);

-- Gym admins / owners can insert and delete invites for their gym
CREATE POLICY "gym_admin_manage_invites" ON public.gym_invitations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_gym_roles ugr
      WHERE ugr.user_id = auth.uid()
        AND (ugr.gym_id = gym_invitations.gym_id OR ugr.role = 'super_admin')
        AND ugr.role IN ('super_admin', 'gym_owner', 'gym_admin')
    )
  );
