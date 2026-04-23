import type { WorkoutSession, SetLog } from '@/lib/db/schema';

export type WorkoutEngineState = {
  session: WorkoutSession | null;
  sets: Record<string, SetLog>; // keyed by set_id (= SetLog.id)
};

export const INITIAL_STATE: WorkoutEngineState = {
  session: null,
  sets: {},
};
