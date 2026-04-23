import { db } from '@/lib/db/dexie';
import type { GymEvent } from '@/lib/db/schema';
import { replayEvents } from './replay';
import { type WorkoutEngineState } from './state';

// Single canonical way to fetch and order events for a session.
// Uses the session_id index (GymEvent.session_id) — O(log n) not O(n).
// Sorts by created_at first; uses id as tiebreaker so same-millisecond
// events have a stable, deterministic order across replays.
export async function loadSessionEvents(sessionId: string): Promise<GymEvent[]> {
  const events = await db.events.where('session_id').equals(sessionId).toArray();
  return events.sort((a, b) => {
    const byTime = a.created_at.localeCompare(b.created_at);
    return byTime !== 0 ? byTime : a.id.localeCompare(b.id);
  });
}

// Write computed state into the Dexie projection tables.
// Projections are always derived — clearing + rewriting is safe and correct.
export async function projectState(
  sessionId: string,
  state: WorkoutEngineState,
): Promise<void> {
  if (state.session) {
    await db.workout_sessions.put(state.session);
  }

  await db.set_logs.where('session_id').equals(sessionId).delete();
  const setLogs = Object.values(state.sets);
  if (setLogs.length > 0) {
    await db.set_logs.bulkPut(setLogs);
  }
}

// Load all events for a session from Dexie, replay them, write projections.
export async function projectFromEvents(sessionId: string): Promise<WorkoutEngineState> {
  const sessionEvents = await loadSessionEvents(sessionId);
  const state = replayEvents(sessionEvents);
  await projectState(sessionId, state);
  return state;
}
