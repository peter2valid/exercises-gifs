import type { LucideIcon } from 'lucide-react';
import {
  Accessibility,
  Activity,
  Bike,
  Cable,
  Circle,
  CircleDashed,
  CircleDot,
  Disc,
  Disc2,
  Dumbbell,
  Frame,
  Hammer,
  Layers,
  Link,
  Minus,
  PersonStanding,
  RefreshCw,
  RotateCcw,
  RotateCw,
  Scale,
  Settings2,
  TrendingUp,
  Truck,
  Wind,
  Zap,
} from 'lucide-react';
import { type Exercise } from '@/lib/db/schema';
import ChestIcon from '@/assets/icons/bodyparts/gym.png';
import BicepsIcon from '@/assets/icons/bodyparts/Biceps_muscle_Icon.webp';
import TricepsIcon from '@/assets/icons/bodyparts/strength.png';
import BackIcon from '@/assets/icons/bodyparts/Back_muscle_Icon.webp';
import ShoulderIcon from '@/assets/icons/bodyparts/shoulder.png';
import AbsIcon from '@/assets/icons/bodyparts/Abdominals_Icon.webp';
import LowerLegIcon from '@/assets/icons/bodyparts/Lower_leg_muscle_Icon.webp';
import HamstringsIcon from '@/assets/icons/bodyparts/Hamstrings_Icon.webp';
import GlutesIcon from '@/assets/icons/bodyparts/Glutes_Icon.webp';
import CalvesIcon from '@/assets/icons/bodyparts/Calves_Icon.webp';
import ForearmsIcon from '@/assets/icons/bodyparts/Forearms_Icon.webp';
import NeckIcon from '@/assets/icons/bodyparts/Neck_muscle_Icon.webp';
import CardioIcon from '@/assets/icons/bodyparts/cardio icon.png';

export type ExploreView = 'list' | 'grid';
export type ExploreMode = 'muscles' | 'equipment';
export type BodyGroupKey =
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

export type GroupTile = {
  key: BodyGroupKey;
  label: string;
  iconSrc?: string;
  exerciseId: string;
  match: (exercise: Exercise) => boolean;
  accent: string;
};

export const bodyGroups: GroupTile[] = [
  {
    key: 'chest',
    label: 'Chest',
    iconSrc: ChestIcon.src,
    exerciseId: '3294',
    match: (exercise) => exercise.body_part === 'chest' || exercise.target === 'pectorals',
    accent: 'from-rose-500/30 to-white/5',
  },
  {
    key: 'biceps',
    label: 'Biceps',
    iconSrc: BicepsIcon.src,
    exerciseId: '0968',
    match: (exercise) => exercise.target === 'biceps' || (exercise.body_part === 'upper arms' && exercise.target === 'biceps'),
    accent: 'from-orange-400/25 to-white/5',
  },
  {
    key: 'triceps',
    label: 'Triceps',
    iconSrc: TricepsIcon.src,
    exerciseId: '0018',
    match: (exercise) => exercise.target === 'triceps' || (exercise.body_part === 'upper arms' && exercise.target === 'triceps'),
    accent: 'from-fuchsia-500/25 to-white/5',
  },
  {
    key: 'back',
    label: 'Back',
    iconSrc: BackIcon.src,
    exerciseId: '0007',
    match: (exercise) => exercise.body_part === 'back' || ['lats', 'lower back', 'upper back'].includes(exercise.target),
    accent: 'from-sky-500/25 to-white/5',
  },
  {
    key: 'shoulders',
    label: 'Shoulders',
    iconSrc: ShoulderIcon.src,
    exerciseId: '0977',
    match: (exercise) => exercise.body_part === 'shoulders' || exercise.target === 'delts',
    accent: 'from-cyan-500/25 to-white/5',
  },
  {
    key: 'abs',
    label: 'Abs',
    iconSrc: AbsIcon.src,
    exerciseId: '0001',
    match: (exercise) => exercise.body_part === 'waist' || exercise.target === 'abs',
    accent: 'from-emerald-500/25 to-white/5',
  },
  {
    key: 'quadriceps',
    label: 'Quadriceps',
    iconSrc: LowerLegIcon.src,
    exerciseId: '1512',
    match: (exercise) => exercise.body_part === 'upper legs' && ['quads', 'quadriceps', 'thighs'].includes(exercise.target),
    accent: 'from-violet-500/25 to-white/5',
  },
  {
    key: 'hamstrings',
    label: 'Hamstrings',
    iconSrc: HamstringsIcon.src,
    exerciseId: '0016',
    match: (exercise) => exercise.target === 'hamstrings',
    accent: 'from-indigo-500/25 to-white/5',
  },
  {
    key: 'hips',
    label: 'Hips',
    iconSrc: GlutesIcon.src,
    exerciseId: '3214',
    match: (exercise) => ['glutes', 'abductors', 'adductors'].includes(exercise.target),
    accent: 'from-pink-500/25 to-white/5',
  },
  {
    key: 'calves',
    label: 'Calves',
    iconSrc: CalvesIcon.src,
    exerciseId: '1368',
    match: (exercise) => exercise.body_part === 'lower legs' || exercise.target === 'calves',
    accent: 'from-amber-400/25 to-white/5',
  },
  {
    key: 'forearms',
    label: 'Forearms',
    iconSrc: ForearmsIcon.src,
    exerciseId: '0994',
    match: (exercise) => exercise.body_part === 'lower arms' || exercise.target === 'forearms',
    accent: 'from-lime-500/25 to-white/5',
  },
  {
    key: 'neck',
    label: 'Neck',
    iconSrc: NeckIcon.src,
    exerciseId: '1403',
    match: (exercise) => exercise.body_part === 'neck',
    accent: 'from-white/15 to-white/5',
  },
  {
    key: 'cardio',
    label: 'Cardio',
    iconSrc: CardioIcon.src,
    exerciseId: '3220',
    match: (exercise) => exercise.body_part === 'cardio',
    accent: 'from-emerald-400/25 to-white/5',
  },
];

export function formatEquipmentLabel(value: string) {
  return value
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function formatBodyPartLabel(value: string) {
  if (value === 'waist') return 'Abs';
  if (value === 'upper arms') return 'Arms';
  if (value === 'upper legs') return 'Legs';
  if (value === 'lower legs') return 'Calves';
  if (value === 'lower arms') return 'Forearms';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export type EquipmentMeta = { icon: LucideIcon; color: string };

export const EQUIPMENT_ICON_MAP: Record<string, EquipmentMeta> = {
  'assisted':             { icon: Accessibility,  color: 'text-emerald-400' },
  'band':                 { icon: Minus,           color: 'text-yellow-400'  },
  'barbell':              { icon: Dumbbell,        color: 'text-white/80'    },
  'body weight':          { icon: PersonStanding,  color: 'text-sky-400'     },
  'bosu ball':            { icon: Disc,            color: 'text-purple-400'  },
  'cable':                { icon: Cable,           color: 'text-orange-400'  },
  'dumbbell':             { icon: Dumbbell,        color: 'text-white/80'    },
  'elliptical machine':   { icon: Activity,        color: 'text-cyan-400'    },
  'ez barbell':           { icon: Dumbbell,        color: 'text-white/60'    },
  'hammer':               { icon: Hammer,          color: 'text-rose-400'    },
  'kettlebell':           { icon: Disc2,           color: 'text-amber-400'   },
  'leverage machine':     { icon: Settings2,       color: 'text-slate-400'   },
  'medicine ball':        { icon: CircleDot,       color: 'text-teal-400'    },
  'olympic barbell':      { icon: Dumbbell,        color: 'text-white/80'    },
  'resistance band':      { icon: Zap,             color: 'text-yellow-300'  },
  'roller':               { icon: RotateCcw,       color: 'text-lime-400'    },
  'rope':                 { icon: Link,            color: 'text-amber-300'   },
  'skierg machine':       { icon: Wind,            color: 'text-sky-300'     },
  'sled machine':         { icon: Truck,           color: 'text-zinc-400'    },
  'smith machine':        { icon: Layers,          color: 'text-violet-400'  },
  'stability ball':       { icon: Circle,          color: 'text-pink-400'    },
  'stationary bike':      { icon: Bike,            color: 'text-emerald-300' },
  'stepmill machine':     { icon: TrendingUp,      color: 'text-indigo-400'  },
  'tire':                 { icon: CircleDashed,    color: 'text-zinc-300'    },
  'trap bar':             { icon: Frame,           color: 'text-lime-300'    },
  'upper body ergometer': { icon: RotateCw,        color: 'text-blue-400'    },
  'weighted':             { icon: Scale,           color: 'text-orange-300'  },
  'wheel roller':         { icon: RefreshCw,       color: 'text-rose-300'    },
};
