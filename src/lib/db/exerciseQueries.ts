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

export async function getExercisesByBodyPart(bodyPart: string): Promise<Exercise[]> {
  return db.exercises
    .where('body_part')
    .equals(bodyPart)
    .and(ex => ex.is_active)
    .toArray();
}

export async function getExerciseById(id: string): Promise<Exercise | undefined> {
  return db.exercises.get(id);
}

export async function searchExercises(query: string): Promise<Exercise[]> {
  if (!query) return getAllExercises();
  
  const q = query.toLowerCase();
  
  // Dexie doesn't have native fuzzy search, but we can use prefix search 
  // or filter the collection. For 1300+ items, a collection filter is fine.
  return db.exercises
    .where('is_active')
    .equals(1)
    .filter(ex => 
      ex.name.toLowerCase().includes(q) || 
      ex.body_part.toLowerCase().includes(q) ||
      ex.target.toLowerCase().includes(q) ||
      ex.equipment.toLowerCase().includes(q)
    )
    .toArray();
}
