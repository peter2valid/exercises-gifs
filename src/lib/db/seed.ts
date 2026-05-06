import { db } from '@/lib/db/dexie';
import exercisesRaw from '../../../data/exercises.json';
import { type Exercise } from './schema';

const SEED_DATE = new Date().toISOString();

export async function seedExercises(): Promise<void> {
  const count = await db.exercises.count();
  
  // Only seed if empty or if we want to ensure full dataset
  if (count >= (exercisesRaw as any[]).length) {
    console.log(`[seed] exercises already complete (${count} rows) — skipping`);
    return;
  }

  const exercises: Exercise[] = (exercisesRaw as any[]).map((ex) => ({
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
  console.log(`[seed] seeded ${exercises.length} exercises from JSON dataset`);
}
