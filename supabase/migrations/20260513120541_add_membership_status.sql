-- Add status to gym_memberships to support join requests/approval flow.
ALTER TABLE public.gym_memberships 
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active'
CHECK (status IN ('active', 'pending', 'rejected'));

-- Index for fast filtering of pending requests
CREATE INDEX IF NOT EXISTS idx_gym_memberships_status ON public.gym_memberships (gym_id, status) WHERE status = 'pending';
