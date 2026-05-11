'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Flame, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { LoadingPage } from '@/components/ui';
import { db } from '@/lib/db/dexie';
import { getAllExercises } from '@/lib/db/exerciseQueries';
import { usesVolumeExercise } from '@/lib/workout/exerciseClassification';
import { convertWeight, getWeightUnit } from '@/lib/settings';
import { PremiumGate } from '@/components/billing/PremiumGate';

function fmtDate(iso?: string | null) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '—';
  }
}

function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  const diffDays = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

interface ProgressStats {
  totalVolume: number;
  totalSessions: number;
  totalSets: number;
  lastSessionDate: string | null;
  avgSetsPerSession: number;
  thisWeekSessions: number;
}

interface RecentSession {
  id: string;
  startedAt: string;
  setCount: number;
  volume: number;
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
  const router = useRouter();
  const [stats, setStats] = useState<ProgressStats>(EMPTY);
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAndLoad() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth');
        return;
      }

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

        const exerciseMap = Object.fromEntries(exercises.map((e) => [e.id, e]));
        const totalSessions = sessions.length;
        const thisWeekSessions = sessions.filter((s) => s.started_at >= weekStartIso).length;
        const sorted = [...sessions].sort((a, b) => b.started_at.localeCompare(a.started_at));
        const lastSessionDate = sorted[0]?.started_at ?? null;
        const strengthSets = allSets.filter((set) => usesVolumeExercise(exerciseMap[set.exercise_id]));
        const totalVolume = strengthSets.reduce((acc, set) => acc + set.weight * set.reps, 0);
        const totalSets = allSets.length;
        const avgSetsPerSession = totalSessions > 0
          ? Math.round((totalSets / totalSessions) * 10) / 10
          : 0;

        const setsBySession = new Map<string, typeof allSets>();
        for (const set of allSets) {
          const bucket = setsBySession.get(set.session_id) ?? [];
          bucket.push(set);
          setsBySession.set(set.session_id, bucket);
        }

        const recent: RecentSession[] = sorted.slice(0, 10).map((s) => {
          const sessionSets = setsBySession.get(s.id) ?? [];
          const sessionVol = sessionSets.reduce((acc, set) =>
            usesVolumeExercise(exerciseMap[set.exercise_id]) ? acc + (set.weight || 0) * (set.reps || 0) : acc, 0);
          return { id: s.id, startedAt: s.started_at, setCount: sessionSets.length, volume: Math.round(sessionVol) };
        });

        setStats({ totalVolume: Math.round(totalVolume), totalSessions, totalSets, lastSessionDate, avgSetsPerSession, thisWeekSessions });
        setRecentSessions(recent);
      } catch {
        setStats(EMPTY);
      } finally {
        setLoading(false);
      }
    }
    checkAndLoad();
  }, [router]);

  const unit = getWeightUnit();

  if (loading) return <LoadingPage />;

  if (stats.totalSessions === 0) {
    return (
      <div className="dashboard-bg min-h-screen pb-24 pt-8">
        <div className="max-w-md mx-auto px-4">
          <div className="mb-8 animate-fade-in">
            <p className="text-xs tracking-[0.3em] text-white/30 uppercase font-medium mb-2">Progress</p>
            <h1 className="text-3xl font-bold text-white tracking-tight">Your Stats</h1>
          </div>
          <div className="glass-panel p-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 border border-white/10 mx-auto mb-4">
              <TrendingUp size={24} className="text-white/20" />
            </div>
            <p className="text-sm font-semibold text-white/50 mb-1">No workouts yet</p>
            <p className="text-xs text-white/25">Complete a session to start tracking your progress</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-bg min-h-screen pb-24 pt-8">
      <div className="max-w-md mx-auto px-4">
        <div className="mb-8 animate-fade-in">
          <p className="text-xs tracking-[0.3em] text-white/30 uppercase font-medium mb-2">Progress</p>
          <h1 className="text-3xl font-bold text-white tracking-tight">Your Stats</h1>
        </div>

        <div className="glass-panel p-6 mb-4 animate-slide-up">
          <p className="text-xs text-white/40 tracking-[0.1em] uppercase mb-1">All-Time Volume</p>
          <p className="text-4xl font-bold text-white">{Math.round(convertWeight(stats.totalVolume, unit)).toLocaleString()} {unit}</p>
          <p className="text-xs text-white/25 mt-2">All time, strength sets only</p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="glass-panel p-4">
            <div className="flex items-center gap-2 mb-2">
              <Flame size={14} className="text-orange-400" />
              <p className="text-[10px] text-white/40 tracking-[0.1em] uppercase font-bold">This Week</p>
            </div>
            <p className="text-2xl font-bold text-white">{stats.thisWeekSessions}</p>
            <p className="text-[10px] text-white/25 mt-1">workouts</p>
          </div>
          <div className="glass-panel p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={14} className="text-emerald-400" />
              <p className="text-[10px] text-white/40 tracking-[0.1em] uppercase font-bold">All Time</p>
            </div>
            <p className="text-2xl font-bold text-white">{stats.totalSessions}</p>
            <p className="text-[10px] text-white/25 mt-1">workouts</p>
          </div>
        </div>

        <div className="space-y-3 mb-8">
          <div className="glass-panel p-4">
            <p className="text-[10px] text-white/40 tracking-[0.1em] uppercase font-bold mb-1">Last Session</p>
            <p className="text-base font-semibold text-white">{fmtDate(stats.lastSessionDate)}</p>
          </div>
          <div className="glass-panel p-4">
            <p className="text-[10px] text-white/40 tracking-[0.1em] uppercase font-bold mb-1">Total Sets Logged</p>
            <p className="text-2xl font-bold text-white">{stats.totalSets.toLocaleString()}</p>
          </div>
          <div className="glass-panel p-4">
            <p className="text-[10px] text-white/40 tracking-[0.1em] uppercase font-bold mb-1">Avg Sets / Workout</p>
            <p className="text-2xl font-bold text-white">{stats.avgSetsPerSession}</p>
          </div>
        </div>

        <PremiumGate 
          feature="workout_history" 
          mode="blur"
          title="Workout History"
          description="Unlock detailed logs of all your past training sessions."
        >
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/30 mb-3">Recent Sessions</p>
            <div className="space-y-2">
              {recentSessions.map((session) => (
                <div key={session.id} className="glass-panel p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">{formatRelativeDate(session.startedAt)}</p>
                    <p className="text-xs text-white/40 mt-0.5">
                      {session.setCount} {session.setCount === 1 ? 'set' : 'sets'}
                      {session.volume > 0 ? ` · ${Math.round(convertWeight(session.volume, unit)).toLocaleString()} ${unit}` : ''}
                    </p>
                  </div>
                  <Calendar size={14} className="text-white/20 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </PremiumGate>
      </div>
    </div>
  );
}
