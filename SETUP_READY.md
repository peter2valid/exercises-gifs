# Supabase Setup - Quick Start Guide

## What Has Been Created

I've created comprehensive setup scripts and documentation for your Supabase database. Here's what's ready for you:

### Files Created:

1. **`scripts/setup-simple.ts`** - Complete setup script
   - Creates all database tables and indexes
   - Sets up reference data (body parts, equipment, muscles)
   - Imports all 1,324 exercises from CSV
   - Imports all instructions and secondary muscles
   - Verifies data with row counts
   
   **Run it with:**
   ```bash
   npx ts-node scripts/setup-simple.ts
   ```

2. **`scripts/supabase-schema.sql`** - Raw SQL schema
   - All table definitions with proper constraints
   - Foreign key relationships
   - Indexes for performance
   - Row Level Security policies
   - Reference data inserts

3. **`scripts/setup-schema.js`** - Schema-only setup
   - Creates database schema without importing data
   - Can be run before data import

4. **`SETUP_GUIDE_COMPLETE.md`** - Comprehensive guide
   - Step-by-step instructions
   - Troubleshooting section
   - Database schema documentation
   - Verification procedures

## How to Use

### Automatic Setup (Recommended)

Run this on a machine with internet access:

```bash
cd exercises-gifs
npx ts-node scripts/setup-simple.ts
```

This will:
- ✅ Create all database tables
- ✅ Set up reference data
- ✅ Import all 1,324 exercises
- ✅ Import all instructions (~8,000+)
- ✅ Import all secondary muscles (~2,500+)
- ✅ Verify everything worked

### Manual Setup (if automatic doesn't work)

**Step 1: Create the schema manually**
1. Go to https://app.supabase.com
2. Select your project → SQL Editor → New Query
3. Copy the entire content of `scripts/supabase-schema.sql`
4. Paste and click Run

**Step 2: Import the data**
```bash
npx ts-node scripts/setup-simple.ts
```

## What Gets Imported

### Tables Created
- ✓ `exercises` - 1,324 exercises
- ✓ `exercise_instructions` - Step-by-step instructions
- ✓ `exercise_secondary_muscles` - Secondary muscle targets
- ✓ `body_parts` - Body part categories
- ✓ `equipment_types` - Equipment list
- ✓ `muscles` - Muscle names and categories

### Data Volume
- **1,324 unique exercises**
- **~8,000+ instructions** (steps for each exercise)
- **~2,500+ secondary muscle mappings**
- **10 body parts** (waist, back, chest, shoulders, legs, arms, neck, cardio)
- **13+ equipment types** (body weight, dumbbells, barbells, cables, machines, etc.)
- **25+ unique muscles** (biceps, pectorals, glutes, quads, lats, etc.)

## Next Steps

1. **Run the setup script** (on a machine with internet access)
   ```bash
   npx ts-node scripts/setup-simple.ts
   ```

2. **Verify the data in Supabase Dashboard**
   - Go to https://app.supabase.com
   - Select your project
   - Check Table Editor to see exercises, instructions, etc.

3. **Test your app**
   ```bash
   npm run dev
   ```
   Visit http://localhost:3000/scan to see your exercises

4. **Use the data in your app**
   - The exercises are now available via Supabase queries
   - Read the hooks in `src/hooks/useExercises.ts` for query examples

## Troubleshooting

### Network Issues
If you get "fetch failed" or DNS errors:
- Ensure you have internet access
- Try running the script on a different machine
- Run the manual setup option instead

### Missing Tables
If you get "table does not exist" errors:
- First run the schema creation (manual or via script)
- Then run the data import
- Check `SETUP_GUIDE_COMPLETE.md` for detailed steps

### Slow Performance
- The import takes 1-2 minutes for 1,300 exercises
- Script shows progress every 100 exercises
- Safe to interrupt and resume

## CSV Data Structure

The `exercises.csv` has ~1,300 rows with columns:
- `id` - Exercise ID (e.g., "0001")
- `name` - Exercise name (e.g., "3/4 sit-up")
- `bodyPart` - Body part (waist, chest, back, etc.)
- `equipment` - Equipment needed (body weight, dumbbell, etc.)
- `target` - Primary muscle (abs, pecs, lats, etc.)
- `secondaryMuscles/*` - Secondary muscles (indexed: 0, 1, 2...)
- `instructions/*` - Step-by-step instructions (indexed: 0, 1, 2...)

## Files Ready to Use

All files are in your workspace:
- `/home/peter/free stufss/exercises-gifs/scripts/setup-simple.ts` ← Use this!
- `/home/peter/free stufss/exercises-gifs/scripts/supabase-schema.sql` ← Schema for manual setup
- `/home/peter/free stufss/exercises-gifs/SETUP_GUIDE_COMPLETE.md` ← Full documentation
- `/home/peter/free stufss/exercises-gifs/exercises.csv` ← Your exercise data

**Ready to go! 🏋️ Run the setup script whenever you have internet access.**
