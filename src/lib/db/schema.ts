import type {
  EventRecord,
  SetLogProjection,
  SessionSnapshot,
  SyncQueueItem,
  WorkoutSessionProjection,
} from '@/types';

export const DB_NAME = 'WorkoutEngineDB';
export const DB_VERSION = 1;

export type DbStores = {
  events: string;
  sync_queue: string;
  workout_sessions: string;
  set_logs: string;
  snapshots: string;
};

export const DB_STORES: DbStores = {
  events: 'id, type, created_at, idempotency_key, sync_state',
  sync_queue: 'id, event_id, attempts, next_retry_at, created_at',
  workout_sessions: 'id, status, started_at, finished_at, updated_at',
  set_logs: 'id, session_id, exercise_id, created_at',
  snapshots: 'id, session_id, created_at',
};

export type DbTables = {
  events: EventRecord;
  sync_queue: SyncQueueItem;
  workout_sessions: WorkoutSessionProjection;
  set_logs: SetLogProjection;
  snapshots: SessionSnapshot;
};
