import Dexie, { type Table } from 'dexie';
import type {
  GymEvent,
  WorkoutSession,
  SetLog,
  SyncQueue,
  SessionSnapshot,
  Template,
  TemplateExercise,
  Exercise,
  EntitlementCache,
} from './schema';

export class SupafastDB extends Dexie {
  events!: Table<GymEvent, string>;
  workout_sessions!: Table<WorkoutSession, string>;
  set_logs!: Table<SetLog, string>;
  sync_queue!: Table<SyncQueue, string>;
  snapshots!: Table<SessionSnapshot, string>;
  templates!: Table<Template, string>;
  template_exercises!: Table<TemplateExercise, string>;
  exercises!: Table<Exercise, string>;
  entitlement_cache!: Table<EntitlementCache, string>;

  constructor() {
    super('SupafastDB');
    
    this.version(1).stores({
      events: 'id, tenant_id, created_at, sync_state',
      workout_sessions: 'id, tenant_id, user_id, status, started_at',
      set_logs: 'id, session_id, exercise_id, [session_id+logged_at]',
      sync_queue: 'id, event_id, status, next_retry_at',
      snapshots: 'id, session_id, tenant_id',
      templates: 'id, tenant_id, user_id',
      template_exercises: 'id, template_id, exercise_id',
      exercises: 'id, tenant_id, name',
    });

    // v3: added indexes for exercises to support performance-critical queries
    this.version(3).stores({
      events: 'id, session_id, tenant_id, created_at, sync_state',
      workout_sessions: 'id, tenant_id, user_id, status, started_at',
      set_logs: 'id, session_id, exercise_id, [session_id+logged_at]',
      sync_queue: 'id, event_id, status, next_retry_at',
      snapshots: 'id, session_id, tenant_id',
      templates: 'id, tenant_id, user_id',
      template_exercises: 'id, template_id, exercise_id',
      exercises: 'id, tenant_id, name, body_part, equipment, is_active',
    });

    // v4: added entitlement_cache for offline-first billing
    this.version(4).stores({
      events: 'id, session_id, tenant_id, created_at, sync_state',
      workout_sessions: 'id, tenant_id, user_id, status, started_at',
      set_logs: 'id, session_id, exercise_id, [session_id+logged_at]',
      sync_queue: 'id, event_id, status, next_retry_at',
      snapshots: 'id, session_id, tenant_id',
      templates: 'id, tenant_id, user_id',
      template_exercises: 'id, template_id, exercise_id',
      exercises: 'id, tenant_id, name, body_part, equipment, is_active',
      entitlement_cache: 'id, user_id',
    });
  }
}

export const db = new SupafastDB();
