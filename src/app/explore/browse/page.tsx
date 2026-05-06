'use client';

import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState, useTransition } from 'react';
import { VariableSizeList as List } from 'react-window';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Bookmark,
  ChevronRight,
  ChevronLeft,
  Dumbbell,
  Grid2X2,
  LayoutGrid,
  List as ListIcon,
  Search,
  UserRound,
  CalendarRange,
} from 'lucide-react';
import { Input, Loading, LoadingPage } from '@/components/ui';
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
import { searchExercises } from '@/lib/search';
import { CompactTile, MuscleTile } from '@/components/ExploreTiles';

const LIST_ITEM_HEIGHT = 94;
const GRID_ROW_HEIGHT = 320;

function BrowsePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const muscleParam = searchParams.get('muscle');
  const queryParam = searchParams.get('q');
  const explicitBrowse = searchParams.has('muscle') || searchParams.has('q');

  const [search, setSearch] = useState(queryParam || '');
  const [debouncedSearch, setDebouncedSearch] = useState(queryParam || '');
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<ExploreTab>('exercises');
  const [mode, setMode] = useState<ExploreMode>('muscles');
  const [activeMuscle, setActiveMuscle] = useState<BodyGroupKey | null>(
    muscleParam && muscleParam !== 'all' ? (muscleParam as BodyGroupKey) : null
  );
  const [activeEquipment, setActiveEquipment] = useState<string | null>(null);
  const [view, setView] = useState<ExploreView>('grid');
  
  const listRef = useRef<any>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const muscleRailRef = useRef<HTMLDivElement>(null);
  
  const [windowHeight, setWindowHeight] = useState(800);
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
    setWindowHeight(window.innerHeight);
    const handleResize = () => setWindowHeight(window.innerHeight);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (activeMuscle && muscleRailRef.current) {
      const activeEl = muscleRailRef.current.querySelector(`[data-muscle-key="${activeMuscle}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [activeMuscle, loading]);

  useEffect(() => {
    const t = setTimeout(() => {
      startTransition(() => setDebouncedSearch(search));
    }, 150);
    return () => clearTimeout(t);
  }, [search]);

  // When filters or view change, we must clear the VariableSizeList cache
  useEffect(() => {
    if (listRef.current) {
      listRef.current.resetAfterIndex(0);
    }
  }, [activeMuscle, activeEquipment, mode, view, activeTab, loading, exercises]);

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
    const q = debouncedSearch.trim().toLowerCase();
    let results = q ? searchExercises(exercises, q) : exercises;

    if (activeMuscle) {
      const group = bodyGroups.find((item) => item.key === activeMuscle);
      if (group) results = results.filter((exercise) => group.match(exercise));
    }

    if (activeEquipment) {
      results = results.filter((exercise) => (exercise.equipment || '').toLowerCase() === activeEquipment);
    }

    return results;
  }, [activeEquipment, activeMuscle, exercises, debouncedSearch]);

  const activeMuscleLabel = activeMuscle ? bodyGroups.find((group) => group.key === activeMuscle)?.label : null;
  const activeEquipmentLabel = activeEquipment ? formatEquipmentLabel(activeEquipment) : null;
  const activeFilterLabel = activeMuscleLabel || activeEquipmentLabel || 'All exercises';

  const getItemSize = (index: number) => {
    if (index === 0) {
      // Header item size (estimate based on current filter state)
      let height = 300; // Base header
      if (activeTab === 'exercises') {
        height += 100; // Muscle rail
        if (mode === 'muscles' && !activeMuscle && !explicitBrowse) height += 250; // Grid
        if (mode === 'equipment' && !activeEquipment) height += 250; // Grid
        height += 100; // Results header
      }
      return height;
    }
    return view === 'grid' ? GRID_ROW_HEIGHT : LIST_ITEM_HEIGHT;
  };

  const Row = ({ index, style }: any) => {
    if (index === 0) {
      return (
        <div style={style} className="px-4 pt-5 pb-4">
          <div ref={headerRef}>
            <div className="mb-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => router.back()}
                className="text-white/75 hover:text-white transition-colors"
                aria-label="Go back"
              >
                <ChevronLeft size={22} />
              </button>
              <div className="text-center">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30">Viewora</p>
                <h1 className="text-xl font-bold text-white">Browse</h1>
              </div>
              <div className="flex items-center gap-3 text-white/75">
                <button type="button" aria-label="Search"><Search size={21} /></button>
                <button type="button" aria-label="Equipment filters"><Dumbbell size={21} /></button>
              </div>
            </div>

            <div className="sticky top-0 z-30 mb-6 rounded-[24px] border border-white/10 bg-black/60 backdrop-blur-xl px-4 py-3 text-white shadow-2xl">
              <div className="flex items-center gap-3 text-white/50">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="Search exercises..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-white/20"
                />
              </div>
            </div>

            <div className="mb-6 grid grid-cols-3 gap-2 rounded-2xl border border-white/5 bg-white/[0.02] p-1.5">
              {['programs', 'exercises', 'coaches'].map((tab) => {
                const Icon = tab === 'programs' ? CalendarRange : tab === 'exercises' ? Dumbbell : UserRound;
                const active = activeTab === tab;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab as ExploreTab)}
                    className={`flex items-center justify-center gap-2 rounded-xl py-2.5 transition-all ${
                      active ? 'bg-white text-black shadow-lg scale-[1.02]' : 'text-white/40 hover:text-white/60'
                    }`}
                  >
                    <Icon size={16} />
                    <span className="text-[11px] font-bold uppercase tracking-wider">{tab}</span>
                  </button>
                );
              })}
            </div>

            {activeTab === 'exercises' && (
              <>
                <div ref={muscleRailRef} className="mb-6 flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
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
                      <CompactTile group={group} active={activeMuscle === group.key} onClick={() => { setMode('muscles'); setActiveMuscle(group.key); setActiveEquipment(null); }} />
                    </div>
                  ))}
                </div>

                <div className="mb-6 flex items-center justify-between px-1">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/20 mb-1">Filtered by</p>
                    <h2 className="text-lg font-bold text-white tracking-tight">{activeFilterLabel}</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMode(mode === 'muscles' ? 'equipment' : 'muscles')}
                    className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white/70 hover:bg-white/10 transition-colors"
                  >
                    <Grid2X2 size={12} /> {mode === 'muscles' ? 'Gear' : 'Muscles'}
                  </button>
                </div>

                {mode === 'muscles' ? (
                  !activeMuscle && !explicitBrowse && (
                    <div className="mb-8 grid grid-cols-3 gap-3">
                      {bodyGroups.map((group) => (
                        <MuscleTile key={group.key} group={group} active={activeMuscle === group.key} count={muscleCounts.get(group.key) || 0} onClick={() => { setActiveMuscle(group.key); setActiveEquipment(null); }} />
                      ))}
                    </div>
                  )
                ) : (
                  !activeEquipment && (
                    <div className="mb-8 grid grid-cols-3 gap-3">
                      {equipmentGroups.map((item) => (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => { setActiveEquipment(item.key); setActiveMuscle(null); }}
                          className={`glass-panel flex flex-col items-center justify-center gap-2 px-2 py-5 text-center transition-all ${activeEquipment === item.key ? 'ring-2 ring-white/40 bg-white/10' : 'hover:bg-white/5'}`}
                        >
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-white/80"><Dumbbell size={22} /></div>
                          <div>
                            <p className="text-[11px] font-bold text-white uppercase tracking-tight">{item.label}</p>
                            <p className="text-[9px] font-medium text-white/30 uppercase">{item.count} items</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )
                )}

                <div className="mb-4 flex items-center justify-between px-1">
                  <h3 className={`text-[10px] font-bold uppercase tracking-[0.25em] text-white/30 transition-opacity duration-200 ${isPending ? 'opacity-50' : 'opacity-100'}`}>
                    Showing {filteredExercises.length} Results
                  </h3>
                  <div className="flex items-center gap-1.5 rounded-xl border border-white/5 bg-white/[0.02] p-1">
                    <button onClick={() => setView('list')} className={`rounded-lg p-1.5 transition-all ${view === 'list' ? 'bg-white text-black' : 'text-white/30 hover:text-white/50'}`} aria-label="List view"><ListIcon size={14} /></button>
                    <button onClick={() => setView('grid')} className={`rounded-lg p-1.5 transition-all ${view === 'grid' ? 'bg-white text-black' : 'text-white/30 hover:text-white/50'}`} aria-label="Grid view"><LayoutGrid size={14} /></button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      );
    }

    // Exercise rows
    const dataIndex = index - 1;
    if (view === 'grid') {
      const a = filteredExercises[dataIndex * 2];
      const b = filteredExercises[dataIndex * 2 + 1];
      return (
        <div style={style} className="flex gap-3 px-4 pb-3">
          <div className="flex-1 min-w-0">
            {a && <ExerciseCard index={dataIndex * 2} exercise={a} view="grid" muscleLabel={formatBodyPartLabel(a.body_part || 'other')} detailLabel={`${formatBodyPartLabel(a.body_part || 'other')} • ${formatEquipmentLabel(a.equipment || 'other')}`} />}
          </div>
          <div className="flex-1 min-w-0">
            {b && <ExerciseCard index={dataIndex * 2 + 1} exercise={b} view="grid" muscleLabel={formatBodyPartLabel(b.body_part || 'other')} detailLabel={`${formatBodyPartLabel(b.body_part || 'other')} • ${formatEquipmentLabel(b.equipment || 'other')}`} />}
          </div>
        </div>
      );
    }

    const ex = filteredExercises[dataIndex];
    if (!ex) return null;
    return (
      <div style={style} className="px-4 pb-3">
        <ExerciseCard
          index={dataIndex}
          exercise={ex}
          view="list"
          muscleLabel={formatBodyPartLabel(ex.body_part || 'other')}
          detailLabel={`${formatBodyPartLabel(ex.body_part || 'other')} • ${formatEquipmentLabel(ex.equipment || 'other')}`}
        />
      </div>
    );
  };

  if (loading) return <LoadingPage />;

  const itemCount = 1 + (view === 'grid' ? Math.ceil(filteredExercises.length / 2) : filteredExercises.length);

  return (
    <div className="dashboard-bg min-h-screen">
      <List
        ref={listRef}
        height={windowHeight}
        itemCount={itemCount}
        itemSize={getItemSize}
        width="100%"
        className="scrollbar-hide"
      >
        {Row}
      </List>
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
