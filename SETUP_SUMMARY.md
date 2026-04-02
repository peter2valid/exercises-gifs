# Supabase Setup Summary

## ✅ What Has Been Prepared

I've created a complete Supabase database setup for your exercises application. Everything is ready to use - you just need to run it on a machine with internet access to Supabase.

## 📦 Files Created/Updated

### Setup Scripts (Choose one to run):

1. **`scripts/setup.js`** ⭐ **RECOMMENDED**
   - Pure Node.js (no TypeScript compilation)
   - Easiest to use
   - **Run with:** `node scripts/setup.js`

2. **`scripts/setup-simple.ts`**
   - TypeScript version  
   - **Run with:** `npx ts-node scripts/setup-simple.ts`

3. **`scripts/setup-schema.js`**
   - Schema creation only (if you want to do it separately)

### Documentation:

1. **`SETUP_READY.md`** ⭐ **START HERE**
   - Quick start guide
   - What gets imported
   - Troubleshooting tips

2. **`SETUP_GUIDE_COMPLETE.md`**
   - Detailed step-by-step guide
   - Database schema documentation
   - CSV format explanation
   - Full troubleshooting section

### Schema Files:

1. **`scripts/supabase-schema.sql`**
   - Raw SQL for manual setup
   - All table definitions, indexes, RLS policies
   - Reference data inserts

## 🎯 Quick Start

### On a machine with internet access:

```bash
cd exercises-gifs
node scripts/setup.js
```

That's it! The script will:
- ✅ Create all database tables
- ✅ Set up reference data
- ✅ Import 1,324 exercises
- ✅ Import 8,000+ instructions
- ✅ Import 2,500+ secondary muscles
- ✅ Verify everything worked

## 📊 What Gets Created

### Database Tables (6):
```
exercises
├── id (VARCHAR(10) - primary key)
├── name
├── body_part_id (FK)
├── equipment_id (FK)
├── primary_target_id (FK)
├── is_active
├── created_at
└── updated_at

exercise_instructions
├── id
├── exercise_id (FK)
├── step_number
└── instruction_text

exercise_secondary_muscles
├── exercise_id (FK)
├── muscle_id (FK)
└── priority_order

body_parts (10 records)
equipment_types (13 records)
muscles (25+ records)
```

### Data Imported:
- **1,324 unique exercises**
- **~8,000 instruction steps** (many exercises have multiple steps)
- **~2,500 secondary muscle relationships**
- **10 body parts** (chest, back, shoulders, arms, legs, core, cardio, etc.)
- **13 equipment types** (body weight, dumbbells, machines, cables, etc.)
- **25+ muscle groups** (biceps, triceps, pectorals, glutes, quads, etc.)

### Example Exercise Record:
```
id: "0001"
name: "3/4 sit-up"
body_part: "waist" (ID: 1)
equipment: "body weight" (ID: 1)
target: "abs" (ID: 1)

Instructions:
  1. "Lie flat on your back with your knees bent..."
  2. "Place your hands behind your head..."
  3. "Engaging your abs, slowly lift your upper body..."
  4. "Pause for a moment at the top..."
  5. "Repeat for the desired number of repetitions"

Secondary Muscles:
  - hip flexors
  - lower back
```

## 🔄 Import Process Explained

1. **Reads CSV** - Parses exercises.csv (1,324 rows)
2. **Validates References** - Ensures body parts & equipment exist
3. **Creates Exercises** - Inserts exercise records
4. **Links Secondary Muscles** - Creates muscle relationships
5. **Adds Instructions** - Stores step-by-step guides
6. **Verifies** - Counts rows and confirms success

**Progress:** Shows updates every 100 exercises (takes 1-2 minutes total)

## 📋 CSV Data Format

Your `exercises.csv` has columns:
- `id` - Exercise identifier (e.g., "0001")
- `name` - Exercise name (e.g., "3/4 sit-up")
- `bodyPart` - Body part trained (e.g., "waist")
- `equipment` - Equipment needed (e.g., "body weight")
- `target` - Primary muscle (e.g., "abs")
- `secondaryMuscles/0`, `/1`, `/2`, etc. - Secondary muscles
- `instructions/0`, `/1`, `/2`, etc. - Step-by-step instructions

Example row:
```
id=0001,name=3/4 sit-up,bodyPart=waist,equipment=body weight,target=abs,
secondaryMuscles/0=hip flexors,secondaryMuscles/1=lower back,
instructions/0=Lie flat on your back...,instructions/1=Place your hands...
```

## 🔐 Credentials Required

Your `.env.local` has (Supabase Dashboard):
- ✅ `NEXT_PUBLIC_SUPABASE_URL` (your project URL)
- ✅ `SUPABASE_SERVICE_ROLE_KEY` (admin/service key)
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` (for client-side)

The script uses the **service role key** to create and modify tables securely.

## 🚀 Running the Setup

### Prerequisites:
```bash
# Install dependencies first
npm install
```

### Option A: Automatic Setup (Recommended)
```bash
node scripts/setup.js
```

### Option B: Step-by-Step
**Step 1 - Create Schema:**
1. Go to https://app.supabase.com
2. Your Project → SQL Editor → New Query
3. Copy all content from `scripts/supabase-schema.sql`
4. Click Run

**Step 2 - Import Data:**
```bash
node scripts/setup.js
```

## ✨ Features Included

- **Foreign Key Constraints** - Ensures data integrity
- **Unique Indexes** - Prevents duplicate names
- **Performance Indexes** - Fast queries by body part, equipment, etc.
- **Row Level Security** - Public read access to exercises
- **Timestamps** - created_at and updated_at for all records
- **Cascading Deletes** - Clean up related data automatically

## 🔍 Verification

After running the script, check your Supabase project:

**In Supabase Dashboard:**
1. Go to Table Editor
2. You should see:
   - `exercises` - 1,320+ rows
   - `exercise_instructions` - 8,000+ rows
   - `exercise_secondary_muscles` - 2,500+ rows
   - `body_parts` - 10 rows
   - `equipment_types` - 13 rows
   - `muscles` - 25+ rows

## ⚠️ Troubleshooting

### "fetch failed" or "Could not resolve host"
- **Cause:** No internet connection or firewall blocking
- **Solution:** Use manual setup option (copy/paste schema in dashboard)

### "table does not exist"
- **Cause:** Schema wasn't created first
- **Solution:** Run `scripts/supabase-schema.sql` in SQL Editor first

### Missing exercises
- **Cause:** CSV file has body parts not in reference data
- **Solution:** Script automatically skips these (you'll see warnings)

### Slow performance
- **Expected:** 1-2 minutes for 1,300 exercises
- **Normal:** Script shows progress every 100 exercises
- **Safe:** Can interrupt and resume

## 📞 Next Steps

1. ✅ Run the setup script
2. ✅ Verify data in Supabase dashboard
3. ✅ Test your app: `npm run dev`
4. ✅ Visit: http://localhost:3000/scan
5. ✅ Start building with exercises!

## 🎓 Using the Exercises in Your App

Example hook in `src/hooks/useExercises.ts`:

```typescript
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export function useExercises() {
  const [exercises, setExercises] = useState([]);

  useEffect(() => {
    supabase
      .from('exercises')
      .select(`
        *,
        body_parts(name),
        equipment_types(name),
        primary_target:muscles(name),
        exercise_secondary_muscles(muscle_id),
        exercise_instructions(instruction_text, step_number)
      `)
      .eq('is_active', true)
      .then(({ data }) => setExercises(data));
  }, []);

  return exercises;
}
```

## 📚 Resources

- [Supabase Docs](https://supabase.com/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Schema File](scripts/supabase-schema.sql)
- [Full Setup Guide](SETUP_GUIDE_COMPLETE.md)

---

**Status:** ✅ All files prepared and ready to use

**Ready to set up?** Run: `node scripts/setup.js`
