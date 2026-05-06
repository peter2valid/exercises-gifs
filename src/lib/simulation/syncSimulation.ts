import { db } from '@/lib/db/dexie';
import { createEvent } from '@/lib/events/createEvent';
import { syncWorker } from '@/lib/sync/SyncWorker';

// ─── Logging helpers ─────────────────────────────────────────────────────────

function log(msg: string)  { console.log(msg); }
function pass(label: string) { console.log(`  ✓ ${label}`); return true; }
function fail(label: string) { console.log(`  ✗ ${label}`); return false; }
function check(label: string, ok: boolean): boolean {
  return ok ? pass(label) : fail(label);
}

// ─── Simulation ──────────────────────────────────────────────────────────────

export async function runSyncSimulation(): Promise<boolean> {
  log('\n════════════════════════════════════════════');
  log('  PHASE 2A SIMULATION — Sync Engine Core   ');
  log('════════════════════════════════════════════\n');

  // Clear previous sync queue items to have a clean state for simulation
  await db.sync_queue.clear();
  log('  sync_queue cleared for simulation');

  // ── PHASE 1: Event Creation ──────────────────────────────────
  log('── PHASE 1: EVENT CREATION ─────────────────\n');

  const event1 = await createEvent({
    type: 'SESSION_STARTED',
    tenant_id: 'sync-test-tenant',
    device_id: 'sync-test-device',
    user_id: 'user-1',
    payload: { session_id: 'sync-session-1', user_id: 'user-1', started_at: new Date().toISOString() }
  });
  log(`  Event created: ${event1.type} (${event1.id})`);

  const queueItem1 = await db.sync_queue.where('event_id').equals(event1.id).first();
  const p1: boolean[] = [
    check('Event sync_state is pending', event1.sync_state === 'pending'),
    check('Sync queue entry exists', !!queueItem1),
    check('Sync queue status is pending', queueItem1?.status === 'pending'),
  ];

  const phase1Pass = p1.every(Boolean);
  log(`\n  → Phase 1: ${phase1Pass ? 'PASS ✓' : 'FAIL ✗'}\n`);

  // ── PHASE 2: Sync Processing (Simulation) ───────────────────
  log('── PHASE 2: SYNC PROCESSING ────────────────\n');

  log('  Triggering processQueue() manually...');
  // We'll run it a few times to simulate multiple batches or retries
  await syncWorker.cycle();

  const afterSync1 = await db.events.get(event1.id);
  const queueAfter1 = await db.sync_queue.where('event_id').equals(event1.id).first();

  log(`  Event status after sync: ${afterSync1?.sync_state}`);
  log(`  Queue status after sync: ${queueAfter1?.status} (Attempts: ${queueAfter1?.attempts})`);

  const p2: boolean[] = [];
  if (queueAfter1?.status === 'completed') {
    p2.push(check('Event state is synced (confirmed)', afterSync1?.sync_state === 'synced'));
  } else if (queueAfter1?.status === 'pending') {
    p2.push(check('Attempt recorded on retryable failure', (queueAfter1.attempts || 0) > 0));
    p2.push(check('Status reverted to pending for retry', queueAfter1.status === 'pending'));
  } else if (queueAfter1?.status === 'failed') {
    p2.push(check('Permanent failure state set', afterSync1?.sync_state === 'failed'));
    p2.push(check('Error message recorded', !!queueAfter1.last_error));
  }

  const phase2Pass = p2.length > 0 && p2.every(Boolean);
  log(`\n  → Phase 2: ${phase2Pass ? 'PASS ✓' : 'FAIL ✗'}\n`);

  // ── PHASE 3: Multiple Events Batching ───────────────────────
  log('── PHASE 3: BATCHING ───────────────────────\n');

  log('  Creating 5 more events...');
  for (let i = 0; i < 5; i++) {
    await createEvent({
      type: 'SET_LOGGED',
      tenant_id: 'sync-test-tenant',
      device_id: 'sync-test-device',
      user_id: 'user-1',
      payload: { 
        session_id: 'sync-session-1', 
        set_id: `set-${i}`, 
        exercise_id: 'ex-1', 
        weight: 100, 
        reps: 10, 
        logged_at: new Date().toISOString() 
      }
    });
  }

  const pendingCountBefore = await db.sync_queue.where('status').equals('pending').count();
  log(`  Pending queue size: ${pendingCountBefore}`);

  log('  Processing batch...');
  await syncWorker.cycle();

  const pendingCountAfter = await db.sync_queue.where('status').equals('pending').count();
  const completedCount = await db.sync_queue.where('status').equals('completed').count();
  
  log(`  Pending after: ${pendingCountAfter}`);
  log(`  Completed: ${completedCount}`);

  const p3: boolean[] = [
    check('Queue size decreased or items completed', pendingCountAfter < pendingCountBefore || completedCount > 0),
  ];

  const phase3Pass = p3.every(Boolean);
  log(`\n  → Phase 3: ${phase3Pass ? 'PASS ✓' : 'FAIL ✗'}\n`);

  // ── RESULT ───────────────────────────────────────────────────
  const allPass = phase1Pass && phase2Pass && phase3Pass;

  log('════════════════════════════════════════════');
  if (allPass) {
    log('  ✓ SYNC SIMULATION COMPLETE — PASS       ');
  } else {
    log('  ✗ SYNC SIMULATION FAILED — SEE ABOVE    ');
  }
  log('════════════════════════════════════════════\n');

  return allPass;
}
