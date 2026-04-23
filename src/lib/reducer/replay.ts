import type { GymEvent } from '@/lib/db/schema';
import { applyEvent } from './applyEvent';
import { INITIAL_STATE, type WorkoutEngineState } from './state';

export function replayEvents(events: GymEvent[]): WorkoutEngineState {
  return events.reduce<WorkoutEngineState>(applyEvent, INITIAL_STATE);
}
