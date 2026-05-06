import { db } from './dexie';
import { type Exercise } from './schema';

/**
 * Optimized queries for Exercises using Dexie indexes.
 * Filters for is_active = true by default.
 */

export async function getAllExercises(): Promise<Exercise[]> {
  const exercises = await db.exercises.toArray();
  // Filter for active exercises in-memory for maximum reliability across browsers/versions
  return exercises.filter((ex) => ex.is_active !== false);
}

export async function getExerciseById(id: string): Promise<Exercise | undefined> {
  return db.exercises.get(id);
}
