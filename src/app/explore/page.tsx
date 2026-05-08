'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dumbbell,
  Search,
  UserRound,
  CalendarRange,
  Zap,
} from 'lucide-react';
import { LoadingPage } from '@/components/ui';
import { getAllExercises } from '@/lib/db/exerciseQueries';
import { seedExercises } from '@/lib/db/seed';
import { type Exercise } from '@/lib/db/schema';
import {
  ExploreTab,
  BodyGroupKey,
  bodyGroups,
} from '@/lib/explore/constants';
import { CompactTile, MuscleTile } from '@/components/ExploreTiles';

export default function ExplorePage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
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

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && search.trim()) {
      router.push(`/explore/browse?q=${encodeURIComponent(search.trim())}`);
    }
  };

  const handleSearchSubmit = () => {
    if (search.trim()) {
      router.push(`/explore/browse?q=${encodeURIComponent(search.trim())}`);
    }
  };

  if (loading) return <LoadingPage />;

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
            <button type="button" aria-label="Equipment">
              <Dumbbell size={21} />
            </button>
          </div>
        </div>

        {/* Search — navigates only on Enter or tap of search icon */}
        <div className="mb-4 rounded-[30px] border border-white/10 bg-white px-4 py-3 text-black shadow-[0_18px_45px_rgba(0,0,0,0.16)]">
          <div className="flex items-center gap-3 text-black/70">
            <button type="button" onClick={handleSearchSubmit} aria-label="Search">
              <Search size={18} className="shrink-0" />
            </button>
            <input
              type="search"
              inputMode="search"
              enterKeyHint="search"
              placeholder="Search exercises..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearchKeyDown}
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
                className={`flex flex-col items-center gap-1 rounded-2xl px-3 py-3 transition-all active:scale-[0.97] ${
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
              className="glass-panel overflow-hidden text-left transition-transform active:scale-[0.97] touch-manipulation"
            >
              <div className="relative aspect-[0.95] bg-gradient-to-br from-indigo-500/30 to-white/5 overflow-hidden flex flex-col items-center justify-center">
                <Zap size={32} className="text-indigo-300 mb-2" />
                <span className="text-xs font-medium text-white/70">All</span>
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
            Coming soon.
          </div>
        )}
      </div>
    </div>
  );
}
