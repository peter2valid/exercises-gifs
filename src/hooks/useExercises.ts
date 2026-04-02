import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { db } from '@/lib/db/dexie';
import { useLiveQuery } from 'dexie-react-hooks';
import { getExerciseBodyPart, getExerciseTargetMuscles } from '@/lib/exercise-data';

const CATEGORY_ALIASES: Record<string, string[]> = {
  chest: ['chest', 'pectorals', 'serratus anterior'],
  biceps: ['biceps', 'upper arms', 'arms'],
  triceps: ['triceps', 'upper arms', 'arms'],
  back: ['back', 'upper back', 'lats', 'traps', 'spine', 'levator scapulae'],
  shoulders: ['shoulders', 'delts', 'deltoids'],
  abs: ['abs', 'abdominals', 'waist', 'core'],
  quads: ['quads', 'quadriceps', 'upper legs', 'legs'],
  hamstrings: ['hamstrings', 'upper legs', 'legs'],
  glutes: ['glutes', 'hips', 'upper legs', 'legs'],
  calves: ['calves', 'lower legs', 'legs'],
  forearms: ['forearms', 'lower arms', 'arms'],
  neck: ['neck'],
  cardio: ['cardio'],
};

export function useExercises(search: string = '', bodyPart: string = 'all') {
  const [isSyncing, setIsSyncing] = useState(false);
  
  // 1. Read from IndexedDB instantly (Local-First)
  const localExercises = useLiveQuery(() => db.exercises.toArray()) || [];

  // 2. Sync in background
  useEffect(() => {
    let isMounted = true;

    async function syncExercises() {
      setIsSyncing(true);
      try {
        // Always refresh from remote so local cache does not become permanently stale.
        const supabase = getSupabaseClient();
        const { data: remoteData, error } = await supabase
          .from('exercises')
          .select('*');

        if (error) throw error;

        if (remoteData && remoteData.length > 0) {
          await db.exercises.bulkPut(remoteData);
        }
      } catch (error) {
        console.error('Failed to sync exercises in background:', error);
      } finally {
        if (isMounted) {
          setIsSyncing(false);
        }
      }
    }
    
    syncExercises();

    return () => {
      isMounted = false;
    };
  }, []);

  // Filter logic (Runs instantly on local data without lag)
  const filtered = localExercises.filter(ex => {
    const normalizedSearch = search.trim().toLowerCase();
    const normalizedBodyPart = bodyPart.trim().toLowerCase();
    const exerciseName = String(ex.name || '').toLowerCase();
    const exerciseBodyPart = getExerciseBodyPart(ex).toLowerCase();
    const exerciseTargetMuscles = getExerciseTargetMuscles(ex).toLowerCase();
    const exerciseSearchBlob = `${exerciseBodyPart} ${exerciseTargetMuscles}`.trim();

    const matchesSearch =
      normalizedSearch.length === 0 ||
      exerciseName.includes(normalizedSearch) ||
      exerciseBodyPart.includes(normalizedSearch) ||
      exerciseTargetMuscles.includes(normalizedSearch);

    const aliases = CATEGORY_ALIASES[normalizedBodyPart] ?? [normalizedBodyPart];
    const matchesBodyPart =
      bodyPart === 'all' ||
      aliases.some((alias) => exerciseSearchBlob.includes(alias));

    return matchesSearch && matchesBodyPart;
  });

  return { 
    exercises: filtered, 
    // Only block UI if we literally have no data to show
    isLoading: isSyncing && localExercises.length === 0,
    isSyncing
  };
}