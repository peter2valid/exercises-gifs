import { db } from '@/lib/db/dexie';
import exercisesRaw from '../../../data/exercises.json';
import { type Exercise } from './schema';

const SEED_DATE = new Date().toISOString();

export async function seedExercises(): Promise<void> {
  try {
    const count = await db.exercises.count();
    const first = await db.exercises.limit(1).toArray();
    
    // Safety check for is_active field (added in v3)
    const needsUpdate = first.length > 0 && first[0].is_active === undefined;
    
    const rawData = exercisesRaw as any[];
    if (!Array.isArray(rawData)) {
      console.error('[seed] exercisesRaw is not an array:', rawData);
      return;
    }

    // Only skip if we have the full dataset AND they have the is_active property
    if (count >= rawData.length && !needsUpdate) {
      console.log(`[seed] exercises already complete (${count} rows) — skipping`);
      return;
    }

    console.log(`[seed] ${needsUpdate ? 'Updating' : 'Seeding'} ${rawData.length} exercises...`);

    const exercises: Exercise[] = rawData.map((ex) => ({
      id: String(ex.id),
      name: ex.name,
      body_part: ex.bodyPart,
      equipment: ex.equipment,
      target: ex.target,
      instructions: ex.instructions || [],
      secondaryMuscles: ex.secondaryMuscles || [],
      tenant_id: 'default',
      is_active: true,
      created_at: SEED_DATE,
      updated_at: SEED_DATE,
      version: 1,
    }));

    // bulkPut handles both fresh seeds and updates
    await db.exercises.bulkPut(exercises);
    console.log(`[seed] successfully populated ${exercises.length} exercises`);
  } catch (error) {
    console.error('[seed] fatal error during seeding:', error);
  }
}
