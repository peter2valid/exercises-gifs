'use client';

import { useMemo, useState, useEffect } from 'react';
import { Button, Input } from '@/components/ui';
import { Play, Pause, RotateCcw, CheckCircle, Plus, Minus, Search, X, RefreshCw } from 'lucide-react';
import type { Exercise, SetLog } from '@/lib/db/schema';
import { searchExercises } from '@/lib/search';

import { ExerciseThumbnail } from '@/components/ExerciseCard';

// --- Shared Utilities ---

function groupByMuscle(exercises: Exercise[]): [string, Exercise[]][] {
  const map: Record<string, Exercise[]> = {};
  for (const ex of exercises) {
    const g = ex.body_part ?? 'other';
    if (!map[g]) map[g] = [];
    map[g].push(ex);
  }
  return Object.entries(map);
}

// --- Views ---

export function RestoringView() {
  return (
    <div className="dashboard-bg min-h-screen flex items-center justify-center">
      <span className="text-white/20 text-xs tracking-[0.3em] uppercase">Loading</span>
    </div>
  );
}

export function IdleView({ onStart, isLoading }: { onStart: () => void; isLoading: boolean }) {
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

export function RestingView({
  lastSet,
  exMap,
  activeRest,
  onEndRest,
  onAdjustRest,
}: {
  lastSet: SetLog | null;
  exMap: Record<string, Exercise>;
  activeRest: { startedAt: string; durationSeconds: number } | null;
  onEndRest: () => void;
  onAdjustRest: (seconds: number) => void;
}) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!activeRest) return;

    const tick = () => {
      const start = new Date(activeRest.startedAt).getTime();
      const now = Date.now();
      const elapsed = Math.floor((now - start) / 1000);
      const rem = Math.max(0, activeRest.durationSeconds - elapsed);
      setRemaining(rem);
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [activeRest]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progress = activeRest ? (remaining / activeRest.durationSeconds) * 100 : 0;

  return (
    <div className="dashboard-bg min-h-screen pb-24 flex flex-col items-center justify-center px-6">
      <div className="text-center w-full max-w-md space-y-8">
        <div className="animate-fade-in flex flex-col items-center">
          <p className="text-xs tracking-[0.4em] text-white/30 uppercase font-bold mb-8">Rest Timer</p>
          
          <div className="relative w-48 h-48 flex items-center justify-center mb-10">
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle
                cx="96"
                cy="96"
                r="88"
                className="stroke-white/5 fill-none"
                strokeWidth="8"
              />
              <circle
                cx="96"
                cy="96"
                r="88"
                className="stroke-white/80 fill-none transition-all duration-1000 ease-linear"
                strokeWidth="8"
                strokeDasharray="552.92"
                strokeDashoffset={552.92 - (552.92 * progress) / 100}
                strokeLinecap="round"
              />
            </svg>
            <div className="flex flex-col items-center">
              <span className="text-5xl font-bold text-white tabular-nums tracking-tighter">
                {formatTime(remaining)}
              </span>
              <span className="text-[10px] text-white/30 uppercase tracking-widest mt-1 font-bold">Remaining</span>
            </div>
          </div>

          <div className="flex gap-3 mb-10">
            <button 
              onClick={() => onAdjustRest(-15)}
              className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-xs font-bold text-white/60 hover:bg-white/10 active:scale-95 transition-all"
              aria-label="Subtract 15 seconds"
            >
              -15s
            </button>
            <button 
              onClick={() => onAdjustRest(30)}
              className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-xs font-bold text-white/60 hover:bg-white/10 active:scale-95 transition-all"
              aria-label="Add 30 seconds"
            >
              +30s
            </button>
          </div>

          {lastSet && (
            <div className="glass-panel w-full p-5 mb-4 animate-slide-up border-white/5 bg-white/[0.02]">
              <p className="text-[10px] text-white/30 tracking-[0.15em] uppercase font-bold mb-2">Previous Set</p>
              <p className="text-white/80 font-semibold mb-1">{exMap[lastSet.exercise_id]?.name ?? 'Exercise'}</p>
              <p className="text-white/40 text-sm">
                {lastSet.weight}kg × {lastSet.reps} reps
              </p>
            </div>
          )}
        </div>

        <Button
          onClick={onEndRest}
          className="w-full h-14 text-base font-bold animate-slide-up flex items-center justify-center gap-3 rounded-2xl shadow-2xl"
          variant="primary"
        >
          <Play size={20} fill="currentColor" />
          Ready Now
        </Button>
      </div>
    </div>
  );
}

export function ActiveView({
  sets,
  exercises,
  exMap,
  initialExerciseId,
  onLogSet,
  onStartRest,
  onComplete,
  hasLastSet,
}: {
  sets: SetLog[];
  exercises: Exercise[];
  exMap: Record<string, Exercise>;
  initialExerciseId: string;
  onLogSet: (exerciseId: string, weight: number, reps: number) => Promise<void>;
  onStartRest: () => void;
  onComplete: () => void;
  hasLastSet: boolean;
}) {
  const groups = useMemo(() => groupByMuscle(exercises), [exercises]);

  const [exerciseId, setExerciseId] = useState(initialExerciseId || exercises[0]?.id || '');
  const [weight, setWeight] = useState(60);
  const [reps, setReps] = useState(5);
  const [isLogging, setIsLogging] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [lastUsed, setLastUsed] = useState<Record<string, { weight: number; reps: number }>>({});

  useEffect(() => {
    const preferredId = initialExerciseId || exercises[0]?.id;
    if (preferredId) setExerciseId((current) => current || preferredId);
  }, [exercises, initialExerciseId]);

  const handleExerciseChange = (id: string) => {
    setExerciseId(id);
    setShowPicker(false);
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
      setLastUsed((prev) => ({ ...prev, [exerciseId]: { weight, reps } }));
    } finally {
      setIsLogging(false);
    }
  };

  const filteredPicker = useMemo(() => {
    return pickerSearch.trim() 
      ? searchExercises(exercises, pickerSearch)
      : exercises.slice(0, 50);
  }, [exercises, pickerSearch]);

  const selectedExercise = exMap[exerciseId];

  return (
    <div className="dashboard-bg min-h-screen pb-32">
      <div className="max-w-md mx-auto w-full">
        <div className="sticky top-0 backdrop-blur-2xl bg-black/60 border-b border-white/10 z-20">
          <div className="flex items-center justify-between px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse" />
              </div>
              <span className="text-xs text-white/50 font-bold tracking-[0.25em] uppercase">Session Active</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-white tabular-nums">{sets.length}</span>
              <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-0.5">Sets</span>
            </div>
          </div>
        </div>

        <div className="px-5 pt-6 pb-6 space-y-6">
          {sets.length > 0 && (
            <div className="space-y-3">
              <p className="text-[10px] text-white/30 tracking-[0.2em] uppercase font-bold ml-1">Previous Sets</p>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {[...sets].reverse().map((s) => (
                  <div key={s.id} className="glass-panel shrink-0 p-3 min-w-[120px] bg-white/[0.03] border-white/5">
                    <p className="text-[10px] text-white/40 truncate mb-1">{exMap[s.exercise_id]?.name ?? 'Exercise'}</p>
                    <p className="text-sm font-bold text-white tabular-nums">
                      {s.weight}kg <span className="text-white/30 mx-1">×</span> {s.reps}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="glass-panel p-6 space-y-8 bg-white/[0.02] border-white/10 shadow-2xl">
            <div className="space-y-2">
              <label className="text-[10px] text-white/30 tracking-[0.2em] uppercase font-bold ml-1">Current Exercise</label>
              <button
                onClick={() => setShowPicker(true)}
                className="w-full h-16 flex items-center justify-between px-3 rounded-2xl bg-white/5 border border-white/5 hover:border-white/15 transition-all active:scale-[0.98]"
              >
                <div className="flex items-center gap-3 overflow-hidden pr-4">
                  <div className="w-10 h-10 shrink-0 relative rounded-lg bg-black/20 overflow-hidden border border-white/5">
                    {exerciseId && (
                      <ExerciseThumbnail 
                        alt={selectedExercise?.name || 'Exercise'} 
                        exerciseId={exerciseId} 
                      />
                    )}
                  </div>
                  <div className="flex flex-col items-start text-left truncate">
                    <span className="text-sm font-bold text-white truncate w-full">
                      {selectedExercise?.name || 'Select Exercise'}
                    </span>
                    <span className="text-[10px] text-white/30 uppercase tracking-wider font-medium">
                      {selectedExercise?.body_part || 'Category'}
                    </span>
                  </div>
                </div>
                <Search size={18} className="text-white/30 shrink-0" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <label className="text-[10px] text-white/30 tracking-[0.2em] uppercase font-bold text-center block">Weight (kg)</label>
                <div className="flex items-center gap-1 bg-white/5 rounded-2xl p-1 border border-white/5">
                  <button 
                    onClick={() => setWeight(w => Math.max(0, w - 2.5))} 
                    className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/10 text-white/40"
                    aria-label="Decrease weight"
                  >
                    <Minus size={18} />
                  </button>
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(Number(e.target.value))}
                    className="w-full bg-transparent text-center text-xl font-bold text-white outline-none"
                  />
                  <button 
                    onClick={() => setWeight(w => w + 2.5)} 
                    className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/10 text-white/40"
                    aria-label="Increase weight"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] text-white/30 tracking-[0.2em] uppercase font-bold text-center block">Repetitions</label>
                <div className="flex items-center gap-1 bg-white/5 rounded-2xl p-1 border border-white/5">
                  <button 
                    onClick={() => setReps(r => Math.max(1, r - 1))} 
                    className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/10 text-white/40"
                    aria-label="Decrease repetitions"
                  >
                    <Minus size={18} />
                  </button>
                  <input
                    type="number"
                    value={reps}
                    onChange={(e) => setReps(Number(e.target.value))}
                    className="w-full bg-transparent text-center text-xl font-bold text-white outline-none"
                  />
                  <button 
                    onClick={() => setReps(r => r + 1)} 
                    className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/10 text-white/40"
                    aria-label="Increase repetitions"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <Button
                onClick={handleLog}
                disabled={!exerciseId || isLogging}
                className="w-full h-14 text-base font-bold flex items-center justify-center gap-3 rounded-2xl shadow-xl active:scale-[0.98]"
                variant="primary"
              >
                {isLogging ? <RefreshCw className="animate-spin" size={20} /> : <CheckCircle size={20} />}
                {isLogging ? 'Logging...' : 'Complete Set'}
              </Button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={onStartRest}
                  disabled={!hasLastSet}
                  className="h-12 flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 text-sm font-bold text-white/70 hover:bg-white/10 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all"
                >
                  <Pause size={16} fill="currentColor" />
                  Take Rest
                </button>
                <button
                  onClick={onComplete}
                  disabled={sets.length === 0}
                  className="h-12 flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 text-sm font-bold text-white/70 hover:bg-white/10 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all"
                >
                  <CheckCircle size={16} />
                  Finish
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showPicker && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black/90 backdrop-blur-3xl animate-fade-in">
          <div className="flex items-center gap-4 px-6 pt-8 pb-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
              <input
                autoFocus
                type="text"
                placeholder="Find exercise..."
                value={pickerSearch}
                onChange={(e) => setPickerSearch(e.target.value)}
                className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 text-white text-lg font-medium outline-none focus:border-white/30 transition-all"
              />
            </div>
            <button 
              onClick={() => setShowPicker(false)} 
              className="w-12 h-14 flex items-center justify-center text-white/40 hover:text-white"
              aria-label="Close picker"
            >
              <X size={24} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto px-6 pb-12 space-y-2 custom-scrollbar">
            {filteredPicker.length === 0 ? (
              <div className="py-20 text-center text-white/20">No exercises found</div>
            ) : (
              filteredPicker.map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => handleExerciseChange(ex.id)}
                  className="w-full glass-panel p-4 flex flex-col items-start hover:bg-white/5 border-white/5 transition-all active:scale-[0.99]"
                >
                  <span className="text-sm font-bold text-white">{ex.name}</span>
                  <span className="text-[10px] text-white/30 uppercase tracking-widest mt-1 font-semibold">{ex.body_part} • {ex.equipment}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function FinishedView({
  sets,
  exMap,
  onReset,
}: {
  sets: SetLog[];
  exMap: Record<string, Exercise>;
  onReset: () => void;
}) {
  const totalVolume = sets.reduce((acc, s) => acc + s.weight * s.reps, 0);

  return (
    <div className="dashboard-bg min-h-screen pb-24 flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md space-y-8">
        <div className="animate-fade-in">
          <p className="text-xs tracking-[0.3em] text-white/30 uppercase font-medium mb-3">Complete</p>
          <h2 className="text-4xl font-bold text-white tracking-tight mb-2">{sets.length} Sets</h2>
          <p className="text-sm text-white/40">{totalVolume.toLocaleString()}kg total volume</p>
        </div>

        <div className="glass-panel p-6 space-y-4">
          {sets.map((s) => (
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
