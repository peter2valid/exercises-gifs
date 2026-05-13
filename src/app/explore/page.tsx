'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Dumbbell, Search, X, Zap } from 'lucide-react';
import { LoadingPage } from '@/components/ui';
import { getAllExercises } from '@/lib/db/exerciseQueries';
import { seedExercises } from '@/lib/db/seed';
import { type Exercise } from '@/lib/db/schema';
import {
  BodyGroupKey,
  bodyGroups,
  EQUIPMENT_ICON_MAP,
  formatEquipmentLabel,
} from '@/lib/explore/constants';
import { CompactTile, MuscleTile, EquipmentTile } from '@/components/ExploreTiles';

const PENDING_GYM_KEY = 'gymapp:pendingGymJoin';

interface PendingGym {
  gymId: string;
  gymName: string;
  gymType?: string | null;
  timestamp: number;
}


export default function ExplorePage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [showEquipment, setShowEquipment] = useState(false);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingGym, setPendingGym] = useState<PendingGym | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);

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

  // Detect gym context from QR scan: ?gymId=X
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gymId = params.get('gymId');
    if (!gymId) {
      // Show existing pending gym if not yet dismissed
      try {
        const raw = localStorage.getItem(PENDING_GYM_KEY);
        if (raw) {
          const saved: PendingGym = JSON.parse(raw);
          if (Date.now() - saved.timestamp < 7 * 24 * 60 * 60 * 1000) {
            setPendingGym(saved);
          }
        }
      } catch {
        // ignore
      }
      return;
    }

    // Fetch gym details and store pending join
    fetch(`/api/public/gyms/${gymId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.gym) return;
        const pending: PendingGym = {
          gymId: data.gym.id,
          gymName: data.gym.name,
          gymType: data.gym.type ?? null,
          timestamp: Date.now(),
        };
        localStorage.setItem(PENDING_GYM_KEY, JSON.stringify(pending));
        setPendingGym(pending);
      })
      .catch(() => {});
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

        {/* Gym context banner — shown when arriving via gym QR code */}
        {pendingGym && !bannerDismissed && (
          <div className="mb-4 flex items-center gap-3 rounded-2xl px-4 py-3 animate-fade-in"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <Building2 size={16} className="text-white/60" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-white leading-tight truncate">{pendingGym.gymName}</p>
              <p className="text-[11px] text-white/35 mt-0.5">
                Sign up to join this gym
              </p>
            </div>
            <button
              onClick={() => router.push(`/auth?next=${encodeURIComponent(`/join?gymId=${pendingGym.gymId}`)}`)}
              className="shrink-0 rounded-xl bg-white px-3 py-1.5 text-[12px] font-bold text-black transition-all active:scale-[0.97]"
            >
              Join →
            </button>
            <button
              onClick={() => setBannerDismissed(true)}
              className="shrink-0 text-white/25 hover:text-white/50 transition-colors"
              aria-label="Dismiss"
            >
              <X size={15} />
            </button>
          </div>
        )}

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
