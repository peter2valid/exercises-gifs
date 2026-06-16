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
  AlertTriangle,
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
  volume,
  sets,
}: {
  volume: number;
  sets: number;
}) {
  const unit = getWeightUnit();
  const displayVolume = convertWeight(volume, unit);

  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
      <div className="grid grid-cols-2 gap-3 text-center">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">Volume</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-white">{Math.round(displayVolume).toLocaleString()} {unit}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">Sets</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-white">{sets}</p>
        </div>
      </div>
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
  exercises = [],
  onCreateWorkout,
}: {
  onStart: () => void;
  onBrowseLibrary: () => void;
  isLoading: boolean;
  preselectedExercise?: Exercise | null;
  exercisesError?: boolean;
  assignedPrograms?: any[];
  onStartProgram?: (program: any) => void;
  exercises?: Exercise[];
  onCreateWorkout?: (name: string, exerciseIds: string[]) => void;
}) {
  const [mode, setMode] = useState<'home' | 'create'>('home');
  const [workoutName, setWorkoutName] = useState('');
  const [search, setSearch] = useState('');
  const [roster, setRoster] = useState<Exercise[]>([]);

  const deferredSearch = useDeferredValue(search);
  const searchResults = useMemo(() => {
    if (!deferredSearch.trim()) return exercises.slice(0, 20);
    return searchExercises(exercises, deferredSearch).slice(0, 20);
  }, [deferredSearch, exercises]);

  const rosterIds = useMemo(() => new Set(roster.map(e => e.id)), [roster]);

  const addExercise = (ex: Exercise) => {
    if (!rosterIds.has(ex.id)) setRoster(prev => [...prev, ex]);
  };

  const removeExercise = (id: string) => {
    setRoster(prev => prev.filter(e => e.id !== id));
  };

  const handleStartCreated = () => {
    onCreateWorkout?.(workoutName.trim() || 'My Workout', roster.map(e => e.id));
  };

  if (mode === 'create') {
    return (
      <div className="dashboard-bg min-h-screen pb-28 pt-8">
        <div className="mx-auto flex max-w-md flex-col px-4">
          {/* Header */}
          <div className="mb-6 flex items-center gap-3">
            <button
              type="button"
              onClick={() => { setMode('home'); setRoster([]); setSearch(''); setWorkoutName(''); }}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/50 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-white/30">New Workout</p>
              <h1 className="text-xl font-bold tracking-tight text-white">Build your plan</h1>
            </div>
          </div>

          {/* Workout name */}
          <input
            type="text"
            value={workoutName}
            onChange={e => setWorkoutName(e.target.value)}
            placeholder="Workout name (optional)"
            className="mb-5 h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-white outline-none placeholder:text-white/25 focus:border-white/20 transition-all"
          />

          {/* Roster */}
          {roster.length > 0 && (
            <div className="mb-5">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-white/30">{roster.length} exercise{roster.length !== 1 ? 's' : ''} planned</p>
              <div className="space-y-2">
                {roster.map((ex, idx) => (
                  <div key={ex.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                    <span className="w-5 shrink-0 text-center text-[11px] font-bold text-white/25">{idx + 1}</span>
                    <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-white/5">
                      <ExerciseThumbnail alt={ex.name} exerciseId={ex.id} />
                    </div>
                    <p className="flex-1 truncate text-sm font-semibold text-white">{ex.name}</p>
                    <button
                      type="button"
                      onClick={() => removeExercise(ex.id)}
                      className="shrink-0 text-white/25 hover:text-rose-400 transition-colors"
                    >
                      <X size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Start button */}
          {roster.length > 0 && (
            <button
              type="button"
              onClick={handleStartCreated}
              disabled={isLoading}
              className="mb-5 flex h-14 w-full items-center justify-center gap-3 rounded-[20px] bg-white text-black font-bold shadow-[0_12px_40px_rgba(255,255,255,0.1)] transition-transform active:scale-[0.99] disabled:opacity-60"
            >
              <Play size={16} fill="currentColor" />
              {isLoading ? 'Starting…' : `Start Workout · ${roster.length} exercise${roster.length !== 1 ? 's' : ''}`}
            </button>
          )}

          {/* Exercise search */}
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-white/30">Add exercises</p>
          <div className="relative mb-3">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25" size={15} />
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search exercises…"
              className="h-11 w-full rounded-2xl border border-white/10 bg-white/[0.04] pl-10 pr-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/20 transition-all"
            />
          </div>

          <div className="space-y-2 pb-4">
            {searchResults.map(ex => {
              const added = rosterIds.has(ex.id);
              return (
                <button
                  key={ex.id}
                  type="button"
                  onClick={() => added ? removeExercise(ex.id) : addExercise(ex)}
                  className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition-all active:scale-[0.99] ${
                    added
                      ? 'border-white/20 bg-white/8'
                      : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.05]'
                  }`}
                >
                  <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-white/5">
                    <ExerciseThumbnail alt={ex.name} exerciseId={ex.id} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">{ex.name}</p>
                    {ex.muscle_group && (
                      <p className="text-[10px] uppercase tracking-wider text-white/30">{ex.muscle_group}</p>
                    )}
                  </div>
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-all ${
                    added
                      ? 'border-white/30 bg-white text-black'
                      : 'border-white/15 bg-white/5 text-white/40'
                  }`}>
                    {added ? <X size={12} /> : <Plus size={12} />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-bg min-h-screen pb-28 pt-8">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-md flex-col px-4">
        <div className="mb-8 space-y-3">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-white/30">Workout now</p>
          <h1 className="text-3xl font-bold tracking-tight text-white">Ready to train?</h1>
          <p className="max-w-sm text-sm text-white/45">Start free and add exercises as you go, or plan your session first.</p>
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
              <p className="text-xs text-black/45">Add exercises as you go</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setMode('create')}
            disabled={isLoading}
            className="flex h-16 w-full items-center gap-4 rounded-[20px] border border-white/10 bg-white/[0.04] transition-transform active:scale-[0.99] disabled:opacity-60"
          >
            <div className="ml-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white">
              <Plus size={16} />
            </div>
            <div className="min-w-0 text-left">
              <p className="text-base font-bold text-white">Create a Workout</p>
              <p className="text-xs text-white/35">Pick exercises, then start</p>
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
              <p className="text-xs text-white/35">Browse the full library</p>
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
  onEndRest,
}: {
  lastSet: SetLog | null;
  exMap: Record<string, Exercise>;
  onEndRest: () => void;
}) {
  const lastExercise = lastSet ? exMap[lastSet.exercise_id] : null;
  const unit = getWeightUnit();

  return (
    <div className="dashboard-bg min-h-screen px-4 pb-28 pt-8">
      <div className="mx-auto flex max-w-md flex-col items-center space-y-6">
        <div className="w-full text-center">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-white/25">Resting</p>
          <p className="mt-3 text-sm text-white/40">Take your time, then continue when ready.</p>
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
          className="w-full rounded-[24px] border border-white/10 bg-white px-5 py-4 text-base font-bold text-black transition-transform active:scale-[0.99]"
        >
          Back to workout
        </button>
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
  const restoredRef = useRef(false);

  const [weight, setWeight] = useState(20);
  const [reps, setReps] = useState(8);
  const [duration, setDuration] = useState(20);
  const [distance, setDistance] = useState(0);
  const unit = getWeightUnit();

  const rosterKey = sessionId ? rosterStorageKey(sessionId) : '';

  // One-time restoration when session starts or exercises load
  useEffect(() => {
    if (!sessionId || restoredRef.current || Object.keys(exMap).length === 0) return;
    
    let nextRoster: string[] = [];
    try {
      const saved = localStorage.getItem(rosterKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          nextRoster = parsed.filter((id) => typeof id === 'string' && exMap[id]);
        }
      }
    } catch {
      // Ignore storage issues
    }

    // Merge initial exercise into roster if missing
    if (initialExerciseId && exMap[initialExerciseId] && !nextRoster.includes(initialExerciseId)) {
      nextRoster.push(initialExerciseId);
    }

    if (nextRoster.length > 0) {
      setRoster(nextRoster);
      // Ensure we have a valid active exercise
      setActiveExerciseId((current) => {
        if (initialExerciseId && exMap[initialExerciseId]) return initialExerciseId;
        if (current && nextRoster.includes(current)) return current;
        return nextRoster[0];
      });
    }

    restoredRef.current = true;
  }, [exMap, initialExerciseId, rosterKey, sessionId]);

  // Sync to storage when roster changes, but ONLY after initial restoration
  useEffect(() => {
    if (!sessionId || !restoredRef.current) return;
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
    <div className="dashboard-bg flex min-h-screen flex-col pb-28">
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
          <div />
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
        <SessionHeader volume={totalVolume} sets={sets.length} />

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

          <div
            className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pt-4"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
          >
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
            <div className="sticky bottom-0 -mx-4 mt-4 border-t border-white/5 bg-black/90 px-4 pt-4 backdrop-blur-xl">
              <div className="mb-3 flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-white/30">
                <span>{pickerSelection.length > 0 ? `${pickerSelection.length} selected` : 'No exercises selected'}</span>
                <span>Tap items to toggle</span>
              </div>
              <div className="grid grid-cols-2 gap-3 pb-1">
                <Button type="button" variant="secondary" className="h-12 rounded-[18px]" onClick={() => setPickerOpen(false)}>
                  Cancel
                </Button>
                <Button type="button" variant="primary" className="h-12 rounded-[18px]" onClick={addSelectedExercises} disabled={pickerSelection.length === 0}>
                  Add selected {pickerSelection.length > 0 ? `(${pickerSelection.length})` : ''}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {moreOpen && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/70 backdrop-blur-sm" onClick={() => { setMoreOpen(false); setAbandonConfirm(false); }}>
          <div
        className="mx-auto w-full max-w-md rounded-t-[28px] border border-white/10 bg-[#121212] px-4 pt-4"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
        onClick={(event) => event.stopPropagation()}
      >
            <div className="mx-auto mb-4 h-1.5 w-16 rounded-full bg-white/10" />
            {abandonConfirm ? (
              <div className="space-y-4 py-2">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center mx-auto mb-3">
                    <AlertTriangle size={24} className="text-red-400" />
                  </div>
                  <p className="text-sm font-bold text-white">Abandon Workout?</p>
                  <p className="text-[12px] text-white/40 mt-1">Your current progress will be permanently lost.</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Button type="button" variant="secondary" className="h-12 rounded-[18px] border-white/10 text-white/60" onClick={() => setAbandonConfirm(false)}>
                    Keep going
                  </Button>
                  <button
                    type="button"
                    onClick={() => { setMoreOpen(false); setAbandonConfirm(false); onAbandon(); }}
                    className="h-12 rounded-[18px] bg-red-600 text-sm font-black uppercase tracking-widest text-white transition-all active:scale-[0.98]"
                  >
                    Abandon
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex flex-col gap-2">
                  <Button type="button" variant="secondary" className="h-12 w-full rounded-[18px] justify-start px-4 gap-3" onClick={() => { setMoreOpen(false); onStartRest(); }} disabled={!hasLastSet}>
                    <Timer size={18} className={hasLastSet ? "text-sky-400" : "text-white/20"} />
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-bold">Take rest now</span>
                      {!hasLastSet && <span className="text-[9px] text-white/20 uppercase tracking-wider font-bold">Log a set first</span>}
                    </div>
                  </Button>
                  <Button type="button" variant="secondary" className="h-12 w-full rounded-[18px] justify-start px-4 gap-3" onClick={() => { setMoreOpen(false); onComplete(); }} disabled={sets.length === 0 || isLogging}>
                    <CheckCircle size={18} className={sets.length > 0 ? "text-emerald-400" : "text-white/20"} />
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-bold">Finish workout</span>
                      {sets.length === 0 && <span className="text-[9px] text-white/20 uppercase tracking-wider font-bold">No sets logged yet</span>}
                    </div>
                  </Button>
                </div>
                
                <div className="h-px bg-white/5 my-2" />

                <Button type="button" variant="secondary" className="h-12 w-full rounded-[18px] justify-start px-4 text-white/60 hover:text-white" onClick={() => { clearRoster(); setMoreOpen(false); }}>
                  <RotateCcw size={16} className="mr-2" />
                  Clear exercise roster
                </Button>
                <Button type="button" variant="secondary" className="h-12 w-full rounded-[18px] justify-start px-4 text-red-400/80 hover:text-red-400 hover:bg-red-500/10" onClick={() => setAbandonConfirm(true)}>
                  <XCircle size={16} className="mr-2" />
                  Abandon workout
                </Button>
                <Button type="button" variant="ghost" className="h-12 w-full rounded-[18px] justify-center mt-2" onClick={() => setMoreOpen(false)}>
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
    <div className="dashboard-bg min-h-screen px-4 pb-28 pt-8">
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
