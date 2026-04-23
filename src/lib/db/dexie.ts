import Dexie, { type Table } from 'dexie';
import type {
  EventRecord,
  SetLogProjection,
  SessionSnapshot,
  SyncQueueItem,
  WorkoutSessionProjection,
} from '@/types';
import { DB_NAME, DB_STORES, DB_VERSION } from './schema';

export class AppDatabase extends Dexie {
  events!: Table<EventRecord, string>;
  sync_queue!: Table<SyncQueueItem, string>;
  workout_sessions!: Table<WorkoutSessionProjection, string>;
  set_logs!: Table<SetLogProjection, string>;
  snapshots!: Table<SessionSnapshot, string>;

  constructor() {
    super(DB_NAME);
    this.version(DB_VERSION).stores(DB_STORES);
  }
}

export const db = new AppDatabase();
