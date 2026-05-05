import { create } from 'zustand';
import { createEvent } from '@/lib/events/createEvent';
import { projectFromEvents } from '@/lib/reducer/projectState';
import type { WorkoutSession, SetLog } from '@/lib/db/schema';
import type { SessionStatus } from '@/types';

type WorkoutPhase = 'idle' | 'active' | 'resting' | 'finished' | 'abandoned';

type WorkoutStore = {
  // Engine state — derived from events, replicated here for reactive UI
  phase: WorkoutPhase;
  session: WorkoutSession | null;
  sets: Record<string, SetLog>;

  // Context — set once per session, used by all subsequent actions
  tenantId: string;
  deviceId: string;

  // Actions
  startSession: (sessionId: string, userId: string, tenantId: string, deviceId: string) => Promise<void>;
  logSet: (setId: string, exerciseId: string, weight: number, reps: number) => Promise<void>;
  startRest: (setId: string, durationSeconds: number) => Promise<void>;
  editSet: (setId: string, weight: number, reps: number) => Promise<void>;
  deleteSet: (setId: string) => Promise<void>;
  completeSession: () => Promise<void>;
  loadSession: (sessionId: string, tenantId: string, deviceId: string) => Promise<void>;
  endRest: () => void;
  reset: () => void;
};

function phaseFromStatus(status: SessionStatus): WorkoutPhase {
  switch (status) {
    case 'active':    return 'active';
    case 'completed': return 'finished';
    case 'abandoned': return 'abandoned';
  }
}

export const useWorkoutStore = create<WorkoutStore>((set, get) => ({
  phase: 'idle',
  session: null,
  sets: {},
  tenantId: '',
  deviceId: '',

  startSession: async (sessionId, userId, tenantId, deviceId) => {
    await createEvent({
      type: 'SESSION_STARTED',
      tenant_id: tenantId,
      device_id: deviceId,
      payload: { session_id: sessionId, user_id: userId, started_at: new Date().toISOString() },
    });
    const engineState = await projectFromEvents(sessionId);
    set({ phase: 'active', session: engineState.session, sets: engineState.sets, tenantId, deviceId });
  },

  logSet: async (setId, exerciseId, weight, reps) => {
    const { session, tenantId, deviceId } = get();
    if (!session) throw new Error('logSet called with no active session');
    await createEvent({
      type: 'SET_LOGGED',
      tenant_id: tenantId,
      device_id: deviceId,
      payload: { session_id: session.id, set_id: setId, exercise_id: exerciseId, weight, reps, logged_at: new Date().toISOString() },
    });
    const engineState = await projectFromEvents(session.id);
    set({ phase: 'active', session: engineState.session, sets: engineState.sets });
  },

  startRest: async (setId, durationSeconds) => {
    const { session, tenantId, deviceId } = get();
    if (!session) throw new Error('startRest called with no active session');
    await createEvent({
      type: 'REST_STARTED',
      tenant_id: tenantId,
      device_id: deviceId,
      payload: { session_id: session.id, set_id: setId, duration_seconds: durationSeconds, started_at: new Date().toISOString() },
    });
    // REST_STARTED has no projection — only phase changes
    set({ phase: 'resting' });
  },

  editSet: async (setId, weight, reps) => {
    const { session, tenantId, deviceId } = get();
    if (!session) throw new Error('editSet called with no active session');
    await createEvent({
      type: 'SET_EDITED',
      tenant_id: tenantId,
      device_id: deviceId,
      payload: { session_id: session.id, set_id: setId, weight, reps, edited_at: new Date().toISOString() },
    });
    const engineState = await projectFromEvents(session.id);
    set({ session: engineState.session, sets: engineState.sets });
  },

  deleteSet: async (setId) => {
    const { session, tenantId, deviceId } = get();
    if (!session) throw new Error('deleteSet called with no active session');
    await createEvent({
      type: 'SET_DELETED',
      tenant_id: tenantId,
      device_id: deviceId,
      payload: { session_id: session.id, set_id: setId, deleted_at: new Date().toISOString() },
    });
    const engineState = await projectFromEvents(session.id);
    set({ session: engineState.session, sets: engineState.sets });
  },

  completeSession: async () => {
    const { session, tenantId, deviceId } = get();
    if (!session) throw new Error('completeSession called with no active session');
    await createEvent({
      type: 'SESSION_COMPLETED',
      tenant_id: tenantId,
      device_id: deviceId,
      payload: { session_id: session.id, finished_at: new Date().toISOString() },
    });
    const engineState = await projectFromEvents(session.id);
    set({ phase: 'finished', session: engineState.session, sets: engineState.sets });
  },

  loadSession: async (sessionId, tenantId, deviceId) => {
    const engineState = await projectFromEvents(sessionId);
    if (!engineState.session) return;
    set({
      phase: phaseFromStatus(engineState.session.status),
      session: engineState.session,
      sets: engineState.sets,
      tenantId,
      deviceId,
    });
  },

  endRest: () => set({ phase: 'active' }),

  reset: () => set({ phase: 'idle', session: null, sets: {}, tenantId: '', deviceId: '' }),
}));
