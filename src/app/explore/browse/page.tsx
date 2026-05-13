'use client';

import { Suspense, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { FixedSizeList as List } from 'react-window';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  ChevronLeft,
  Dumbbell,
  Grid2X2,
  LayoutGrid,
  List as ListIcon,
  Search,
  X,
} from 'lucide-react';
import { LoadingPage } from '@/components/ui';
import ExerciseCard from '@/components/ExerciseCard';
import { getAllExercises } from '@/lib/db/exerciseQueries';
import { seedExercises } from '@/lib/db/seed';
import { type Exercise } from '@/lib/db/schema';
import {
  ExploreView,
  ExploreMode,
  BodyGroupKey,
  bodyGroups,
  EQUIPMENT_ICON_MAP,
  formatEquipmentLabel,
  formatBodyPartLabel,
} from '@/lib/explore/constants';
import { searchExercises } from '@/lib/search';
import { CompactTile, MuscleTile, EquipmentTile } from '@/components/ExploreTiles';


const LIST_ITEM_HEIGHT = 94;
const GRID_ROW_HEIGHT = 310;

function BrowsePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const muscleParam = searchParams.get('muscle');
  const queryParam = searchParams.get('q');
  const modeParam = searchParams.get('mode');
  const equipmentParam = searchParams.get('equipment');
  const explicitBrowse = searchParams.has('muscle') || searchParams.has('q');

  const [search, setSearch] = useState(queryParam || '');
  const deferredSearch = useDeferredValue(search);
  const [mode, setMode] = useState<ExploreMode>(modeParam === 'equipment' ? 'equipment' : 'muscles');
  const [activeMuscle, setActiveMuscle] = useState<BodyGroupKey | null>(
    muscleParam && muscleParam !== 'all' ? (muscleParam as BodyGroupKey) : null
  );
  const [activeEquipment, setActiveEquipment] = useState<string | null>(equipmentParam || null);
  const [view, setView] = useState<ExploreView>('grid');

  const muscleRailRef = useRef<HTMLDivElement>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);
  const [listHeight, setListHeight] = useState(400);

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

  // Use ResizeObserver on the list container for stable height (handles keyboard open/close)
  useEffect(() => {
    const el = listContainerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        // Subtract BottomNav height (~72px) so the list doesn't scroll under the fixed nav
        setListHeight(Math.max(200, entry.contentRect.height - 72));
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (activeMuscle && muscleRailRef.current) {
      const activeEl = muscleRailRef.current.querySelector(`[data-muscle-key="${activeMuscle}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [activeMuscle, loading]);

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
    const q = deferredSearch.trim().toLowerCase();
    let results = q ? searchExercises(exercises, q) : exercises;

    if (activeMuscle) {
      const group = bodyGroups.find((item) => item.key === activeMuscle);
      if (group) results = results.filter((exercise) => group.match(exercise));
    }

    if (activeEquipment) {
      results = results.filter((exercise) => (exercise.equipment || '').toLowerCase() === activeEquipment);
    }

    return results;
  }, [activeEquipment, activeMuscle, deferredSearch, exercises]);

  const activeMuscleLabel = activeMuscle ? bodyGroups.find((g) => g.key === activeMuscle)?.label : null;
  const activeEquipmentLabel = activeEquipment ? formatEquipmentLabel(activeEquipment) : null;
  const activeFilterLabel = activeMuscleLabel || activeEquipmentLabel || 'All exercises';

  const resultLabel = useMemo(() => {
    const count = filteredExercises.length;
    const q = deferredSearch.trim();
    if (q) return `${count} result${count !== 1 ? 's' : ''} for "${q}"`;
    if (activeMuscle) {
      const group = bodyGroups.find((g) => g.key === activeMuscle);
      return `${count} ${group?.label ?? activeMuscle} Exercise${count !== 1 ? 's' : ''}`;
    }
    if (activeEquipment) return `${count} ${formatEquipmentLabel(activeEquipment)} Exercise${count !== 1 ? 's' : ''}`;
    return `${count} Exercise${count !== 1 ? 's' : ''}`;
  }, [filteredExercises.length, deferredSearch, activeMuscle, activeEquipment]);

  const showMuscleGrid = mode === 'muscles' && !activeMuscle && !explicitBrowse && !deferredSearch.trim();
  const showEquipGrid = mode === 'equipment' && !activeEquipment;
  const showExerciseList = !showMuscleGrid && !showEquipGrid;

  const getItemSize = () => view === 'grid' ? GRID_ROW_HEIGHT : LIST_ITEM_HEIGHT;
  const itemCount = view === 'grid' ? Math.ceil(filteredExercises.length / 2) : filteredExercises.length;

  const Row = ({ index, style }: any) => {
    if (view === 'grid') {
      const a = filteredExercises[index * 2];
      const b = filteredExercises[index * 2 + 1];
      return (
        <div style={style}>
          <div className="mx-auto max-w-md flex gap-3 px-4 pb-3">
            <div className="flex-1 min-w-0">
              {a && <ExerciseCard index={index * 2} exercise={a} view="grid" muscleLabel={formatBodyPartLabel(a.body_part || 'other')} detailLabel={`${formatBodyPartLabel(a.body_part || 'other')} • ${formatEquipmentLabel(a.equipment || 'other')}`} />}
            </div>
            <div className="flex-1 min-w-0">
              {b && <ExerciseCard index={index * 2 + 1} exercise={b} view="grid" muscleLabel={formatBodyPartLabel(b.body_part || 'other')} detailLabel={`${formatBodyPartLabel(b.body_part || 'other')} • ${formatEquipmentLabel(b.equipment || 'other')}`} />}
            </div>
          </div>
        </div>
      );
    }

    const ex = filteredExercises[index];
    if (!ex) return null;
    return (
      <div style={style}>
        <div className="mx-auto max-w-md px-4 pb-3">
          <ExerciseCard
            index={index}
            exercise={ex}
            view="list"
            muscleLabel={formatBodyPartLabel(ex.body_part || 'other')}
            detailLabel={`${formatBodyPartLabel(ex.body_part || 'other')} • ${formatEquipmentLabel(ex.equipment || 'other')}`}
          />
        </div>
      </div>
    );
  };

  if (loading) return <LoadingPage />;

  return (
    <div className="dashboard-bg flex flex-col" style={{ height: '100dvh' }}>
      {/* ─── HEADER — always outside the VirtualList so search never loses focus ─── */}
      <div className="flex-none">
        <div className="max-w-md mx-auto px-4 pt-5 pb-3">
          {/* Top bar */}
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => router.back()}
              className="text-white/75 hover:text-white transition-colors active:scale-90"
              aria-label="Go back"
            >
              <ChevronLeft size={22} />
            </button>
            <div className="text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30">Explore</p>
              <h1 className="text-xl font-bold text-white">Browse</h1>
            </div>
            <div className="w-[22px]" />
          </div>

          {/* Search input — stable outside virtual list */}
          <div className="mb-4 rounded-[24px] border border-white/10 bg-black/60 backdrop-blur-xl px-4 py-3 text-white shadow-2xl">
            <div className="flex items-center gap-3 text-white/50">
              <Search size={18} className="shrink-0" />
              <input
                type="search"
                inputMode="search"
                enterKeyHint="search"
                placeholder="Search exercises..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-white/20"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="shrink-0 text-white/30 hover:text-white/60 transition-colors"
                  aria-label="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          <>
              {/* Muscle rail */}
              <div ref={muscleRailRef} className="mb-4 flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
                <button
                  type="button"
                  onClick={() => { setActiveMuscle(null); setActiveEquipment(null); }}
                  className={`flex h-[76px] w-20 shrink-0 flex-col items-center justify-center gap-2 rounded-2xl border transition-all ${
                    !activeMuscle && !activeEquipment ? 'border-white/30 bg-white/10 shadow-lg' : 'border-white/5 bg-white/[0.02]'
                  }`}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-[10px] font-black text-white/80 uppercase">All</div>
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-tighter">Library</span>
                </button>
                {bodyGroups.map((group) => (
                  <div key={group.key} data-muscle-key={group.key}>
                    <CompactTile
                      group={group}
                      active={activeMuscle === group.key}
                      onClick={() => { setMode('muscles'); setActiveMuscle(group.key); setActiveEquipment(null); }}
                    />
                  </div>
                ))}
              </div>

              {/* Filter label + gear toggle + results count + view toggle */}
              <div className="mb-3 flex items-center justify-between px-1">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/20 mb-0.5">Filtered by</p>
                  <h2 className="text-base font-bold text-white tracking-tight">{activeFilterLabel}</h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setMode(mode === 'muscles' ? 'equipment' : 'muscles')}
                    className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white/60 active:scale-95 transition-all"
                  >
                    <Grid2X2 size={11} /> {mode === 'muscles' ? 'Gear' : 'Muscles'}
                  </button>
                  <div className="flex items-center gap-1 rounded-xl border border-white/5 bg-white/[0.02] p-1">
                    <button onClick={() => setView('list')} className={`rounded-lg p-1.5 transition-all ${view === 'list' ? 'bg-white text-black' : 'text-white/30'}`} aria-label="List view"><ListIcon size={13} /></button>
                    <button onClick={() => setView('grid')} className={`rounded-lg p-1.5 transition-all ${view === 'grid' ? 'bg-white text-black' : 'text-white/30'}`} aria-label="Grid view"><LayoutGrid size={13} /></button>
                  </div>
                </div>
              </div>
          </>
        </div>
      </div>

      {/* ─── MUSCLE / EQUIPMENT GRID — scrollable section above virtual list ─── */}
      {(showMuscleGrid || showEquipGrid) && (
        <div className="flex-none overflow-y-auto" style={{ maxHeight: '45dvh' }}>
          <div className="max-w-md mx-auto px-4 pb-4">
            {showMuscleGrid && (
              <div className="grid grid-cols-3 gap-3">
                {bodyGroups.map((group) => (
                  <MuscleTile
                    key={group.key}
                    group={group}
                    active={activeMuscle === group.key}
                    count={muscleCounts.get(group.key) || 0}
                    onClick={() => { setActiveMuscle(group.key); setActiveEquipment(null); }}
                  />
                ))}
              </div>
            )}
            {showEquipGrid && (
              <div className="grid grid-cols-3 gap-3">
                {equipmentGroups.map((item) => {
                  const meta = EQUIPMENT_ICON_MAP[item.key] ?? { icon: Dumbbell, color: 'text-white/80' };
                  return (
                    <EquipmentTile
                      key={item.key}
                      icon={meta.icon}
                      label={item.label}
                      count={item.count}
                      active={activeEquipment === item.key}
                      color={meta.color}
                      onClick={() => { setActiveEquipment(item.key); setActiveMuscle(null); }}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Results count when exercises are shown */}
      {showExerciseList && (
        <div className="flex-none px-5 pb-2 max-w-md mx-auto w-full">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/25">
            {resultLabel}
          </p>
        </div>
      )}

      {showEquipGrid && (
        <div className="flex-none px-5 pb-3 max-w-md mx-auto w-full">
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-center text-[11px] font-medium uppercase tracking-[0.2em] text-white/35">
            Pick equipment to reveal exercises
          </div>
        </div>
      )}

      {/* ─── VIRTUAL LIST — only exercise rows, search is above so focus is stable ─── */}
      {showExerciseList ? (
        <div ref={listContainerRef} className="flex-1 min-h-0">
          {filteredExercises.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 px-8 text-center">
              <p className="text-sm font-semibold text-white/40">
                {deferredSearch.trim() ? `No results for "${deferredSearch.trim()}"` : 'No exercises found'}
              </p>
              {deferredSearch.trim() && (
                <p className="text-xs text-white/20">Try a different search term</p>
              )}
            </div>
          ) : (
            <List
              height={listHeight}
              itemCount={itemCount}
              itemSize={getItemSize()}
              width="100%"
              className="scrollbar-hide"
            >
              {Row}
            </List>
          )}
        </div>
      ) : (
        <div className="flex-1 min-h-0" />
      )}
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
