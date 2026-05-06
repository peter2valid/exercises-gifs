'use client';

import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState, useTransition } from 'react';
import { FixedSizeList } from 'react-window';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Bookmark,
  ChevronRight,
  ChevronLeft,
  Dumbbell,
  Grid2X2,
  LayoutGrid,
  List,
  Search,
  UserRound,
  CalendarRange,
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
import { searchExercises } from '@/lib/search';
import { CompactTile, MuscleTile } from '@/components/ExploreTiles';

const LIST_ITEM_HEIGHT = 94;  // glass-panel p-3 + h-14 + border + 12px gap
const GRID_ROW_HEIGHT = 320;  // aspect-[4/5] card + footer + 12px gap

interface VirtualData { exercises: Exercise[] }

function ListItem({ index, style, data }: { index: number; style: React.CSSProperties; data: VirtualData }) {
  const ex = data.exercises[index];
  if (!ex) return null;
  return (
    <div style={{ ...style, paddingBottom: 12 }}>
      <ExerciseCard
        index={index}
        exercise={ex}
        view="list"
        muscleLabel={formatBodyPartLabel(ex.body_part || 'other')}
        detailLabel={`${formatBodyPartLabel(ex.body_part || 'other')} • ${formatEquipmentLabel(ex.equipment || 'other')}`}
      />
    </div>
  );
}

function GridRow({ index, style, data }: { index: number; style: React.CSSProperties; data: VirtualData }) {
  const a = data.exercises[index * 2];
  const b = data.exercises[index * 2 + 1];
  return (
    <div style={{ ...style, display: 'flex', gap: 12, paddingBottom: 12 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        {a && <ExerciseCard index={index * 2} exercise={a} view="grid" muscleLabel={formatBodyPartLabel(a.body_part || 'other')} detailLabel={`${formatBodyPartLabel(a.body_part || 'other')} • ${formatEquipmentLabel(a.equipment || 'other')}`} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {b && <ExerciseCard index={index * 2 + 1} exercise={b} view="grid" muscleLabel={formatBodyPartLabel(b.body_part || 'other')} detailLabel={`${formatBodyPartLabel(b.body_part || 'other')} • ${formatEquipmentLabel(b.equipment || 'other')}`} />}
      </div>
    </div>
  );
}

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
  const listContainerRef = useRef<HTMLDivElement>(null);
  const [listHeight, setListHeight] = useState(500);
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

  useLayoutEffect(() => {
    if (!listContainerRef.current) return;
    const rect = listContainerRef.current.getBoundingClientRect();
    setListHeight(Math.max(300, window.innerHeight - rect.top - 96));
  }, [activeMuscle, activeEquipment, mode, explicitBrowse, activeTab]);

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

  const itemData = useMemo(() => ({ exercises: filteredExercises }), [filteredExercises]);

  const activeMuscleLabel = activeMuscle ? bodyGroups.find((group) => group.key === activeMuscle)?.label : null;
  const activeEquipmentLabel = activeEquipment ? formatEquipmentLabel(activeEquipment) : null;
  const activeFilterLabel = activeMuscleLabel || activeEquipmentLabel || 'All exercises';

  return (
    <div className="dashboard-bg min-h-screen pb-24 pt-5">
      <div className="mx-auto max-w-md px-4">
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-white/75 hover:text-white transition-colors"
            aria-label="Go back"
          >
            <ChevronLeft size={22} />
          </button>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-white/35">Browse</p>
            <h1 className="text-2xl font-semibold text-white">Exercises</h1>
          </div>
          <div className="flex items-center gap-3 text-white/75">
            <button type="button" aria-label="Search">
              <Search size={21} />
            </button>
            <button type="button" aria-label="Equipment filters">
              <Dumbbell size={21} />
            </button>
          </div>
        </div>

        <div className="mb-4 rounded-[30px] border border-white/10 bg-white px-4 py-3 text-black shadow-[0_18px_45px_rgba(0,0,0,0.16)]">
          <div className="flex items-center gap-3 text-black/70">
            <Search size={18} />
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
          <>
            <div className="mb-6 flex items-center gap-3 overflow-x-auto pb-1 scrollbar-hide">
              <button
                type="button"
                onClick={() => {
                  setActiveMuscle(null);
                  setActiveEquipment(null);
                }}
                className={`flex w-20 shrink-0 flex-col items-center gap-2 rounded-2xl border px-2 py-2 transition-all ${
                  !activeMuscle && !activeEquipment ? 'border-white/25 bg-white/10' : 'border-white/5 bg-white/[0.03]'
                }`}
              >
                <div className="flex h-12 w-full items-center justify-center rounded-xl bg-black/20 text-xs font-semibold text-white/80">
                  All
                </div>
                <span className="text-[11px] font-medium text-white/80">Filters</span>
              </button>

              {bodyGroups.map((group) => (
                <CompactTile
                  key={group.key}
                  group={group}
                  active={activeMuscle === group.key}
                  onClick={() => {
                    setMode('muscles');
                    setActiveMuscle(group.key);
                    setActiveEquipment(null);
                  }}
                />
              ))}
            </div>

            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/30">Selected</p>
                <h2 className="text-lg font-semibold text-white">{activeFilterLabel}</h2>
              </div>
              <button
                type="button"
                onClick={() => setMode(mode === 'muscles' ? 'equipment' : 'muscles')}
                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-white/80"
              >
                <Grid2X2 size={14} />
                {mode === 'muscles' ? 'Muscles' : 'Equipment'}
                <ChevronRight size={14} />
              </button>
            </div>

            {mode === 'muscles' ? (
              <>
                {/* When a muscle is selected we hide the large "Browse categories" grid
                    to avoid repeating icons. The compact rail above remains visible and
                    filtered exercises will appear below. */}
                {!activeMuscle && !explicitBrowse && (
                  <>
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/30">By muscle</p>
                        <h3 className="text-xl font-semibold text-white">Browse categories</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveMuscle(null)}
                        className="rounded-full border border-white/10 px-3 py-2 text-xs font-medium text-white/70"
                      >
                        Clear
                      </button>
                    </div>

                    <div className="mb-8 grid grid-cols-3 gap-3">
                      {bodyGroups.map((group) => (
                        <MuscleTile
                          key={group.key}
                          group={group}
                          active={activeMuscle === group.key}
                          count={muscleCounts.get(group.key) || 0}
                          onClick={() => {
                            setActiveMuscle(group.key);
                            setActiveEquipment(null);
                          }}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/30">By equipment</p>
                    <h3 className="text-xl font-semibold text-white">Gear filters</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveEquipment(null)}
                    className="rounded-full border border-white/10 px-3 py-2 text-xs font-medium text-white/70"
                  >
                    Clear
                  </button>
                </div>

                <div className="mb-8 grid grid-cols-3 gap-3">
                  {equipmentGroups.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => {
                        setActiveEquipment(item.key);
                        setActiveMuscle(null);
                      }}
                      className={`glass-panel flex flex-col items-center justify-center gap-2 px-2 py-5 text-center transition-all ${
                        activeEquipment === item.key ? 'ring-1 ring-white/30' : ''
                      }`}
                    >
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 text-white/80">
                        <Dumbbell size={24} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{item.label}</p>
                        <p className="text-[11px] text-white/35">{item.count} exercises</p>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}

            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/30">All exercises</p>
                <h3 className={`text-xl font-semibold text-white transition-opacity duration-200 ${isPending ? 'opacity-50' : 'opacity-100'}`}>
                  {filteredExercises.length} results
                </h3>
              </div>
              <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1">
                <button
                  type="button"
                  onClick={() => setView('list')}
                  className={`rounded-full p-2 transition-all ${view === 'list' ? 'bg-white text-black' : 'text-white/60'}`}
                  aria-label="List view"
                >
                  <List size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => setView('grid')}
                  className={`rounded-full p-2 transition-all ${view === 'grid' ? 'bg-white text-black' : 'text-white/60'}`}
                  aria-label="Grid view"
                >
                  <LayoutGrid size={15} />
                </button>
              </div>
            </div>

            <div ref={listContainerRef} className="min-h-[300px]">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-8 h-8 border-2 border-white/10 border-t-white/80 rounded-full animate-spin" />
                </div>
              ) : filteredExercises.length === 0 ? (
                <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-6 py-12 text-center text-sm text-white/40">
                  No exercises found.
                </div>
              ) : (
                <FixedSizeList
                  height={listHeight}
                  itemCount={view === 'grid' ? Math.ceil(filteredExercises.length / 2) : filteredExercises.length}
                  itemSize={view === 'grid' ? GRID_ROW_HEIGHT : LIST_ITEM_HEIGHT}
                  width="100%"
                  itemData={itemData}
                  className="scrollbar-hide"
                >
                  {view === 'grid' ? GridRow : ListItem}
                </FixedSizeList>
              )}
            </div>
          </>
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

export default function BrowsePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <BrowsePageContent />
    </Suspense>
  );
}
