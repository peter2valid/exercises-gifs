import type { GymEvent } from '@/lib/db/schema';
import type {
  SessionStartedPayload,
  SetLoggedPayload,
  SessionCompletedPayload,
  SetEditedPayload,
  SetDeletedPayload,
  MemberCheckedInPayload,
} from '@/types';
import { type WorkoutEngineState } from './state';

export function applyEvent(
  state: WorkoutEngineState,
  event: GymEvent,
): WorkoutEngineState {
  switch (event.type) {
    case 'SESSION_STARTED': {
      const p = event.payload as SessionStartedPayload;
      return {
        session: {
          id: p.session_id,
          user_id: p.user_id,
          tenant_id: event.tenant_id,
          device_id: event.device_id,
          status: 'active',
          started_at: p.started_at,
          finished_at: null,
          created_at: event.created_at,
          updated_at: event.created_at,
          version: 1,
        },
        sets: {},
      };
    }

    case 'SET_LOGGED': {
      const p = event.payload as SetLoggedPayload;
      return {
        ...state,
        sets: {
          ...state.sets,
          [p.set_id]: {
            id: p.set_id,
            session_id: p.session_id,
            exercise_id: p.exercise_id,
            tenant_id: event.tenant_id,
            device_id: event.device_id,
            weight: p.weight,
            reps: p.reps,
            logged_at: p.logged_at,
            created_at: event.created_at,
            version: 1,
          },
        },
      };
    }

    case 'REST_STARTED': {
      // Rest is transient — no projection change
      return state;
    }

    case 'SESSION_COMPLETED': {
      const p = event.payload as SessionCompletedPayload;
      if (!state.session) return state;
      return {
        ...state,
        session: {
          ...state.session,
          status: 'completed',
          finished_at: p.finished_at,
          updated_at: event.created_at,
          version: state.session.version + 1,
        },
      };
    }

    case 'SET_EDITED': {
      const p = event.payload as SetEditedPayload;
      const existing = state.sets[p.set_id];
      if (!existing) return state;
      return {
        ...state,
        sets: {
          ...state.sets,
          [p.set_id]: {
            ...existing,
            weight: p.weight,
            reps: p.reps,
            version: existing.version + 1,
          },
        },
      };
    }

    case 'SET_DELETED': {
      const p = event.payload as SetDeletedPayload;
      const sets = { ...state.sets };
      delete sets[p.set_id];
      return { ...state, sets };
    }

    case 'MEMBER_CHECKED_IN': {
      // Check-in events carry attendance data but do not mutate workout state.
      // The check_in_id is used as session_id on the event so it routes through
      // the normal event pipeline. Projection is handled separately by the
      // admin dashboard, not the workout engine.
      void (event.payload as MemberCheckedInPayload);
      return state;
    }

    default: {
      // Compile error here means a new EventType was added without a reducer case
      const _exhaustive: never = event.type;
      void _exhaustive;
      return state;
    }
  }
}
