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
  user_id: string;          // top-level copy for auth/sync
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
  body_part: string;
  equipment: string;
  target: string;
  instructions: string[];
  secondaryMuscles: string[];
  tenant_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  version: number;
}

// Singleton row (id = 'current') — offline cache for resolved entitlements.
// Written after every server refresh; read on startup for instant offline access.
export interface EntitlementCache {
  id: 'current';
  user_id: string;
  gym_id: string | null;              // primary gym the user belongs to
  effective_features: string[];       // Feature[] serialised as string[]
  gym_plan: string | null;            // GymPlan | null
  gym_plan_status: string | null;     // SubscriptionStatus | null
  has_member_premium: boolean;
  member_plan_status: string | null;  // SubscriptionStatus | null
  active_promotions: string[];
  cached_at: string;                  // ISO timestamp of last server fetch
  version: number;
}

export type GymRoleType = 'super_admin' | 'gym_owner' | 'gym_admin' | 'trainer' | 'member';

export interface UserGymRole {
  id: string;
  user_id: string;
  gym_id: string | null; // null for super_admin (platform-wide role)
  role: GymRoleType;
  created_at: string;
  updated_at: string;
}

export interface MemberCheckIn {
  id: string;           // = check_in_id
  gym_id: string;
  member_user_id: string;
  checked_in_at: string;
  method: 'qr_scan' | 'manual';
  staff_user_id: string | null;
  sync_state: string;
  created_at: string;
}
