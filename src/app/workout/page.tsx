'use client';

import { useEffect, useMemo, useState } from 'react';
import { useWorkoutStore } from '@/store/workoutStore';
import { getAllExercises } from '@/lib/db/queries';
import { seedExercises } from '@/lib/db/seed';
import {
  getDeviceUserId,
  saveSessionId,
  getSavedSessionId,
  clearSessionId,
} from '@/lib/device/identity';
import { TENANT_ID } from '@/lib/config';
import { Button, Input } from '@/components/ui';
import type { Exercise, SetLog } from '@/lib/db/schema';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function groupByMuscle(exercises: Exercise[]): [string, Exercise[]][] {
  const map: Record<string, Exercise[]> = {};
  for (const ex of exercises) {
    const g = ex.muscle_group ?? 'other';
    if (!map[g]) map[g] = [];
    map[g].push(ex);
  }
  return Object.entries(map);
}

// ─── Entry point ──────────────────────────────────────────────────────────────

export default function WorkoutPage() {
  const phase = useWorkoutStore(s => s.phase);
  const sets  = useWorkoutStore(s => s.sets);

  const startSession    = useWorkoutStore(s => s.startSession);
  const logSet          = useWorkoutStore(s => s.logSet);
  const startRest       = useWorkoutStore(s => s.startRest);
  const endRest         = useWorkoutStore(s => s.endRest);
  const completeSession = useWorkoutStore(s => s.completeSession);
  const loadSession     = useWorkoutStore(s => s.loadSession);
  const reset           = useWorkoutStore(s => s.reset);

  const [exercises,   setExercises]   = useState<Exercise[]>([]);
  const [lastSetId,   setLastSetId]   = useState<string | null>(null);
  const [isStarting,  setIsStarting]  = useState(false);
  const [isRestoring, setIsRestoring] = useState(true);

  useEffect(() => {
    seedExercises().catch(console.error);
    getAllExercises().then(setExercises).catch(console.error);

    const savedId = getSavedSessionId();
    if (savedId) {
      loadSession(savedId, TENANT_ID, getDeviceUserId())
        .catch(console.error)
        .finally(() => setIsRestoring(false));
    } else {
      setIsRestoring(false);
    }
  }, []);

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleStart = () => {
    if (isStarting) return;
    const sessionId = crypto.randomUUID();
    const userId    = getDeviceUserId();
    setIsStarting(true);
    startSession(sessionId, userId, TENANT_ID, userId)
      .then(() => saveSessionId(sessionId))
      .catch(console.error)
      .finally(() => setIsStarting(false));
  };

  const handleLogSet = async (exerciseId: string, weight: number, reps: number): Promise<void> => {
    const setId = crypto.randomUUID();
    await logSet(setId, exerciseId, weight, reps);
    setLastSetId(setId);
  };

  const handleStartRest = () => {
    if (!lastSetId) return;
    startRest(lastSetId, 90).catch(console.error);
  };

  const handleComplete = () => {
    completeSession().then(clearSessionId).catch(console.error);
  };

  const handleReset = () => {
    reset();
    clearSessionId();
    setLastSetId(null);
  };

  // ── Derived ────────────────────────────────────────────────────────────────

  const setList = useMemo(() => Object.values(sets), [sets]);
  const exMap   = useMemo(
    () => Object.fromEntries(exercises.map(e => [e.id, e])),
    [exercises],
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  if (isRestoring) return <RestoringView />;

  return (
    <div className="dashboard-bg min-h-screen flex flex-col">
      {phase === 'idle' && (
        <IdleView onStart={handleStart} isLoading={isStarting} />
      )}
      {phase === 'active' && (
        <ActiveView
          sets={setList}
          exercises={exercises}
          exMap={exMap}
          onLogSet={handleLogSet}
          onStartRest={handleStartRest}
          onComplete={handleComplete}
          hasLastSet={!!lastSetId}
        />
      )}
      {phase === 'resting' && (
        <RestingView
          lastSet={lastSetId ? (sets[lastSetId] ?? null) : null}
          exMap={exMap}
          onEndRest={endRest}
        />
      )}
      {phase === 'finished' && (
        <FinishedView
          sets={setList}
          exMap={exMap}
          onReset={handleReset}
        />
      )}
    </div>
  );
}

// ─── Restoring ────────────────────────────────────────────────────────────────

function RestoringView() {
  return (
    <div className="dashboard-bg min-h-screen flex items-center justify-center">
      <span className="text-white/20 text-xs tracking-[0.3em] uppercase">Loading</span>
    </div>
  );
}

// ─── Idle ─────────────────────────────────────────────────────────────────────

function IdleView({ onStart, isLoading }: { onStart: () => void; isLoading: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 gap-10">
      <div className="text-center space-y-2">
        <p className="text-[11px] tracking-[0.25em] text-white/25 uppercase font-medium">Supafast</p>
        <h1 className="text-[34px] font-semibold text-white tracking-tight">Ready to train?</h1>
        <p className="text-white/35 text-sm">Every rep counts.</p>
      </div>

      <button
        onClick={onStart}
        disabled={isLoading}
        className="w-full max-w-xs h-16 rounded-2xl font-semibold text-[16px] tracking-tight transition-all active:scale-[0.98] disabled:opacity-40"
        style={{
          background: 'rgba(255,255,255,0.92)',
          border: '1px solid rgba(255,255,255,0.30)',
          color: '#0a0a0b',
        }}
      >
        {isLoading ? 'Starting…' : 'Start Workout'}
      </button>
    </div>
  );
}

// ─── Active ───────────────────────────────────────────────────────────────────

function ActiveView({
  sets,
  exercises,
  exMap,
  onLogSet,
  onStartRest,
  onComplete,
  hasLastSet,
}: {
  sets: SetLog[];
  exercises: Exercise[];
  exMap: Record<string, Exercise>;
  onLogSet: (exerciseId: string, weight: number, reps: number) => Promise<void>;
  onStartRest: () => void;
  onComplete: () => void;
  hasLastSet: boolean;
}) {
  const groups  = useMemo(() => groupByMuscle(exercises), [exercises]);
  const firstId = exercises[0]?.id ?? '';

  const [exerciseId, setExerciseId] = useState(firstId);
  const [weight, setWeight]         = useState(60);
  const [reps,   setReps]           = useState(5);
  const [isLogging, setIsLogging]   = useState(false);
  const [lastUsed,  setLastUsed]    = useState<Record<string, { weight: number; reps: number }>>({});

  useEffect(() => {
    if (!exerciseId && exercises.length > 0) setExerciseId(exercises[0].id);
  }, [exercises]);

  const handleExerciseChange = (id: string) => {
    setExerciseId(id);
    if (lastUsed[id]) {
      setWeight(lastUsed[id].weight);
      setReps(lastUsed[id].reps);
    }
  };

  const handleLog = async () => {
    if (!exerciseId || isLogging) return;
    setIsLogging(true);
    try {
      await onLogSet(exerciseId, weight, reps);
      setLastUsed(prev => ({ ...prev, [exerciseId]: { weight, reps } }));
    } catch (e) {
      console.error(e);
    } finally {
      setIsLogging(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-10 pb-4">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse" />
          <span className="text-white/40 text-xs font-medium tracking-[0.2em] uppercase">Active</span>
        </div>
        <span className="text-white/30 text-xs tabular-nums">
          {sets.length} set{sets.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Set history */}
      <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-2 scrollbar-hide">
        {sets.length === 0 && (
          <p className="text-white/20 text-sm text-center py-10">
            No sets yet
          </p>
        )}
        {[...sets].reverse().map(s => (
          <div
            key={s.id}
            className="flex items-center justify-between px-4 py-3"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '16px',
            }}
          >
            <span className="text-white/60 text-sm">
              {exMap[s.exercise_id]?.name ?? s.exercise_id}
            </span>
            <span className="text-white text-sm font-semibold tabular-nums">
              {s.weight}kg × {s.reps}
            </span>
          </div>
        ))}
      </div>

      {/* Log form */}
      <div className="mx-4 mb-6 p-5 space-y-4" style={{
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.10)',
        borderRadius: '24px',
        backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)',
        boxShadow: '0 1px 0 rgba(255,255,255,0.10) inset, 0 8px 32px rgba(0,0,0,0.36)',
      }}>
        <select
          value={exerciseId}
          onChange={e => handleExerciseChange(e.target.value)}
          className="w-full h-12 rounded-xl text-white text-sm px-3 outline-none transition-colors appearance-none"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.10)',
            color: '#ffffff',
          }}
        >
          {groups.map(([group, exs]) => (
            <optgroup key={group} label={group.toUpperCase()} style={{ background: '#111113' }}>
              {exs.map(ex => (
                <option key={ex.id} value={ex.id} style={{ background: '#111113' }}>
                  {ex.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-white/30 text-[10px] tracking-[0.2em] uppercase font-medium">Weight (kg)</label>
            <Input
              type="number"
              min={0}
              step={2.5}
              value={weight}
              onChange={e => setWeight(Number(e.target.value))}
              className="text-white text-center text-lg font-semibold focus-visible:ring-white/20"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-white/30 text-[10px] tracking-[0.2em] uppercase font-medium">Reps</label>
            <Input
              type="number"
              min={1}
              step={1}
              value={reps}
              onChange={e => setReps(Number(e.target.value))}
              className="text-white text-center text-lg font-semibold focus-visible:ring-white/20"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}
            />
          </div>
        </div>

        <button
          onClick={handleLog}
          disabled={!exerciseId || isLogging}
          className="w-full h-14 rounded-xl font-semibold text-[15px] tracking-tight transition-all active:scale-[0.98] disabled:opacity-40"
          style={{
            background: 'rgba(255,255,255,0.92)',
            border: '1px solid rgba(255,255,255,0.30)',
            color: '#0a0a0b',
          }}
        >
          {isLogging ? 'Logging…' : 'Log Set'}
        </button>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onStartRest}
            disabled={!hasLastSet}
            className="h-11 rounded-xl text-sm font-medium text-white/50 transition-all active:scale-[0.98] disabled:opacity-30"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}
          >
            Start Rest
          </button>
          <button
            onClick={onComplete}
            disabled={sets.length === 0}
            className="h-11 rounded-xl text-sm font-medium text-white/50 transition-all active:scale-[0.98] disabled:opacity-30"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}
          >
            Finish
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Resting ──────────────────────────────────────────────────────────────────

function RestingView({
  lastSet,
  exMap,
  onEndRest,
}: {
  lastSet: SetLog | null;
  exMap: Record<string, Exercise>;
  onEndRest: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 gap-10">
      <div className="text-center space-y-4">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
        >
          <span className="text-white/40 text-xl">—</span>
        </div>
        <p className="text-[11px] tracking-[0.25em] text-white/30 uppercase font-medium">Rest</p>
        {lastSet && (
          <div
            className="px-6 py-4"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '20px',
            }}
          >
            <p className="text-white/40 text-sm mb-1">
              {exMap[lastSet.exercise_id]?.name ?? lastSet.exercise_id}
            </p>
            <p className="text-white font-semibold text-xl">
              {lastSet.weight}kg × {lastSet.reps}
            </p>
          </div>
        )}
      </div>

      <button
        onClick={onEndRest}
        className="w-full max-w-xs h-16 rounded-2xl font-semibold text-[16px] tracking-tight transition-all active:scale-[0.98]"
        style={{
          background: 'rgba(255,255,255,0.92)',
          border: '1px solid rgba(255,255,255,0.30)',
          color: '#0a0a0b',
        }}
      >
        Ready
      </button>
    </div>
  );
}

// ─── Finished ─────────────────────────────────────────────────────────────────

function FinishedView({
  sets,
  exMap,
  onReset,
}: {
  sets: SetLog[];
  exMap: Record<string, Exercise>;
  onReset: () => void;
}) {
  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto w-full">
      <div className="px-5 pt-12 pb-8 text-center">
        <p className="text-[11px] tracking-[0.25em] text-white/30 uppercase font-medium mb-3">Complete</p>
        <h2 className="text-[34px] font-semibold text-white tracking-tight">{sets.length} Sets Done</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-5 space-y-2 pb-6 scrollbar-hide">
        {sets.map((s, i) => (
          <div
            key={s.id}
            className="flex items-center gap-4 px-4 py-3"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '16px',
            }}
          >
            <span className="text-white/20 text-xs tabular-nums w-4 text-right">{i + 1}</span>
            <span className="text-white/60 text-sm flex-1">
              {exMap[s.exercise_id]?.name ?? s.exercise_id}
            </span>
            <span className="text-white text-sm font-semibold tabular-nums">
              {s.weight}kg × {s.reps}
            </span>
          </div>
        ))}
      </div>

      <div className="px-5 pb-10">
        <button
          onClick={onReset}
          className="w-full h-14 rounded-2xl font-medium text-[15px] text-white/60 transition-all active:scale-[0.98]"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.10)',
          }}
        >
          New Workout
        </button>
      </div>
    </div>
  );
}
