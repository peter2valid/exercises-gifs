import { db } from '@/lib/db/dexie';
import { EXERCISES } from '@/lib/data/exercises';
import type { Exercise } from '@/lib/db/schema';

export async function seedExercises(): Promise<void> {
  const count = await db.exercises.count();
  if (count === EXERCISES.length) {
    console.log(`[seed] exercises already complete (${count} rows) — skipping`);
    return;
  }
  // bulkPut handles both fresh seeds and partial seeds (interrupted or partial deletes)
  await db.exercises.bulkPut(EXERCISES);
  console.log(`[seed] seeded ${EXERCISES.length} exercises`);
}

export async function getAllExercises(): Promise<Exercise[]> {
  return db.exercises.toArray();
}
