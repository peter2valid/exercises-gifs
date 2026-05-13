'use client';

import { memo, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { FixedSizeList } from 'react-window';
import { useRouter } from 'next/navigation';
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  Plus,
  Minus,
  Search,
  X,
  RefreshCw,
  Timer,
  ChevronDown,
  MoreHorizontal,
  XCircle,
} from 'lucide-react';
import { Button, Loading } from '@/components/ui';
import { ExerciseThumbnail } from '@/components/ExerciseCard';
import type { Exercise, SetLog } from '@/lib/db/schema';
import { searchExercises } from '@/lib/search';
import {
  classifyWorkoutExercise,
  formatWorkoutSet,
  isCardioExercise,
  usesVolumeExercise,
  type WorkoutExerciseMode,
} from '@/lib/workout/exerciseClassification';
import { getWeightUnit, convertWeight, toInternalWeight, getWeightSuffix, type WeightUnit } from '@/lib/settings';

function formatTime(seconds: number) {
  const clamped = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(clamped / 60);
  const secs = clamped % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
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
    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
    ctx.close().catch(() => {});
  } catch {
    // Audio can fail on restricted devices; fall back silently.
  }
}

type ExerciseDraft = {
  weight: number;
  reps: number;
  duration: number;
  distance: number;
};

function rosterStorageKey(sessionId: string) {
  return `gymapp-workout-roster:${sessionId || 'draft'}`;
}

function modeLabel(mode: WorkoutExerciseMode) {
  switch (mode) {
    case 'strength': return 'Strength';
    case 'reps': return 'Bodyweight';
    case 'time': return 'Time';
    case 'cardio': return 'Cardio';
  }
}

function defaultDraft(mode: WorkoutExerciseMode) {
  return {
    weight: mode === 'strength' ? 20 : 0,
    reps: mode === 'reps' ? 10 : 8,
    duration: mode === 'time' ? 10 : 20,
    distance: mode === 'cardio' ? 1 : 0,
  };
}

function NumericControl({
  label,
  value,
  onChange,
  step,
  min = 0,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (next: number) => void;
  step: number;
  min?: number;
  suffix?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">{label}</label>
      <div className="flex items-center gap-1 rounded-2xl border border-white/10 bg-white/[0.04] p-1">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, Number((value - step).toFixed(2))))}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-white/40 transition-colors active:scale-95 hover:bg-white/5"
          aria-label={`Decrease ${label}`}
        >
          <Minus size={18} />
        </button>
        <div className="relative flex-1">
          <input
            type="number"
            inputMode="decimal"
            value={value}
            min={min}
            onChange={(event) => onChange(Math.max(min, Number(event.target.value || 0)))}
            className="h-10 w-full bg-transparent text-center text-lg font-semibold text-white outline-none placeholder:text-white/25"
          />
          {suffix && (
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/20">
              {suffix}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => onChange(Number((value + step).toFixed(2)))}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-white/40 transition-colors active:scale-95 hover:bg-white/5"
          aria-label={`Increase ${label}`}
        >
          <Plus size={18} />
        </button>
      </div>
    </div>
  );
}

function SessionHeader({
  startedAt,
  volume,
  sets,
}: {
  startedAt?: string | null;
  volume: number;
  sets: number;
}) {
  const [now, setNow] = useState(Date.now());
  const unit = getWeightUnit();

  // Local timer controls (UI-only): pause/resume and restart (display only)
  const [menuOpen, setMenuOpen] = useState(false);
  const [pausedAt, setPausedAt] = useState<number | null>(null);
  const [accumulatedMs, setAccumulatedMs] = useState<number>(0);
  const [startTime, setStartTime] = useState<number | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  // Sync with underlying session start
  useEffect(() => {
    if (startedAt) {
      setStartTime(new Date(startedAt).getTime());
      setAccumulatedMs(0);
      setPausedAt(null);
    } else {
      setStartTime(null);
    }
    setMenuOpen(false);
  }, [startedAt]);

  // Compute displayed elapsed milliseconds
  let elapsedMs = 0;
  if (startTime) {
    if (pausedAt) {
      elapsedMs = accumulatedMs;
    } else {
      elapsedMs = accumulatedMs + (now - startTime);
    }
  }
  const elapsedSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
  const displayVolume = convertWeight(volume, unit);

  return (
    <div className="relative rounded-[24px] border border-white/10 bg-white/[0.03] p-4 shadow-2xl">
      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">Duration</p>
          <button
            type="button"
            onClick={() => { if (!startedAt) return; setMenuOpen((s) => !s); }}
            className="mt-1 text-2xl font-semibold tabular-nums text-sky-400 focus:outline-none"
            aria-expanded={menuOpen}
            aria-controls="timer-menu"
          >
            {formatTime(elapsedSeconds)}
          </button>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">Volume</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-white">{Math.round(displayVolume).toLocaleString()} {unit}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">Sets</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-white">{sets}</p>
        </div>
      </div>

      {menuOpen && startedAt && (
        <div id="timer-menu" className="absolute left-1/2 top-full z-[60] mt-3 w-64 -translate-x-1/2 rounded-lg border border-white/10 bg-[#0b0b0b] p-3 shadow-lg">
          <p className="mb-2 text-xs text-white/40">Timer controls</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                if (!startTime) return;
                const currentTime = Date.now();
                if (pausedAt) {
                  // resume
                  setStartTime(currentTime);
                  setPausedAt(null);
                } else {
                  // pause
                  setAccumulatedMs(accumulatedMs + (currentTime - startTime));
                  setPausedAt(currentTime);
                }
                setMenuOpen(false);
              }}
              className="flex-1 rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/90"
            >
              {pausedAt ? 'Resume' : 'Pause'}
            </button>
            <button
              type="button"
              onClick={() => {
                setStartTime(Date.now());
                setAccumulatedMs(0);
                setPausedAt(null);
                setMenuOpen(false);
              }}
              className="flex-1 rounded-md bg-sky-500 px-3 py-2 text-sm font-bold text-black"
            >
              Restart
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function RestoringView() {
  return (
    <div className="dashboard-bg flex min-h-screen items-center justify-center">
      <Loading size={32} />
    </div>
  );
}

export function IdleView({
  onStart,
  onBrowseLibrary,
  isLoading,
  preselectedExercise,
  exercisesError,
  assignedPrograms = [],
  onStartProgram,
}: {
  onStart: () => void;
  onBrowseLibrary: () => void;
  isLoading: boolean;
  preselectedExercise?: Exercise | null;
  exercisesError?: boolean;
  assignedPrograms?: any[];
  onStartProgram?: (program: any) => void;
}) {
  return (
    <div className="dashboard-bg min-h-screen pb-24 pt-8">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-md flex-col px-4">
        <div className="mb-8 space-y-3">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-white/30">Workout now</p>
          <h1 className="text-3xl font-bold tracking-tight text-white">Start a simple session</h1>
          <p className="max-w-sm text-sm text-white/45">Log without a plan, then add exercises only when you need them.</p>
        </div>

        {preselectedExercise && (
          <div className="mb-5 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/5">
              <ExerciseThumbnail alt={preselectedExercise.name} exerciseId={preselectedExercise.id} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">Starting with {preselectedExercise.name}</p>
              <p className="text-[11px] uppercase tracking-[0.16em] text-white/30">Selected from exercise detail</p>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <button
            type="button"
            onClick={onStart}
            disabled={isLoading}
            className="flex h-16 w-full items-center gap-4 rounded-[20px] border border-white/10 bg-white text-black shadow-[0_18px_50px_rgba(255,255,255,0.1)] transition-transform active:scale-[0.99] disabled:opacity-60"
          >
            <div className="ml-4 flex h-10 w-10 items-center justify-center rounded-full bg-black text-white">
              <Play size={16} fill="currentColor" />
            </div>
            <div className="min-w-0 text-left">
              <p className="text-base font-bold">{isLoading ? 'Starting workout…' : 'Start Free Workout'}</p>
            </div>
          </button>

          <button
            type="button"
            onClick={onBrowseLibrary}
            className="flex h-16 w-full items-center gap-4 rounded-[20px] border border-white/10 bg-white/[0.04] transition-transform active:scale-[0.99]"
          >
            <div className="ml-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white">
              <Search size={16} />
            </div>
            <div className="min-w-0 text-left">
              <p className="text-base font-bold text-white">Find exercises</p>
            </div>
          </button>
        </div>

        {assignedPrograms.length > 0 && (
          <div className="mt-10">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-white/30 mb-4">Your Programs</p>
            <div className="space-y-3">
              {assignedPrograms.map(prog => (
                <div key={prog.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <h3 className="text-base font-bold text-white mb-1">{prog.name}</h3>
                  {prog.description && <p className="text-xs text-white/40 mb-4">{prog.description}</p>}
                  <button
                    onClick={() => onStartProgram?.(prog)}
                    disabled={isLoading}
                    className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#3b82f6] text-sm font-bold text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
                  >
                    <Play size={14} fill="currentColor" /> Start Program
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {exercisesError && (
          <p className="mt-4 text-center text-xs text-amber-400/70">
            Exercise library unavailable — try closing and reopening the app, or check storage permissions.
          </p>
        )}

        <p className="mt-auto pt-6 text-center text-xs text-white/20 pb-4">Fast, local, and ready for weak connections.</p>
      </div>
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
      const nextRemaining = Math.max(0, activeRest.durationSeconds - elapsed);
      setRemaining(nextRemaining);

      if (nextRemaining === 0 && !beepedRef.current) {
        beepedRef.current = true;
        playBeep();
      }
    };

    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [activeRest]);

  const isDone = remaining === 0;
  const progress = activeRest && activeRest.durationSeconds > 0 ? (remaining / activeRest.durationSeconds) * 100 : 0;
  const lastExercise = lastSet ? exMap[lastSet.exercise_id] : null;
  const unit = getWeightUnit();

  return (
    <div className="dashboard-bg min-h-screen px-4 pb-24 pt-8">
      <div className="mx-auto flex max-w-md flex-col items-center space-y-6">
        <div className="w-full text-center">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-white/25">Rest timer</p>
          <div className="mx-auto mt-8 flex h-44 w-44 items-center justify-center rounded-full border border-white/10 bg-white/[0.03]">
            <div className="text-center">
              <p className={`text-5xl font-bold tabular-nums ${isDone ? 'text-rose-400' : 'text-white'}`}>{formatTime(remaining)}</p>
              <p className={`mt-2 text-[10px] font-bold uppercase tracking-[0.2em] ${isDone ? 'text-rose-400/70' : 'text-white/30'}`}>
                {isDone ? 'Ready now' : 'Remaining'}
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => onAdjustRest(-15)}
              className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold text-white/65 transition-colors active:scale-95"
            >
              -15s
            </button>
            <button
              type="button"
              onClick={() => onAdjustRest(30)}
              className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold text-white/65 transition-colors active:scale-95"
            >
              +30s
            </button>
          </div>
        </div>

        {lastSet && (
          <div className="w-full rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/25">Previous set</p>
            <p className="mt-2 truncate text-sm font-semibold text-white">{lastExercise?.name ?? 'Exercise'}</p>
            <p className="mt-1 text-sm text-white/45">{formatWorkoutSet(lastExercise, lastSet, unit)}</p>
          </div>
        )}

        <button
          type="button"
          onClick={onEndRest}
          className={`w-full rounded-[24px] border border-white/10 px-5 py-4 text-base font-bold transition-transform active:scale-[0.99] ${isDone ? 'bg-rose-500 text-black' : 'bg-white text-black'}`}
        >
          {isDone ? 'Go now' : 'Back to workout'}
        </button>

        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
          <div className={`h-full rounded-full transition-all ${isDone ? 'bg-rose-500' : 'bg-sky-400'}`} style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  );
}

const PICKER_ITEM_HEIGHT = 80;

type PickerRowData = {
  items: Exercise[];
  selection: string[];
  onToggle: (id: string) => void;
};

const PickerRow = memo(function PickerRow({
  index,
  style,
  data,
}: {
  index: number;
  style: React.CSSProperties;
  data: PickerRowData;
}) {
  const exercise = data.items[index];
  const selected = data.selection.includes(exercise.id);
  const cardio = isCardioExercise(exercise);
  return (
    <div style={style}>
      <button
        type="button"
        onClick={() => data.onToggle(exercise.id)}
        className={`flex w-full items-center gap-3 rounded-[20px] border p-3 text-left transition-all active:scale-[0.99] mb-2 ${
          selected ? 'border-white/15 bg-white/[0.06]' : 'border-white/10 bg-white/[0.03]'
        }`}
      >
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/5">
          <ExerciseThumbnail alt={exercise.name} exerciseId={exercise.id} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{exercise.name}</p>
          <p className="truncate text-[11px] uppercase tracking-[0.16em] text-white/30">
            {exercise.body_part} · {exercise.equipment}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {selected ? (
            <span className="rounded-full bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-black">
              Selected
            </span>
          ) : (
            <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/35">
              Add
            </span>
          )}
          {cardio && <Timer size={12} className="text-emerald-400" />}
        </div>
      </button>
    </div>
  );
});

export function ActiveView({
  sets,
  exercises,
  exMap,
  initialExerciseId,
  sessionId,
  sessionStartedAt,
  onLogSet,
  onStartRest,
  onComplete,
  onAbandon,
  hasLastSet,
}: {
  sets: SetLog[];
  exercises: Exercise[];
  exMap: Record<string, Exercise>;
  initialExerciseId: string;
  sessionId: string;
  sessionStartedAt?: string | null;
  onLogSet: (exerciseId: string, weight: number, reps: number) => Promise<void>;
  onStartRest: () => void;
  onComplete: () => void;
  onAbandon: () => void;
  hasLastSet: boolean;
}) {
  const router = useRouter();
  const [isLogging, setIsLogging] = useState(false);
  const [logError, setLogError] = useState<string | null>(null);
  const [abandonConfirm, setAbandonConfirm] = useState(false);
  // Ref-based guard prevents double-tap before React re-renders with isLogging=true
  const loggingRef = useRef(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const deferredPickerSearch = useDeferredValue(pickerSearch);
  const [pickerSelection, setPickerSelection] = useState<string[]>([]);
  const [roster, setRoster] = useState<string[]>(() => (initialExerciseId ? [initialExerciseId] : []));
  const [activeExerciseId, setActiveExerciseId] = useState(initialExerciseId || '');
  const [weight, setWeight] = useState(20);
  const [reps, setReps] = useState(8);
  const [duration, setDuration] = useState(20);
  const [distance, setDistance] = useState(0);
  const [now, setNow] = useState(Date.now());
  const unit = getWeightUnit();

  const rosterKey = sessionId ? rosterStorageKey(sessionId) : '';

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    try {
      const saved = localStorage.getItem(rosterKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter((id) => typeof id === 'string' && exMap[id]);
          if (cleaned.length > 0) {
            setRoster(cleaned);
            setActiveExerciseId(cleaned[0]);
            return;
          }
        }
      }
    } catch {
      // Ignore storage issues and fall back to the current session state.
    }
    if (initialExerciseId && exMap[initialExerciseId]) {
      setRoster([initialExerciseId]);
      setActiveExerciseId(initialExerciseId);
    }
  }, [exMap, initialExerciseId, rosterKey, sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    try {
      localStorage.setItem(rosterKey, JSON.stringify(roster));
    } catch {
      // Ignore persistence failures.
    }
  }, [roster, rosterKey, sessionId]);

  useEffect(() => {
    if (roster.length === 0) {
      setActiveExerciseId('');
      return;
    }
    if (!activeExerciseId || !roster.includes(activeExerciseId)) {
      setActiveExerciseId(roster[0]);
    }
  }, [activeExerciseId, roster]);

  const rosterExercises = useMemo(() => roster.map((id) => exMap[id]).filter(Boolean), [exMap, roster]);
  const selectedExercise = activeExerciseId ? exMap[activeExerciseId] : undefined;
  const selectedMode = classifyWorkoutExercise(selectedExercise);
  const selectedSets = useMemo(() => sets.filter((set) => set.exercise_id === activeExerciseId), [activeExerciseId, sets]);

  const totalVolume = useMemo(
    () => sets.reduce((acc, set) => {
      const exercise = exMap[set.exercise_id];
      return usesVolumeExercise(exercise) ? acc + set.weight * set.reps : acc;
    }, 0),
    [exMap, sets]
  );

  const elapsedSeconds = sessionStartedAt ? Math.max(0, Math.floor((now - new Date(sessionStartedAt).getTime()) / 1000)) : 0;

  useEffect(() => {
    if (!selectedExercise) return;
    const mode = classifyWorkoutExercise(selectedExercise);
    const lastSet = [...selectedSets].reverse()[0];
    if (lastSet) {
      if (mode === 'strength') {
        setWeight(Number(convertWeight(lastSet.weight || 20, unit).toFixed(1)));
        setReps(lastSet.reps || 8);
        setDuration(20);
        setDistance(0);
      } else if (mode === 'reps') {
        setReps(lastSet.reps || 8);
        setWeight(0);
        setDuration(20);
        setDistance(0);
      } else if (mode === 'time') {
        setDuration(lastSet.reps || 10);
        setWeight(0);
        setDistance(0);
      } else {
        setDuration(lastSet.reps || 20);
        setDistance(lastSet.weight || 0);
        setWeight(0);
      }
      return;
    }

    const draft = defaultDraft(mode);
    if (mode === 'strength') {
      setWeight(Number(convertWeight(draft.weight, unit).toFixed(1)));
    } else {
      setWeight(draft.weight);
    }
    setReps(draft.reps);
    setDuration(draft.duration);
    setDistance(draft.distance);
  }, [activeExerciseId, selectedExercise, selectedSets, unit]);

  const filteredPicker = useMemo(() => {
    const query = deferredPickerSearch.trim();
    const nextExercises = query ? searchExercises(exercises, query) : exercises;
    const rosterSet = new Set(roster);
    return nextExercises.filter((exercise) => !rosterSet.has(exercise.id));
  }, [exercises, deferredPickerSearch, roster]);
  const pickerItems = filteredPicker;

  const [listHeight, setListHeight] = useState(() =>
    typeof window !== 'undefined' ? Math.max(300, window.innerHeight - 200) : 500
  );
  useEffect(() => {
    const update = () => setListHeight(Math.max(300, window.innerHeight - 200));
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const pickerItemData = useMemo<PickerRowData>(
    () => ({
      items: pickerItems,
      selection: pickerSelection,
      onToggle: (id: string) =>
        setPickerSelection((current) =>
          current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
        ),
    }),
    [pickerItems, pickerSelection]
  );

  const openPicker = () => {
    setPickerSelection([]);
    setPickerSearch('');
    setPickerOpen(true);
  };

  const addSelectedExercises = () => {
    if (pickerSelection.length === 0) {
      setPickerOpen(false);
      return;
    }

    const nextRoster = [...roster];
    for (const id of pickerSelection) {
      if (!nextRoster.includes(id)) {
        nextRoster.push(id);
      }
    }

    setRoster(nextRoster);
    setActiveExerciseId((current) => current || nextRoster[0] || '');
    setPickerOpen(false);
    setPickerSelection([]);
  };

  const handleLog = async () => {
    if (!selectedExercise || loggingRef.current) return;
    loggingRef.current = true;
    setIsLogging(true);
    setLogError(null);
    try {
      const mode = classifyWorkoutExercise(selectedExercise);
      if (mode === 'strength') {
        await onLogSet(selectedExercise.id, toInternalWeight(weight, unit), reps);
      } else if (mode === 'reps') {
        await onLogSet(selectedExercise.id, 0, reps);
      } else if (mode === 'time') {
        await onLogSet(selectedExercise.id, 0, duration);
      } else {
        await onLogSet(selectedExercise.id, distance, duration);
      }
    } catch (e) {
      console.error('[workout] logSet failed:', e);
      setLogError('Set could not be saved — your data is safe, please try again.');
    } finally {
      loggingRef.current = false;
      setIsLogging(false);
    }
  };

  const clearRoster = () => {
    setRoster([]);
    setActiveExerciseId('');
    setPickerOpen(false);
    setMoreOpen(false);
  };

  return (
    <div className="dashboard-bg flex min-h-screen flex-col pb-24">
      <div className="sticky top-0 z-20 border-b border-white/5 bg-black/85 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-md items-center justify-between px-4 py-4">
          <button
            type="button"
            onClick={() => router.push('/home')}
            className="rounded-full p-2 text-white/70 transition-colors active:scale-95 hover:text-white"
            aria-label="Close workout"
          >
            <ChevronDown size={22} />
          </button>
          <div className="flex items-center gap-2 text-sky-400">
            <Timer size={18} />
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-white/40">{formatTime(elapsedSeconds)}</span>
          </div>
          <button
            type="button"
            onClick={onComplete}
            disabled={sets.length === 0 || isLogging}
            className="rounded-full bg-sky-500 px-4 py-2 text-sm font-bold text-black transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Finish
          </button>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-4 pt-5">
        <SessionHeader startedAt={sessionStartedAt} volume={totalVolume} sets={sets.length} />

        {rosterExercises.length === 0 ? null : (
          <div className="space-y-3">
            {rosterExercises.map((exercise) => {
              const exerciseSets = sets.filter((set) => set.exercise_id === exercise.id);
              const active = exercise.id === activeExerciseId;
              const mode = classifyWorkoutExercise(exercise);
              const lastSet = exerciseSets[exerciseSets.length - 1];

              const transitionClass = active && selectedExercise ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 pointer-events-none';
              return (
                <div key={exercise.id} className="space-y-2">
                  <button
                    type="button"
                    onClick={() => { if (isLogging) return; setActiveExerciseId((current) => (current === exercise.id ? '' : exercise.id)); }}
                    className={`w-full rounded-[18px] border p-2 text-left transition-all ${active ? 'border-white/15 bg-white/[0.06]' : 'border-white/10 bg-white/[0.03]'}`}
                  >
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/5">
                      <ExerciseThumbnail alt={exercise.name} exerciseId={exercise.id} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-base font-semibold text-white">{exercise.name}</p>
                          <p className="truncate text-[11px] uppercase tracking-[0.16em] text-white/35">
                            {exercise.body_part} · {exercise.equipment}
                          </p>
                        </div>
                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
                          {modeLabel(mode)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-white/45">
                        {exerciseSets.length > 0 ? `${exerciseSets.length} set${exerciseSets.length === 1 ? '' : 's'} logged` : 'Tap to start logging'}
                        {lastSet ? ` · ${formatWorkoutSet(exercise, lastSet, unit)}` : ''}
                      </p>
                    </div>
                    <ChevronDown className={`shrink-0 text-white/30 transition-transform ${active ? 'rotate-180' : ''}`} size={18} />
                  </div>
                  </button>
                  <div aria-hidden={!active || !selectedExercise} className={'overflow-hidden transition-all duration-200 ' + transitionClass}>
                  <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-3">
                    <div className="mb-4 flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/25">Current exercise</p>
                        <h2 className="mt-1 truncate text-lg font-semibold text-white">{selectedExercise?.name}</h2>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={openPicker}
                          className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white/70"
                        >
                          Change
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveExerciseId('')}
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-white/40 hover:text-white"
                          aria-label="Close log"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        {selectedMode === 'strength' && (
                          <>
                            <NumericControl label="Weight" value={weight} onChange={setWeight} step={unit === 'kg' ? 2.5 : 5} min={0} suffix={unit} />
                            <NumericControl label="Reps" value={reps} onChange={setReps} step={1} min={1} />
                          </>
                        )}

                        {selectedMode === 'reps' && (
                          <NumericControl label="Reps" value={reps} onChange={setReps} step={1} min={1} />
                        )}

                        {selectedMode === 'time' && (
                          <NumericControl label="Duration" value={duration} onChange={setDuration} step={1} min={1} suffix="min" />
                        )}

                        {selectedMode === 'cardio' && (
                          <>
                            <NumericControl label="Duration" value={duration} onChange={setDuration} step={1} min={1} suffix="min" />
                            <NumericControl label="Distance" value={distance} onChange={setDistance} step={0.5} min={0} suffix="km" />
                          </>
                        )}
                      </div>

                      <Button
                        type="button"
                        onClick={handleLog}
                        disabled={isLogging}
                        className="h-12 w-full rounded-[18px] text-base font-bold"
                        variant="primary"
                      >
                        {isLogging ? <RefreshCw className="mr-2 animate-spin" size={18} /> : <CheckCircle className="mr-2" size={18} />}
                        {isLogging ? 'Logging…' : 'Log set'}
                      </Button>

                      {logError && (
                        <p className="text-center text-xs text-red-400">{logError}</p>
                      )}

                      <p className="text-center text-xs text-white/35">
                        {selectedMode === 'strength' && 'Weight counts toward volume. Reps stay editable per set.'}
                        {selectedMode === 'reps' && 'No external weight needed for bodyweight work.'}
                        {selectedMode === 'time' && 'Timed work stays out of volume totals.'}
                        {selectedMode === 'cardio' && 'Distance is tracked separately from strength volume.'}
                      </p>
                    </div>
                  </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onStartRest}
            disabled={!hasLastSet}
            className="flex h-12 items-center justify-center gap-2 rounded-[16px] border border-white/10 bg-white/[0.04] text-sm font-bold text-white/70 transition-transform active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Pause size={16} fill="currentColor" />
            Take rest
          </button>
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className="flex h-12 items-center justify-center gap-2 rounded-[16px] border border-white/10 bg-white/[0.04] text-sm font-bold text-white/70 transition-transform active:scale-[0.99]"
          >
            <MoreHorizontal size={16} />
            More
          </button>
        </div>

        <button
          type="button"
          onClick={openPicker}
          className="flex h-12 items-center justify-center gap-2 rounded-[20px] bg-white text-black shadow-[0_12px_30px_rgba(255,255,255,0.12)] transition-transform active:scale-[0.99]"
        >
          <Plus size={18} />
          <span className="text-base font-bold">Add exercise</span>
        </button>
      </div>

      {pickerOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-3xl">
          <div className="mx-auto flex w-full max-w-md items-center gap-3 border-b border-white/5 px-4 py-4">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
              <input
                autoFocus
                type="search"
                placeholder="Find exercise"
                value={pickerSearch}
                onChange={(event) => setPickerSearch(event.target.value)}
                className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.05] pl-12 pr-4 text-white outline-none placeholder:text-white/20"
              />
            </div>
            <button
              type="button"
              onClick={() => setPickerOpen(false)}
              className="rounded-full p-2 text-white/40 transition-colors active:scale-95 hover:text-white"
              aria-label="Close picker"
            >
              <X size={22} />
            </button>
          </div>

          <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-4">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.22em] text-white/25">
              Select one or more exercises
            </p>
            {pickerItems.length === 0 ? (
              <div className="flex flex-1 items-start pt-4">
                <div className="w-full rounded-[20px] border border-white/10 bg-white/[0.03] p-8 text-center text-sm text-white/30">
                  No exercises found
                </div>
              </div>
            ) : (
              <FixedSizeList
                height={listHeight}
                width="100%"
                itemCount={pickerItems.length}
                itemSize={PICKER_ITEM_HEIGHT}
                itemData={pickerItemData}
                overscanCount={5}
                style={{ overflowX: 'hidden' }}
              >
                {PickerRow}
              </FixedSizeList>
            )}
            <div className="grid grid-cols-2 gap-3 border-t border-white/5 pt-4">
              <Button type="button" variant="secondary" className="h-12 rounded-[18px]" onClick={() => setPickerOpen(false)}>
                Cancel
              </Button>
              <Button type="button" variant="primary" className="h-12 rounded-[18px]" onClick={addSelectedExercises}>
                Add selected {pickerSelection.length > 0 ? `(${pickerSelection.length})` : ''}
              </Button>
            </div>
          </div>
        </div>
      )}

      {moreOpen && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/70 backdrop-blur-sm" onClick={() => { setMoreOpen(false); setAbandonConfirm(false); }}>
          <div className="mx-auto w-full max-w-md rounded-t-[28px] border border-white/10 bg-[#121212] p-4" onClick={(event) => event.stopPropagation()}>
            <div className="mx-auto mb-4 h-1.5 w-16 rounded-full bg-white/10" />
            {abandonConfirm ? (
              <div className="space-y-3">
                <p className="text-center text-sm font-semibold text-white">Abandon this workout?</p>
                <p className="text-center text-xs text-white/40">Your logged sets will be lost. This cannot be undone.</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button type="button" variant="secondary" className="h-12 rounded-[18px]" onClick={() => setAbandonConfirm(false)}>
                    Keep going
                  </Button>
                  <button
                    type="button"
                    onClick={() => { setMoreOpen(false); setAbandonConfirm(false); onAbandon(); }}
                    className="h-12 rounded-[18px] bg-red-600 text-sm font-bold text-white transition-transform active:scale-[0.99]"
                  >
                    Abandon
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Button type="button" variant="secondary" className="h-12 w-full rounded-[18px] justify-start px-4" onClick={() => { setMoreOpen(false); onStartRest(); }} disabled={!hasLastSet}>
                  <Timer size={16} className="mr-2" />
                  Take rest now
                </Button>
                <Button type="button" variant="secondary" className="h-12 w-full rounded-[18px] justify-start px-4" onClick={() => { setMoreOpen(false); onComplete(); }} disabled={sets.length === 0 || isLogging}>
                  <CheckCircle size={16} className="mr-2" />
                  Finish workout
                </Button>
                <Button type="button" variant="secondary" className="h-12 w-full rounded-[18px] justify-start px-4" onClick={() => { clearRoster(); setMoreOpen(false); }}>
                  <XCircle size={16} className="mr-2" />
                  Clear exercise roster
                </Button>
                <Button type="button" variant="secondary" className="h-12 w-full rounded-[18px] justify-start px-4 text-red-400 hover:text-red-300" onClick={() => setAbandonConfirm(true)}>
                  <XCircle size={16} className="mr-2" />
                  Abandon workout
                </Button>
                <Button type="button" variant="ghost" className="h-12 w-full rounded-[18px] justify-center" onClick={() => setMoreOpen(false)}>
                  Close
                </Button>
              </div>
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
  onHome,
}: {
  sets: SetLog[];
  exMap: Record<string, Exercise>;
  onReset: () => void;
  onHome: () => void;
}) {
  const [logOpen, setLogOpen] = useState(false);
  const unit = getWeightUnit();
  const totalVolumeKg = sets.reduce((acc, set) => {
    const exercise = exMap[set.exercise_id];
    return usesVolumeExercise(exercise) ? acc + set.weight * set.reps : acc;
  }, 0);

  const displayVolume = convertWeight(totalVolumeKg, unit);

  const timedSets = sets.filter((set) => !usesVolumeExercise(exMap[set.exercise_id]));
  const strengthSets = sets.filter((set) => usesVolumeExercise(exMap[set.exercise_id]));
  const allSets = [...strengthSets, ...timedSets];

  return (
    <div className="dashboard-bg min-h-screen px-4 pb-24 pt-8">
      <div className="mx-auto flex max-w-md flex-col items-center gap-6 text-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-white/25">Workout complete</p>
          <h2 className="mt-2 text-3xl font-bold text-white">Nice work</h2>
          <p className="mt-2 text-sm text-white/40">Your session is saved locally and ready for the next run.</p>
        </div>

        <div className="grid w-full grid-cols-2 gap-3">
          <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4 text-left">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/25">Sets</p>
            <p className="mt-2 text-3xl font-bold text-white">{sets.length}</p>
          </div>
          <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4 text-left">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/25">Volume</p>
            <p className="mt-2 text-3xl font-bold text-white">{Math.round(displayVolume).toLocaleString()} {unit}</p>
          </div>
        </div>

        <div className="w-full rounded-[24px] border border-white/10 bg-white/[0.03] text-left overflow-hidden">
          <button
            type="button"
            onClick={() => setLogOpen((s) => !s)}
            className="flex w-full items-center justify-between px-4 py-4 transition-colors active:bg-white/5"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/25">
              Log · {allSets.length} {allSets.length === 1 ? 'set' : 'sets'}
            </p>
            <ChevronDown
              size={16}
              className={`text-white/25 transition-transform duration-200 ${logOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {logOpen && (
            <div className="space-y-2 px-4 pb-4">
              {allSets.map((set) => (
                <div key={set.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white/[0.03] px-3 py-2">
                  <span className="truncate text-sm text-white/70">{exMap[set.exercise_id]?.name || 'Exercise'}</span>
                  <span className="shrink-0 text-sm font-semibold text-white">{formatWorkoutSet(exMap[set.exercise_id], set, unit)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex w-full flex-col gap-2">
          <Button onClick={onReset} className="h-12 w-full rounded-[18px] text-base font-semibold" variant="primary">
            <RotateCcw size={18} className="mr-2" />
            Start new workout
          </Button>
          <Button onClick={onHome} className="h-12 w-full rounded-[18px] text-base font-semibold border-white/10 bg-white/5 text-white" variant="secondary">
            Go Home
          </Button>
        </div>
      </div>
    </div>
  );
}
