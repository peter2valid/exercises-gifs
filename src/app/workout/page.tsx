'use client';

import { useEffect } from 'react';
import { db } from '@/lib/db/dexie';
import type { GymEvent } from '@/lib/db/schema';

const TEST_EVENT_ID = 'test-event-day1-foundation';

export default function WorkoutPage() {
  useEffect(() => {
    async function runDbTest() {
      const testEvent: GymEvent = {
        id: TEST_EVENT_ID,
        type: 'SESSION_STARTED',
        payload: {
          session_id: 'test-session-001',
          user_id: 'test-user-001',
          started_at: new Date().toISOString(),
        },
        tenant_id: 'test-tenant-001',
        device_id: 'test-device-001',
        idempotency_key: TEST_EVENT_ID,
        created_at: new Date().toISOString(),
        sync_state: 'pending',
        version: 1,
      };

      await db.events.put(testEvent);
      console.log('[DB TEST] Inserted event:', testEvent);

      const events = await db.events.toArray();
      console.log('[DB TEST] Retrieved events:', events);
      console.log('[DB TEST] Event count:', events.length);
      console.log('[DB TEST] Tables available:', [
        'events',
        'workout_sessions',
        'set_logs',
        'sync_queue',
        'snapshots',
        'templates',
        'template_exercises',
        'exercises',
      ]);
    }

    runDbTest().catch(console.error);
  }, []);

  return <div>Workout Page</div>;
}
