import { db } from '@/lib/db/dexie';
import type { Exercise } from '@/lib/db/schema';

export async function getAllExercises(): Promise<Exercise[]> {
  return db.exercises.toArray();
}
