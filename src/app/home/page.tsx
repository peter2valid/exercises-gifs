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
import { useWorkoutStore } from '@/store/workoutStore';
import { useEntitlementStore } from '@/store/entitlementStore';
import { db } from '@/lib/db/dexie';
import { getAllExercises } from '@/lib/db/exerciseQueries';
import { usesVolumeExercise } from '@/lib/workout/exerciseClassification';
import { convertWeight, getWeightUnit } from '@/lib/settings';
import { resolveTenantId } from '@/lib/config';

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
  const gymId = useEntitlementStore((s) => s.gymId);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [thisWeek, setThisWeek] = useState(0);
  const [totalVolume, setTotalVolume] = useState(0);
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);

  useEffect(() => {
    // Middleware already redirects unauthenticated users to /auth.
    // This effect only needs to load the user object for display.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setUser(session.user);
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // If a guest started a session previously, claim it for the signed-in user
  useEffect(() => {
    async function claimGuest() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const savedId = getSavedSessionId();
      if (!savedId) return;

      try {
        // Load the guest session into the workout store under the real user id
        await useWorkoutStore.getState().loadSession(savedId, resolveTenantId(session.user.id, gymId), 'local-browser', session.user.id);
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

        {/* Compact Greeting matching reference image */}
        <div className="animate-fade-in">
          <p className="text-sm text-white/40 mb-1">Hello, {firstName}</p>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Ready To Move?</h1>
        </div>

        {/* Minimal stat tiles (mimic reference) */}
        <div className="flex items-center justify-between gap-3 animate-slide-up mt-4">
          <div className="flex-1 glass-panel p-3 text-center">
            <p className="text-2xl font-black text-white">6541</p>
            <p className="text-xs text-white/40 mt-1">Steps</p>
          </div>
          <div className="flex-1 glass-panel p-3 text-center">
            <p className="text-2xl font-black text-white">1.5</p>
            <p className="text-xs text-white/40 mt-1">Liters</p>
          </div>
          <div className="flex-1 glass-panel p-3 text-center">
            <p className="text-2xl font-black text-white">259</p>
            <p className="text-xs text-white/40 mt-1">Cal Burn</p>
          </div>
        </div>

        {/* Join/Create Gym Prompt for users without a gym */}
        {!gymId && (
          <div className="glass-panel p-6 border-white/10 bg-white/5 animate-fade-in">
            <h3 className="text-sm font-bold text-white mb-2">Connect with a Gym</h3>
            <p className="text-xs text-white/40 mb-4">Join your local gym to access programs, check-ins, and trainer guidance.</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => router.push('/join')}
                className="h-10 rounded-xl bg-white text-black text-xs font-bold"
              >
                Find a Gym
              </button>
              <button
                onClick={() => router.push('/onboarding')}
                className="h-10 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-bold"
              >
                I own a Gym
              </button>
            </div>
          </div>
        )}

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
