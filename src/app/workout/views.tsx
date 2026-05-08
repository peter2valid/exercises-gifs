'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import { Button, Loading } from '@/components/ui';
import { Play, Pause, RotateCcw, CheckCircle, Plus, Minus, Search, X, RefreshCw, Timer, Zap } from 'lucide-react';
import type { Exercise, SetLog } from '@/lib/db/schema';
import { searchExercises } from '@/lib/search';
import { ExerciseThumbnail } from '@/components/ExerciseCard';

// --- Utilities ---

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function isCardioExercise(exercise: Exercise | undefined): boolean {
  if (!exercise) return false;
  return (
    exercise.body_part === 'cardio' ||
    exercise.target === 'cardiovascular system' ||
    ['treadmill', 'cycling', 'running', 'rowing', 'elliptical', 'jump rope', 'stair', 'walk'].some(
      (kw) => exercise.name?.toLowerCase().includes(kw)
    )
  );
}

function playBeep() {
  if (typeof window !== 'undefined' && localStorage.getItem('restTimerSound') === 'off') return;
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.6);
    ctx.close().catch(() => {});
  } catch {
    // Audio not supported — silent fail
  }
}

// --- Views ---

export function RestoringView() {
  return (
    <div className="dashboard-bg min-h-screen flex items-center justify-center">
      <Loading size={32} />
    </div>
  );
}

export function IdleView({
  onStart,
  isLoading,
  preselectedExercise,
}: {
  onStart: () => void;
  isLoading: boolean;
  preselectedExercise?: Exercise | null;
}) {
  return (
    <div className="dashboard-bg min-h-screen pb-24 flex flex-col items-center justify-center px-4">
      <div className="text-center space-y-4 mb-12 max-w-md animate-fade-in">
        <p className="text-xs tracking-[0.3em] text-white/30 uppercase font-medium">Workout</p>
        <h1 className="text-4xl font-bold text-white tracking-tight">Ready to train?</h1>
        {preselectedExercise ? (
          <div className="mt-3 flex items-center justify-center gap-3 glass-panel px-5 py-3 rounded-2xl mx-auto w-fit">
            <div className="w-9 h-9 rounded-xl bg-white/5 relative overflow-hidden border border-white/10 shrink-0">
              <ExerciseThumbnail alt={preselectedExercise.name} exerciseId={preselectedExercise.id} />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-white">{preselectedExercise.name}</p>
              <p className="text-[10px] text-white/40 uppercase tracking-wider">{preselectedExercise.body_part}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-white/40">Every rep counts toward your goals</p>
        )}
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
  const beepedRef = useRef(false);

  useEffect(() => {
    if (!activeRest) return;
    beepedRef.current = false;

    const tick = () => {
      const start = new Date(activeRest.startedAt).getTime();
      const now = Date.now();
      const elapsed = Math.floor((now - start) / 1000);
      const rem = Math.max(0, activeRest.durationSeconds - elapsed);
      setRemaining(rem);

      if (rem === 0 && !beepedRef.current) {
        beepedRef.current = true;
        playBeep();
      }
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [activeRest]);

  const progress = activeRest ? (remaining / activeRest.durationSeconds) * 100 : 0;
  const isDone = remaining === 0;

  const lastExercise = lastSet ? exMap[lastSet.exercise_id] : null;
  const lastIsCardio = isCardioExercise(lastExercise ?? undefined);

  return (
    <div className="dashboard-bg min-h-screen pb-24 flex flex-col items-center justify-center px-6">
      <div className="text-center w-full max-w-md space-y-8">
        <div className="animate-fade-in flex flex-col items-center">
          <p className="text-xs tracking-[0.4em] text-white/30 uppercase font-bold mb-8">Rest Timer</p>

          <div className="relative w-48 h-48 flex items-center justify-center mb-10">
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle cx="96" cy="96" r="88" className="stroke-white/5 fill-none" strokeWidth="8" />
              <circle
                cx="96"
                cy="96"
                r="88"
                className={`fill-none transition-all duration-1000 ease-linear ${isDone ? 'stroke-rose-500' : 'stroke-white/80'}`}
                strokeWidth="8"
                strokeDasharray="552.92"
                strokeDashoffset={552.92 - (552.92 * progress) / 100}
                strokeLinecap="round"
              />
            </svg>
            <div className="flex flex-col items-center">
              <span className={`text-5xl font-bold tabular-nums tracking-tighter transition-colors duration-500 ${isDone ? 'text-rose-400 animate-pulse' : 'text-white'}`}>
                {formatTime(remaining)}
              </span>
              <span className={`text-[10px] uppercase tracking-widest mt-1 font-bold transition-colors duration-500 ${isDone ? 'text-rose-400/60' : 'text-white/30'}`}>
                {isDone ? 'Done — Go!' : 'Remaining'}
              </span>
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
              <p className="text-white/80 font-semibold mb-1">{lastExercise?.name ?? 'Exercise'}</p>
              <p className="text-white/40 text-sm">
                {lastIsCardio
                  ? `${lastSet.reps} min${lastSet.weight > 0 ? ` · ${lastSet.weight} km` : ''}`
                  : `${lastSet.weight}kg × ${lastSet.reps} reps`}
              </p>
            </div>
          )}
        </div>

        <Button
          onClick={onEndRest}
          className={`w-full h-14 text-base font-bold animate-slide-up flex items-center justify-center gap-3 rounded-2xl shadow-2xl transition-all ${isDone ? 'ring-2 ring-rose-500/50' : ''}`}
          variant="primary"
        >
          <Play size={20} fill="currentColor" />
          {isDone ? 'Go Now!' : 'Ready Now'}
        </Button>
      </div>
    </div>
  );
}

// --- Cardio Timer Component ---

function CardioTimer({
  durationMinutes,
  onComplete,
}: {
  durationMinutes: number;
  onComplete: () => void;
}) {
  const totalSeconds = durationMinutes * 60;
  const [elapsed, setElapsed] = useState(0);
  const beepedRef = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;
        if (next >= totalSeconds && !beepedRef.current) {
          beepedRef.current = true;
          playBeep();
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [totalSeconds]);

  const remaining = Math.max(0, totalSeconds - elapsed);
  const progress = (elapsed / totalSeconds) * 100;
  const isDone = remaining === 0;

  return (
    <div className="flex flex-col items-center gap-4 py-2">
      <div className="relative w-32 h-32 flex items-center justify-center">
        <svg className="absolute inset-0 w-full h-full -rotate-90">
          <circle cx="64" cy="64" r="56" className="stroke-white/5 fill-none" strokeWidth="6" />
          <circle
            cx="64"
            cy="64"
            r="56"
            className={`fill-none transition-all duration-1000 ease-linear ${isDone ? 'stroke-rose-500' : 'stroke-emerald-400'}`}
            strokeWidth="6"
            strokeDasharray="351.86"
            strokeDashoffset={351.86 - (351.86 * progress) / 100}
            strokeLinecap="round"
          />
        </svg>
        <div className="flex flex-col items-center">
          <span className={`text-2xl font-bold tabular-nums ${isDone ? 'text-rose-400 animate-pulse' : 'text-white'}`}>
            {formatTime(remaining)}
          </span>
          <span className="text-[9px] text-white/30 uppercase tracking-widest font-bold mt-0.5">
            {isDone ? 'Done!' : 'left'}
          </span>
        </div>
      </div>

      {isDone && (
        <button
          onClick={onComplete}
          className="px-6 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-sm font-bold active:scale-95 transition-all"
        >
          Log & Continue
        </button>
      )}
    </div>
  );
}

// --- Active View ---

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
  const [exerciseId, setExerciseId] = useState(initialExerciseId || exercises[0]?.id || '');
  const [weight, setWeight] = useState(60);
  const [reps, setReps] = useState(5);
  // Cardio fields
  const [duration, setDuration] = useState(20); // minutes
  const [distance, setDistance] = useState(0);  // km, optional
  const [cardioActive, setCardioActive] = useState(false);

  const [isLogging, setIsLogging] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [lastUsed, setLastUsed] = useState<Record<string, { weight: number; reps: number }>>({});

  useEffect(() => {
    const preferredId = initialExerciseId || exercises[0]?.id;
    if (preferredId) setExerciseId((current) => current || preferredId);
  }, [exercises, initialExerciseId]);

  const selectedExercise = exMap[exerciseId];
  const isCardio = isCardioExercise(selectedExercise);

  const handleExerciseChange = (id: string) => {
    setExerciseId(id);
    setShowPicker(false);
    setCardioActive(false);
    if (lastUsed[id]) {
      setWeight(lastUsed[id].weight);
      setReps(lastUsed[id].reps);
    }
  };

  const handleLog = async () => {
    if (!exerciseId || isLogging) return;
    setIsLogging(true);
    try {
      if (isCardio) {
        // Store duration as reps, distance as weight (0 if not set)
        await onLogSet(exerciseId, distance, duration);
      } else {
        await onLogSet(exerciseId, weight, reps);
        setLastUsed((prev) => ({ ...prev, [exerciseId]: { weight, reps } }));
      }
      setCardioActive(false);
    } finally {
      setIsLogging(false);
    }
  };

  const filteredPicker = useMemo(() => {
    return pickerSearch.trim()
      ? searchExercises(exercises, pickerSearch)
      : exercises.slice(0, 60);
  }, [exercises, pickerSearch]);

  return (
    <div className="dashboard-bg min-h-screen pb-32">
      <div className="max-w-md mx-auto w-full">
        {/* Session header */}
        <div className="sticky top-0 backdrop-blur-2xl bg-black/60 border-b border-white/10 z-20">
          <div className="flex items-center justify-between px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse" />
              <span className="text-xs text-white/50 font-bold tracking-[0.25em] uppercase">Session Active</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-white tabular-nums">{sets.length}</span>
              <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-0.5">Sets</span>
            </div>
          </div>
        </div>

        <div className="px-5 pt-6 pb-6 space-y-6">
          {/* Previous sets scroll */}
          {sets.length > 0 && (
            <div className="space-y-3">
              <p className="text-[10px] text-white/30 tracking-[0.2em] uppercase font-bold ml-1">Previous Sets</p>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {[...sets].reverse().map((s) => {
                  const ex = exMap[s.exercise_id];
                  const cardio = isCardioExercise(ex);
                  return (
                    <div key={s.id} className="glass-panel shrink-0 p-3 min-w-[130px] bg-white/[0.03] border-white/5">
                      <p className="text-[10px] text-white/40 truncate mb-1">{ex?.name ?? 'Exercise'}</p>
                      <p className="text-sm font-bold text-white tabular-nums">
                        {cardio
                          ? `${s.reps}min${s.weight > 0 ? ` · ${s.weight}km` : ''}`
                          : `${s.weight}kg × ${s.reps}`}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="glass-panel p-6 space-y-6 bg-white/[0.02] border-white/10 shadow-2xl">
            {/* Exercise selector */}
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
                    <span className="text-[10px] text-white/30 uppercase tracking-wider font-medium flex items-center gap-1.5">
                      {isCardio && <Timer size={10} className="text-emerald-400" />}
                      {selectedExercise?.body_part || 'Category'}
                    </span>
                  </div>
                </div>
                <Search size={18} className="text-white/30 shrink-0" />
              </button>
            </div>

            {/* Inputs: Cardio vs Strength */}
            {isCardio ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <Zap size={14} className="text-emerald-400" />
                  <p className="text-[10px] text-white/30 tracking-[0.2em] uppercase font-bold">Cardio Session</p>
                </div>

                {/* Duration */}
                <div className="space-y-3">
                  <label className="text-[10px] text-white/30 tracking-[0.2em] uppercase font-bold text-center block">Duration (min)</label>
                  <div className="flex items-center gap-1 bg-white/5 rounded-2xl p-1 border border-white/5">
                    <button
                      onClick={() => setDuration(d => Math.max(1, d - 1))}
                      className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/10 text-white/40 active:scale-90"
                    >
                      <Minus size={18} />
                    </button>
                    <input
                      type="number"
                      value={duration}
                      onChange={(e) => setDuration(Math.max(1, Number(e.target.value)))}
                      className="w-full bg-transparent text-center text-xl font-bold text-white outline-none"
                    />
                    <button
                      onClick={() => setDuration(d => d + 1)}
                      className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/10 text-white/40 active:scale-90"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>

                {/* Distance (optional) */}
                <div className="space-y-3">
                  <label className="text-[10px] text-white/30 tracking-[0.2em] uppercase font-bold text-center block">Distance (km, optional)</label>
                  <div className="flex items-center gap-1 bg-white/5 rounded-2xl p-1 border border-white/5">
                    <button
                      onClick={() => setDistance(d => Math.max(0, Math.round((d - 0.5) * 10) / 10))}
                      className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/10 text-white/40 active:scale-90"
                    >
                      <Minus size={18} />
                    </button>
                    <input
                      type="number"
                      value={distance || ''}
                      placeholder="0"
                      onChange={(e) => setDistance(Number(e.target.value))}
                      className="w-full bg-transparent text-center text-xl font-bold text-white outline-none placeholder:text-white/20"
                    />
                    <button
                      onClick={() => setDistance(d => Math.round((d + 0.5) * 10) / 10)}
                      className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/10 text-white/40 active:scale-90"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>

                {/* Countdown timer */}
                {cardioActive && (
                  <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-4">
                    <CardioTimer durationMinutes={duration} onComplete={handleLog} />
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="text-[10px] text-white/30 tracking-[0.2em] uppercase font-bold text-center block">Weight (kg)</label>
                  <div className="flex items-center gap-1 bg-white/5 rounded-2xl p-1 border border-white/5">
                    <button onClick={() => setWeight(w => Math.max(0, w - 2.5))} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/10 text-white/40 active:scale-90">
                      <Minus size={18} />
                    </button>
                    <input
                      type="number"
                      value={weight}
                      onChange={(e) => setWeight(Number(e.target.value))}
                      className="w-full bg-transparent text-center text-xl font-bold text-white outline-none"
                    />
                    <button onClick={() => setWeight(w => w + 2.5)} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/10 text-white/40 active:scale-90">
                      <Plus size={18} />
                    </button>
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] text-white/30 tracking-[0.2em] uppercase font-bold text-center block">Repetitions</label>
                  <div className="flex items-center gap-1 bg-white/5 rounded-2xl p-1 border border-white/5">
                    <button onClick={() => setReps(r => Math.max(1, r - 1))} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/10 text-white/40 active:scale-90">
                      <Minus size={18} />
                    </button>
                    <input
                      type="number"
                      value={reps}
                      onChange={(e) => setReps(Number(e.target.value))}
                      className="w-full bg-transparent text-center text-xl font-bold text-white outline-none"
                    />
                    <button onClick={() => setReps(r => r + 1)} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/10 text-white/40 active:scale-90">
                      <Plus size={18} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="space-y-4 pt-2">
              {isCardio ? (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setCardioActive(!cardioActive)}
                    className={`h-14 flex items-center justify-center gap-2 rounded-2xl border font-bold text-sm transition-all active:scale-[0.98] ${
                      cardioActive
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                        : 'border-white/10 bg-white/5 text-white/70'
                    }`}
                  >
                    <Timer size={18} />
                    {cardioActive ? 'Timer On' : 'Start Timer'}
                  </button>
                  <Button
                    onClick={handleLog}
                    disabled={isLogging}
                    className="h-14 text-sm font-bold flex items-center justify-center gap-2 rounded-2xl shadow-xl active:scale-[0.98]"
                    variant="primary"
                  >
                    {isLogging ? <RefreshCw className="animate-spin" size={18} /> : <CheckCircle size={18} />}
                    {isLogging ? 'Logging...' : 'Log Set'}
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={handleLog}
                  disabled={!exerciseId || isLogging}
                  className="w-full h-14 text-base font-bold flex items-center justify-center gap-3 rounded-2xl shadow-xl active:scale-[0.98]"
                  variant="primary"
                >
                  {isLogging ? <RefreshCw className="animate-spin" size={20} /> : <CheckCircle size={20} />}
                  {isLogging ? 'Logging...' : 'Complete Set'}
                </Button>
              )}

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

      {/* Exercise Picker Modal */}
      {showPicker && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black/95 backdrop-blur-3xl animate-fade-in">
          <div className="flex items-center gap-4 px-5 pt-8 pb-4 border-b border-white/5">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
              <input
                autoFocus
                type="search"
                placeholder="Find exercise..."
                value={pickerSearch}
                onChange={(e) => setPickerSearch(e.target.value)}
                className="w-full h-13 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-white text-base font-medium outline-none focus:border-white/30 transition-all"
              />
            </div>
            <button
              onClick={() => { setShowPicker(false); setPickerSearch(''); }}
              className="w-11 h-11 flex items-center justify-center text-white/40 hover:text-white active:scale-90 transition-all"
              aria-label="Close picker"
            >
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-3 space-y-1.5">
            {filteredPicker.length === 0 ? (
              <div className="py-20 text-center text-white/20">No exercises found</div>
            ) : (
              filteredPicker.map((ex) => {
                const cardio = isCardioExercise(ex);
                return (
                  <button
                    key={ex.id}
                    onClick={() => handleExerciseChange(ex.id)}
                    className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-white/5 active:bg-white/10 active:scale-[0.99] transition-all border border-transparent hover:border-white/5"
                  >
                    <div className="w-12 h-12 shrink-0 rounded-xl bg-white/5 relative overflow-hidden border border-white/10">
                      <ExerciseThumbnail alt={ex.name} exerciseId={ex.id} />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <span className="text-sm font-bold text-white block truncate">{ex.name}</span>
                      <span className="text-[10px] text-white/30 uppercase tracking-widest font-semibold flex items-center gap-1.5 mt-0.5">
                        {cardio && <Timer size={10} className="text-emerald-400 shrink-0" />}
                        {ex.body_part} · {ex.equipment}
                      </span>
                    </div>
                  </button>
                );
              })
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
  const totalVolume = sets.reduce((acc, s) => {
    const ex = exMap[s.exercise_id];
    if (isCardioExercise(ex)) return acc; // skip cardio from volume
    return acc + s.weight * s.reps;
  }, 0);

  const cardioSets = sets.filter((s) => isCardioExercise(exMap[s.exercise_id]));
  const strengthSets = sets.filter((s) => !isCardioExercise(exMap[s.exercise_id]));

  return (
    <div className="dashboard-bg min-h-screen pb-24 flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md w-full space-y-8">
        <div className="animate-fade-in">
          <p className="text-xs tracking-[0.3em] text-white/30 uppercase font-medium mb-3">Complete</p>
          <h2 className="text-4xl font-bold text-white tracking-tight mb-2">{sets.length} Sets</h2>
          {totalVolume > 0 && (
            <p className="text-sm text-white/40">{totalVolume.toLocaleString()}kg total volume</p>
          )}
        </div>

        <div className="glass-panel p-6 space-y-3">
          {strengthSets.map((s) => (
            <div key={s.id} className="flex items-center justify-between text-sm">
              <span className="text-white/50 truncate mr-4">{exMap[s.exercise_id]?.name || 'Exercise'}</span>
              <span className="text-white font-medium tabular-nums shrink-0">{s.weight}kg × {s.reps}</span>
            </div>
          ))}
          {cardioSets.map((s) => (
            <div key={s.id} className="flex items-center justify-between text-sm">
              <span className="text-white/50 truncate mr-4 flex items-center gap-1.5">
                <Timer size={12} className="text-emerald-400 shrink-0" />
                {exMap[s.exercise_id]?.name || 'Cardio'}
              </span>
              <span className="text-white font-medium tabular-nums shrink-0">
                {s.reps}min{s.weight > 0 ? ` · ${s.weight}km` : ''}
              </span>
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
