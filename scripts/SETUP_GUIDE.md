-- ============================================================================
-- SUPABASE DATABASE SETUP GUIDE
-- ============================================================================

# Step-by-Step Setup Instructions

## Phase 1: Create Tables and Schema

1. **Go to your Supabase Dashboard**
   - Navigate to SQL Editor
   - Copy the entire contents of `scripts/supabase-schema.sql`
   - Paste it into a new query
   - Click "Run" to execute

2. **Verify Tables Were Created**
   - Go to the "Table Editor" tab
   - You should see these new tables:
     - exercises
     - body_parts
     - equipment_types
     - muscles
     - exercise_secondary_muscles
     - exercise_instructions

## Phase 2: Verify Reference Data

3. **Check Populated Reference Tables**
   Run these queries in SQL Editor to verify:

   ```sql
   SELECT COUNT(*) as body_parts_count FROM body_parts;
   SELECT COUNT(*) as equipment_count FROM equipment_types;
   SELECT COUNT(*) as muscles_count FROM muscles;
   ```

## Phase 3: Import Exercise Data

4. **Import from CSV Using TypeScript Script**
   - Run: `npm run import-exercises`
   - This will parse exercises.csv and populate the exercises table

5. **Alternative: Manual Import via SQL**
   - See the CSV-to-SQL conversion queries below

## Phase 4: Verify data

6. **Query Some Data**
   ```sql
   SELECT * FROM exercise_details LIMIT 10;
   
   SELECT e.name, bp.name as body_part, m.name as target
   FROM exercises e
   LEFT JOIN body_parts bp ON e.body_part_id = bp.id
   LEFT JOIN muscles m ON e.primary_target_id = m.id
   LIMIT 20;
   ```

-- ============================================================================
-- EXAMPLE: INSERTING A SINGLE EXERCISE (For Reference)
-- ============================================================================

-- This shows how a row from the CSV maps to the database
INSERT INTO exercises (id, name, body_part_id, equipment_id, primary_target_id)
SELECT 
  '0001',
  '3/4 sit-up',
  bp.id,
  eq.id,
  m.id
FROM body_parts bp
CROSS JOIN equipment_types eq
CROSS JOIN muscles m
WHERE bp.name = 'waist'
  AND eq.name = 'body weight'
  AND m.name = 'abs';

-- Then add secondary muscles:
INSERT INTO exercise_secondary_muscles (exercise_id, muscle_id, priority_order)
SELECT '0001', m.id, ROW_NUMBER() OVER (ORDER BY m.name)
FROM muscles m
WHERE m.name IN ('hip flexors', 'lower back');

-- Then add instructions:
INSERT INTO exercise_instructions (exercise_id, step_number, instruction_text)
VALUES
  ('0001', 1, 'Lie flat on your back with your knees bent and feet flat on the ground.'),
  ('0001', 2, 'Place your hands behind your head with your elbows pointing outwards.'),
  ('0001', 3, 'Engaging your abs, slowly lift your upper body off the ground, curling forward until your torso is at a 45-degree angle.'),
  ('0001', 4, 'Pause for a moment at the top, then slowly lower your upper body back down to the starting position.'),
  ('0001', 5, 'Repeat for the desired number of repetitions.');

-- ============================================================================
-- TABLE STRUCTURE SUMMARY
-- ============================================================================

/*
exercises (Primary Table)
├── id (VARCHAR 4-digit code)
├── name
├── body_part_id → body_parts
├── equipment_id → equipment_types
├── primary_target_id → muscles
└── metadata (created_at, updated_at, is_active)

exercise_secondary_muscles (Junction Table)
├── exercise_id → exercises
├── muscle_id → muscles
└── priority_order (1-6)

exercise_instructions (Step-by-step)
├── exercise_id → exercises
├── step_number (1-11)
└── instruction_text

Reference Tables:
- body_parts: waist, upper legs, back, chest, etc.
- equipment_types: body weight, cable, dumbbell, etc.
- muscles: abs, biceps, pectorals, etc.
*/

-- ============================================================================
-- RLS SECURITY SUMMARY
-- ============================================================================

/*
DEFAULT POLICY: Everyone can READ all active exercises and reference data

WRITE ACCESS: Only users with JWT role = 'admin' can:
- Create/Update/Delete exercises
- Manage secondary muscles
- Add/Edit instructions

To test as admin, you need to:
1. Create an auth token with { role: 'admin' } in JWT
2. Use that token in API requests

For local development, enable RLS bypassing in Supabase dashboard:
Project Settings → API → Bypass Row Level Security Toggle
*/
