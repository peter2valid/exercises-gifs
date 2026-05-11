'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dumbbell,
  Search,
  Zap,
  Accessibility,
  Minus,
  PersonStanding,
  Activity,
  Disc,
  Cable,
  Hammer,
  Disc2,
  Settings2,
  CircleDot,
  RotateCcw,
  Link,
  Wind,
  Truck,
  Layers,
  Circle,
  TrendingUp,
  CircleDashed,
  Frame,
  RotateCw,
  Scale,
  RefreshCw,
} from 'lucide-react';
import { LoadingPage } from '@/components/ui';
import { getAllExercises } from '@/lib/db/exerciseQueries';
import { seedExercises } from '@/lib/db/seed';
import { type Exercise } from '@/lib/db/schema';
import {
  BodyGroupKey,
  bodyGroups,
  formatEquipmentLabel,
} from '@/lib/explore/constants';
import { CompactTile, MuscleTile, EquipmentTile } from '@/components/ExploreTiles';

type EquipmentMeta = { icon: typeof Dumbbell; color: string };

const EQUIPMENT_ICON_MAP: Record<string, EquipmentMeta> = {
  assisted: { icon: Accessibility, color: 'text-emerald-400' },
  band: { icon: Minus, color: 'text-yellow-400' },
  barbell: { icon: Dumbbell, color: 'text-white/80' },
  'body weight': { icon: PersonStanding, color: 'text-sky-400' },
  'bosu ball': { icon: Disc, color: 'text-purple-400' },
  cable: { icon: Cable, color: 'text-orange-400' },
  dumbbell: { icon: Dumbbell, color: 'text-white/80' },
  'elliptical machine': { icon: Activity, color: 'text-cyan-400' },
  'ez barbell': { icon: Dumbbell, color: 'text-white/60' },
  hammer: { icon: Hammer, color: 'text-rose-400' },
  kettlebell: { icon: Disc2, color: 'text-amber-400' },
  'leverage machine': { icon: Settings2, color: 'text-slate-400' },
  'medicine ball': { icon: CircleDot, color: 'text-teal-400' },
  'olympic barbell': { icon: Dumbbell, color: 'text-white/80' },
  'resistance band': { icon: Zap, color: 'text-yellow-300' },
  roller: { icon: RotateCcw, color: 'text-lime-400' },
  rope: { icon: Link, color: 'text-amber-300' },
  'skierg machine': { icon: Wind, color: 'text-sky-300' },
  'sled machine': { icon: Truck, color: 'text-zinc-400' },
  'smith machine': { icon: Layers, color: 'text-violet-400' },
  'stability ball': { icon: Circle, color: 'text-pink-400' },
  'stationary bike': { icon: Activity, color: 'text-emerald-300' },
  'stepmill machine': { icon: TrendingUp, color: 'text-indigo-400' },
  tire: { icon: CircleDashed, color: 'text-zinc-300' },
  'trap bar': { icon: Frame, color: 'text-lime-300' },
  'upper body ergometer': { icon: RotateCw, color: 'text-blue-400' },
  weighted: { icon: Scale, color: 'text-orange-300' },
  'wheel roller': { icon: RefreshCw, color: 'text-rose-300' },
};

export default function ExplorePage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [showEquipment, setShowEquipment] = useState(false);
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

  const handleMuscleClick = (muscleKey: BodyGroupKey) => {
    router.push(`/explore/browse?muscle=${muscleKey}`);
  };

  const handleAllExercises = () => {
    router.push('/explore/browse?muscle=all');
  };

  const handleEquipmentClick = (equipmentKey: string) => {
    router.push(`/explore/browse?mode=equipment&equipment=${encodeURIComponent(equipmentKey)}`);
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
        <div className="mb-4">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-white/35">Explore</p>
          <h1 className="text-2xl font-semibold text-white">{showEquipment ? 'Equipment' : 'Exercises'}</h1>
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

        <div className="mb-5 flex items-center justify-between rounded-3xl border border-white/10 bg-white/[0.03] p-2">
          <button
            type="button"
            onClick={() => setShowEquipment(false)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-2xl px-3 py-3 transition-all active:scale-[0.97] ${
              !showEquipment ? 'bg-white text-black shadow-lg' : 'text-white/55'
            }`}
          >
            <Dumbbell size={22} />
            <span className="text-[12px] font-semibold">Exercises</span>
          </button>
          <button
            type="button"
            onClick={() => setShowEquipment(true)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-2xl px-3 py-3 transition-all active:scale-[0.97] ${
              showEquipment ? 'bg-white text-black shadow-lg' : 'text-white/55'
            }`}
          >
            <Zap size={22} />
            <span className="text-[12px] font-semibold">Equipment</span>
          </button>
        </div>

        {!showEquipment && (
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

        {showEquipment && (
          <div className="grid grid-cols-3 gap-3">
            {equipmentGroups.map((item) => {
              const meta = EQUIPMENT_ICON_MAP[item.key] ?? { icon: Dumbbell, color: 'text-white/80' };
              return (
                <EquipmentTile
                  key={item.key}
                  icon={meta.icon}
                  label={item.label}
                  count={item.count}
                  active={false}
                  color={meta.color}
                  onClick={() => handleEquipmentClick(item.key)}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
