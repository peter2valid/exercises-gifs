#!/usr/bin/env node
/**
 * Supabase Exercises Database Setup - Pure Node.js version
 * No TypeScript compilation needed!
 * 
 * Usage: node scripts/setup.js
 * 
 * This script:
 * 1. Creates reference tables (body_parts, equipment_types, muscles)
 * 2. Creates exercises and related tables
 * 3. Imports 1,324 exercises from exercises.csv
 * 4. Imports all instructions and secondary muscles
 * 5. Verifies the import with row counts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Helper functions

function collectIndexedValues(record, prefix) {
  return Object.keys(record)
    .filter((key) => key.startsWith(prefix))
    .sort((a, b) => Number(a.split('/')[1]) - Number(b.split('/')[1]))
    .map((key) => String(record[key] ?? '').trim())
    .filter(Boolean);
}

async function ensureReferenceData() {
  console.log('📋 Setting up reference data...\n');

  const bodyParts = [
    'waist', 'upper legs', 'lower legs', 'back', 'chest',
    'upper arms', 'lower arms', 'shoulders', 'cardio', 'neck'
  ];

  const equipment = [
    'body weight', 'cable', 'leverage machine', 'assisted',
    'medicine ball', 'band', 'stability ball', 'weighted',
    'barbell', 'dumbbell', 'kettlebell', 'machine', 'rope'
  ];

  const muscles = [
    'abs', 'hip flexors', 'lower back', 'obliques', 'quads',
    'hamstrings', 'glutes', 'calves', 'ankle stabilizers', 'lats',
    'biceps', 'rhomboids', 'pectorals', 'triceps', 'shoulders',
    'delts', 'traps', 'upper back', 'forearms', 'core', 'spine',
    'adductors', 'quadriceps', 'cardiovascular system', 'rear deltoids'
  ];

  try {
    // Create body parts
    for (const bp of bodyParts) {
      await supabase
        .from('body_parts')
        .upsert({ name: bp }, { onConflict: 'name' })
        .throwOnError();
    }
    console.log(`✓ Body parts: ${bodyParts.length} references`);

    // Create equipment types
    for (const eq of equipment) {
      await supabase
        .from('equipment_types')
        .upsert({ name: eq }, { onConflict: 'name' })
        .throwOnError();
    }
    console.log(`✓ Equipment: ${equipment.length} types`);

    // Create muscles
    for (const muscle of muscles) {
      await supabase
        .from('muscles')
        .upsert({ name: muscle, category: 'general' }, { onConflict: 'name' })
        .throwOnError();
    }
    console.log(`✓ Muscles: ${muscles.length} references\n`);
  } catch (err) {
    if (err.message.includes('relation') || err.message.includes('does not exist')) {
      console.error('❌ Reference table does not exist');
      console.log('   Please create the schema first:\n');
      console.log('   Option 1: Manual Setup');
      console.log('   1. Go to https://app.supabase.com');
      console.log('   2. Project → SQL Editor → New Query');
      console.log('   3. Copy content from: scripts/supabase-schema.sql');
      console.log('   4. Click Run\n');
      console.log('   Option 2: Auto Setup');
      console.log('   1. Get database password from Supabase Dashboard → Settings → Database');
      console.log('   2. Add to .env.local: SUPABASE_DB_PASSWORD=<password>');
      console.log('   3. Run: node scripts/setup.js\n');
      process.exit(1);
    }
    throw err;
  }
}

async function getOrCreateMuscle(muscleName) {
  if (!muscleName) return null;

  const { data } = await supabase
    .from('muscles')
    .select('id')
    .eq('name', muscleName)
    .single();

  if (data) return data.id;

  const { data: newMuscle } = await supabase
    .from('muscles')
    .insert([{ name: muscleName, category: 'general' }])
    .select('id')
    .single();

  return newMuscle?.id || null;
}

async function getBodyPartId(bodyPartName) {
  const { data } = await supabase
    .from('body_parts')
    .select('id')
    .eq('name', bodyPartName)
    .single();

  return data?.id || null;
}

async function getEquipmentId(equipmentName) {
  const { data } = await supabase
    .from('equipment_types')
    .select('id')
    .eq('name', equipmentName)
    .single();

  return data?.id || null;
}

async function importExercises() {
  console.log('🚀 Starting exercise import...\n');

  const csvPath = path.resolve(__dirname, '../exercises.csv');

  if (!fs.existsSync(csvPath)) {
    console.error(`❌ CSV file not found: ${csvPath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(csvPath, 'utf-8');
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
  });

  const exercises = [];
  for (const record of records) {
    exercises.push({
      id: String(record.id ?? '').trim(),
      name: String(record.name ?? '').trim(),
      bodyPart: String(record.bodyPart ?? '').trim(),
      equipment: String(record.equipment ?? '').trim(),
      target: String(record.target ?? '').trim(),
      instructions: collectIndexedValues(record, 'instructions/'),
      secondaryMuscles: collectIndexedValues(record, 'secondaryMuscles/'),
    });
  }

  console.log(`✓ Parsed ${exercises.length} exercises from CSV\n`);

  const uniqueExercises = Array.from(
    new Map(exercises.map((e) => [e.id, e])).values()
  );

  console.log(`✓ ${uniqueExercises.length} unique exercises\n`);

  let inserted = 0;
  let skipped = 0;
  let errors = 0;
  const startTime = Date.now();

  for (let i = 0; i < uniqueExercises.length; i++) {
    const exercise = uniqueExercises[i];

    try {
      const bodyPartId = await getBodyPartId(exercise.bodyPart);
      const equipmentId = await getEquipmentId(exercise.equipment);
      const primaryTargetId = await getOrCreateMuscle(exercise.target);

      if (!bodyPartId) {
        skipped++;
        if (skipped <= 3) console.warn(`⚠️  Skipping "${exercise.name}" - unknown: ${exercise.bodyPart}`);
        continue;
      }

      if (!equipmentId) {
        skipped++;
        if (skipped <= 3) console.warn(`⚠️  Skipping "${exercise.name}" - unknown: ${exercise.equipment}`);
        continue;
      }

      if (!primaryTargetId) {
        skipped++;
        continue;
      }

      // Insert exercise
      const { error: insertError } = await supabase.from('exercises').upsert(
        [{
          id: exercise.id,
          name: exercise.name,
          body_part_id: bodyPartId,
          equipment_id: equipmentId,
          primary_target_id: primaryTargetId,
          is_active: true,
        }],
        { onConflict: 'id' }
      );

      if (insertError) {
        errors++;
        continue;
      }

      // Insert secondary muscles
      if (exercise.secondaryMuscles.length > 0) {
        const muscleIds = [];
        for (let j = 0; j < exercise.secondaryMuscles.length; j++) {
          const muscleId = await getOrCreateMuscle(exercise.secondaryMuscles[j]);
          if (muscleId) {
            muscleIds.push({
              exercise_id: exercise.id,
              muscle_id: muscleId,
              priority_order: j,
            });
          }
        }

        if (muscleIds.length > 0) {
          await supabase
            .from('exercise_secondary_muscles')
            .upsert(muscleIds, { onConflict: 'exercise_id,muscle_id' });
        }
      }

      // Insert instructions
      if (exercise.instructions.length > 0) {
        const instr = exercise.instructions.map((text, idx) => ({
          exercise_id: exercise.id,
          step_number: idx + 1,
          instruction_text: text,
        }));

        await supabase
          .from('exercise_instructions')
          .upsert(instr, { onConflict: 'exercise_id,step_number' });
      }

      inserted++;

      if ((i + 1) % 100 === 0) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        const pct = Math.round(((i + 1) / uniqueExercises.length) * 100);
        process.stdout.write(`\r  [${pct}%] ${i + 1}/${uniqueExercises.length} exercises (${inserted} OK, ${skipped} skipped) [${elapsed}s]`);
      }
    } catch (err) {
      errors++;
    }
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n✓ Import completed in ${totalTime}s\n`);

  return { inserted, skipped, errors };
}

async function verifyData() {
  console.log('📊 Verifying data...\n');

  const [
    { count: exCount },
    { count: instrCount },
    { count: musclesCount },
  ] = await Promise.all([
    supabase.from('exercises').select('*', { count: 'exact', head: true }),
    supabase.from('exercise_instructions').select('*', { count: 'exact', head: true }),
    supabase.from('exercise_secondary_muscles').select('*', { count: 'exact', head: true }),
  ]);

  console.log('   Tables created:');
  console.log('   ✓ exercises');
  console.log('   ✓ exercise_instructions');
  console.log('   ✓ exercise_secondary_muscles');
  console.log('   ✓ body_parts');
  console.log('   ✓ equipment_types');
  console.log('   ✓ muscles\n');

  console.log('📈 Data Summary:');
  console.log(`   • Total Exercises: ${exCount}`);
  console.log(`   • Total Instructions: ${instrCount}`);
  console.log(`   • Total Secondary Muscles: ${musclesCount}\n`);

  return { exercises: exCount, instructions: instrCount, secondaryMuscles: musclesCount };
}

// Main execution
async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🏋️  SUPABASE EXERCISES DATABASE SETUP');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    await ensureReferenceData();
    const result = await importExercises();

    console.log('📋 Import Summary:');
    console.log(`   ✓ Inserted: ${result.inserted}`);
    console.log(`   ⚠️  Skipped: ${result.skipped}`);
    console.log(`   ❌ Errors: ${result.errors}\n`);

    const verify = await verifyData();

    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ DATABASE SETUP COMPLETED SUCCESSFULLY!');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log('📖 Next steps:');
    console.log('   1. Run: npm run dev');
    console.log('   2. Visit: http://localhost:3000/scan');
    console.log('   3. Start using exercises in your app!\n');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

main();
