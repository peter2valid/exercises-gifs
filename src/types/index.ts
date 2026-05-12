export type EventType =
  | 'SESSION_STARTED'
  | 'SET_LOGGED'
  | 'REST_STARTED'
  | 'SESSION_COMPLETED'
  | 'SET_EDITED'
  | 'SET_DELETED'
  | 'MEMBER_CHECKED_IN';

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

// check_in_id is used as session_id on the event so it routes through
// the same event infrastructure without requiring a workout session.
export type MemberCheckedInPayload = {
  session_id: string;   // = check_in_id
  check_in_id: string;
  gym_id: string;
  member_user_id: string;
  checked_in_at: string;
  method: 'qr_scan' | 'manual';
  staff_user_id?: string;
};

export type EventPayload =
  | { type: 'SESSION_STARTED'; payload: SessionStartedPayload }
  | { type: 'SET_LOGGED'; payload: SetLoggedPayload }
  | { type: 'REST_STARTED'; payload: RestStartedPayload }
  | { type: 'SESSION_COMPLETED'; payload: SessionCompletedPayload }
  | { type: 'SET_EDITED'; payload: SetEditedPayload }
  | { type: 'SET_DELETED'; payload: SetDeletedPayload }
  | { type: 'MEMBER_CHECKED_IN'; payload: MemberCheckedInPayload };

export type AnyEventPayload = EventPayload['payload'];

export type SessionSnapshotState = {
  session_id: string;
  status: SessionStatus;
  started_at: string;
  finished_at: string | null;
  set_count: number;
  last_event_id: string;
};
