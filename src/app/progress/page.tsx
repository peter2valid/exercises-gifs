'use client';

import { BarChart3, TrendingUp, Calendar } from 'lucide-react';
import { useMemo } from 'react';
import { useWorkoutStore } from '@/store/workoutStore';

function fmtDate(iso?: string | null) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString();
  } catch {
    return '—';
  }
}

export default function ProgressPage() {
  const { session, sets } = useWorkoutStore((s) => ({ session: s.session, sets: s.sets }));

  const stats = useMemo(() => {
    const setList = Object.values(sets || {});
    const totalVolume = setList.reduce((acc, s) => acc + (s.weight || 0) * (s.reps || 0), 0);
    const totalSets = setList.length;
    const workouts = session ? 1 : 0; // local store only tracks current session
    const last = session?.finished_at || session?.started_at || null;
    const byExercise: Record<string, number> = {};
    setList.forEach((s) => { byExercise[s.exercise_id] = (byExercise[s.exercise_id] || 0) + 1; });
    const avgSets = Object.keys(byExercise).length ? Math.round((totalSets / Object.keys(byExercise).length) * 10) / 10 : 0;
    return { totalVolume, totalSets, workouts, last, avgSets };
  }, [sets, session]);

  return (
    <div className="dashboard-bg min-h-screen pb-24 pt-8">
      <div className="max-w-md mx-auto px-4">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <p className="text-xs tracking-[0.3em] text-white/30 uppercase font-medium mb-2">Progress</p>
          <h1 className="text-3xl font-bold text-white tracking-tight">Your Stats</h1>
        </div>

        {/* Main Metric */}
        <div className="glass-panel p-6 mb-6 animate-slide-up">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs text-white/40 tracking-[0.1em] uppercase mb-1">Total Volume</p>
              <p className="text-4xl font-bold text-white">{Math.round(stats.totalVolume)} kg</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center">
              <BarChart3 size={24} className="text-white/40" />
            </div>
          </div>
          <p className="text-xs text-white/30">Since you started</p>
        </div>

        {/* Stats Grid */}
        <div className="space-y-3 mb-8">
          <div className="glass-panel p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-white/40 tracking-[0.1em] uppercase">Workouts</p>
              <p className="text-2xl font-semibold text-white mt-1">{stats.workouts}</p>
            </div>
            <TrendingUp size={20} className="text-white/20" />
          </div>
          <div className="glass-panel p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-white/40 tracking-[0.1em] uppercase">Last Session</p>
              <p className="text-lg font-semibold text-white/40 mt-1">{fmtDate(stats.last)}</p>
            </div>
            <Calendar size={20} className="text-white/20" />
          </div>
          <div className="glass-panel p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-white/40 tracking-[0.1em] uppercase">Avg Sets</p>
              <p className="text-2xl font-semibold text-white mt-1">{stats.avgSets}</p>
            </div>
            <BarChart3 size={20} className="text-white/20" />
          </div>
        </div>

        {/* Coming Soon */}
        <div className="text-center py-8">
          <p className="text-white/30 text-sm">More detailed analytics coming soon</p>
        </div>
      </div>
    </div>
  );
}
