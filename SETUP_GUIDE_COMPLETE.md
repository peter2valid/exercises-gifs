# Supabase Database Setup Guide

## Overview
This guide will help you set up your Supabase PostgreSQL database for the exercises application and import ~1,300 exercise records from the CSV file.

## Prerequisites
- Supabase account and active project
- Credentials saved in `.env.local`:
  - `NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co`
  - `SUPABASE_SERVICE_ROLE_KEY=...`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY=...` (optional)

## Setup Steps

### Option 1: Automatic Setup (Recommended)

If you have a machine with internet access:

```bash
# 1. Clone/access the project
cd /path/to/exercises-gifs

# 2. Install dependencies
npm install

# 3. Run the simple setup script
npx ts-node scripts/setup-simple.ts
```

This will:
- ✓ Create reference tables (body_parts, equipment_types, muscles)
- ✓ Create exercises table and related tables
- ✓ Import all 1,324 exercises from CSV
- ✓ Import all instructions and secondary muscles
- ✓ Verify the data with row counts

### Option 2: Manual Setup (Step-by-Step)

#### Step 1: Create Database Schema

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Select your project
3. Navigate to **SQL Editor → New Query**
4. Open `scripts/supabase-schema.sql` and copy the entire content
5. Paste into the SQL editor and click **Run**

This creates:
- `body_parts` table
- `equipment_types` table
- `muscles` table (for primary and secondary targets)
- `exercises` table
- `exercise_instructions` table
- `exercise_secondary_muscles` table
- Indexes for performance
- Row Level Security policies

#### Step 2: Import Data

After the schema is created, run:

```bash
# From your local machine with internet access
npx ts-node scripts/setup-simple.ts
```

This will populate the database with:
- **1,324 unique exercises**
- **Primary muscle targets** for each exercise
- **Secondary muscle targets** (many exercises work multiple muscle groups)
- **Step-by-step instructions** for performing each exercise

## CSV Format

The `exercises.csv` file contains:
- `id`: Exercise ID (4 digits)
- `name`: Exercise name
- `bodyPart`: Body part trained (waist, upper legs, back, chest, etc.)
- `equipment`: Equipment type (body weight, dumbbell, cable, etc.)
- `target`: Primary muscle targeted
- `secondaryMuscles/*`: Secondary muscles (indexed: 0, 1, 2, etc.)
- `instructions/*`: Step-by-step instructions (indexed: 0, 1, 2, etc.)

Example CSV row structure:
```
id,name,bodyPart,equipment,target,secondaryMuscles/0,secondaryMuscles/1,instructions/0,instructions/1,...
0001,3/4 sit-up,waist,body weight,abs,hip flexors,lower back,"Lie flat on your back...","Place your hands behind..."
```

## Database Schema

### Tables

```
body_parts
├── id (PRIMARY KEY)
├── name (UNIQUE)
└── created_at

equipment_types
├── id (PRIMARY KEY)
├── name (UNIQUE)
└── created_at

muscles
├── id (PRIMARY KEY)
├── name (UNIQUE)
├── category
└── created_at

exercises
├── id (PRIMARY KEY) - 4-digit string
├── name
├── body_part_id (FOREIGN KEY)
├── equipment_id (FOREIGN KEY)
├── primary_target_id (FOREIGN KEY)
├── description
├── difficulty_level
├── is_active
├── created_at
└── updated_at

exercise_instructions
├── id (PRIMARY KEY)
├── exercise_id (FOREIGN KEY)
├── step_number
├── instruction_text
└── UNIQUE(exercise_id, step_number)

exercise_secondary_muscles
├── exercise_id (FOREIGN KEY)
├── muscle_id (FOREIGN KEY)
├── priority_order
└── PRIMARY KEY(exercise_id, muscle_id)
```

### Reference Data Populated

**Body Parts (10):**
- waist, upper legs, lower legs, back, chest, upper arms, lower arms, shoulders, cardio, neck

**Equipment Types (13):**
- body weight, cable, leverage machine, assisted, medicine ball, band, stability ball, weighted, barbell, dumbbell, kettlebell, machine, rope

**Muscles (25+):**
- abs, biceps, glutes, hamstrings, quads, triceps, shoulders, pectorals, lats, core, etc.

## Verification

After import completes, you should see:

```
📊 Verification Summary
   • Total Exercises: ~1,320
   • Total Instructions: ~8,000+
   • Total Secondary Muscles: ~2,500+
   • Body Parts: 10
   • Equipment Types: 13
   • Unique Muscles: 25+
```

## Troubleshooting

### "body_parts table does not exist"
**Solution:** Create the schema first. See Option 2, Step 1 above.

### "Unknown body part" warnings
The CSV references body parts not in the reference data. The script:
- ✓ Automatically skips exercises with unmapped body parts
- ✓ Creates new muscle entries on-the-fly
- ✓ Reports all skipped records

### "Invalid Supabase credentials"
**Check:**
- The `.env.local` file exists with correct keys
- `NEXT_PUBLIC_SUPABASE_URL` matches your Supabase project
- `SUPABASE_SERVICE_ROLE_KEY` is the full key (not anon key)

### Slow Import
- ✓ Expected to take 1-2 minutes for ~1,300 exercises
- ✓ Script shows progress every 100 exercises
- ✓ Can be safely interrupted and resumed

## Next Steps

Once your database is set up:

1. **Test the data:**
   ```bash
   npm run dev
   ```
   Visit http://localhost:3000/scan to see exercises

2. **Customize:**
   - Add custom fields to exercises table
   - Add user ratings/favorites functionality
   - Create workouts from exercises

3. **Scale:**
   - Add Row Level Security policies for user-specific data
   - Implement caching for performance
   - Add real-time subscriptions for collaborative features

## Support Scripts

Available in `scripts/`:

- `setup-simple.ts` - Complete setup with data import
- `supabase-schema.sql` - Raw SQL schema (for manual execution)
- `setup-schema.js` - Schema setup only
- `import-exercises-normalized.ts` - Data import only (after schema exists)

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Exercises API Data Source](https://rapidapi.com/api-sports/api/api-sports-exercises)
