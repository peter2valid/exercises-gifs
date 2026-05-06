import { db } from '@/lib/db/dexie';
import { createEvent } from '@/lib/events/createEvent';
import {
  loadSessionEvents,
  projectFromEvents,
  projectState,
} from '@/lib/reducer/projectState';
import { replayEvents } from '@/lib/reducer/replay';
import type { WorkoutEngineState } from '@/lib/reducer/state';

// ─── Constants ────────────────────────────────────────────────────────────────

const TENANT    = 'sim-tenant-001';
const DEVICE    = 'sim-device-001';
const SESSION   = 'session-day4-sim';
const USER      = 'user-day4-001';
const SQUAT     = 'exercise-squat';
const BENCH     = 'exercise-bench';
const SET_1     = 'set-d4-001';   // squat 60kg × 5
const SET_2     = 'set-d4-002';   // squat 65kg × 5
const SET_3     = 'set-d4-003';   // squat 70kg × 3 → edited to × 5
const SET_4     = 'set-d4-004';   // bench 80kg × 8 → deleted (wrong exercise)
const SET_5     = 'set-d4-005';   // bench 100kg × 5

// ─── Logging helpers ─────────────────────────────────────────────────────────

function log(msg: string)  { console.log(msg); }
function pass(label: string) { console.log(`  ✓ ${label}`); return true; }
function fail(label: string) { console.log(`  ✗ ${label}`); return false; }
function check(label: string, ok: boolean): boolean {
  return ok ? pass(label) : fail(label);
}

// ─── Simulation ──────────────────────────────────────────────────────────────

export async function runSimulation(): Promise<boolean> {
  log('\n════════════════════════════════════════════');
  log('  DAY 4 SIMULATION — Full Workout Engine   ');
  log('════════════════════════════════════════════\n');

  // ── PHASE 1: Build the full workout ──────────────────────────
  log('── PHASE 1: BUILDING WORKOUT ──────────────\n');

  await createEvent({ type: 'SESSION_STARTED', tenant_id: TENANT, device_id: DEVICE, user_id: USER,
    payload: { session_id: SESSION, user_id: USER, started_at: new Date().toISOString() } });
  log('  SESSION_STARTED');

  await createEvent({ type: 'SET_LOGGED', tenant_id: TENANT, device_id: DEVICE, user_id: USER,
    payload: { session_id: SESSION, set_id: SET_1, exercise_id: SQUAT, weight: 60, reps: 5, logged_at: new Date().toISOString() } });
  log('  SET_LOGGED    squat   60kg × 5');

  await createEvent({ type: 'REST_STARTED', tenant_id: TENANT, device_id: DEVICE, user_id: USER,
    payload: { session_id: SESSION, set_id: SET_1, duration_seconds: 90, started_at: new Date().toISOString() } });
  log('  REST_STARTED  90s');

  await createEvent({ type: 'SET_LOGGED', tenant_id: TENANT, device_id: DEVICE, user_id: USER,
    payload: { session_id: SESSION, set_id: SET_2, exercise_id: SQUAT, weight: 65, reps: 5, logged_at: new Date().toISOString() } });
  log('  SET_LOGGED    squat   65kg × 5');

  await createEvent({ type: 'REST_STARTED', tenant_id: TENANT, device_id: DEVICE, user_id: USER,
    payload: { session_id: SESSION, set_id: SET_2, duration_seconds: 90, started_at: new Date().toISOString() } });
  log('  REST_STARTED  90s');

  await createEvent({ type: 'SET_LOGGED', tenant_id: TENANT, device_id: DEVICE, user_id: USER,
    payload: { session_id: SESSION, set_id: SET_3, exercise_id: SQUAT, weight: 70, reps: 3, logged_at: new Date().toISOString() } });
  log('  SET_LOGGED    squat   70kg × 3  ← wrong reps');

  await createEvent({ type: 'SET_EDITED', tenant_id: TENANT, device_id: DEVICE, user_id: USER,
    payload: { session_id: SESSION, set_id: SET_3, weight: 70, reps: 5, edited_at: new Date().toISOString() } });
  log('  SET_EDITED    squat   70kg × 3 → 5  ← corrected');

  await createEvent({ type: 'REST_STARTED', tenant_id: TENANT, device_id: DEVICE, user_id: USER,
    payload: { session_id: SESSION, set_id: SET_3, duration_seconds: 120, started_at: new Date().toISOString() } });
  log('  REST_STARTED  120s');

  await createEvent({ type: 'SET_LOGGED', tenant_id: TENANT, device_id: DEVICE, user_id: USER,
    payload: { session_id: SESSION, set_id: SET_4, exercise_id: BENCH, weight: 80, reps: 8, logged_at: new Date().toISOString() } });
  log('  SET_LOGGED    bench   80kg × 8  ← wrong exercise');

  await createEvent({ type: 'SET_DELETED', tenant_id: TENANT, device_id: DEVICE, user_id: USER,
    payload: { session_id: SESSION, set_id: SET_4, deleted_at: new Date().toISOString() } });
  log('  SET_DELETED   bench   80kg × 8  ← removed');

  await createEvent({ type: 'SET_LOGGED', tenant_id: TENANT, device_id: DEVICE, user_id: USER,
    payload: { session_id: SESSION, set_id: SET_5, exercise_id: BENCH, weight: 100, reps: 5, logged_at: new Date().toISOString() } });
  log('  SET_LOGGED    bench  100kg × 5');

  await createEvent({ type: 'SESSION_COMPLETED', tenant_id: TENANT, device_id: DEVICE, user_id: USER,
    payload: { session_id: SESSION, finished_at: new Date().toISOString() } });
  log('  SESSION_COMPLETED\n');

  const eventCount = (await loadSessionEvents(SESSION)).length;
  log(`  12 events written (${eventCount} loaded from DB)\n`);

  const originalState: WorkoutEngineState = await projectFromEvents(SESSION);

  // ── PHASE 2: Verify final state ──────────────────────────────
  log('── PHASE 2: VERIFYING FINAL STATE ─────────\n');

  const p2: boolean[] = [
    check('Session exists',                   originalState.session !== null),
    check('Session status = completed',       originalState.session?.status === 'completed'),
    check('Session finished_at is set',       originalState.session?.finished_at !== null),
    check('4 sets total (SET_4 deleted)',     Object.keys(originalState.sets).length === 4),
    check('SET_1: squat  60kg × 5',          originalState.sets[SET_1]?.weight === 60  && originalState.sets[SET_1]?.reps === 5),
    check('SET_2: squat  65kg × 5',          originalState.sets[SET_2]?.weight === 65  && originalState.sets[SET_2]?.reps === 5),
    check('SET_3: squat  70kg × 5 (edited)', originalState.sets[SET_3]?.weight === 70  && originalState.sets[SET_3]?.reps === 5),
    check('SET_4: absent (deleted)',          originalState.sets[SET_4] === undefined),
    check('SET_5: bench 100kg × 5',          originalState.sets[SET_5]?.weight === 100 && originalState.sets[SET_5]?.reps === 5),
    check('SET_3 version bumped by edit',    (originalState.sets[SET_3]?.version ?? 0) > 1),
  ];

  const phase2Pass = p2.every(Boolean);
  log(`\n  → Phase 2: ${phase2Pass ? 'PASS ✓' : 'FAIL ✗'}\n`);

  // ── PHASE 3: Break it ────────────────────────────────────────
  log('── PHASE 3: BREAKING PROJECTIONS ──────────\n');
  log('  Deleting projection tables for this session...\n');

  await db.workout_sessions.delete(SESSION);
  await db.set_logs.where('session_id').equals(SESSION).delete();

  const sessionGone = await db.workout_sessions.get(SESSION);
  const setsGone    = await db.set_logs.where('session_id').equals(SESSION).count();

  const p3: boolean[] = [
    check('workout_sessions row deleted',  sessionGone === undefined),
    check('set_logs rows deleted',         setsGone === 0),
  ];

  const phase3Pass = p3.every(Boolean);
  log(`\n  → Phase 3: ${phase3Pass ? 'PASS ✓' : 'FAIL ✗'}\n`);

  // ── PHASE 4: Recover it ──────────────────────────────────────
  log('── PHASE 4: RECOVERING FROM EVENTS ────────\n');

  const sessionEvents = await loadSessionEvents(SESSION);
  log(`  Loaded ${sessionEvents.length} events from DB`);

  const recoveredState = replayEvents(sessionEvents);
  await projectState(SESSION, recoveredState);
  log('  Replayed → projections written\n');

  // ── PHASE 5: Verify recovery ─────────────────────────────────
  log('── PHASE 5: VERIFYING RECOVERY ─────────────\n');

  const dbSession = await db.workout_sessions.get(SESSION);
  const dbSets    = await db.set_logs.where('session_id').equals(SESSION).toArray();

  const p5: boolean[] = [
    check('Session restored to DB',                        dbSession !== undefined),
    check('Session status matches original',               dbSession?.status       === originalState.session?.status),
    check('Session finished_at matches original',          dbSession?.finished_at  === originalState.session?.finished_at),
    check('Set count matches (4)',                         dbSets.length           === Object.keys(originalState.sets).length),
    check('SET_3 edited weight preserved (70kg)',         dbSets.find(s => s.id === SET_3)?.weight === 70),
    check('SET_3 edited reps preserved (5)',              dbSets.find(s => s.id === SET_3)?.reps   === 5),
    check('SET_4 absent after recovery (deletion held)',  dbSets.find(s => s.id === SET_4) === undefined),
    check('In-memory state matches DB state',
      recoveredState.session?.status         === originalState.session?.status &&
      Object.keys(recoveredState.sets).length === Object.keys(originalState.sets).length,
    ),
  ];

  const phase5Pass = p5.every(Boolean);
  log(`\n  → Phase 5: ${phase5Pass ? 'PASS ✓' : 'FAIL ✗'}\n`);

  // ── RESULT ───────────────────────────────────────────────────
  const allPass = phase2Pass && phase3Pass && phase5Pass;

  log('════════════════════════════════════════════');
  if (allPass) {
    log('  ✓ SIMULATION COMPLETE — ALL PHASES PASS  ');
  } else {
    log('  ✗ SIMULATION FAILED — SEE ABOVE          ');
  }
  log('════════════════════════════════════════════\n');

  return allPass;
}
