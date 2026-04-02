# Supabase Database Setup - Complete Implementation Guide

## Overview

This guide walks you through setting up your Supabase database for the exercises-gifs application. The schema is normalized and includes:

- **Base Tables**: exercises, body_parts, equipment_types, muscles
- **Junction Tables**: exercise_secondary_muscles, exercise_instructions
- **Security**: Row Level Security (RLS) policies for public read + admin write
- **Data**: ~1300 exercises from exercises.csv

---

## Prerequisites

Before starting, you need:

1. **Active Supabase Project** - Create one at [https://supabase.com](https://supabase.com)
2. **.env.local file** with:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_project_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```
3. **Node.js 18+** for running import script

---

## Phase 1: Create Database Schema

### Step 1.1: Access Supabase SQL Editor

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Select your project
3. Click **"SQL Editor"** in the left sidebar
4. Click **"New Query"**

### Step 1.2: Execute Schema SQL

1. Open `/scripts/supabase-schema.sql` in your editor
2. Copy the **entire** file content
3. Paste into Supabase SQL Editor query window
4. Click **"Run"** button
5. Wait for "Success" message (should take 5-10 seconds)

**✓ Check**: You should now see these tables in the Table Editor:
- `body_parts` (10 rows)
- `equipment_types` (14 rows)
- `muscles` (26 rows)
- `exercises` (empty - we'll fill this next)
- `exercise_secondary_muscles` (empty)
- `exercise_instructions` (empty)

### Step 1.3: Verify Reference Data

Run this query in SQL Editor to confirm reference data loaded:

```sql
SELECT COUNT(*) as body_parts FROM body_parts;
SELECT COUNT(*) as equipment FROM equipment_types;
SELECT COUNT(*) as muscles FROM muscles;
```

Expected output:
```
body_parts: 10
equipment: 14
muscles: 26
```

---

## Phase 2: Import Exercise Data

### Step 2.1: Prepare Import Script

```bash
# Ensure you're in project root
cd /home/peter/free\ stufss/exercises-gifs

# Verify .env.local has required credentials
cat .env.local | grep SUPABASE

# Run npm install if needed (csv-parse should be in package.json)
npm install
```

### Step 2.2: Run Import Script

```bash
npx ts-node scripts/import-exercises-normalized.ts
```

You should see output like:
```
🚀 Starting exercise import...

✓ Parsed 1325 exercises from CSV
✓ 1290 unique exercises (after dedup)

✓ Imported 10 exercises...
✓ Imported 20 exercises...
...
✓ Imported 1290 exercises...

📊 Import Summary:
   ✓ Inserted: 1290
   ⚠️  Skipped: 0
   ❌ Errors: 0
   Total: 1290

✅ Import completed successfully!
```

### Step 2.3: Verify Import

Run this query in Supabase SQL Editor:

```sql
-- Check total exercises
SELECT COUNT(*) as total_exercises FROM exercises;

-- View sample exercises
SELECT 
  e.name,
  bp.name as body_part,
  eq.name as equipment,
  m.name as target
FROM exercises e
LEFT JOIN body_parts bp ON e.body_part_id = bp.id
LEFT JOIN equipment_types eq ON e.equipment_id = eq.id
LEFT JOIN muscles m ON e.primary_target_id = m.id
LIMIT 20;

-- Check instructions were imported
SELECT COUNT(*) as total_instructions FROM exercise_instructions;

-- Check secondary muscles
SELECT COUNT(*) as total_secondary FROM exercise_secondary_muscles;
```

Expected counts:
- total_exercises: ~1290
- total_instructions: ~2800+
- total_secondary: ~2200+

---

## Phase 3: Verify Security (RLS Policies)

### Step 3.1: Check RLS is Enabled

Run in SQL Editor:

```sql
-- Check RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('exercises', 'body_parts', 'equipment_types', 'muscles');
```

Expected output: `rowsecurity: t` (true) for all tables

### Step 3.2: Test Policies

**Read Access (Public):**

```sql
-- This should work - anyone can read active exercises
SELECT * FROM exercises WHERE is_active = TRUE LIMIT 5;
```

**Write Access (Admin Only):**

In your application code, this would fail for non-admin users:

```javascript
// This would fail for non-admin
const { error } = await supabase
  .from('exercises')
  .insert({ id: 'test', name: 'Test Exercise', ... });
// Error: JWT role is not admin
```

---

## Phase 4: Use Your Database

### Option A: Via Supabase Client (JavaScript/TypeScript)

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Get all exercises for a body part
const { data: exercises } = await supabase
  .from('exercises')
  .select(`
    id,
    name,
    body_parts(name),
    equipment_types(name),
    muscles(name as target),
    exercise_instructions(step_number, instruction_text),
    exercise_secondary_muscles(
      muscle_id,
      muscles(name)
    )
  `)
  .eq('body_parts.name', 'chest');

// Get exercise with all details
const { data: exercise } = await supabase
  .from('exercises')
  .select(`*, exercise_instructions(*), exercise_secondary_muscles(*, muscles(*))`)
  .eq('id', '0001')
  .single();
```

### Option B: Via SQL Editor (Manual Queries)

```sql
-- Get all exercises for a body part with instructions
SELECT 
  e.id,
  e.name,
  bp.name as body_part,
  ei.step_number,
  ei.instruction_text
FROM exercises e
LEFT JOIN body_parts bp ON e.body_part_id = bp.id
LEFT JOIN exercise_instructions ei ON e.id = ei.exercise_id
WHERE bp.name = 'chest'
ORDER BY e.name, ei.step_number;

-- Get muscles targeted by an exercise
SELECT 
  e.name,
  m.name as muscle,
  'primary' as muscle_type
FROM exercises e
LEFT JOIN muscles m ON e.primary_target_id = m.id
WHERE e.id = '0001'

UNION ALL

SELECT
  e.name,
  m.name as muscle,
  'secondary' as muscle_type
FROM exercises e
LEFT JOIN exercise_secondary_muscles esm ON e.id = esm.exercise_id
LEFT JOIN muscles m ON esm.muscle_id = m.id
WHERE e.id = '0001'
ORDER BY muscle_type, muscle;
```

---

## Database Schema Diagram

```
body_parts
├─ id (PK)
├─ name

equipment_types
├─ id (PK)
├─ name

muscles
├─ id (PK)
├─ name
├─ category

exercises (MAIN)
├─ id (PK) - VARCHAR(4)
├─ name
├─ body_part_id (FK) → body_parts
├─ equipment_id (FK) → equipment_types
├─ primary_target_id (FK) → muscles
├─ is_active
├─ created_at
├─ updated_at

exercise_secondary_muscles (JUNCTION)
├─ exercise_id (FK) → exercises
├─ muscle_id (FK) → muscles
├─ priority_order

exercise_instructions
├─ id (PK)
├─ exercise_id (FK) → exercises
├─ step_number
├─ instruction_text
```

---

## Troubleshooting

### Issue: "SUPABASE_SERVICE_ROLE_KEY not found"

**Solution**: Ensure .env.local exists in project root with:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGcio...
```

Get these from Supabase Dashboard → Settings → API

### Issue: "Permission denied for schema public"

**Solution**: Ensure you're using the **Service Role Key** (not anon key) for imports

### Issue: "Duplicate key value violates unique constraint"

**Solution**: This is fine if re-running import. The script upserts (update or insert), so duplicate IDs are expected.

### Issue: "Unknown body_part/equipment/muscle"

**Solution**: The import script automatically creates missing muscles. For body_parts and equipment_types, ensure they exist in reference tables first:

```sql
-- Add missing reference
INSERT INTO body_parts (name) VALUES ('missing_part');
INSERT INTO equipment_types (name) VALUES ('missing_equipment');
```

---

## Advanced: Customizing RLS Policies

### Allow Specific Users to Write

Edit policies in SQL Editor to restrict writes to specific users:

```sql
-- Only allow a specific user to update
CREATE POLICY "Allow user to update own exercises"
  ON exercises
  FOR UPDATE
  USING (auth.uid() = 'user-uuid-here')
  WITH CHECK (auth.uid() = 'user-uuid-here');
```

### Allow Everyone to Write (Development Only)

```sql
-- ⚠️ DANGEROUS - Development only!
DROP POLICY IF EXISTS "Enable write access for admins on exercises" ON exercises;

CREATE POLICY "Enable write access for testing"
  ON exercises
  FOR ALL
  USING (TRUE)
  WITH CHECK (TRUE);
```

---

## Next Steps

1. **Set up authentication** - Add Supabase Auth to your app
2. **Create API routes** - Build REST endpoints for exercises
3. **Build UI components** - Display exercises in React
4. **Add streaming** - Use exercises in workout programs
5. **Add user data** - Store user workout history

---

## Files Reference

| File | Purpose |
|------|---------|
| `scripts/supabase-schema.sql` | Database schema & RLS policies |
| `scripts/import-exercises-normalized.ts` | Import CSV data |
| `scripts/SETUP_GUIDE.md` | Quick setup reference |
| `exercises.csv` | Source data (~1300 exercises) |

---

## Support

For issues:
1. Check Supabase logs: Dashboard → Logs → API
2. Check SQL Editor errors: Dashboard → SQL Editor
3. Verify .env.local credentials
4. Ensure all 3 reference tables populated
5. Check exercise_instructions and exercise_secondary_muscles foreign key references

---

**Created**: April 2026  
**Schema Version**: 1.0  
**Total Exercises**: ~1290
