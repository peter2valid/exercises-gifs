'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { LoadingPage } from '@/components/ui';
import { db } from '@/lib/db/dexie';
import type { WorkoutSession } from '@/lib/db/schema';
import { getAllExercises } from '@/lib/db/exerciseQueries';
import { usesVolumeExercise } from '@/lib/workout/exerciseClassification';
import { convertWeight, getWeightUnit } from '@/lib/settings';
import { useLiveQuery } from 'dexie-react-hooks';
import { ContributionMap } from '@/components/ContributionMap';

function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  const diffDays = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function fmtLastSeen(iso: string | null): string {
  if (!iso) return '—';
  const diffDays = Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

interface RecentSession {
  id: string;
  startedAt: string;
  setCount: number;
  volume: number;
}

export default function ProgressPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/auth'); return; }
      setUserId(session.user.id);
      setAuthLoading(false);
    });
  }, [router]);

  const sessions = useLiveQuery<WorkoutSession[]>(
    () => userId
      ? db.workout_sessions.where('user_id').equals(userId).filter(s => s.status === 'completed').toArray()
      : Promise.resolve([] as WorkoutSession[]),
    [userId]
  );

  const allSets = useLiveQuery(
    async () => {
      if (!sessions || sessions.length === 0) return [];
      const ids = new Set(sessions.map(s => s.id));
      return (await db.set_logs.toArray()).filter(set => ids.has(set.session_id));
    },
    [sessions]
  );

  const exercises = useLiveQuery(() => getAllExercises(), []);

  const unit = getWeightUnit();

  const { totalSessions, thisWeekSessions, lastSessionDate, totalVolume, avgSetsPerSession, recentSessions } = useMemo(() => {
    if (!sessions || !allSets || !exercises) {
      return { totalSessions: 0, thisWeekSessions: 0, lastSessionDate: null, totalVolume: 0, avgSetsPerSession: 0, recentSessions: [] as RecentSession[] };
    }

    const exerciseMap = Object.fromEntries(exercises.map(e => [e.id, e]));
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const sorted = [...sessions].sort((a, b) => b.started_at.localeCompare(a.started_at));
    const thisWeek = sessions.filter(s => s.started_at >= weekStart.toISOString()).length;
    const strengthSets = allSets.filter(set => usesVolumeExercise(exerciseMap[set.exercise_id]));
    const vol = strengthSets.reduce((acc, set) => acc + set.weight * set.reps, 0);
    const avg = sessions.length > 0 ? Math.round((allSets.length / sessions.length) * 10) / 10 : 0;

    const setsBySession = new Map<string, typeof allSets>();
    for (const set of allSets) {
      const b = setsBySession.get(set.session_id) ?? [];
      b.push(set);
      setsBySession.set(set.session_id, b);
    }

    const recent: RecentSession[] = sorted.slice(0, 10).map(s => {
      const ss = setsBySession.get(s.id) ?? [];
      const sv = ss.reduce((acc, set) =>
        usesVolumeExercise(exerciseMap[set.exercise_id]) ? acc + (set.weight || 0) * (set.reps || 0) : acc, 0);
      return { id: s.id, startedAt: s.started_at, setCount: ss.length, volume: Math.round(sv) };
    });

    return {
      totalSessions: sessions.length,
      thisWeekSessions: thisWeek,
      lastSessionDate: sorted[0]?.started_at ?? null,
      totalVolume: Math.round(vol),
      avgSetsPerSession: avg,
      recentSessions: recent,
    };
  }, [sessions, allSets, exercises]);

  if (authLoading || sessions === undefined) return <LoadingPage />;

  if (totalSessions === 0) {
    return (
      <div className="dashboard-bg min-h-screen pb-24 pt-8">
        <div className="max-w-md mx-auto px-4">
          <p className="text-xs tracking-[0.3em] text-white/30 uppercase font-medium mb-2">Progress</p>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-10">Your Stats</h1>
          <div className="glass-panel p-10 text-center">
            <Calendar size={28} className="text-white/15 mx-auto mb-4" />
            <p className="text-sm font-semibold text-white/40 mb-1">No workouts yet</p>
            <p className="text-xs text-white/20">Complete a session to start tracking your progress.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-bg min-h-screen pb-24 pt-8">
      <div className="max-w-md mx-auto px-4 space-y-4">

        {/* ── Header + key numbers ───────────────────────────────────────── */}
        <div className="animate-fade-in">
          <p className="text-xs tracking-[0.3em] text-white/30 uppercase font-medium mb-1">Progress</p>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-5">Your Stats</h1>

          <div className="grid grid-cols-3 gap-2">
            <div className="glass-panel px-3 py-3.5 text-center">
              <p className="text-2xl font-bold text-white leading-none">{totalSessions}</p>
              <p className="text-[9px] text-white/30 uppercase tracking-widest font-bold mt-1.5">All Time</p>
            </div>
            <div className="glass-panel px-3 py-3.5 text-center">
              <p className="text-2xl font-bold text-white leading-none">{thisWeekSessions}</p>
              <p className="text-[9px] text-white/30 uppercase tracking-widest font-bold mt-1.5">This Week</p>
            </div>
            <div className="glass-panel px-3 py-3.5 text-center">
              <p className="text-sm font-bold text-white leading-none">{fmtLastSeen(lastSessionDate)}</p>
              <p className="text-[9px] text-white/30 uppercase tracking-widest font-bold mt-1.5">Last Session</p>
            </div>
          </div>
        </div>

        {/* ── Activity map ───────────────────────────────────────────────── */}
        <ContributionMap sessions={sessions ?? []} />

        {/* ── Volume summary ─────────────────────────────────────────────── */}
        <div className="glass-panel px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-[9px] text-white/30 uppercase tracking-widest font-bold mb-1">Total Volume</p>
            <p className="text-xl font-bold text-white">
              {Math.round(convertWeight(totalVolume, unit)).toLocaleString()}
              <span className="text-sm font-medium text-white/40 ml-1">{unit}</span>
            </p>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div className="text-right">
            <p className="text-[9px] text-white/30 uppercase tracking-widest font-bold mb-1">Avg Sets</p>
            <p className="text-xl font-bold text-white">
              {avgSetsPerSession}
              <span className="text-sm font-medium text-white/40 ml-1">/ session</span>
            </p>
          </div>
        </div>

        {/* ── Recent sessions ────────────────────────────────────────────── */}
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.28em] text-white/25 mb-3">Recent Sessions</p>
          <div className="space-y-2">
            {recentSessions.map((session) => (
              <div key={session.id} className="glass-panel px-4 py-3.5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">{formatRelativeDate(session.startedAt)}</p>
                  <p className="text-xs text-white/35 mt-0.5">
                    {session.setCount} {session.setCount === 1 ? 'set' : 'sets'}
                    {session.volume > 0
                      ? ` · ${Math.round(convertWeight(session.volume, unit)).toLocaleString()} ${unit}`
                      : ''}
                  </p>
                </div>
                <Calendar size={13} className="text-white/15 shrink-0" />
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
