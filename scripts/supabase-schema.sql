-- ============================================================================
-- EXERCISES DATABASE SCHEMA FOR SUPABASE
-- ============================================================================
-- This schema is designed for the exercises-gifs application
-- Execute these queries in your Supabase SQL editor

BEGIN;

-- ============================================================================
-- 0. CREATE REFERENCE TABLES (Non-timestamped lookup tables)
-- ============================================================================

-- Body parts table
CREATE TABLE IF NOT EXISTS body_parts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(49) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Equipment types table
CREATE TABLE IF NOT EXISTS equipment_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(99) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Muscles table (for both primary and secondary targets)
CREATE TABLE IF NOT EXISTS muscles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(99) NOT NULL UNIQUE,
  category VARCHAR(49),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 1. CREATE MAIN EXERCISES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS exercises (
  id VARCHAR(9) PRIMARY KEY,
  name VARCHAR(254) NOT NULL,
  body_part_id INTEGER NOT NULL REFERENCES body_parts(id) ON DELETE RESTRICT,
  equipment_id INTEGER NOT NULL REFERENCES equipment_types(id) ON DELETE RESTRICT,
  primary_target_id INTEGER NOT NULL REFERENCES muscles(id) ON DELETE RESTRICT,
  description TEXT,
  difficulty_level VARCHAR(19) DEFAULT 'intermediate',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT exercise_id_format CHECK (id ~ '^\d{4}$')
);

-- Keep updated_at current on row updates
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_exercises_set_updated_at ON exercises;
CREATE TRIGGER trg_exercises_set_updated_at
BEFORE UPDATE ON exercises
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- 2. CREATE JUNCTION TABLES FOR RELATIONSHIPS
-- ============================================================================

-- Exercise may have multiple secondary target muscles
CREATE TABLE IF NOT EXISTS exercise_secondary_muscles (
  exercise_id VARCHAR(9) NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  muscle_id INTEGER NOT NULL REFERENCES muscles(id) ON DELETE CASCADE,
  priority_order INTEGER DEFAULT -1,
  PRIMARY KEY (exercise_id, muscle_id)
);

-- Exercise instructions (steps)
CREATE TABLE IF NOT EXISTS exercise_instructions (
  id SERIAL PRIMARY KEY,
  exercise_id VARCHAR(9) NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  instruction_text TEXT NOT NULL,
  UNIQUE(exercise_id, step_number)
);

-- ============================================================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_exercises_body_part ON exercises(body_part_id);
CREATE INDEX IF NOT EXISTS idx_exercises_equipment ON exercises(equipment_id);
CREATE INDEX IF NOT EXISTS idx_exercises_primary_target ON exercises(primary_target_id);
CREATE INDEX IF NOT EXISTS idx_exercises_is_active ON exercises(is_active);

CREATE INDEX IF NOT EXISTS idx_exercise_secondary_muscles_muscle ON exercise_secondary_muscles(muscle_id);
CREATE INDEX IF NOT EXISTS idx_exercise_instructions_exercise ON exercise_instructions(exercise_id);

-- ============================================================================
-- 4. POPULATE REFERENCE DATA
-- ============================================================================

-- Insert body parts
INSERT INTO body_parts (name) VALUES
('waist'),
('upper legs'),
('lower legs'),
('back'),
('chest'),
('upper arms'),
('lower arms'),
('shoulders'),
('cardio'),
('neck')
ON CONFLICT (name) DO NOTHING;

-- Insert equipment types
INSERT INTO equipment_types (name) VALUES
('body weight'),
('cable'),
('leverage machine'),
('assisted'),
('medicine ball'),
('band'),
('stability ball'),
('weighted'),
('barbell'),
('dumbbell'),
('kettlebell'),
('machine'),
('rope'),
('resistance band')
ON CONFLICT (name) DO NOTHING;

-- Insert muscles
INSERT INTO muscles (name, category) VALUES
('abs', 'core'),
('hip flexors', 'core'),
('lower back', 'back'),
('obliques', 'core'),
('quads', 'legs'),
('hamstrings', 'legs'),
('glutes', 'legs'),
('calves', 'legs'),
('ankle stabilizers', 'stabilizers'),
('lats', 'back'),
('biceps', 'arms'),
('rhomboids', 'back'),
('pectorals', 'chest'),
('triceps', 'arms'),
('shoulders', 'shoulders'),
('delts', 'shoulders'),
('traps', 'back'),
('upper back', 'back'),
('forearms', 'arms'),
('core', 'core'),
('spine', 'back'),
('adductors', 'legs'),
('quadriceps', 'legs'),
('cardiovascular system', 'cardio'),
('rear deltoids', 'shoulders')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 5. ENABLE ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE muscles ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_secondary_muscles ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_instructions ENABLE ROW LEVEL SECURITY;

-- Recommended grants for Supabase API roles
GRANT SELECT ON body_parts TO anon, authenticated;
GRANT SELECT ON equipment_types TO anon, authenticated;
GRANT SELECT ON muscles TO anon, authenticated;
GRANT SELECT ON exercises TO anon, authenticated;
GRANT SELECT ON exercise_secondary_muscles TO anon, authenticated;
GRANT SELECT ON exercise_instructions TO anon, authenticated;

GRANT INSERT, UPDATE, DELETE ON exercises TO authenticated;
GRANT INSERT, UPDATE, DELETE ON exercise_secondary_muscles TO authenticated;
GRANT INSERT, UPDATE, DELETE ON exercise_instructions TO authenticated;

-- ============================================================================
-- 6. RLS POLICIES - PUBLIC READ ACCESS
-- ============================================================================

-- Anyone can read exercises
DROP POLICY IF EXISTS "Enable read access on exercises" ON exercises;
CREATE POLICY "Enable read access on exercises"
  ON exercises
  FOR SELECT
  TO anon, authenticated
  USING (is_active = TRUE);

-- Anyone can read body parts
DROP POLICY IF EXISTS "Enable read access on body_parts" ON body_parts;
CREATE POLICY "Enable read access on body_parts"
  ON body_parts
  FOR SELECT
  TO anon, authenticated
  USING (TRUE);

-- Anyone can read equipment types
DROP POLICY IF EXISTS "Enable read access on equipment_types" ON equipment_types;
CREATE POLICY "Enable read access on equipment_types"
  ON equipment_types
  FOR SELECT
  TO anon, authenticated
  USING (TRUE);

-- Anyone can read muscles
DROP POLICY IF EXISTS "Enable read access on muscles" ON muscles;
CREATE POLICY "Enable read access on muscles"
  ON muscles
  FOR SELECT
  TO anon, authenticated
  USING (TRUE);

-- Anyone can read secondary muscles
DROP POLICY IF EXISTS "Enable read access on exercise_secondary_muscles" ON exercise_secondary_muscles;
CREATE POLICY "Enable read access on exercise_secondary_muscles"
  ON exercise_secondary_muscles
  FOR SELECT
  TO anon, authenticated
  USING (TRUE);

-- Anyone can read instructions
DROP POLICY IF EXISTS "Enable read access on exercise_instructions" ON exercise_instructions;
CREATE POLICY "Enable read access on exercise_instructions"
  ON exercise_instructions
  FOR SELECT
  TO anon, authenticated
  USING (TRUE);

-- ============================================================================
-- 7. RLS POLICIES - ADMIN WRITE ACCESS
-- ============================================================================
-- By default, only authenticated users with admin role can write

-- Admins can do everything on exercises
DROP POLICY IF EXISTS "Enable write access for admins on exercises" ON exercises;
CREATE POLICY "Enable write access for admins on exercises"
  ON exercises
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Admins can write to secondary muscles
DROP POLICY IF EXISTS "Enable write access for admins on exercise_secondary_muscles" ON exercise_secondary_muscles;
CREATE POLICY "Enable write access for admins on exercise_secondary_muscles"
  ON exercise_secondary_muscles
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Admins can write instructions
DROP POLICY IF EXISTS "Enable write access for admins on exercise_instructions" ON exercise_instructions;
CREATE POLICY "Enable write access for admins on exercise_instructions"
  ON exercise_instructions
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- ============================================================================
-- 8. VIEWS (OPTIONAL - For easier querying)
-- ============================================================================

-- View to get complete exercise information
CREATE OR REPLACE VIEW exercise_details
WITH (security_invoker = true)
AS
SELECT
  e.id,
  e.name,
  bp.name as body_part,
  eq.name as equipment,
  m.name as primary_target,
  e.is_active,
  e.created_at
FROM exercises e
LEFT JOIN body_parts bp ON e.body_part_id = bp.id
LEFT JOIN equipment_types eq ON e.equipment_id = eq.id
LEFT JOIN muscles m ON e.primary_target_id = m.id;

COMMIT;

-- ============================================================================
-- NOTES FOR USERS
-- ============================================================================
-- 0. To add admin users, update your Supabase Auth settings
-- 1. The schema uses natural language identifiers that can be queried easily
-- 2. All queries defaulting to active exercises for data integrity
-- 3. Timestamp fields automatically track creation and updates
-- 4. Foreign keys prevent orphaned data
-- 5. Use the exercise_details view for simpler queries
