'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Play,
  Search,
  Dumbbell,
  Compass,
  TrendingUp,
  User,
  Calendar,
  ChevronRight,
} from 'lucide-react';
import { LoadingPage } from '@/components/ui';
import { supabase } from '@/lib/supabase/client';
import { getSavedSessionId } from '@/lib/device/identity';
import { TENANT_ID } from '@/lib/config';
import { useWorkoutStore } from '@/store/workoutStore';
import { db } from '@/lib/db/dexie';
import { getAllExercises } from '@/lib/db/exerciseQueries';
import { usesVolumeExercise } from '@/lib/workout/exerciseClassification';
import { convertWeight, getWeightUnit } from '@/lib/settings';

function getFirstName(email: string): string {
  const localPart = email.split('@')[0];
  const firstSegment = localPart.split(/[.+_]/)[0];
  return firstSegment.charAt(0).toUpperCase() + firstSegment.slice(1);
}

function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

interface RecentSession {
  id: string;
  startedAt: string;
  setCount: number;
  volume: number;
}

const QUICK_ACTIONS = [
  { label: 'Workout', icon: Dumbbell, href: '/workout' },
  { label: 'Explore', icon: Compass, href: '/explore' },
  { label: 'Progress', icon: TrendingUp, href: '/progress' },
  { label: 'Profile', icon: User, href: '/profile' },
] as const;

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [thisWeek, setThisWeek] = useState(0);
  const [totalVolume, setTotalVolume] = useState(0);
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);

  useEffect(() => {
    async function checkUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth');
        return;
      }
      setUser(session.user);
      setLoading(false);
    }
    checkUser();
  }, [router]);

  // If a guest started a session previously, claim it for the signed-in user
  useEffect(() => {
    async function claimGuest() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const savedId = getSavedSessionId();
      if (!savedId) return;

      try {
        // Load the guest session into the workout store under the real user id
        await useWorkoutStore.getState().loadSession(savedId, TENANT_ID, 'local-browser', session.user.id);
      } catch (e) {
        console.error('claimGuest session failed', e);
      }
    }
    claimGuest();
  }, []);

  useEffect(() => {
    async function loadStats() {
      try {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        weekStart.setHours(0, 0, 0, 0);
        const weekStartIso = weekStart.toISOString();

        const [completedSessions, allSets, exercises] = await Promise.all([
          db.workout_sessions.where('status').equals('completed').toArray(),
          db.set_logs.toArray(),
          getAllExercises(),
        ]);

        const exerciseMap = Object.fromEntries(exercises.map((e) => [e.id, e]));

        const weekCount = completedSessions.filter((s) => s.started_at >= weekStartIso).length;

        const vol = allSets.reduce((acc, set) => {
          const exercise = exerciseMap[set.exercise_id];
          return usesVolumeExercise(exercise) ? acc + (set.weight || 0) * (set.reps || 0) : acc;
        }, 0);

        // Group sets by session_id once — used for per-session stats below
        const setsBySession = new Map<string, typeof allSets>();
        for (const set of allSets) {
          const bucket = setsBySession.get(set.session_id) ?? [];
          bucket.push(set);
          setsBySession.set(set.session_id, bucket);
        }

        const sorted = [...completedSessions].sort((a, b) => b.started_at.localeCompare(a.started_at));
        const recent: RecentSession[] = sorted.slice(0, 3).map((session) => {
          const sessionSets = setsBySession.get(session.id) ?? [];
          const sessionVol = sessionSets.reduce((acc, set) => {
            return usesVolumeExercise(exerciseMap[set.exercise_id])
              ? acc + (set.weight || 0) * (set.reps || 0)
              : acc;
          }, 0);
          return {
            id: session.id,
            startedAt: session.started_at,
            setCount: sessionSets.length,
            volume: Math.round(sessionVol),
          };
        });

        setThisWeek(weekCount);
        setTotalVolume(Math.round(vol));
        setRecentSessions(recent);
      } catch {
        // Dexie not ready yet — leave at defaults
      }
    }
    loadStats();
  }, []);

  if (loading) return <LoadingPage />;

  const firstName = user?.email ? getFirstName(user.email) : 'there';
  const unit = getWeightUnit();

  return (
    <div className="dashboard-bg min-h-screen pb-24 pt-8">
      <div className="max-w-md mx-auto px-4 space-y-8">

        {/* Greeting */}
        <div className="animate-fade-in">
          <p className="text-xs tracking-[0.3em] text-white/30 uppercase font-medium mb-2">Supafast</p>
          <h1 className="text-4xl font-bold text-white tracking-tight mb-2">
            Hey, {firstName}
          </h1>
          <p className="text-sm text-white/40">Ready for today&apos;s session?</p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3 animate-slide-up">
          <div className="glass-panel p-4">
            <p className="text-xs text-white/40 tracking-[0.1em] uppercase mb-1">This Week</p>
            <p className="text-2xl font-semibold text-white">
              {thisWeek} {thisWeek === 1 ? 'Workout' : 'Workouts'}
            </p>
          </div>
          <div className="glass-panel p-4">
            <p className="text-xs text-white/40 tracking-[0.1em] uppercase mb-1">All-Time Volume</p>
            <p className="text-2xl font-semibold text-white">{Math.round(convertWeight(totalVolume, unit)).toLocaleString()} {unit}</p>
          </div>
        </div>

        {/* Today's Focus */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/30 mb-3">
            Today&apos;s Focus
          </p>
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => router.push('/workout')}
              className="flex h-20 w-full items-center gap-4 rounded-[24px] border border-white/10 bg-white text-black shadow-[0_18px_50px_rgba(255,255,255,0.08)] transition-transform active:scale-[0.99]"
            >
              <div className="ml-4 flex h-12 w-12 items-center justify-center rounded-full bg-black text-white">
                <Play size={18} fill="currentColor" />
              </div>
              <div className="text-left">
                <p className="text-base font-bold">Start Workout</p>
                <p className="text-sm text-black/50">Log without a plan</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => router.push('/explore')}
              className="flex h-16 w-full items-center gap-4 rounded-[22px] border border-white/10 bg-white/[0.04] transition-transform active:scale-[0.99]"
            >
              <div className="ml-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white">
                <Search size={16} />
              </div>
              <p className="text-sm font-semibold text-white">Browse Exercises</p>
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/30 mb-3">
            Recent Activity
          </p>
          {recentSessions.length === 0 ? (
            <div className="glass-panel p-6 text-center">
              <Calendar size={24} className="text-white/20 mx-auto mb-2" />
              <p className="text-sm text-white/40">No workouts yet</p>
              <p className="text-xs text-white/20 mt-1">Complete a session to see it here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentSessions.map((session) => (
                <div
                  key={session.id}
                  className="glass-panel p-4 flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {formatRelativeDate(session.startedAt)}
                    </p>
                    <p className="text-xs text-white/40 mt-0.5">
                      {session.setCount} {session.setCount === 1 ? 'set' : 'sets'}
                      {session.volume > 0 ? ` · ${Math.round(convertWeight(session.volume, unit)).toLocaleString()} ${unit}` : ''}
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-white/20" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/30 mb-3">
            Quick Actions
          </p>
          <div className="grid grid-cols-2 gap-3">
            {QUICK_ACTIONS.map(({ label, icon: Icon, href }) => (
              <button
                key={href}
                type="button"
                onClick={() => router.push(href)}
                className="glass-panel p-4 flex flex-col items-start gap-3 transition-transform active:scale-[0.98] text-left"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 border border-white/10">
                  <Icon size={18} className="text-white/60" />
                </div>
                <p className="text-sm font-semibold text-white">{label}</p>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
