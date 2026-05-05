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
import { Play, Pause, RotateCcw, CheckCircle } from 'lucide-react';
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <div className="dashboard-bg min-h-screen pb-24 flex flex-col items-center justify-center px-4">
      <div className="text-center space-y-4 mb-12 max-w-md animate-fade-in">
        <p className="text-xs tracking-[0.3em] text-white/30 uppercase font-medium">Workout</p>
        <h1 className="text-4xl font-bold text-white tracking-tight">Ready to train?</h1>
        <p className="text-sm text-white/40">Every rep counts toward your goals</p>
      </div>

      <Button
        onClick={onStart}
        disabled={isLoading}
        className="w-full max-w-xs h-12 text-base font-semibold mb-6 animate-slide-up flex items-center justify-center gap-2"
        variant="primary"
      >
        <Play size={18} />
        {isLoading ? 'Starting…' : 'Start Workout'}
      </Button>

      <p className="text-xs text-white/20">Tap to begin your session</p>
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <div className="dashboard-bg min-h-screen pb-24">
      <div className="max-w-md mx-auto w-full">
        {/* Header */}
        <div className="sticky top-0 backdrop-blur-xl bg-black/50 border-b border-white/10 z-10">
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-white/40 font-medium tracking-[0.2em] uppercase">Active</span>
            </div>
            <span className="text-xs text-white/30 tabular-nums font-medium">
              {sets.length} set{sets.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 pt-6 pb-6">
          {/* Set History */}
          {sets.length > 0 && (
            <div className="mb-8">
              <p className="text-xs text-white/30 tracking-[0.1em] uppercase font-medium mb-3">Recent</p>
              <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-hide">
                {[...sets].reverse().slice(0, 4).map(s => (
                  <div key={s.id} className="glass-panel p-3 flex items-center justify-between">
                    <span className="text-xs text-white/50">
                      {exMap[s.exercise_id]?.name ?? s.exercise_id}
                    </span>
                    <span className="text-sm font-medium text-white tabular-nums">
                      {s.weight}kg × {s.reps}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Log Form */}
          <div className="glass-panel p-6 space-y-4">
            <div>
              <label className="text-xs text-white/30 tracking-[0.1em] uppercase font-medium block mb-2">Exercise</label>
              <select
                value={exerciseId}
                onChange={e => handleExerciseChange(e.target.value)}
                className="w-full h-11 rounded-lg text-white text-sm px-3 outline-none transition-colors appearance-none bg-white/5 border border-white/15"
              >
                {groups.map(([group, exs]) => (
                  <optgroup key={group} label={group.toUpperCase()} style={{ background: '#1a1a1b' }}>
                    {exs.map(ex => (
                      <option key={ex.id} value={ex.id} style={{ background: '#1a1a1b' }}>
                        {ex.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-white/30 tracking-[0.1em] uppercase font-medium block mb-2">Weight (kg)</label>
                <Input
                  type="number"
                  min={0}
                  step={2.5}
                  value={weight}
                  onChange={e => setWeight(Number(e.target.value))}
                  className="text-center text-lg font-semibold"
                />
              </div>
              <div>
                <label className="text-xs text-white/30 tracking-[0.1em] uppercase font-medium block mb-2">Reps</label>
                <Input
                  type="number"
                  min={1}
                  step={1}
                  value={reps}
                  onChange={e => setReps(Number(e.target.value))}
                  className="text-center text-lg font-semibold"
                />
              </div>
            </div>

            <Button
              onClick={handleLog}
              disabled={!exerciseId || isLogging}
              className="w-full h-11 text-base font-medium flex items-center justify-center gap-2"
              variant="primary"
            >
              {isLogging ? 'Logging…' : 'Log Set'}
            </Button>

            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={onStartRest}
                disabled={!hasLastSet}
                className="h-10 text-sm"
                variant="secondary"
              >
                <Pause size={16} className="mr-1" />
                Rest
              </Button>
              <Button
                onClick={onComplete}
                disabled={sets.length === 0}
                className="h-10 text-sm"
                variant="secondary"
              >
                <CheckCircle size={16} className="mr-1" />
                Finish
              </Button>
            </div>
          </div>
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
    <div className="dashboard-bg min-h-screen pb-24 flex flex-col items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="animate-fade-in">
          <p className="text-xs tracking-[0.3em] text-white/30 uppercase font-medium mb-4">Rest</p>
          <h2 className="text-3xl font-bold text-white mb-4">Take a break</h2>
          {lastSet && (
            <div className="glass-panel p-6">
              <p className="text-xs text-white/40 tracking-[0.1em] uppercase mb-2">Last Set</p>
              <p className="text-white/60 text-sm mb-2">
                {exMap[lastSet.exercise_id]?.name ?? lastSet.exercise_id}
              </p>
              <p className="text-white font-semibold text-xl">
                {lastSet.weight}kg × {lastSet.reps}
              </p>
            </div>
          )}
        </div>

        <Button
          onClick={onEndRest}
          className="w-full h-12 text-base font-semibold animate-slide-up flex items-center justify-center gap-2"
          variant="primary"
        >
          <Play size={18} />
          Ready
        </Button>
      </div>
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
  const totalVolume = sets.reduce((acc, s) => acc + (s.weight * s.reps), 0);

  return (
    <div className="dashboard-bg min-h-screen pb-24 flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md space-y-8">
        <div className="animate-fade-in">
          <p className="text-xs tracking-[0.3em] text-white/30 uppercase font-medium mb-3">Complete</p>
          <h2 className="text-4xl font-bold text-white tracking-tight mb-2">{sets.length} Sets</h2>
          <p className="text-sm text-white/40">{totalVolume.toLocaleString()}kg total volume</p>
        </div>

        {/* Summary */}
        <div className="glass-panel p-6 space-y-4">
          {sets.map((s, i) => (
            <div key={s.id} className="flex items-center justify-between text-sm">
              <span className="text-white/50">{exMap[s.exercise_id]?.name || 'Exercise'}</span>
              <span className="text-white font-medium tabular-nums">{s.weight}kg × {s.reps}</span>
            </div>
          ))}
        </div>

        <Button
          onClick={onReset}
          className="w-full h-12 text-base font-semibold animate-slide-up flex items-center justify-center gap-2"
          variant="primary"
        >
          <RotateCcw size={18} />
          Start New Session
        </Button>
      </div>
    </div>
  );
}
