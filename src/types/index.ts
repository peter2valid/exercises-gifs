export type EventType =
  | 'SESSION_STARTED'
  | 'SET_LOGGED'
  | 'REST_STARTED'
  | 'SESSION_COMPLETED'
  | 'SET_EDITED'
  | 'SET_DELETED';

export type SyncState = 'pending' | 'syncing' | 'synced' | 'failed';

export type QueueStatus = 'pending' | 'syncing' | 'completed' | 'failed';

export type SessionStatus = 'active' | 'completed' | 'abandoned';

export type SessionStartedPayload = {
  session_id: string;
  user_id: string;
  started_at: string;
};

export type SetLoggedPayload = {
  session_id: string;
  set_id: string;
  exercise_id: string;
  weight: number;
  reps: number;
  logged_at: string;
};

export type RestStartedPayload = {
  session_id: string;
  set_id: string;
  duration_seconds: number;
  started_at: string;
};

export type SessionCompletedPayload = {
  session_id: string;
  finished_at: string;
};

export type SetEditedPayload = {
  session_id: string;
  set_id: string;
  weight: number;
  reps: number;
  edited_at: string;
};

export type SetDeletedPayload = {
  session_id: string;
  set_id: string;
  deleted_at: string;
};

export type EventPayload =
  | { type: 'SESSION_STARTED'; payload: SessionStartedPayload }
  | { type: 'SET_LOGGED'; payload: SetLoggedPayload }
  | { type: 'REST_STARTED'; payload: RestStartedPayload }
  | { type: 'SESSION_COMPLETED'; payload: SessionCompletedPayload }
  | { type: 'SET_EDITED'; payload: SetEditedPayload }
  | { type: 'SET_DELETED'; payload: SetDeletedPayload };

export type AnyEventPayload = EventPayload['payload'];

export type SessionSnapshotState = {
  session_id: string;
  status: SessionStatus;
  started_at: string;
  finished_at: string | null;
  set_count: number;
  last_event_id: string;
};
