import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { db } from '@/lib/db/dexie';
import { useLiveQuery } from 'dexie-react-hooks';
import { getExerciseBodyPart, getExerciseTargetMuscles } from '@/lib/exercise-data';

const CATEGORY_ALIASES: Record<string, string[]> = {
  chest: ['chest', 'pectorals', 'serratus anterior'],
  arms: ['arms', 'upper arms', 'lower arms', 'biceps', 'triceps', 'forearms'],
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

type LookupRow = {
  id: number;
  name: string;
};

type InstructionRow = {
  exercise_id: string;
  step_number: number;
  instruction_text: string;
};

type ExerciseRow = {
  id: string;
  name: string;
  body_part_id: number;
  equipment_id: number;
  primary_target_id: number;
  is_active: boolean;
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
        const [exercisesResult, bodyPartsResult, equipmentResult, musclesResult, instructionsResult] = await Promise.all([
          supabase.from('exercises').select('id,name,body_part_id,equipment_id,primary_target_id,is_active'),
          supabase.from('body_parts').select('id,name'),
          supabase.from('equipment_types').select('id,name'),
          supabase.from('muscles').select('id,name'),
          supabase.from('exercise_instructions').select('exercise_id,step_number,instruction_text'),
        ]);

        const remoteData = (exercisesResult.data ?? []) as ExerciseRow[];
        const { error } = exercisesResult;
        if (error) throw error;
        if (bodyPartsResult.error) throw bodyPartsResult.error;
        if (equipmentResult.error) throw equipmentResult.error;
        if (musclesResult.error) throw musclesResult.error;
        if (instructionsResult.error) throw instructionsResult.error;

        const bodyParts = (bodyPartsResult.data ?? []) as LookupRow[];
        const equipmentTypes = (equipmentResult.data ?? []) as LookupRow[];
        const muscles = (musclesResult.data ?? []) as LookupRow[];
        const instructions = (instructionsResult.data ?? []) as InstructionRow[];

        const bodyPartMap = new Map(bodyParts.map((row) => [row.id, row.name]));
        const equipmentMap = new Map(equipmentTypes.map((row) => [row.id, row.name]));
        const muscleMap = new Map(muscles.map((row) => [row.id, row.name]));
        const instructionMap = new Map<string, string[]>();

        for (const row of instructions) {
          const list = instructionMap.get(row.exercise_id) ?? [];
          list[row.step_number - 1] = row.instruction_text;
          instructionMap.set(row.exercise_id, list);
        }

        const localRows = remoteData.map((row) => ({
          id: row.id,
          name: row.name,
          body_part: bodyPartMap.get(row.body_part_id) ?? '',
          equipment: equipmentMap.get(row.equipment_id) ?? '',
          instructions: (instructionMap.get(row.id) ?? []).filter(Boolean).join('\n'),
          target_muscles: muscleMap.get(row.primary_target_id) ?? '',
          video_url: '',
        }));

        if (localRows.length > 0) {
          await db.exercises.bulkPut(localRows);
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