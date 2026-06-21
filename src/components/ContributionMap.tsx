'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { WorkoutSession } from '@/lib/db/schema';

type View = 'annual' | 'monthly' | 'weekly';

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Local-timezone YYYY-MM-DD key
function dateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function todayKey(): string {
  return dateKey(new Date());
}

function buildDayMap(sessions: WorkoutSession[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const s of sessions) {
    const k = dateKey(new Date(s.started_at));
    map.set(k, (map.get(k) || 0) + 1);
  }
  return map;
}

// Emerald intensity scale
function cellClass(count: number): string {
  if (count === 0) return 'bg-white/[0.06]';
  if (count === 1) return 'bg-emerald-600/50';
  if (count === 2) return 'bg-emerald-500/75';
  return 'bg-emerald-400';
}

// ─── Annual view ─────────────────────────────────────────────────────────────

function AnnualView({ dayMap }: { dayMap: Map<string, number> }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Build 53 week columns starting from the Sunday 52 weeks ago
  const weeks = useMemo(() => {
    const cursor = new Date(today);
    cursor.setDate(cursor.getDate() - 364);
    cursor.setDate(cursor.getDate() - cursor.getDay()); // rewind to Sunday

    const cols: Date[][] = [];
    while (cursor <= today) {
      const week: Date[] = [];
      for (let d = 0; d < 7; d++) {
        week.push(new Date(cursor));
        cursor.setDate(cursor.getDate() + 1);
      }
      cols.push(week);
    }
    return cols;
  }, [today]);

  // Month label positions: first week where the Sunday flips to a new month
  const monthMarkers = useMemo(() => {
    const markers: { col: number; label: string }[] = [];
    for (let i = 0; i < weeks.length; i++) {
      const sun = weeks[i][0];
      if (i === 0 || sun.getMonth() !== weeks[i - 1][0].getMonth()) {
        markers.push({ col: i, label: MONTH_LABELS[sun.getMonth()] });
      }
    }
    return markers;
  }, [weeks]);

  // Auto-scroll to the right (most recent dates)
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, []);

  const yearTotal = useMemo(() =>
    [...dayMap.values()].reduce((a, b) => a + b, 0),
    [dayMap]
  );
  const activeDays = dayMap.size;

  const CELL = 11;   // px
  const GAP  = 2;    // px
  const STEP = CELL + GAP;

  return (
    <div>
      <p className="text-[11px] text-white/35 mb-3">
        <span className="text-white font-semibold">{yearTotal}</span> workout{yearTotal !== 1 ? 's' : ''} &middot; <span className="text-white font-semibold">{activeDays}</span> active day{activeDays !== 1 ? 's' : ''} in the past year
      </p>

      <div ref={scrollRef} className="overflow-x-auto scrollbar-hide pb-1">
        <div className="inline-block" style={{ paddingLeft: 18 }}>
          {/* Month labels row */}
          <div className="flex mb-1" style={{ marginLeft: -1 }}>
            {weeks.map((_, i) => {
              const marker = monthMarkers.find(m => m.col === i);
              return (
                <div key={i} style={{ width: STEP, flexShrink: 0 }}
                  className="text-[8.5px] font-semibold text-white/30 leading-none">
                  {marker?.label ?? ''}
                </div>
              );
            })}
          </div>

          <div className="flex">
            {/* Day-of-week labels */}
            <div className="flex flex-col mr-1" style={{ gap: GAP }}>
              {DAY_LABELS.map((d, i) => (
                <div key={i}
                  style={{ width: 14, height: CELL }}
                  className="text-[8px] font-medium text-white/25 flex items-center justify-end pr-1">
                  {i % 2 === 1 ? d : ''}
                </div>
              ))}
            </div>

            {/* Week columns */}
            <div className="flex" style={{ gap: GAP }}>
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col" style={{ gap: GAP }}>
                  {week.map((day, di) => {
                    const k = dateKey(day);
                    const count = dayMap.get(k) || 0;
                    const future = day > today;
                    const isToday = k === todayKey();
                    return (
                      <div
                        key={di}
                        title={future ? '' : `${k}: ${count} workout${count !== 1 ? 's' : ''}`}
                        style={{ width: CELL, height: CELL, borderRadius: 2, flexShrink: 0 }}
                        className={
                          future ? 'bg-transparent' :
                          isToday ? `${cellClass(count)} ring-1 ring-white/40` :
                          cellClass(count)
                        }
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-1.5 mt-2">
        <span className="text-[9px] text-white/25">Less</span>
        {[0, 1, 2, 3].map(n => (
          <div key={n}
            style={{ width: 10, height: 10, borderRadius: 2 }}
            className={cellClass(n)} />
        ))}
        <span className="text-[9px] text-white/25">More</span>
      </div>
    </div>
  );
}

// ─── Monthly view ─────────────────────────────────────────────────────────────

function MonthlyView({ dayMap }: { dayMap: Map<string, number> }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();

  const goPrev = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };
  const goNext = () => {
    if (isCurrentMonth) return;
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };

  const days: (Date | null)[] = useMemo(() => {
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const pad: (Date | null)[] = Array(first.getDay()).fill(null);
    const cells = pad.concat(
      Array.from({ length: last.getDate() }, (_, i) => new Date(year, month, i + 1))
    );
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [year, month]);

  const monthTotal = useMemo(() =>
    days.reduce((acc, d) => acc + (d ? (dayMap.get(dateKey(d)) || 0) : 0), 0),
    [days, dayMap]
  );

  const tk = todayKey();

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <button onClick={goPrev}
          className="w-8 h-8 flex items-center justify-center rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition-all text-lg font-bold">
          ‹
        </button>
        <div className="text-center">
          <p className="text-sm font-bold text-white">{MONTH_LABELS[month]} {year}</p>
          <p className="text-[10px] text-white/30 mt-0.5">{monthTotal} workout{monthTotal !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={goNext}
          className={`w-8 h-8 flex items-center justify-center rounded-xl text-lg font-bold transition-all ${
            isCurrentMonth ? 'text-white/10 cursor-default' : 'text-white/40 hover:text-white hover:bg-white/5'
          }`}>
          ›
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-2 mt-3">
        {DAY_LABELS.map((d, i) => (
          <div key={i} className="text-center text-[10px] font-bold text-white/25">{d}</div>
        ))}
      </div>

      {/* Calendar cells */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          if (!day) return <div key={i} />;
          const k = dateKey(day);
          const count = dayMap.get(k) || 0;
          const isToday = k === tk;
          return (
            <div key={i}
              className={`relative aspect-square rounded-lg flex items-center justify-center ${
                count > 0 ? cellClass(count) : 'bg-white/[0.04]'
              } ${isToday ? 'ring-1 ring-white/40' : ''}`}>
              <span className={`text-[11px] font-semibold leading-none ${count > 0 ? 'text-white' : 'text-white/25'}`}>
                {day.getDate()}
              </span>
              {count > 1 && (
                <span className="absolute bottom-0.5 right-1 text-[7px] font-black text-white/60 leading-none">{count}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Weekly view ──────────────────────────────────────────────────────────────

function WeeklyView({ dayMap }: { dayMap: Map<string, number> }) {
  const [offset, setOffset] = useState(0); // 0=current week, -1=last week, …

  const weekDays = useMemo(() => {
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    // Start of week (Sunday) + offset
    const sun = new Date(base);
    sun.setDate(base.getDate() - base.getDay() + offset * 7);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(sun);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [offset]);

  const weekLabel = useMemo(() => {
    if (offset === 0) return 'This Week';
    if (offset === -1) return 'Last Week';
    const start = weekDays[0];
    const end = weekDays[6];
    const sm = MONTH_LABELS[start.getMonth()];
    const em = MONTH_LABELS[end.getMonth()];
    if (sm === em) return `${sm} ${start.getDate()}–${end.getDate()}`;
    return `${sm} ${start.getDate()} – ${em} ${end.getDate()}`;
  }, [offset, weekDays]);

  const counts = useMemo(() => weekDays.map(d => dayMap.get(dateKey(d)) || 0), [weekDays, dayMap]);
  const weekTotal = counts.reduce((a, b) => a + b, 0);
  const maxCount = Math.max(...counts, 1);
  const tk = todayKey();

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setOffset(o => o - 1)}
          className="w-8 h-8 flex items-center justify-center rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition-all text-lg font-bold">
          ‹
        </button>
        <div className="text-center">
          <p className="text-sm font-bold text-white">{weekLabel}</p>
          <p className="text-[10px] text-white/30 mt-0.5">{weekTotal} workout{weekTotal !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setOffset(o => Math.min(0, o + 1))}
          className={`w-8 h-8 flex items-center justify-center rounded-xl text-lg font-bold transition-all ${
            offset < 0 ? 'text-white/40 hover:text-white hover:bg-white/5' : 'text-white/10 cursor-default'
          }`}>
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {weekDays.map((day, i) => {
          const count = counts[i];
          const isToday = dateKey(day) === tk;
          const barPct = count > 0 ? Math.max(15, Math.round((count / maxCount) * 100)) : 0;

          return (
            <div key={i} className="flex flex-col items-center gap-1.5">
              {/* Bar */}
              <div className="w-full flex flex-col items-center justify-end rounded-xl bg-white/[0.04] overflow-hidden"
                style={{ height: 88 }}>
                {count > 0 && (
                  <div
                    className={`w-full transition-all duration-300 ${cellClass(count)}`}
                    style={{ height: `${barPct}%` }}
                  />
                )}
              </div>
              {/* Count badge */}
              <span className={`text-[10px] font-bold leading-none ${count > 0 ? 'text-white' : 'text-white/15'}`}>
                {count > 0 ? count : '·'}
              </span>
              {/* Day label */}
              <div className="text-center leading-none">
                <p className={`text-[9px] font-bold uppercase tracking-wide ${isToday ? 'text-emerald-400' : 'text-white/30'}`}>
                  {DAY_LABELS[day.getDay()]}
                </p>
                <p className={`text-[8px] mt-0.5 ${isToday ? 'text-white/50' : 'text-white/15'}`}>
                  {day.getDate()}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

const VIEWS: { id: View; label: string }[] = [
  { id: 'monthly', label: '1M' },
  { id: 'weekly',  label: '1W' },
  { id: 'annual',  label: '1Y' },
];

export function ContributionMap({ sessions }: { sessions: WorkoutSession[] }) {
  const [view, setView] = useState<View>('monthly');
  const dayMap = useMemo(() => buildDayMap(sessions), [sessions]);

  return (
    <div className="glass-panel p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/35">Activity</p>
        <div className="flex items-center gap-0.5 rounded-xl border border-white/8 bg-white/[0.03] p-0.5">
          {VIEWS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setView(id)}
              className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                view === id
                  ? 'bg-white text-black shadow'
                  : 'text-white/30 hover:text-white/60'
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {view === 'annual'  && <AnnualView  dayMap={dayMap} />}
      {view === 'monthly' && <MonthlyView dayMap={dayMap} />}
      {view === 'weekly'  && <WeeklyView  dayMap={dayMap} />}
    </div>
  );
}
