import type {
  EventType,
  SyncState,
  QueueStatus,
  SessionStatus,
  AnyEventPayload,
  SessionSnapshotState,
} from '@/types';

export interface GymEvent {
  id: string;
  type: EventType;
  payload: AnyEventPayload;
  session_id: string;       // top-level copy for Dexie indexing
  tenant_id: string;
  device_id: string;
  idempotency_key: string;
  created_at: string;
  sync_state: SyncState;
  version: number;
}

export interface WorkoutSession {
  id: string;
  user_id: string;
  tenant_id: string;
  device_id: string;
  status: SessionStatus;
  started_at: string;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
  version: number;
}

export interface SetLog {
  id: string;
  session_id: string;
  exercise_id: string;
  tenant_id: string;
  device_id: string;
  weight: number;
  reps: number;
  logged_at: string;
  created_at: string;
  version: number;
}

export interface SyncQueue {
  id: string;
  event_id: string;
  status: QueueStatus;
  attempts: number;
  next_retry_at: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface SessionSnapshot {
  id: string;
  session_id: string;
  tenant_id: string;
  state: SessionSnapshotState;
  last_event_id: string;
  created_at: string;
  version: number;
}

export interface Template {
  id: string;
  name: string;
  user_id: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
  version: number;
}

export interface TemplateExercise {
  id: string;
  template_id: string;
  exercise_id: string;
  sets: number;
  reps: number;
  rest_seconds: number;
  order: number;
  created_at: string;
  version: number;
}

export interface Exercise {
  id: string;
  name: string;
  muscle_group: string | null;
  equipment: string | null;
  tenant_id: string;
  created_at: string;
  updated_at: string;
  version: number;
}
