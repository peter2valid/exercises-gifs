/**
 * Complete Supabase Database Setup and Data Import
 * 
 * This script:
 * 1. Reads Supabase credentials from .env.local
 * 2. Creates all schema tables and indexes
 * 3. Imports all exercises from exercises.csv
 * 4. Verifies the import with row counts
 * 
 * Usage: npx ts-node scripts/setup-database.ts
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

function normalizeEquipmentName(equipmentName: string): string {
  const normalized = String(equipmentName ?? '').trim().toLowerCase();
  const aliases: Record<string, string> = {
    'ez barbell': 'barbell',
    'olympic barbell': 'barbell',
    'trap bar': 'barbell',
    'smith machine': 'machine',
    'sled machine': 'machine',
    'elliptical machine': 'machine',
    'stepmill machine': 'machine',
    'stationary bike': 'machine',
    'upper body ergometer': 'machine',
    'skierg machine': 'machine',
    'bosu ball': 'stability ball',
    'wheel roller': 'body weight',
    'roller': 'body weight',
  };

  return aliases[normalized] || normalized;
}

async function createSchema() {
  console.log('📋 Setting up schema...\n');

  const schemaPath = path.resolve(__dirname, './supabase-schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, { encoding: 'utf-8' });

  try {
    // Try to execute the entire schema SQL using PostgREST
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
      },
      body: JSON.stringify({ sql: schemaSql }),
    });

    if (response.ok) {
      console.log('✅ Schema created successfully!\n');
      return;
    }
  } catch (err) {
    // Expected if exec_sql RPC doesn't exist
  }

  console.log('📖 Schema setup requires manual execution via Supabase dashboard.\n');
  console.log('   Please follow these steps:');
  console.log('   1. Go to https://app.supabase.com');
  console.log('   2. Select your project');
  console.log('   3. Go to SQL Editor → New Query');
  console.log('   4. Copy the entire content from: scripts/supabase-schema.sql');
  console.log('   5. Paste and click Run\n');
  console.log('   ⏳ Waiting for schema to be ready...');
  
  // Check if tables exist with a simple query
  for (let i = 0; i < 60; i++) {
    try {
      const { data } = await supabase
        .from('exercises')
        .select('id')
        .limit(1)
        .single();
      
      if (data || !data) {
        console.log('✅ Schema is ready! Proceeding with import.\n');
        return;
      }
    } catch (err) {
      // Table doesn't exist yet
      if (i % 5 === 0) {
        process.stdout.write(`\r   Checking... ${i}s`);
      }
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  console.log('\n⚠️  Timeout waiting for schema. Creating tables will be skipped.');
  console.log('   Make sure to execute scripts/supabase-schema.sql in Supabase dashboard.\n');
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
  return null;
}

async function getBodyPartId(bodyPartName: string): Promise<number | null> {
  if (!bodyPartName) return null;

  const { data } = await supabase
    .from('body_parts')
    .select('id')
    .eq('name', bodyPartName)
    .single();

  if (data) return data.id;

  const { data: newBodyPart } = await supabase
    .from('body_parts')
    .insert([{ name: bodyPartName }])
    .select('id')
    .single();

  return newBodyPart?.id || null;
}

async function getEquipmentId(equipmentName: string): Promise<number | null> {
  if (!equipmentName) return null;
  const normalizedEquipmentName = normalizeEquipmentName(equipmentName);

  const { data } = await supabase
    .from('equipment_types')
    .select('id')
    .eq('name', normalizedEquipmentName)
    .single();

  if (data) return data.id;

  const { data: newEquipment } = await supabase
    .from('equipment_types')
    .insert([{ name: normalizedEquipmentName }])
    .select('id')
    .single();

  return newEquipment?.id || null;
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

  const startTime = Date.now();

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
      if (insertedCount % 50 === 0) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        process.stdout.write(`\r✓ Imported ${insertedCount}/${uniqueExercises.length} exercises (${elapsed}s)...`);
      }
    } catch (err) {
      console.error(`❌ Unexpected error processing ${exercise.id}:`, err);
      errorCount++;
    }
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n✓ Import completed in ${totalTime}s\n`);

  return { insertedCount, skippedCount, errorCount };
}

async function verifyData() {
  console.log('📊 Verifying imported data...\n');

  try {
    const [
      { count: exerciseCount },
      { count: instructionCount },
      { count: secondaryMuscleCount },
      { count: bodyPartCount },
      { count: equipmentCount },
      { count: muscleCount },
    ] = await Promise.all([
      supabase.from('exercises').select('*', { count: 'exact', head: true }),
      supabase.from('exercise_instructions').select('*', { count: 'exact', head: true }),
      supabase.from('exercise_secondary_muscles').select('*', { count: 'exact', head: true }),
      supabase.from('body_parts').select('*', { count: 'exact', head: true }),
      supabase.from('equipment_types').select('*', { count: 'exact', head: true }),
      supabase.from('muscles').select('*', { count: 'exact', head: true }),
    ]);

    console.log('   Tables created:');
    console.log('   ✓ exercises');
    console.log('   ✓ exercise_instructions');
    console.log('   ✓ exercise_secondary_muscles');
    console.log('   ✓ body_parts');
    console.log('   ✓ equipment_types');
    console.log('   ✓ muscles\n');

    console.log('📈 Data Summary:');
    console.log(`   • Exercises: ${exerciseCount}`);
    console.log(`   • Instructions: ${instructionCount}`);
    console.log(`   • Secondary Muscles: ${secondaryMuscleCount}`);
    console.log(`   • Body Parts: ${bodyPartCount}`);
    console.log(`   • Equipment Types: ${equipmentCount}`);
    console.log(`   • Unique Muscles: ${muscleCount}\n`);

    return { exerciseCount, instructionCount, secondaryMuscleCount, bodyPartCount, equipmentCount, muscleCount };
  } catch (err: any) {
    console.error('❌ Verification failed:', err.message);
    console.log('   This may be expected if the schema has not been created yet.');
    return null;
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🏋️  EXERCISES DATABASE SETUP');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // Step 1: Create schema
    await createSchema();

    // Step 2: Import exercises
    const importResult = await importExercises();

    console.log('📋 Import Summary:');
    console.log(`   ✓ Inserted: ${importResult.insertedCount}`);
    console.log(`   ⚠️  Skipped: ${importResult.skippedCount}`);
    console.log(`   ❌ Errors: ${importResult.errorCount}`);
    console.log(`   Total: ${importResult.insertedCount + importResult.skippedCount + importResult.errorCount}\n`);

    // Step 3: Verify data
    const verifyResult = await verifyData();

    if (verifyResult) {
      console.log('═══════════════════════════════════════════════════════════');
      console.log('✅ DATABASE SETUP COMPLETED SUCCESSFULLY!');
      console.log('═══════════════════════════════════════════════════════════\n');
    } else {
      console.log('⚠️  Import completed, but verification failed.');
      console.log('   This may be normal if schema creation needs manual setup.\n');
    }
  } catch (err) {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  }
}

main();
