-- =============================================================================
-- Migration 003: workout templates (coach programs)
-- Run once in Supabase SQL Editor
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.templates (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  description text,
  created_by  uuid        NOT NULL REFERENCES auth.users(id),
  gym_id      uuid        REFERENCES public.gyms(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_templates_gym ON public.templates (gym_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.template_exercises (
  id            uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id   uuid  NOT NULL REFERENCES public.templates(id) ON DELETE CASCADE,
  exercise_id   text  NOT NULL/*  */,
  exercise_name text  NOT NULL,
  sets          int   NOT NULL DEFAULT 3,
  reps          int   NOT NULL DEFAULT 10,
  rest_seconds  int   NOT NULL DEFAULT 90,
  ord           int   NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_template_exercises_template ON public.template_exercises (template_id, ord);

CREATE TABLE IF NOT EXISTS public.template_assignments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.templates(id) ON DELETE CASCADE,
  assigned_to uuid NOT NULL REFERENCES auth.users(id),
  assigned_by uuid NOT NULL REFERENCES auth.users(id),
  gym_id      uuid REFERENCES public.gyms(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (template_id, assigned_to)
);

ALTER TABLE public.templates           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_exercises  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_assignments ENABLE ROW LEVEL SECURITY;

-- Gym staff can manage templates for their gym
CREATE POLICY "gym_staff_templates" ON public.templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_gym_roles ugr
      WHERE ugr.user_id = auth.uid()
        AND (ugr.gym_id = templates.gym_id OR ugr.role = 'super_admin')
        AND ugr.role IN ('super_admin','gym_owner','gym_admin','trainer')
    )
  );

-- Members can read templates assigned to them
CREATE POLICY "member_assigned_templates" ON public.templates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.template_assignments ta
      WHERE ta.template_id = templates.id AND ta.assigned_to = auth.uid()
    )
  );

-- Template exercises follow parent template access
CREATE POLICY "template_exercises_via_template" ON public.template_exercises
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.templates t
      LEFT JOIN public.user_gym_roles ugr ON (ugr.gym_id = t.gym_id OR ugr.role = 'super_admin') AND ugr.user_id = auth.uid()
      LEFT JOIN public.template_assignments ta ON ta.template_id = t.id AND ta.assigned_to = auth.uid()
      WHERE t.id = template_exercises.template_id
        AND (ugr.id IS NOT NULL OR ta.id IS NOT NULL)
    )
  );

-- Assignments: staff can manage; assignee can read
CREATE POLICY "template_assignments_staff" ON public.template_assignments
  FOR ALL USING (
    assigned_to = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.user_gym_roles ugr
      WHERE ugr.user_id = auth.uid()
        AND (ugr.gym_id = template_assignments.gym_id OR ugr.role = 'super_admin')
        AND ugr.role IN ('super_admin','gym_owner','gym_admin','trainer')
    )
  );
