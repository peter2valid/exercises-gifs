'use client';

import { useMemo, useState } from 'react';
import { useExercises } from '@/hooks/useExercises';
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
import GlutesIcon from '@/assets/icons/bodyparts/Glutes_Icon.webp';
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
  { id: 'chest', name: 'Chest', iconSrc: AbdominalsIcon, color: 'bg-red-50' },
  { id: 'biceps', name: 'Biceps', iconSrc: BicepsMuscleIcon, color: 'bg-purple-50' },
  { id: 'triceps', name: 'Triceps', iconSrc: ForearmsBackIcon, color: 'bg-fuchsia-50' },
  { id: 'back', name: 'Back', iconSrc: BackMuscleIcon, color: 'bg-blue-50' },
  { id: 'shoulders', name: 'Shoulders', iconSrc: NeckMuscleIcon, color: 'bg-cyan-50' },
  { id: 'abs', name: 'Abs', iconSrc: LowerAbdominalsIcon, color: 'bg-rose-50' },
  { id: 'quads', name: 'Quadriceps', iconSrc: InnerThighIcon, color: 'bg-orange-50' },
  { id: 'hamstrings', name: 'Hamstrings', iconSrc: HamstringsIcon, color: 'bg-amber-50' },
  { id: 'glutes', name: 'Hips', iconSrc: HipsBackMuscleIcon, color: 'bg-pink-50' },
  { id: 'calves', name: 'Calves', iconSrc: LowerLegMuscleIcon, color: 'bg-yellow-50' },
  { id: 'forearms', name: 'Forearms', iconSrc: ForearmsIcon, color: 'bg-violet-50' },
  { id: 'neck', name: 'Neck', iconSrc: NeckMuscleIcon, color: 'bg-emerald-50' },
  { id: 'cardio', name: 'Cardio', iconSrc: CardioIcon, color: 'bg-sky-50' },
];

const PROGRAMS = [
  { id: 'starter-strength', name: 'Starter Strength', description: 'Master fundamental movements', exercises: ['0001', '0002', '0003'] },
  { id: 'core-blast', name: 'Core Blast', description: 'Build a strong midsection', exercises: ['0001', '0006', '0007'] },
];

const CATEGORY_PREVIEWS: Record<string, { count: string; accent: string }> = {
  chest: { count: 'push', accent: 'from-rose-500/10 to-white' },
  biceps: { count: 'arms', accent: 'from-violet-500/10 to-white' },
  triceps: { count: 'arms', accent: 'from-fuchsia-500/10 to-white' },
  back: { count: 'pull', accent: 'from-sky-500/10 to-white' },
  shoulders: { count: 'press', accent: 'from-cyan-500/10 to-white' },
  abs: { count: 'core', accent: 'from-pink-500/10 to-white' },
  quads: { count: 'legs', accent: 'from-orange-500/10 to-white' },
  hamstrings: { count: 'legs', accent: 'from-amber-500/10 to-white' },
  glutes: { count: 'hips', accent: 'from-red-500/10 to-white' },
  calves: { count: 'legs', accent: 'from-yellow-500/10 to-white' },
  forearms: { count: 'arms', accent: 'from-purple-500/10 to-white' },
  cardio: { count: 'endurance', accent: 'from-emerald-500/10 to-white' },
  neck: { count: 'mobility', accent: 'from-lime-500/10 to-white' },
};

export default function ScanPage() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const { exercises, isLoading } = useExercises(search, activeCategory);
  const activeCategoryLabel = CATEGORIES.find(category => category.id === activeCategory)?.name ?? 'Exercises';
  const hasActiveSelection = activeCategory !== 'all';
  const isFocusedResultsMode = hasActiveSelection || search.trim().length > 0;

  const workoutCards = PROGRAMS.map((program, index) => ({
    ...program,
    tone: index === 0 ? 'from-gray-900 via-gray-800 to-gray-700' : 'from-blue-600 via-sky-500 to-cyan-400',
  }));

  const searchResults = useMemo(() => {
    if (!isFocusedResultsMode) return [];
    return exercises.slice(0, 60); // Show more rows when a category is selected
  }, [exercises, isFocusedResultsMode]);

  return (
    <div className="min-h-screen bg-[#f7f7fb] pb-24">
      {/* Sticky Header */}
      <header className="sticky top-0 z-30 bg-[#f7f7fb]/90 backdrop-blur-xl border-b border-black/5 px-6 py-6 space-y-4">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Exercises</h1>
        <div className="relative group">
          <LucideSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
          <Input 
            placeholder="Search exercises..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-12 pr-12 h-16 bg-white border-none rounded-full text-lg shadow-[0_12px_40px_rgba(15,23,42,0.08)] focus:ring-2 focus:ring-blue-100"
          />
          {search && (
            <button 
              onClick={() => setSearch('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 bg-gray-200 rounded-full text-gray-500 hover:text-gray-700 transition-colors"
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
                  {CATEGORIES.map((cat, index) => (
                    <button
                      key={`mini-${cat.id}`}
                      onClick={() => {
                        setActiveCategory(activeCategory === cat.id ? 'all' : cat.id);
                        setSearch('');
                      }}
                      className={`shrink-0 rounded-full p-2 border transition-all active:scale-95 ${
                        activeCategory === cat.id
                          ? 'border-blue-500 bg-blue-50 shadow-[0_10px_24px_rgba(59,130,246,0.2)]'
                          : 'border-black/5 bg-white'
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
                 {search ? 'Search Results' : `${activeCategoryLabel} Workouts`}
               </h2>
               <div className="flex items-center gap-3">
                 <span className="text-xs font-bold text-gray-400 uppercase">{exercises.length} results</span>
                 <button 
                   onClick={() => { setSearch(''); setActiveCategory('all'); }}
                   className="text-xs font-bold text-blue-600"
                 >
                   Clear All
                 </button>
               </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {isLoading ? (
                 Array(6).fill(0).map((_, i) => (
                    <div key={i} className="h-28 bg-white rounded-[2rem] animate-pulse shadow-sm" />
                 ))
              ) : searchResults.map(ex => (
                <Link 
                  key={ex.id} 
                  href={`/scan/exercise/${ex.id}`}
                  className="flex items-center justify-between p-4 bg-white rounded-[2rem] active:scale-[0.98] transition-all group shadow-[0_10px_30px_rgba(15,23,42,0.06)] border border-black/5 min-h-[7rem]"
                >
                  <div>
                    <h3 className="font-black text-gray-900 capitalize text-lg leading-tight">{ex.name}</h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-[0.24em] mt-1">{getExerciseBodyPart(ex) || 'Unknown'}</p>
                  </div>
                  <LucideChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-600 transition-colors" />
                </Link>
              ))}
              {!isLoading && searchResults.length === 0 && (
                <p className="text-center py-10 text-gray-400 font-medium">No exercises found.</p>
              )}
            </div>
          </section>
        )}

        {/* Categories */}
        {!isFocusedResultsMode && (
        <section className="space-y-4">
          <div className="flex items-end justify-between">
            <h2 className="text-sm font-black text-gray-500 uppercase tracking-[0.24em]">Choose a muscle</h2>
            <span className="text-xs font-bold text-gray-400 uppercase">{CATEGORIES.length} groups</span>
          </div>
           <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {isLoading ? (
              Array(CATEGORIES.length).fill(0).map((_, i) => (
                  <div key={i} className="h-48 bg-white rounded-[2.25rem] animate-pulse shadow-sm" />
               ))
            ) : CATEGORIES.map((cat, index) => (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(activeCategory === cat.id ? 'all' : cat.id);
                  setSearch('');
                }}
                className={`group flex flex-col items-center text-center gap-4 p-4 rounded-[2.25rem] transition-all active:scale-95 text-left shadow-[0_10px_30px_rgba(15,23,42,0.06)] border ${
                  activeCategory === cat.id ? 'border-blue-500 bg-blue-50' : 'border-black/5 bg-white'
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
                        className="h-24 w-24 object-contain drop-shadow-sm"
                      />
                    ) : (
                      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/80 text-sm font-black uppercase tracking-[0.3em] text-gray-600 shadow-sm">
                        CV
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="block text-lg font-black text-gray-900 leading-none">{cat.name}</span>
                  <span className="block text-xs font-bold uppercase tracking-[0.24em] text-gray-400">
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
            <h2 className="text-sm font-black text-gray-500 uppercase tracking-[0.24em]">Workouts</h2>
            <span className="text-xs font-bold text-gray-400 uppercase">tap to open</span>
          </div>
          <div className="grid gap-4">
            {isLoading ? (
               Array(2).fill(0).map((_, i) => (
                  <div key={i} className="h-56 bg-white rounded-[2rem] animate-pulse shadow-sm" />
               ))
            ) : workoutCards.map(prog => (
              <Link 
                key={prog.id} 
                href={`/scan/program/${prog.id}`}
                className="block relative overflow-hidden rounded-[2rem] bg-white p-4 shadow-[0_16px_50px_rgba(15,23,42,0.08)] border border-black/5 active:scale-[0.98] transition-transform"
              >
                <div className={`rounded-[1.75rem] bg-gradient-to-br ${prog.tone} p-5 text-white`}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/60">Workout</p>
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
                        Move {exerciseId.slice(-2)}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between px-2 pb-1">
                  <span className="text-xs font-bold uppercase tracking-[0.24em] text-gray-400">Open workout</span>
                  <LucideChevronRight className="h-5 w-5 text-gray-300" />
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
