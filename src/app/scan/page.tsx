'use client';

import { useMemo, useState } from 'react';
import { useExercises } from '@/hooks/useExercises';
import { useGym } from '@/context/GymContext';
import { useGymParam } from '@/hooks/useGymParam';
import { Input } from '@/components/ui';
import { LucideSearch, LucideChevronRight, LucideDumbbell } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import type { StaticImageData } from 'next/image';
import { getExerciseBodyPart } from '@/lib/exercise-data';

import AbdominalsIcon from '@/assets/icons/bodyparts/Abdominals_Icon.webp';
import BackMuscleIcon from '@/assets/icons/bodyparts/Back_muscle_Icon.webp';
import BicepsMuscleIcon from '@/assets/icons/bodyparts/Biceps_muscle_Icon.webp';
import ForearmsIcon from '@/assets/icons/bodyparts/Forearms_Icon.webp';
import ForearmsBackIcon from '@/assets/icons/bodyparts/Forearms_back_Icon.webp';
import HamstringsIcon from '@/assets/icons/bodyparts/Hamstrings_Icon.webp';
import HipsBackMuscleIcon from '@/assets/icons/bodyparts/Hips_back_muscle_Icon.webp';
import InnerThighIcon from '@/assets/icons/bodyparts/Inner_thigh_Icon.webp';
import LowerAbdominalsIcon from '@/assets/icons/bodyparts/Lower_abdominals_Icon.webp';
import LowerLegMuscleIcon from '@/assets/icons/bodyparts/Lower_leg_muscle_Icon.webp';
import NeckMuscleIcon from '@/assets/icons/bodyparts/Neck_muscle_Icon.webp';
import CardioIcon from '@/assets/icons/bodyparts/cardio icon.png';

const CATEGORIES: Array<{
  id: string;
  name: string;
  iconSrc?: StaticImageData;
  color: string;
}> = [
  { id: 'chest', name: 'Chest', iconSrc: AbdominalsIcon, color: 'bg-cyan-400/15' },
  { id: 'arms', name: 'Arms', iconSrc: BicepsMuscleIcon, color: 'bg-violet-400/15' },
  { id: 'biceps', name: 'Biceps', iconSrc: BicepsMuscleIcon, color: 'bg-[#b26dff]/18' },
  { id: 'triceps', name: 'Triceps', iconSrc: ForearmsBackIcon, color: 'bg-sky-400/15' },
  { id: 'back', name: 'Back', iconSrc: BackMuscleIcon, color: 'bg-[#2b3948]/50' },
  { id: 'shoulders', name: 'Shoulders', iconSrc: NeckMuscleIcon, color: 'bg-[#2a3f49]/50' },
  { id: 'abs', name: 'Abs', iconSrc: LowerAbdominalsIcon, color: 'bg-indigo-400/15' },
  { id: 'quads', name: 'Quadriceps', iconSrc: InnerThighIcon, color: 'bg-[#4e3e2b]/45' },
  { id: 'hamstrings', name: 'Hamstrings', iconSrc: HamstringsIcon, color: 'bg-[#4a3c2a]/45' },
  { id: 'glutes', name: 'Hips', iconSrc: HipsBackMuscleIcon, color: 'bg-[#4b3430]/45' },
  { id: 'calves', name: 'Calves', iconSrc: LowerLegMuscleIcon, color: 'bg-[#4f442f]/45' },
  { id: 'forearms', name: 'Forearms', iconSrc: ForearmsIcon, color: 'bg-[#4d3f66]/45' },
  { id: 'neck', name: 'Neck', iconSrc: NeckMuscleIcon, color: 'bg-[#3d4a2d]/45' },
  { id: 'cardio', name: 'Cardio', iconSrc: CardioIcon, color: 'bg-[#2f4a45]/45' },
];

const PROGRAMS = [
  { id: 'starter-strength', name: 'Starter Strength', description: 'Master fundamental movements', exercises: ['0001', '0002', '0003'] },
  { id: 'core-blast', name: 'Core Blast', description: 'Build a strong midsection', exercises: ['0001', '0006', '0007'] },
];

const CATEGORY_PREVIEWS: Record<string, { count: string; accent: string }> = {
  chest: { count: 'push', accent: 'from-cyan-400/25 to-transparent' },
  arms: { count: 'arms', accent: 'from-violet-500/18 to-transparent' },
  biceps: { count: 'arms', accent: 'from-violet-500/20 to-transparent' },
  triceps: { count: 'arms', accent: 'from-sky-400/20 to-transparent' },
  back: { count: 'pull', accent: 'from-sky-500/18 to-transparent' },
  shoulders: { count: 'press', accent: 'from-cyan-500/18 to-transparent' },
  abs: { count: 'core', accent: 'from-indigo-400/20 to-transparent' },
  quads: { count: 'legs', accent: 'from-orange-500/18 to-transparent' },
  hamstrings: { count: 'legs', accent: 'from-amber-500/18 to-transparent' },
  glutes: { count: 'hips', accent: 'from-red-500/18 to-transparent' },
  calves: { count: 'legs', accent: 'from-yellow-500/18 to-transparent' },
  forearms: { count: 'arms', accent: 'from-purple-500/18 to-transparent' },
  cardio: { count: 'endurance', accent: 'from-emerald-500/18 to-transparent' },
  neck: { count: 'mobility', accent: 'from-lime-500/18 to-transparent' },
};

export default function ScanPage() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const { exercises, isLoading } = useExercises(search, activeCategory);
  const { gymId, gymName } = useGym();
  const { buildGymUrl } = useGymParam();
  const activeCategoryLabel = CATEGORIES.find(category => category.id === activeCategory)?.name ?? 'Exercises';
  const hasActiveSelection = activeCategory !== 'all';
  const isFocusedResultsMode = hasActiveSelection || search.trim().length > 0;

  const workoutCards = PROGRAMS.map((program, index) => ({
    ...program,
    tone: index === 0 ? 'from-gray-900 via-gray-800 to-gray-700' : 'from-blue-600 via-sky-500 to-cyan-400',
  }));

  const searchResults = useMemo(() => {
    if (!isFocusedResultsMode) return [];
    return exercises.slice(0, 60);
  }, [exercises, isFocusedResultsMode]);

  return (
    <div className="min-h-screen dashboard-bg text-[var(--text-primary)] pb-24">
      {/* Sticky Header */}
      <header className="sticky top-0 z-30 bg-transparent backdrop-blur-xl border-b border-white/10 px-6 py-6 space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">Exercises</h1>
            {gymId && (
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent-orange)] mt-1">
                Location: {gymName}
              </p>
            )}
          </div>
        </div>
        <div className="relative group">
          <LucideSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)] group-focus-within:text-[var(--accent-orange)] transition-colors" />
          <Input 
            placeholder="Search exercises..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-12 pr-12 h-16 bg-white/10 border border-white/10 rounded-full text-lg text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] shadow-[0_12px_40px_rgba(0,0,0,0.25)] focus:ring-2 focus:ring-[var(--accent-orange)]/35"
          />
          {search && (
            <button 
              onClick={() => setSearch('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 bg-white/10 rounded-full text-[var(--text-secondary)] hover:text-white transition-colors"
            >
              <span className="text-xs">✕</span>
            </button>
          )}
        </div>
      </header>

      <main className="px-6 mt-6 space-y-10">
        {/* Filtered Results Mode */}
        {isFocusedResultsMode && (
          <section className="space-y-4">
            {hasActiveSelection && (
              <div className="-mx-2 overflow-x-auto pb-1 scrollbar-hide">
                <div className="flex min-w-max gap-2 px-2">
                  <button
                    key="mini-all"
                    type="button"
                    onClick={() => {
                      setActiveCategory('all');
                      setSearch('');
                    }}
                    className="shrink-0 rounded-full px-4 py-2 border border-white/10 bg-white/10 text-xs font-bold uppercase tracking-[0.2em] text-[var(--text-secondary)] hover:text-white transition-all active:scale-95"
                  >
                    All
                  </button>
                  {CATEGORIES.map((cat, index) => (
                    <button
                      key={`mini-${cat.id}`}
                      type="button"
                      onClick={() => {
                        setActiveCategory(cat.id);
                        setSearch('');
                      }}
                      className={`shrink-0 rounded-full p-2 border transition-all active:scale-95 cursor-pointer ${
                        activeCategory === cat.id
                          ? 'border-[var(--accent-orange)] bg-[var(--accent-orange)]/15 shadow-[0_0_24px_rgba(57,213,255,0.28)]'
                            : 'border-white/10 bg-white/10'
                      }`}
                    >
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${cat.color}`}>
                        {cat.iconSrc ? (
                          <Image
                            src={cat.iconSrc}
                            alt={`${cat.name} mini icon`}
                            width={32}
                            height={32}
                            priority={index < 4}
                            sizes="32px"
                            className="h-8 w-8 object-contain"
                          />
                        ) : (
                          <span className="text-[10px] font-black text-gray-600">CV</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between items-center">
               <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest">
                 {search ? 'Search Results' : `${activeCategoryLabel} Exercises`}
               </h2>
               <div className="flex items-center gap-3">
                 <span className="text-xs font-bold text-[var(--text-secondary)] uppercase">{exercises.length} results</span>
                 <button 
                   onClick={() => { setSearch(''); setActiveCategory('all'); }}
                   className="text-xs font-bold text-[var(--accent-orange)]"
                 >
                   Clear All
                 </button>
               </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {isLoading ? (
                 Array(6).fill(0).map((_, i) => (
                    <div key={i} className="h-28 glass-panel rounded-[2rem] animate-pulse" />
                 ))
              ) : searchResults.map(ex => (
                <Link 
                  key={ex.id} 
                  href={buildGymUrl(`/scan/exercise/${ex.id}`)}
                  className="glass-panel flex items-center justify-between p-4 rounded-[2rem] active:scale-[0.98] transition-all group min-h-[7rem]"
                >
                  <div>
                    <h3 className="font-black text-[var(--text-primary)] capitalize text-lg leading-tight">{ex.name}</h3>
                    <p className="text-xs text-[var(--text-secondary)] font-bold uppercase tracking-[0.24em] mt-1">{getExerciseBodyPart(ex) || 'Unknown'}</p>
                  </div>
                  <LucideChevronRight className="w-5 h-5 text-[var(--text-secondary)] group-hover:text-[var(--accent-orange)] transition-colors" />
                </Link>
              ))}
              {!isLoading && searchResults.length === 0 && (
                <p className="text-center py-10 text-[var(--text-secondary)] font-medium">No exercises found.</p>
              )}
            </div>
          </section>
        )}

        {/* Categories */}
        {!isFocusedResultsMode && (
        <section className="space-y-4">
          <div className="flex items-end justify-between">
            <h2 className="text-sm font-black text-[var(--text-secondary)] uppercase tracking-[0.24em]">Choose a body area</h2>
            <span className="text-xs font-bold text-[var(--text-secondary)] uppercase">{CATEGORIES.length} groups</span>
          </div>
           <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {isLoading ? (
              Array(CATEGORIES.length).fill(0).map((_, i) => (
                  <div key={i} className="h-48 glass-panel rounded-[2.25rem] animate-pulse" />
               ))
            ) : CATEGORIES.map((cat, index) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setActiveCategory(cat.id);
                  setSearch('');
                }}
                className={`glass-panel group flex flex-col items-center text-center gap-4 p-4 rounded-[2.25rem] transition-all active:scale-95 text-left cursor-pointer ${
                  activeCategory === cat.id ? 'ring-2 ring-[var(--accent-orange)] bg-[var(--accent-orange)]/10' : ''
                }`}
              >
                <div className={`w-full rounded-[1.75rem] bg-gradient-to-b ${CATEGORY_PREVIEWS[cat.id]?.accent ?? 'from-gray-100 to-white'} p-4`}> 
                  <div className="flex h-24 items-center justify-center">
                    {cat.iconSrc ? (
                      <Image
                        src={cat.iconSrc}
                        alt={`${cat.name} icon`}
                        width={110}
                        height={110}
                        priority={index === 0}
                        sizes="110px"
                        className="h-24 w-24 object-contain drop-shadow-[0_8px_18px_rgba(0,0,0,0.35)]"
                      />
                    ) : (
                      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/10 text-sm font-black uppercase tracking-[0.3em] text-[var(--text-secondary)] shadow-sm">
                        CV
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="block text-lg font-black text-[var(--text-primary)] leading-none">{cat.name}</span>
                  <span className="block text-xs font-bold uppercase tracking-[0.24em] text-[var(--text-secondary)]">
                    {CATEGORY_PREVIEWS[cat.id]?.count ?? 'workouts'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>
        )}

        {/* Programs */}
        {!isFocusedResultsMode && (
        <section className="space-y-4">
          <div className="flex items-end justify-between">
            <h2 className="text-sm font-black text-[var(--text-secondary)] uppercase tracking-[0.24em]">Programs</h2>
            <span className="text-xs font-bold text-[var(--text-secondary)] uppercase">tap to open</span>
          </div>
          <div className="grid gap-4">
            {isLoading ? (
               Array(2).fill(0).map((_, i) => (
                  <div key={i} className="h-56 glass-panel rounded-[2rem] animate-pulse" />
               ))
            ) : workoutCards.map(prog => (
              <Link 
                key={prog.id} 
                href={buildGymUrl(`/scan/program/${prog.id}`)}
                className="glass-panel block relative overflow-hidden rounded-[2rem] p-4 active:scale-[0.98] transition-transform"
              >
                <div className={`rounded-[1.75rem] bg-gradient-to-br ${prog.tone} p-5 text-white`}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/60">Program</p>
                      <h3 className="mt-2 text-3xl font-black tracking-tight">{prog.name}</h3>
                      <p className="mt-2 max-w-[18rem] text-sm text-white/75">{prog.description}</p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm">
                      <LucideDumbbell className="h-6 w-6 text-white" />
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-3 gap-3">
                    {prog.exercises.map((exerciseId) => (
                      <div key={exerciseId} className="rounded-[1.25rem] bg-white/12 px-3 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-white/80 backdrop-blur-sm">
                        Exercise {exerciseId.slice(-2)}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between px-2 pb-1">
                  <span className="text-xs font-bold uppercase tracking-[0.24em] text-[var(--text-secondary)]">Open program</span>
                  <LucideChevronRight className="h-5 w-5 text-[var(--text-secondary)]" />
                </div>
              </Link>
            ))}
          </div>
        </section>
        )}
      </main>
    </div>
  );
}
