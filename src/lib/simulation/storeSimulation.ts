import { useWorkoutStore } from '@/store/workoutStore';

// ─── Constants ────────────────────────────────────────────────────────────────

const TENANT  = 'sim-tenant-001';
const DEVICE  = 'sim-device-001';
const SESSION = 'session-day5-sim';
const USER    = 'user-day5-001';
const SQUAT   = 'exercise-squat';
const BENCH   = 'exercise-bench';
const SET_A   = 'set-d5-001';   // squat 80kg × 5
const SET_B   = 'set-d5-002';   // squat 80kg × 3 → edited to × 5
const SET_C   = 'set-d5-003';   // bench 60kg × 10 → deleted (wrong exercise)
const SET_D   = 'set-d5-004';   // bench 80kg × 8

// ─── Logging helpers ─────────────────────────────────────────────────────────

function log(msg: string)  { console.log(msg); }
function pass(label: string) { console.log(`  ✓ ${label}`); return true; }
function fail(label: string) { console.log(`  ✗ ${label}`); return false; }
function check(label: string, ok: boolean): boolean {
  return ok ? pass(label) : fail(label);
}

// ─── Simulation ──────────────────────────────────────────────────────────────

export async function runStoreSimulation(): Promise<boolean> {
  log('\n════════════════════════════════════════════');
  log('  DAY 5 SIMULATION — Zustand Store Layer   ');
  log('════════════════════════════════════════════\n');

  const store = useWorkoutStore.getState();

  // ── PHASE 1: Start session ────────────────────────────────────
  log('── PHASE 1: SESSION START ──────────────────\n');

  await store.startSession(SESSION, USER, TENANT, DEVICE);
  log('  startSession() called');

  const afterStart = useWorkoutStore.getState();
  const p1: boolean[] = [
    check('phase = active',                afterStart.phase === 'active'),
    check('session exists in store',       afterStart.session !== null),
    check('session.id matches',            afterStart.session?.id === SESSION),
    check('session.status = active',       afterStart.session?.status === 'active'),
    check('tenantId stored',               afterStart.tenantId === TENANT),
    check('deviceId stored',               afterStart.deviceId === DEVICE),
    check('sets empty at start',           Object.keys(afterStart.sets).length === 0),
  ];

  const phase1Pass = p1.every(Boolean);
  log(`\n  → Phase 1: ${phase1Pass ? 'PASS ✓' : 'FAIL ✗'}\n`);

  // ── PHASE 2: Log sets + rest ──────────────────────────────────
  log('── PHASE 2: SET LOGGING + REST ─────────────\n');

  await store.logSet(SET_A, SQUAT, 80, 5);
  log('  logSet   squat  80kg × 5');

  await store.startRest(SET_A, 90);
  log('  startRest 90s');

  const afterRest = useWorkoutStore.getState();
  const p2a: boolean[] = [
    check('phase = resting after startRest',   afterRest.phase === 'resting'),
    check('SET_A visible in store',            afterRest.sets[SET_A] !== undefined),
    check('SET_A weight = 80',                 afterRest.sets[SET_A]?.weight === 80),
    check('SET_A reps = 5',                    afterRest.sets[SET_A]?.reps === 5),
  ];

  await store.logSet(SET_B, SQUAT, 80, 3);
  log('  logSet   squat  80kg × 3  ← wrong reps');

  const afterSecondSet = useWorkoutStore.getState();
  const p2b: boolean[] = [
    check('phase = active after logSet',       afterSecondSet.phase === 'active'),
    check('SET_B visible in store',            afterSecondSet.sets[SET_B] !== undefined),
    check('2 sets in store',                   Object.keys(afterSecondSet.sets).length === 2),
  ];

  const phase2Pass = [...p2a, ...p2b].every(Boolean);
  log(`\n  → Phase 2: ${phase2Pass ? 'PASS ✓' : 'FAIL ✗'}\n`);

  // ── PHASE 3: Edit + delete ────────────────────────────────────
  log('── PHASE 3: EDIT + DELETE ──────────────────\n');

  await store.editSet(SET_B, 80, 5);
  log('  editSet  squat  80kg × 3 → 5  ← corrected');

  await store.logSet(SET_C, BENCH, 60, 10);
  log('  logSet   bench  60kg × 10  ← wrong exercise');

  await store.deleteSet(SET_C);
  log('  deleteSet bench  60kg × 10  ← removed');

  await store.logSet(SET_D, BENCH, 80, 8);
  log('  logSet   bench  80kg × 8');

  const afterEdits = useWorkoutStore.getState();
  const p3: boolean[] = [
    check('SET_B edited reps = 5',             afterEdits.sets[SET_B]?.reps === 5),
    check('SET_B version bumped',              (afterEdits.sets[SET_B]?.version ?? 0) > 1),
    check('SET_C absent (deleted)',            afterEdits.sets[SET_C] === undefined),
    check('SET_D present',                     afterEdits.sets[SET_D] !== undefined),
    check('3 sets in store (A, B, D)',         Object.keys(afterEdits.sets).length === 3),
  ];

  const phase3Pass = p3.every(Boolean);
  log(`\n  → Phase 3: ${phase3Pass ? 'PASS ✓' : 'FAIL ✗'}\n`);

  // ── PHASE 4: Complete session ─────────────────────────────────
  log('── PHASE 4: COMPLETE SESSION ───────────────\n');

  await store.completeSession();
  log('  completeSession() called');

  const afterComplete = useWorkoutStore.getState();
  const p4: boolean[] = [
    check('phase = finished',                  afterComplete.phase === 'finished'),
    check('session.status = completed',        afterComplete.session?.status === 'completed'),
    check('session.finished_at is set',        afterComplete.session?.finished_at !== null),
    check('sets preserved after complete',     Object.keys(afterComplete.sets).length === 3),
  ];

  const phase4Pass = p4.every(Boolean);
  log(`\n  → Phase 4: ${phase4Pass ? 'PASS ✓' : 'FAIL ✗'}\n`);

  // ── PHASE 5: Reset + loadSession ─────────────────────────────
  log('── PHASE 5: RESET + LOAD SESSION ───────────\n');

  store.reset();
  log('  reset() called');

  const afterReset = useWorkoutStore.getState();
  const p5a: boolean[] = [
    check('phase = idle after reset',          afterReset.phase === 'idle'),
    check('session = null after reset',        afterReset.session === null),
    check('sets empty after reset',            Object.keys(afterReset.sets).length === 0),
  ];

  await store.loadSession(SESSION, TENANT, DEVICE, USER);
  log('  loadSession() — restoring from events');

  const afterLoad = useWorkoutStore.getState();
  const p5b: boolean[] = [
    check('phase = finished after load',       afterLoad.phase === 'finished'),
    check('session restored',                  afterLoad.session !== null),
    check('session.id matches',                afterLoad.session?.id === SESSION),
    check('session.status = completed',        afterLoad.session?.status === 'completed'),
    check('3 sets restored',                   Object.keys(afterLoad.sets).length === 3),
    check('SET_A restored (80kg × 5)',         afterLoad.sets[SET_A]?.weight === 80 && afterLoad.sets[SET_A]?.reps === 5),
    check('SET_B restored (80kg × 5 edited)', afterLoad.sets[SET_B]?.weight === 80 && afterLoad.sets[SET_B]?.reps === 5),
    check('SET_C absent after load',           afterLoad.sets[SET_C] === undefined),
    check('SET_D restored (80kg × 8)',         afterLoad.sets[SET_D]?.weight === 80 && afterLoad.sets[SET_D]?.reps === 8),
  ];

  const phase5Pass = [...p5a, ...p5b].every(Boolean);
  log(`\n  → Phase 5: ${phase5Pass ? 'PASS ✓' : 'FAIL ✗'}\n`);

  // ── RESULT ───────────────────────────────────────────────────
  const allPass = phase1Pass && phase2Pass && phase3Pass && phase4Pass && phase5Pass;

  log('════════════════════════════════════════════');
  if (allPass) {
    log('  ✓ SIMULATION COMPLETE — ALL PHASES PASS  ');
  } else {
    log('  ✗ SIMULATION FAILED — SEE ABOVE          ');
  }
  log('════════════════════════════════════════════\n');

  return allPass;
}
