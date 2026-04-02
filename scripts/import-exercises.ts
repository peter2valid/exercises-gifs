import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Must use service role for imports
const r2PublicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function collectIndexedValues(record: Record<string, unknown>, prefix: string): string[] {
  return Object.keys(record)
    .filter((key) => key.startsWith(prefix))
    .sort((a, b) => Number(a.split('/')[1]) - Number(b.split('/')[1]))
    .map((key) => String(record[key] ?? '').trim())
    .filter(Boolean);
}

async function importExercises() {
  const csvFilePath = path.resolve(__dirname, '../exercises.csv');
  const fileContent = fs.readFileSync(csvFilePath, { encoding: 'utf-8' });

  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
  });

  const dedupedBySlug = new Map<string, any>();
  for (const record of records as any[]) {
    const sourceId = String(record.id ?? '').trim();
    const name = String(record.name ?? '').trim();
    const bodyPart = String(record.bodyPart ?? '').trim();
    const target = String(record.target ?? '').trim();
    const instructions = collectIndexedValues(record, 'instructions/');
    const secondaryMuscles = collectIndexedValues(record, 'secondaryMuscles/');
    const normalizedMediaId = sourceId.padStart(4, '0');
    const slug = toSlug(name || sourceId);

    dedupedBySlug.set(slug, {
      source_id: sourceId,
      source_name: 'exercise-csv',
      slug,
      name,
      category: bodyPart || null,
      equipment: String(record.equipment ?? '').trim() || null,
      primary_muscles: [target || bodyPart].filter(Boolean),
      secondary_muscles: secondaryMuscles,
      instructions,
      media_loop_url: `${r2PublicUrl}/exercises/${normalizedMediaId}.mp4`,
      is_active: true,
    });
  }

  const normalizedRecords = Array.from(dedupedBySlug.values());

  console.log(`Found ${records.length} raw exercises to import.`);
  console.log(`Prepared ${normalizedRecords.length} unique exercises after slug dedupe.`);

  const batchSize = 100;
  for (let i = 0; i < normalizedRecords.length; i += batchSize) {
    const batch = normalizedRecords.slice(i, i + batchSize);

    const { error } = await supabase
      .from('exercises')
      .upsert(batch, { onConflict: 'slug' });

    if (error) {
      console.error(`Error importing batch starting at ${i}:`, error.message);
    } else {
      console.log(`Imported batch ${i / batchSize + 1} of ${Math.ceil(normalizedRecords.length / batchSize)}`);
    }
  }

  console.log('Import completed successfully!');
}

importExercises().catch(console.error);