'use client';

import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Calendar, Dumbbell, Flame } from 'lucide-react';
import { db } from '@/lib/db/dexie';
import { getAllExercises } from '@/lib/db/exerciseQueries';
import { usesVolumeExercise } from '@/lib/workout/exerciseClassification';

function fmtDate(iso?: string | null) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '—';
  }
}

interface ProgressStats {
  totalVolume: number;
  totalSessions: number;
  totalSets: number;
  lastSessionDate: string | null;
  avgSetsPerSession: number;
  thisWeekSessions: number;
}

const EMPTY: ProgressStats = {
  totalVolume: 0,
  totalSessions: 0,
  totalSets: 0,
  lastSessionDate: null,
  avgSetsPerSession: 0,
  thisWeekSessions: 0,
};

export default function ProgressPage() {
  const [stats, setStats] = useState<ProgressStats>(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        weekStart.setHours(0, 0, 0, 0);
        const weekStartIso = weekStart.toISOString();

        const [sessions, allSets, exercises] = await Promise.all([
          db.workout_sessions.where('status').equals('completed').toArray(),
          db.set_logs.toArray(),
          getAllExercises(),
        ]);

        const exerciseMap = Object.fromEntries(exercises.map((exercise) => [exercise.id, exercise]));
        const totalSessions = sessions.length;
        const thisWeekSessions = sessions.filter((session) => session.started_at >= weekStartIso).length;
        const sorted = [...sessions].sort((a, b) => b.started_at.localeCompare(a.started_at));
        const lastSessionDate = sorted[0]?.started_at ?? null;
        const strengthSets = allSets.filter((set) => usesVolumeExercise(exerciseMap[set.exercise_id]));
        const totalVolume = strengthSets.reduce((acc, set) => acc + set.weight * set.reps, 0);
        const totalSets = allSets.length;

        const avgSetsPerSession = totalSessions > 0
          ? Math.round((totalSets / totalSessions) * 10) / 10
          : 0;

        setStats({
          totalVolume: Math.round(totalVolume),
          totalSessions,
          totalSets,
          lastSessionDate,
          avgSetsPerSession,
          thisWeekSessions,
        });
      } catch {
        setStats(EMPTY);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="dashboard-bg min-h-screen pb-24 pt-8">
      <div className="max-w-md mx-auto px-4">
        <div className="mb-8 animate-fade-in">
          <p className="text-xs tracking-[0.3em] text-white/30 uppercase font-medium mb-2">Progress</p>
          <h1 className="text-3xl font-bold text-white tracking-tight">Your Stats</h1>
        </div>

        <div className="glass-panel p-6 mb-4 animate-slide-up">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-xs text-white/40 tracking-[0.1em] uppercase mb-1">Total Volume</p>
              <p className="text-4xl font-bold text-white">
                {loading ? '—' : stats.totalVolume.toLocaleString()} kg
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
              <BarChart3 size={22} className="text-white/40" />
            </div>
          </div>
          <p className="text-xs text-white/25">All time, strength sets only</p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="glass-panel p-4">
            <div className="flex items-center gap-2 mb-2">
              <Flame size={14} className="text-orange-400" />
              <p className="text-[10px] text-white/40 tracking-[0.1em] uppercase font-bold">This Week</p>
            </div>
            <p className="text-2xl font-bold text-white">
              {loading ? '—' : stats.thisWeekSessions}
            </p>
            <p className="text-[10px] text-white/25 mt-1">workouts</p>
          </div>
          <div className="glass-panel p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={14} className="text-emerald-400" />
              <p className="text-[10px] text-white/40 tracking-[0.1em] uppercase font-bold">All Time</p>
            </div>
            <p className="text-2xl font-bold text-white">
              {loading ? '—' : stats.totalSessions}
            </p>
            <p className="text-[10px] text-white/25 mt-1">workouts</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="glass-panel p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-white/40 tracking-[0.1em] uppercase font-bold mb-1">Last Session</p>
              <p className="text-base font-semibold text-white">
                {loading ? '—' : fmtDate(stats.lastSessionDate)}
              </p>
            </div>
            <Calendar size={18} className="text-white/20" />
          </div>

          <div className="glass-panel p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-white/40 tracking-[0.1em] uppercase font-bold mb-1">Total Sets Logged</p>
              <p className="text-2xl font-bold text-white">
                {loading ? '—' : stats.totalSets.toLocaleString()}
              </p>
            </div>
            <Dumbbell size={18} className="text-white/20" />
          </div>

          <div className="glass-panel p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-white/40 tracking-[0.1em] uppercase font-bold mb-1">Avg Sets / Workout</p>
              <p className="text-2xl font-bold text-white">
                {loading ? '—' : stats.avgSetsPerSession}
              </p>
            </div>
            <BarChart3 size={18} className="text-white/20" />
          </div>
        </div>
      </div>
    </div>
  );
}
