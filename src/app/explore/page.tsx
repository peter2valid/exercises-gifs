'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Bookmark,
  ChevronRight,
  Dumbbell,
  Grid2X2,
  LayoutGrid,
  List,
  Search,
  UserRound,
  CalendarRange,
  Zap,
} from 'lucide-react';
import { Input } from '@/components/ui';
import ExerciseCard from '@/components/ExerciseCard';
import exercisesData from '../../../data/exercises.json';
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

function matchesQuery(exercise: Exercise, query: string) {
  if (!query) return true;
  const haystack = [exercise.name, exercise.bodyPart, exercise.target, exercise.equipment].join(' ').toLowerCase();
  return haystack.includes(query);
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

export default function ExplorePage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<ExploreTab>('exercises');

  const exercises = exercisesData as Exercise[];

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

  const handleMuscleClick = (muscleKey: BodyGroupKey) => {
    router.push(`/explore/browse?muscle=${muscleKey}`);
  };

  const handleAllExercises = () => {
    router.push('/explore/browse?muscle=all');
  };

  return (
    <div className="dashboard-bg min-h-screen pb-24 pt-5">
      <div className="mx-auto max-w-md px-4">
        <div className="mb-4 flex items-center justify-between">
          <button type="button" className="text-white/75">
            <CalendarRange size={22} />
          </button>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-white/35">Explore</p>
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
          <div className="mb-3 grid grid-cols-3 gap-3">
            {/* All Exercises Tile */}
            <button
              type="button"
              onClick={handleAllExercises}
              className="glass-panel overflow-hidden text-left transition-transform hover:scale-[1.01]"
            >
              <div className="relative aspect-[0.95] bg-gradient-to-br from-indigo-500/30 to-white/5 overflow-hidden flex flex-col items-center justify-center">
                <Zap size={32} className="text-indigo-300 mb-2" />
                <span className="text-xs font-medium text-white/70">All Exercises</span>
              </div>
              <div className="border-t border-white/10 px-3 py-3">
                <p className="text-center text-sm font-semibold text-white">Browse All</p>
              </div>
            </button>

            {/* Muscle Group Tiles */}
            {bodyGroups.map((group) => (
              <MuscleTile
                key={group.key}
                group={group}
                active={false}
                count={muscleCounts.get(group.key) || 0}
                onClick={() => handleMuscleClick(group.key)}
              />
            ))}
          </div>
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
