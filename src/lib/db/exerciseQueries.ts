import { db } from './dexie';
import { type Exercise } from './schema';

/**
 * Optimized queries for Exercises using Dexie indexes.
 * Filters for is_active = true by default.
 */

export async function getAllExercises(): Promise<Exercise[]> {
  return db.exercises
    .where('is_active')
    .equals(1) // Dexie boolean index stores true as 1
    .toArray();
}

export async function getExerciseById(id: string): Promise<Exercise | undefined> {
  return db.exercises.get(id);
}
