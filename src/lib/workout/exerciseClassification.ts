import type { Exercise, SetLog } from '@/lib/db/schema';
import { convertWeight, type WeightUnit } from '@/lib/settings';

export type WorkoutExerciseMode = 'strength' | 'reps' | 'time' | 'cardio';

const CARDIO_KEYWORDS = [
  'cardio',
  'treadmill',
  'cycling',
  'cycle',
  'bike',
  'rowing',
  'rower',
  'elliptical',
  'jump rope',
  'skipping',
  'stair',
  'stairs',
  'walk',
  'run',
  'running',
  'sprint',
  'ski',
];

const TIME_KEYWORDS = [
  'stretch',
  'mobility',
  'warm up',
  'warm-up',
  'warmup',
  'cool down',
  'cooldown',
  'activation',
  'hold',
  'plank',
  'isometric',
  'breath',
  'breathing',
  'pose',
  'flow',
  'yoga',
  'meditation',
  'balance',
];

function normalize(value?: string | null) {
  return (value ?? '').trim().toLowerCase();
}

function includesKeyword(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}

export function classifyWorkoutExercise(exercise?: Exercise | null): WorkoutExerciseMode {
  if (!exercise) return 'strength';

  const text = normalize([
    exercise.name,
    exercise.body_part,
    exercise.target,
    exercise.equipment,
  ].join(' '));

  if (exercise.body_part === 'cardio' || includesKeyword(text, CARDIO_KEYWORDS)) {
    return 'cardio';
  }

  if (includesKeyword(text, TIME_KEYWORDS)) {
    return 'time';
  }

  if (normalize(exercise.equipment) === 'body weight') {
    return 'reps';
  }

  return 'strength';
}

export function isCardioExercise(exercise?: Exercise | null) {
  return classifyWorkoutExercise(exercise) === 'cardio';
}

export function usesVolumeExercise(exercise?: Exercise | null) {
  return classifyWorkoutExercise(exercise) === 'strength';
}

export function formatWorkoutSet(exercise: Exercise | null | undefined, set: SetLog | undefined, unit: WeightUnit = 'kg') {
  if (!set) return '—';
  const mode = classifyWorkoutExercise(exercise);

  if (mode === 'cardio') {
    return `${set.reps} min${set.weight > 0 ? ` · ${set.weight} km` : ''}`;
  }

  if (mode === 'time') {
    return `${set.reps} min`;
  }

  if (mode === 'reps') {
    return `${set.reps} reps`;
  }

  const convertedWeight = convertWeight(set.weight, unit);
  const formattedWeight = Math.abs(convertedWeight - Math.round(convertedWeight)) < 0.01 
    ? Math.round(convertedWeight) 
    : convertedWeight.toFixed(1);

  return `${formattedWeight} ${unit} × ${set.reps}`;
}
