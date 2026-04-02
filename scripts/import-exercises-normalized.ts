/**
 * Import Exercises from CSV into Supabase
 * 
 * This script parses exercises.csv and populates the normalized database schema:
 * - exercises
 * - exercise_secondary_muscles
 * - exercise_instructions
 * 
 * Usage: npx ts-node scripts/import-exercises-normalized.ts
 * 
 * Requirements:
 * - .env.local file with SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ExerciseRecord {
  id: string;
  name: string;
  bodyPart: string;
  equipment: string;
  target: string;
  instructions: string[];
  secondaryMuscles: string[];
}

function collectIndexedValues(record: Record<string, unknown>, prefix: string): string[] {
  return Object.keys(record)
    .filter((key) => key.startsWith(prefix))
    .sort((a, b) => Number(a.split('/')[1]) - Number(b.split('/')[1]))
    .map((key) => String(record[key] ?? '').trim())
    .filter(Boolean);
}

async function getOrCreateMuscle(muscleName: string): Promise<number | null> {
  if (!muscleName) return null;

  const { data, error } = await supabase
    .from('muscles')
    .select('id')
    .eq('name', muscleName)
    .single();

  if (data) return data.id;

  // Create new muscle if it doesn't exist
  const { data: newMuscle, error: createError } = await supabase
    .from('muscles')
    .insert([{ name: muscleName, category: 'general' }])
    .select()
    .single();

  if (newMuscle) return newMuscle.id;
  console.warn(`⚠️  Could not create muscle: ${muscleName}`);
  return null;
}

async function getBodyPartId(bodyPartName: string): Promise<number | null> {
  if (!bodyPartName) return null;

  const { data } = await supabase
    .from('body_parts')
    .select('id')
    .eq('name', bodyPartName)
    .single();

  return data?.id || null;
}

async function getEquipmentId(equipmentName: string): Promise<number | null> {
  if (!equipmentName) return null;

  const { data } = await supabase
    .from('equipment_types')
    .select('id')
    .eq('name', equipmentName)
    .single();

  return data?.id || null;
}

async function importExercises() {
  console.log('🚀 Starting exercise import...\n');

  const csvFilePath = path.resolve(__dirname, '../exercises.csv');

  if (!fs.existsSync(csvFilePath)) {
    console.error(`❌ CSV file not found at: ${csvFilePath}`);
    process.exit(1);
  }

  const fileContent = fs.readFileSync(csvFilePath, { encoding: 'utf-8' });

  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
  });

  const exercises: ExerciseRecord[] = [];

  for (const record of records as any[]) {
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

  // Filter out duplicates by ID
  const uniqueExercises = Array.from(
    new Map(exercises.map((e) => [e.id, e])).values()
  );

  console.log(`✓ ${uniqueExercises.length} unique exercises (after dedup)\n`);

  let insertedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const exercise of uniqueExercises) {
    try {
      // Get foreign key IDs
      const bodyPartId = await getBodyPartId(exercise.bodyPart);
      const equipmentId = await getEquipmentId(exercise.equipment);
      const primaryTargetId = await getOrCreateMuscle(exercise.target);

      if (!bodyPartId) {
        console.warn(`⚠️  Skipping "${exercise.name}" - unknown body part: ${exercise.bodyPart}`);
        skippedCount++;
        continue;
      }

      if (!equipmentId) {
        console.warn(`⚠️  Skipping "${exercise.name}" - unknown equipment: ${exercise.equipment}`);
        skippedCount++;
        continue;
      }

      if (!primaryTargetId) {
        console.warn(`⚠️  Skipping "${exercise.name}" - could not resolve primary target`);
        skippedCount++;
        continue;
      }

      // Insert exercise
      const { error: insertError } = await supabase.from('exercises').upsert(
        [
          {
            id: exercise.id,
            name: exercise.name,
            body_part_id: bodyPartId,
            equipment_id: equipmentId,
            primary_target_id: primaryTargetId,
            is_active: true,
          },
        ],
        { onConflict: 'id' }
      );

      if (insertError) {
        console.error(`❌ Error inserting exercise ${exercise.id}:`, insertError.message);
        errorCount++;
        continue;
      }

      // Insert secondary muscles (if any)
      if (exercise.secondaryMuscles.length > 0) {
        const secondaryMuscleIds: Array<{ exercise_id: string; muscle_id: number; priority_order: number }> = [];

        for (let i = 0; i < exercise.secondaryMuscles.length; i++) {
          const muscleId = await getOrCreateMuscle(exercise.secondaryMuscles[i]);
          if (muscleId) {
            secondaryMuscleIds.push({
              exercise_id: exercise.id,
              muscle_id: muscleId,
              priority_order: i,
            });
          }
        }

        if (secondaryMuscleIds.length > 0) {
          const { error: muscleError } = await supabase
            .from('exercise_secondary_muscles')
            .upsert(secondaryMuscleIds, { onConflict: 'exercise_id,muscle_id' });

          if (muscleError) {
            console.warn(`⚠️  Error inserting secondary muscles for ${exercise.id}`);
          }
        }
      }

      // Insert instructions (if any)
      if (exercise.instructions.length > 0) {
        const instructionRecords = exercise.instructions.map((text, idx) => ({
          exercise_id: exercise.id,
          step_number: idx + 1,
          instruction_text: text,
        }));

        const { error: instrError } = await supabase
          .from('exercise_instructions')
          .upsert(instructionRecords, { onConflict: 'exercise_id,step_number' });

        if (instrError) {
          console.warn(`⚠️  Error inserting instructions for ${exercise.id}`);
        }
      }

      insertedCount++;
      if (insertedCount % 10 === 0) {
        process.stdout.write(`\r✓ Imported ${insertedCount} exercises...`);
      }
    } catch (err) {
      console.error(`❌ Unexpected error processing ${exercise.id}:`, err);
      errorCount++;
    }
  }

  console.log(`\n\n📊 Import Summary:`);
  console.log(`   ✓ Inserted: ${insertedCount}`);
  console.log(`   ⚠️  Skipped: ${skippedCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`   Total: ${uniqueExercises.length}\n`);

  if (errorCount === 0 && skippedCount === 0) {
    console.log('✅ Import completed successfully!');
  } else if (errorCount === 0) {
    console.log('⚠️  Import completed with some skipped records.');
  } else {
    console.log('❌ Import completed with errors.');
  }
}

importExercises().catch((err) => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
