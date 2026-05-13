ALTER TABLE public.gyms 
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active'
CHECK (status IN ('active', 'suspended'));
