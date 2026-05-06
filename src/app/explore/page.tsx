'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
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
import { getAllExercises } from '@/lib/db/exerciseQueries';
import { seedExercises } from '@/lib/db/seed';
import { type Exercise } from '@/lib/db/schema';
import {
  ExploreView,
  ExploreTab,
  ExploreMode,
  BodyGroupKey,
  GroupTile,
  bodyGroups,
  formatEquipmentLabel,
  formatBodyPartLabel,
} from '@/lib/explore/constants';
import { CompactTile, MuscleTile } from '@/components/ExploreTiles';

export default function ExplorePage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<ExploreTab>('exercises');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        await seedExercises();
        const data = await getAllExercises();
        setExercises(data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      startTransition(() => setDebouncedSearch(search));
    }, 150);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (debouncedSearch.trim()) {
      router.push(`/explore/browse?q=${encodeURIComponent(debouncedSearch.trim())}`);
    }
  }, [debouncedSearch, router]);

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
          <button type="button" className="text-white/75" aria-label="Workout Programs">
            <CalendarRange size={22} />
          </button>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-white/35">Explore</p>
            <h1 className="text-2xl font-semibold text-white">Exercises</h1>
          </div>
          <div className="flex items-center gap-3 text-white/75">
            <button type="button" aria-label="Search">
              <Search size={21} />
            </button>
            <button type="button" aria-label="Exercise Equipment">
              <Dumbbell size={21} />
            </button>
          </div>
        </div>

        <div className={`mb-4 rounded-[30px] border border-white/10 bg-white px-4 py-3 text-black shadow-[0_18px_45px_rgba(0,0,0,0.16)] transition-opacity duration-200 ${isPending ? 'opacity-70' : 'opacity-100'}`}>
          <div className="flex items-center gap-3 text-black/70">
            <Search size={18} className={isPending ? 'animate-pulse' : ''} />
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
            {loading ? (
              <div className="col-span-3 flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-white/10 border-t-white/80 rounded-full animate-spin" />
              </div>
            ) : (
              <>
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
              </>
            )}
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
