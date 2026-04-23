'use client';

import { useWorkoutStore } from '@/store/workoutStore';
import { seedExercises, getAllExercises } from '@/lib/db/seed';

// ─── Hardcoded test context ───────────────────────────────────────────────────

const TENANT  = 'sim-tenant-001';
const DEVICE  = 'sim-device-001';
const SESSION = 'session-debug-001';
const USER    = 'user-debug-001';
const SQUAT   = 'exercise-squat';
const BENCH   = 'exercise-bench';

// ─── Debug panel ──────────────────────────────────────────────────────────────

export default function WorkoutPage() {
  const phase     = useWorkoutStore(s => s.phase);
  const session   = useWorkoutStore(s => s.session);
  const sets      = useWorkoutStore(s => s.sets);
  const tenantId  = useWorkoutStore(s => s.tenantId);
  const deviceId  = useWorkoutStore(s => s.deviceId);

  const startSession    = useWorkoutStore(s => s.startSession);
  const logSet          = useWorkoutStore(s => s.logSet);
  const startRest       = useWorkoutStore(s => s.startRest);
  const editSet         = useWorkoutStore(s => s.editSet);
  const deleteSet       = useWorkoutStore(s => s.deleteSet);
  const completeSession = useWorkoutStore(s => s.completeSession);
  const loadSession     = useWorkoutStore(s => s.loadSession);
  const reset           = useWorkoutStore(s => s.reset);

  const firstSetId  = Object.keys(sets)[0] as string | undefined;
  const hasSession  = session !== null;
  const hasSets     = firstSetId !== undefined;

  return (
    <div style={styles.root}>
      <h1 style={styles.title}>⚙ ENGINE DEBUG PANEL</h1>

      {/* ── State display ─────────────────────────────────────── */}
      <section style={styles.section}>
        <h2 style={styles.heading}>CURRENT STATE</h2>
        <table style={styles.table}>
          <tbody>
            <Row label="phase"      value={phase} />
            <Row label="session.id" value={session?.id        ?? '—'} />
            <Row label="status"     value={session?.status    ?? '—'} />
            <Row label="tenant_id"  value={tenantId           || '—'} />
            <Row label="device_id"  value={deviceId           || '—'} />
            <Row label="set count"  value={String(Object.keys(sets).length)} />
          </tbody>
        </table>
      </section>

      {/* ── Sets ─────────────────────────────────────────────── */}
      <section style={styles.section}>
        <h2 style={styles.heading}>SETS</h2>
        <pre style={styles.pre}>{JSON.stringify(sets, null, 2)}</pre>
      </section>

      {/* ── Controls ─────────────────────────────────────────── */}
      <section style={styles.section}>
        <h2 style={styles.heading}>CONTROLS</h2>

        <Group label="SESSION">
          <Btn
            label="Start Session"
            onClick={() => startSession(SESSION, USER, TENANT, DEVICE).catch(console.error)}
          />
          <Btn
            label="Complete Session"
            disabled={!hasSession}
            onClick={() => completeSession().catch(console.error)}
          />
          <Btn
            label="Load Session"
            onClick={() => loadSession(SESSION, TENANT, DEVICE).catch(console.error)}
          />
          <Btn
            label="Reset"
            onClick={() => reset()}
          />
        </Group>

        <Group label="LOGGING">
          <Btn
            label="Log Set — squat 80kg × 5"
            disabled={!hasSession}
            onClick={() => logSet(`debug-set-${Date.now()}`, SQUAT, 80, 5).catch(console.error)}
          />
          <Btn
            label="Log Set — bench 100kg × 8"
            disabled={!hasSession}
            onClick={() => logSet(`debug-set-${Date.now()}`, BENCH, 100, 8).catch(console.error)}
          />
          <Btn
            label="Start Rest — 90s"
            disabled={!hasSets}
            onClick={() => startRest(firstSetId!, 90).catch(console.error)}
          />
        </Group>

        <Group label="EXERCISE DATA">
          <Btn
            label="Seed Exercises"
            onClick={() => seedExercises().catch(console.error)}
          />
          <Btn
            label="Log Exercises"
            onClick={() => getAllExercises().then(ex => console.table(ex)).catch(console.error)}
          />
        </Group>

        <Group label={`EDIT / DELETE  (target: ${firstSetId ?? 'none'})`}>
          <Btn
            label="Edit First Set → 90kg × 5"
            disabled={!hasSets}
            onClick={() => editSet(firstSetId!, 90, 5).catch(console.error)}
          />
          <Btn
            label="Delete First Set"
            disabled={!hasSets}
            onClick={() => deleteSet(firstSetId!).catch(console.error)}
          />
        </Group>
      </section>

      {/* ── Validation checklist ──────────────────────────────── */}
      <section style={styles.section}>
        <h2 style={styles.heading}>VALIDATION CHECKLIST</h2>
        <pre style={styles.pre}>{[
          '1. Start Session      → phase becomes active',
          '2. Log sets           → appear in SETS display',
          '3. Start Rest         → phase becomes resting',
          '4. Edit Set           → weight/reps update in SETS',
          '5. Delete Set         → row removed from SETS',
          '6. Complete Session   → phase becomes finished',
          '7. Reset              → all state clears',
          '8. Load Session       → state restores from events',
        ].join('\n')}</pre>
      </section>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Row({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td style={styles.tdLabel}>{label}</td>
      <td style={styles.tdValue}>{value}</td>
    </tr>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={styles.group}>
      <div style={styles.groupLabel}>{label}</div>
      <div style={styles.groupButtons}>{children}</div>
    </div>
  );
}

function Btn({
  label,
  onClick,
  disabled = false,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      style={{ ...styles.btn, ...(disabled ? styles.btnDisabled : {}) }}
      disabled={disabled}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

// ─── Inline styles ────────────────────────────────────────────────────────────

const styles = {
  root: {
    fontFamily: 'monospace',
    padding: '2rem',
    maxWidth: '860px',
    color: '#e2e8f0',
    background: '#0f172a',
    minHeight: '100vh',
  },
  title: {
    fontSize: '1.25rem',
    letterSpacing: '0.1em',
    marginBottom: '2rem',
    color: '#94a3b8',
  },
  heading: {
    fontSize: '0.75rem',
    letterSpacing: '0.15em',
    color: '#64748b',
    marginBottom: '0.75rem',
    borderBottom: '1px solid #1e293b',
    paddingBottom: '0.25rem',
  },
  section: {
    marginBottom: '2rem',
  },
  table: {
    borderCollapse: 'collapse' as const,
    width: '100%',
  },
  tdLabel: {
    color: '#64748b',
    padding: '0.2rem 1rem 0.2rem 0',
    width: '120px',
  },
  tdValue: {
    color: '#f1f5f9',
    padding: '0.2rem 0',
  },
  pre: {
    background: '#1e293b',
    padding: '1rem',
    borderRadius: '4px',
    fontSize: '0.8rem',
    color: '#94a3b8',
    overflowX: 'auto' as const,
    margin: 0,
  },
  group: {
    marginBottom: '1.25rem',
  },
  groupLabel: {
    fontSize: '0.7rem',
    color: '#475569',
    letterSpacing: '0.1em',
    marginBottom: '0.4rem',
  },
  groupButtons: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '0.5rem',
  },
  btn: {
    background: '#1e293b',
    color: '#e2e8f0',
    border: '1px solid #334155',
    padding: '0.4rem 0.75rem',
    borderRadius: '4px',
    fontFamily: 'monospace',
    fontSize: '0.8rem',
    cursor: 'pointer',
  },
  btnDisabled: {
    opacity: 0.35,
    cursor: 'not-allowed',
  },
} as const;
