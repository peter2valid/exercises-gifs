-- Add missing fields to gyms table to support Tier 0/1 onboarding and profile completeness.
ALTER TABLE public.gyms 
ADD COLUMN IF NOT EXISTS slug        text,
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS address     text,
ADD COLUMN IF NOT EXISTS phone       text,
ADD COLUMN IF NOT EXISTS type        text,
ADD COLUMN IF NOT EXISTS location    text,
ADD COLUMN IF NOT EXISTS logo_url    text,
ADD COLUMN IF NOT EXISTS website     text;

-- Update existing gyms to have a slug based on their name if missing
UPDATE public.gyms 
SET slug = lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL;

-- Make slug NOT NULL and UNIQUE after backfilling
ALTER TABLE public.gyms ALTER COLUMN slug SET NOT NULL;
ALTER TABLE public.gyms ADD CONSTRAINT gyms_slug_key UNIQUE (slug);
