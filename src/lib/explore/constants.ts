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
export type ExploreTab = 'programs' | 'exercises' | 'coaches';
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
