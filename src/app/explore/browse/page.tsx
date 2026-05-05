'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Bookmark,
  ChevronRight,
  ChevronLeft,
  Dumbbell,
  Grid2X2,
  LayoutGrid,
  List,
  Search,
  UserRound,
  CalendarRange,
} from 'lucide-react';
import { Input } from '@/components/ui';
import ExerciseCard from '@/components/ExerciseCard';
import exercisesData from '../../../../data/exercises.json';
import BackIcon from '@/assets/icons/bodyparts/Back_muscle_Icon.webp';
import BicepsIcon from '@/assets/icons/bodyparts/Biceps_muscle_Icon.webp';
import CalvesIcon from '@/assets/icons/bodyparts/Calves_Icon.webp';
import ForearmsIcon from '@/assets/icons/bodyparts/Forearms_Icon.webp';
import GlutesIcon from '@/assets/icons/bodyparts/Glutes_Icon.webp';
import HamstringsIcon from '@/assets/icons/bodyparts/Hamstrings_Icon.webp';
import HipsIcon from '@/assets/icons/bodyparts/Hips_back_muscle_Icon.webp';
import AbsIcon from '@/assets/icons/bodyparts/Abdominals_Icon.webp';
import LowerAbsIcon from '@/assets/icons/bodyparts/Lower_abdominals_Icon.webp';
import LowerBackIcon from '@/assets/icons/bodyparts/Lower_back_muscle_Icon.webp';
import LowerLegIcon from '@/assets/icons/bodyparts/Lower_leg_muscle_Icon.webp';
import NeckIcon from '@/assets/icons/bodyparts/Neck_muscle_Icon.webp';
import ForearmsBackIcon from '@/assets/icons/bodyparts/Forearms_back_Icon.webp';
import InnerThighIcon from '@/assets/icons/bodyparts/Inner_thigh_Icon.webp';
import CardioIcon from '@/assets/icons/bodyparts/cardio icon.png';
import ChestIcon from '@/assets/icons/bodyparts/gym.png';
import ShoulderIcon from '@/assets/icons/bodyparts/shoulder.png';
import TricepsIcon from '@/assets/icons/bodyparts/strength.png';
import { searchExercises } from '@/lib/search';

type Exercise = any;
type ExploreView = 'list' | 'grid';
type ExploreTab = 'programs' | 'exercises' | 'coaches';
type ExploreMode = 'muscles' | 'equipment';
type BodyGroupKey =
  | 'chest'
  | 'biceps'
  | 'triceps'
  | 'back'
  | 'shoulders'
  | 'abs'
  | 'quadriceps'
  | 'hamstrings'
  | 'hips'
  | 'calves'
  | 'forearms'
  | 'neck'
  | 'cardio';

type GroupTile = {
  key: BodyGroupKey;
  label: string;
  iconSrc?: string;
  thumbnailSrc: string;
  match: (exercise: Exercise) => boolean;
  accent: string;
};

const bodyGroups: GroupTile[] = [
  {
    key: 'chest',
    label: 'Chest',
    iconSrc: ChestIcon.src,
    thumbnailSrc: '/exercise-media/3294.gif',
    match: (exercise) => exercise.bodyPart === 'chest' || exercise.target === 'pectorals',
    accent: 'from-rose-500/30 to-white/5',
  },
  {
    key: 'biceps',
    label: 'Biceps',
    iconSrc: BicepsIcon.src,
    thumbnailSrc: '/exercise-media/0968.gif',
    match: (exercise) => exercise.target === 'biceps' || (exercise.bodyPart === 'upper arms' && exercise.target === 'biceps'),
    accent: 'from-orange-400/25 to-white/5',
  },
  {
    key: 'triceps',
    label: 'Triceps',
    iconSrc: TricepsIcon.src,
    thumbnailSrc: '/exercise-media/0018.gif',
    match: (exercise) => exercise.target === 'triceps' || (exercise.bodyPart === 'upper arms' && exercise.target === 'triceps'),
    accent: 'from-fuchsia-500/25 to-white/5',
  },
  {
    key: 'back',
    label: 'Back',
    iconSrc: BackIcon.src,
    thumbnailSrc: '/exercise-media/0007.gif',
    match: (exercise) => exercise.bodyPart === 'back' || ['lats', 'lower back', 'upper back'].includes(exercise.target),
    accent: 'from-sky-500/25 to-white/5',
  },
  {
    key: 'shoulders',
    label: 'Shoulders',
    iconSrc: ShoulderIcon.src,
    thumbnailSrc: '/exercise-media/0977.gif',
    match: (exercise) => exercise.bodyPart === 'shoulders' || exercise.target === 'delts',
    accent: 'from-cyan-500/25 to-white/5',
  },
  {
    key: 'abs',
    label: 'Abs',
    iconSrc: AbsIcon.src,
    thumbnailSrc: '/exercise-media/0001.gif',
    match: (exercise) => exercise.bodyPart === 'waist' || exercise.target === 'abs',
    accent: 'from-emerald-500/25 to-white/5',
  },
  {
    key: 'quadriceps',
    label: 'Quadriceps',
    iconSrc: LowerLegIcon.src,
    thumbnailSrc: '/exercise-media/1512.gif',
    match: (exercise) => exercise.bodyPart === 'upper legs' && ['quads', 'quadriceps', 'thighs'].includes(exercise.target),
    accent: 'from-violet-500/25 to-white/5',
  },
  {
    key: 'hamstrings',
    label: 'Hamstrings',
    iconSrc: HamstringsIcon.src,
    thumbnailSrc: '/exercise-media/0016.gif',
    match: (exercise) => exercise.target === 'hamstrings',
    accent: 'from-indigo-500/25 to-white/5',
  },
  {
    key: 'hips',
    label: 'Hips',
    iconSrc: GlutesIcon.src,
    thumbnailSrc: '/exercise-media/3214.gif',
    match: (exercise) => ['glutes', 'abductors', 'adductors'].includes(exercise.target),
    accent: 'from-pink-500/25 to-white/5',
  },
  {
    key: 'calves',
    label: 'Calves',
    iconSrc: CalvesIcon.src,
    thumbnailSrc: '/exercise-media/1368.gif',
    match: (exercise) => exercise.bodyPart === 'lower legs' || exercise.target === 'calves',
    accent: 'from-amber-400/25 to-white/5',
  },
  {
    key: 'forearms',
    label: 'Forearms',
    iconSrc: ForearmsIcon.src,
    thumbnailSrc: '/exercise-media/0994.gif',
    match: (exercise) => exercise.bodyPart === 'lower arms' || exercise.target === 'forearms',
    accent: 'from-lime-500/25 to-white/5',
  },
  {
    key: 'neck',
    label: 'Neck',
    iconSrc: NeckIcon.src,
    thumbnailSrc: '/exercise-media/1403.gif',
    match: (exercise) => exercise.bodyPart === 'neck',
    accent: 'from-white/15 to-white/5',
  },
  {
    key: 'cardio',
    label: 'Cardio',
    iconSrc: CardioIcon.src,
    thumbnailSrc: '/exercise-media/3220.gif',
    match: (exercise) => exercise.bodyPart === 'cardio',
    accent: 'from-emerald-400/25 to-white/5',
  },
];

function formatEquipmentLabel(value: string) {
  return value
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatBodyPartLabel(value: string) {
  if (value === 'waist') return 'Abs';
  if (value === 'upper arms') return 'Arms';
  if (value === 'upper legs') return 'Legs';
  if (value === 'lower legs') return 'Calves';
  if (value === 'lower arms') return 'Forearms';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function CompactTile({
  group,
  active,
  onClick,
}: {
  group: GroupTile;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-20 shrink-0 flex-col items-center gap-2 rounded-2xl border px-2 py-2 text-center transition-all ${
        active ? 'border-white/25 bg-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.1)]' : 'border-white/5 bg-white/[0.03]'
      }`}
    >
      <div className="relative h-12 w-full overflow-hidden rounded-xl bg-black/20">
        {group.iconSrc ? (
          <Image src={group.iconSrc} alt={group.label} fill unoptimized className="object-contain p-1.5" sizes="80px" />
        ) : (
          <Image src={group.thumbnailSrc} alt={group.label} fill unoptimized className="object-contain p-1" sizes="80px" />
        )}
      </div>
      <span className="text-[11px] font-medium leading-tight text-white/80">{group.label}</span>
    </button>
  );
}

function MuscleTile({
  group,
  active,
  count,
  onClick,
}: {
  group: GroupTile;
  active: boolean;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`glass-panel overflow-hidden text-left transition-transform hover:scale-[1.01] ${active ? 'ring-1 ring-white/30' : ''}`}
    >
      <div className={`relative aspect-[0.95] bg-gradient-to-br ${group.accent} overflow-hidden`}>
        <div className="absolute left-3 top-3 rounded-full bg-black/20 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-white/70 backdrop-blur-sm">
          {count}
        </div>
        {group.iconSrc ? (
          <Image src={group.iconSrc} alt={group.label} fill unoptimized className="object-contain p-2" sizes="33vw" />
        ) : (
          <Image src={group.thumbnailSrc} alt={group.label} fill unoptimized className="object-contain p-2" sizes="33vw" />
        )}
      </div>
      <div className="border-t border-white/10 px-3 py-3">
        <p className="text-center text-sm font-semibold text-white">{group.label}</p>
      </div>
    </button>
  );
}

function BrowsePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const muscleParam = searchParams.get('muscle');
  const explicitBrowse = searchParams.has('muscle');

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeTab, setActiveTab] = useState<ExploreTab>('exercises');
  const [mode, setMode] = useState<ExploreMode>('muscles');
  const [activeMuscle, setActiveMuscle] = useState<BodyGroupKey | null>(
    muscleParam && muscleParam !== 'all' ? (muscleParam as BodyGroupKey) : null
  );
  const [activeEquipment, setActiveEquipment] = useState<string | null>(null);
  const [view, setView] = useState<ExploreView>('grid');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 150);
    return () => clearTimeout(t);
  }, [search]);

  const exercises = exercisesData as Exercise[];

  const equipmentGroups = useMemo(() => {
    const items = new Map<string, number>();
    for (const exercise of exercises) {
      const key = (exercise.equipment || 'other').toLowerCase();
      items.set(key, (items.get(key) || 0) + 1);
    }
    return Array.from(items.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, count]) => ({ key, label: formatEquipmentLabel(key), count }));
  }, [exercises]);

  const muscleCounts = useMemo(() => {
    const counts = new Map<BodyGroupKey, number>();
    for (const group of bodyGroups) counts.set(group.key, 0);
    for (const exercise of exercises) {
      for (const group of bodyGroups) {
        if (group.match(exercise)) {
          counts.set(group.key, (counts.get(group.key) || 0) + 1);
        }
      }
    }
    return counts;
  }, [exercises]);

  const filteredExercises = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    let results = q ? searchExercises(exercises, q) : exercises;

    if (activeMuscle) {
      const group = bodyGroups.find((item) => item.key === activeMuscle);
      if (group) results = results.filter((exercise) => group.match(exercise));
    }

    if (activeEquipment) {
      results = results.filter((exercise) => (exercise.equipment || '').toLowerCase() === activeEquipment);
    }

    return results;
  }, [activeEquipment, activeMuscle, exercises, debouncedSearch]);

  // Cap unfiltered renders — browsing all 1323 cards at once kills responsiveness.
  // When the user applies any filter or search, show everything.
  const visibleExercises = useMemo(() => {
    if (!debouncedSearch && !activeMuscle && !activeEquipment) {
      return filteredExercises.slice(0, 50);
    }
    return filteredExercises;
  }, [filteredExercises, debouncedSearch, activeMuscle, activeEquipment]);

  const activeMuscleLabel = activeMuscle ? bodyGroups.find((group) => group.key === activeMuscle)?.label : null;
  const activeEquipmentLabel = activeEquipment ? formatEquipmentLabel(activeEquipment) : null;
  const activeFilterLabel = activeMuscleLabel || activeEquipmentLabel || 'All exercises';

  return (
    <div className="dashboard-bg min-h-screen pb-24 pt-5">
      <div className="mx-auto max-w-md px-4">
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-white/75 hover:text-white transition-colors"
            aria-label="Go back"
          >
            <ChevronLeft size={22} />
          </button>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-white/35">Browse</p>
            <h1 className="text-2xl font-semibold text-white">Exercises</h1>
          </div>
          <div className="flex items-center gap-3 text-white/75">
            <button type="button">
              <Search size={21} />
            </button>
            <button type="button">
              <Dumbbell size={21} />
            </button>
          </div>
        </div>

        <div className="mb-4 rounded-[30px] border border-white/10 bg-white px-4 py-3 text-black shadow-[0_18px_45px_rgba(0,0,0,0.16)]">
          <div className="flex items-center gap-3 text-black/70">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search exercises..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full bg-transparent text-[15px] font-medium outline-none placeholder:text-black/35"
            />
          </div>
        </div>

        <div className="mb-5 grid grid-cols-3 gap-2 rounded-3xl border border-white/10 bg-white/[0.03] p-2">
          {[
            { key: 'programs', label: 'Programs', icon: CalendarRange },
            { key: 'exercises', label: 'Exercises', icon: Dumbbell },
            { key: 'coaches', label: 'Coaches', icon: UserRound },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key as ExploreTab)}
                className={`flex flex-col items-center gap-1 rounded-2xl px-3 py-3 transition-all ${
                  active ? 'bg-white text-black shadow-lg' : 'text-white/55'
                }`}
              >
                <Icon size={22} />
                <span className="text-[12px] font-semibold">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {activeTab === 'exercises' && (
          <>
            <div className="mb-6 flex items-center gap-3 overflow-x-auto pb-1 scrollbar-hide">
              <button
                type="button"
                onClick={() => {
                  setActiveMuscle(null);
                  setActiveEquipment(null);
                }}
                className={`flex w-20 shrink-0 flex-col items-center gap-2 rounded-2xl border px-2 py-2 transition-all ${
                  !activeMuscle && !activeEquipment ? 'border-white/25 bg-white/10' : 'border-white/5 bg-white/[0.03]'
                }`}
              >
                <div className="flex h-12 w-full items-center justify-center rounded-xl bg-black/20 text-xs font-semibold text-white/80">
                  All
                </div>
                <span className="text-[11px] font-medium text-white/80">Filters</span>
              </button>

              {bodyGroups.map((group) => (
                <CompactTile
                  key={group.key}
                  group={group}
                  active={activeMuscle === group.key}
                  onClick={() => {
                    setMode('muscles');
                    setActiveMuscle(group.key);
                    setActiveEquipment(null);
                  }}
                />
              ))}
            </div>

            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/30">Selected</p>
                <h2 className="text-lg font-semibold text-white">{activeFilterLabel}</h2>
              </div>
              <button
                type="button"
                onClick={() => setMode(mode === 'muscles' ? 'equipment' : 'muscles')}
                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-white/80"
              >
                <Grid2X2 size={14} />
                {mode === 'muscles' ? 'Muscles' : 'Equipment'}
                <ChevronRight size={14} />
              </button>
            </div>

            {mode === 'muscles' ? (
              <>
                {/* When a muscle is selected we hide the large "Browse categories" grid
                    to avoid repeating icons. The compact rail above remains visible and
                    filtered exercises will appear below. */}
                {!activeMuscle && !explicitBrowse && (
                  <>
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/30">By muscle</p>
                        <h3 className="text-xl font-semibold text-white">Browse categories</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveMuscle(null)}
                        className="rounded-full border border-white/10 px-3 py-2 text-xs font-medium text-white/70"
                      >
                        Clear
                      </button>
                    </div>

                    <div className="mb-8 grid grid-cols-3 gap-3">
                      {bodyGroups.map((group) => (
                        <MuscleTile
                          key={group.key}
                          group={group}
                          active={activeMuscle === group.key}
                          count={muscleCounts.get(group.key) || 0}
                          onClick={() => {
                            setActiveMuscle(group.key);
                            setActiveEquipment(null);
                          }}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/30">By equipment</p>
                    <h3 className="text-xl font-semibold text-white">Gear filters</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveEquipment(null)}
                    className="rounded-full border border-white/10 px-3 py-2 text-xs font-medium text-white/70"
                  >
                    Clear
                  </button>
                </div>

                <div className="mb-8 grid grid-cols-3 gap-3">
                  {equipmentGroups.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => {
                        setActiveEquipment(item.key);
                        setActiveMuscle(null);
                      }}
                      className={`glass-panel flex flex-col items-center justify-center gap-2 px-2 py-5 text-center transition-all ${
                        activeEquipment === item.key ? 'ring-1 ring-white/30' : ''
                      }`}
                    >
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 text-white/80">
                        <Dumbbell size={24} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{item.label}</p>
                        <p className="text-[11px] text-white/35">{item.count} exercises</p>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}

            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/30">All exercises</p>
                <h3 className="text-xl font-semibold text-white">
                  {filteredExercises.length} results
                  {visibleExercises.length < filteredExercises.length && (
                    <span className="text-sm font-normal text-white/30 ml-2">showing {visibleExercises.length}</span>
                  )}
                </h3>
              </div>
              <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1">
                <button
                  type="button"
                  onClick={() => setView('list')}
                  className={`rounded-full p-2 transition-all ${view === 'list' ? 'bg-white text-black' : 'text-white/60'}`}
                  aria-label="List view"
                >
                  <List size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => setView('grid')}
                  className={`rounded-full p-2 transition-all ${view === 'grid' ? 'bg-white text-black' : 'text-white/60'}`}
                  aria-label="Grid view"
                >
                  <LayoutGrid size={15} />
                </button>
              </div>
            </div>

            <div className={view === 'grid' ? 'grid grid-cols-2 gap-3' : 'space-y-3'}>
              {filteredExercises.length === 0 ? (
                <div className="col-span-full rounded-3xl border border-white/10 bg-white/[0.03] px-6 py-12 text-center text-sm text-white/40">
                  No exercises found.
                </div>
              ) : (
                visibleExercises.map((exercise, i) => (
                  <ExerciseCard
                    key={exercise.id}
                    index={i}
                    exercise={exercise}
                    view={view}
                    thumbnailSrc={`/exercise-media/${exercise.id}.gif`}
                    muscleLabel={formatBodyPartLabel(exercise.bodyPart || 'other')}
                    detailLabel={`${formatBodyPartLabel(exercise.bodyPart || 'other')} • ${formatEquipmentLabel(exercise.equipment || 'other')}`}
                  />
                ))
              )}
            </div>
          </>
        )}

        {activeTab !== 'exercises' && (
          <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 text-center text-white/50">
            This tab is ready for the next pass.
          </div>
        )}
      </div>
    </div>
  );
}

export default function BrowsePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <BrowsePageContent />
    </Suspense>
  );
}
