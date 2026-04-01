import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; 
const r2PublicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL!;

if (!supabaseUrl || !supabaseKey || !r2PublicUrl) {
  console.error('Missing credentials or R2 URL in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function repairUrls() {
  console.log('Fetching exercises from Supabase...');
  const { data: exercises, error: fetchError } = await supabase
    .from('exercises')
    .select('id, video_url');

  if (fetchError) throw fetchError;
  if (!exercises) return;

  console.log(`Analyzing ${exercises.length} exercises...`);

  const updates = exercises
    .filter(ex => ex.video_url.includes('undefined'))
    .map(ex => ({
      id: ex.id,
      video_url: `${r2PublicUrl}/exercises/${ex.id}.mp4`
    }));

  if (updates.length === 0) {
    console.log('No broken URLs found. Everything looks good!');
    return;
  }

  console.log(`Repairing ${updates.length} broken URLs...`);

  for (let i = 0; i < updates.length; i += 50) {
    const batch = updates.slice(i, i + 50);
    const { error: updateError } = await supabase
      .from('exercises')
      .upsert(batch, { onConflict: 'id' });

    if (updateError) {
      console.error(`Error updating batch starting at ${i}:`, updateError.message);
    } else {
      console.log(`Repaired batch ${i / 50 + 1}`);
    }
  }

  console.log('Repair complete!');
}

repairUrls().catch(console.error);
