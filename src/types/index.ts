export type WorkoutEventType =
  | 'SESSION_STARTED'
  | 'SET_LOGGED'
  | 'REST_STARTED'
  | 'SESSION_COMPLETED'
  | 'SET_EDITED'
  | 'SET_DELETED';

export type SyncState = 'pending' | 'synced' | 'failed';

export type EventRecord = {
  id: string;
  type: WorkoutEventType;
  payload: Record<string, unknown>;
  idempotency_key: string;
  created_at: string;
  sync_state: SyncState;
};

export type SyncQueueItem = {
  id: string;
  event_id: string;
  attempts: number;
  next_retry_at: string | null;
  created_at: string;
};

export type WorkoutSessionProjection = {
  id: string;
  status: 'active' | 'completed' | 'abandoned';
  started_at: string;
  finished_at: string | null;
  updated_at: string;
};

export type SetLogProjection = {
  id: string;
  session_id: string;
  exercise_id: string;
  weight: number;
  reps: number;
  created_at: string;
};

export type SessionSnapshot = {
  id: string;
  session_id: string;
  data: Record<string, unknown>;
  created_at: string;
};