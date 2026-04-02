import fs from 'fs';
import path from 'path';
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

async function importExercises() {
  const csvFilePath = path.resolve(__dirname, '../exercises.csv');
  const fileContent = fs.readFileSync(csvFilePath, { encoding: 'utf-8' });

  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
  });

  console.log(`Found ${records.length} exercises to import.`);

  const batchSize = 100;
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize).map((record: any) => ({
      id: String(record.id ?? '').trim(),
      name: String(record.name ?? '').trim(),
      body_part: String(record.bodyPart ?? '').trim(),
      equipment: String(record.equipment ?? '').trim(),
      instructions: Object.keys(record)
        .filter((key) => key.startsWith('instructions/'))
        .sort((a, b) => Number(a.split('/')[1]) - Number(b.split('/')[1]))
        .map((key) => String(record[key] ?? '').trim())
        .filter(Boolean)
        .join('\n'),
      target_muscles: String(record.target ?? '').trim(),
      video_url: `${r2PublicUrl}/exercises/${String(record.id ?? '').trim()}.mp4`,
    }));

    const { error } = await supabase
      .from('exercises')
      .upsert(batch, { onConflict: 'id' });

    if (error) {
      console.error(`Error importing batch starting at ${i}:`, error.message);
    } else {
      console.log(`Imported batch ${i / batchSize + 1} of ${Math.ceil(records.length / batchSize)}`);
    }
  }

  console.log('Import completed successfully!');
}

importExercises().catch(console.error);