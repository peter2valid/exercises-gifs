'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Compass, TrendingUp } from 'lucide-react';
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
import {
  format,
  parseISO,
  subDays,
  startOfWeek,
  differenceInCalendarDays,
  startOfDay,
} from 'date-fns';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getFirstName(email: string): string {
  const localPart = email.split('@')[0];
  const firstSegment = localPart.split(/[.+_]/)[0];
  return firstSegment.charAt(0).toUpperCase() + firstSegment.slice(1);
}

function getTimeGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatRelativeDate(iso: string): string {
  const date = parseISO(iso);
  const diff = differenceInCalendarDays(startOfDay(new Date()), startOfDay(date));
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return format(date, 'MMM d');
}

function computeStreak(sessions: { started_at: string }[]): number {
  if (!sessions.length) return 0;
  const daySet = new Set(sessions.map((s) => format(parseISO(s.started_at), 'yyyy-MM-dd')));
  let d = new Date();
  // If no workout today yet, start streak check from yesterday
  if (!daySet.has(format(d, 'yyyy-MM-dd'))) d = subDays(d, 1);
  let streak = 0;
  while (daySet.has(format(d, 'yyyy-MM-dd'))) {
    streak++;
    d = subDays(d, 1);
  }
  return streak;
}

function computeActiveDays(sessions: { started_at: string }[], weekStart: Date): Set<number> {
  const active = new Set<number>();
  for (const s of sessions) {
    const diff = differenceInCalendarDays(parseISO(s.started_at), weekStart);
    if (diff >= 0 && diff <= 6) active.add(diff);
  }
  return active;
}

// ─── Activity Ring ─────────────────────────────────────────────────────────────

function ActivityRing({ value, max = 7, size = 188 }: { value: number; max?: number; size?: number }) {
  const sw = 14;
  const r = (size - sw * 2) / 2;
  const circ = 2 * Math.PI * r;
  const progress = Math.min(value / max, 1);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 80);
    return () => clearTimeout(t);
  }, []);

  const offset = ready ? circ * (1 - progress) : circ;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={sw}
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="white" strokeWidth={sw}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{
            transition: 'stroke-dashoffset 1.4s cubic-bezier(0.34,1.56,0.64,1)',
            filter: 'drop-shadow(0 0 14px rgba(255,255,255,0.22))',
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span
          className="font-black text-white leading-none"
          style={{ fontSize: value >= 10 ? 44 : 52, letterSpacing: '-0.03em' }}
        >
          {value}
        </span>
        <span className="text-[10px] text-white/30 mt-1 font-semibold tracking-[0.18em] uppercase">
          this week
        </span>
      </div>
    </div>
  );
}

// ─── Week Dots ─────────────────────────────────────────────────────────────────

function WeekDots({ activeDays }: { activeDays: Set<number> }) {
  const LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const ws = startOfWeek(new Date(), { weekStartsOn: 1 });
  const todayIdx = differenceInCalendarDays(startOfDay(new Date()), ws);

  return (
    <div className="flex items-center gap-2.5 justify-center">
      {LABELS.map((label, i) => {
        const active = activeDays.has(i);
        const isToday = i === todayIdx;
        return (
          <div key={i} className="flex flex-col items-center gap-[5px]">
            <div
              className="flex items-center justify-center rounded-full transition-all duration-300"
              style={{
                width: 26, height: 26,
                background: active ? 'white' : isToday ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)',
                border: isToday && !active ? '1.5px solid rgba(255,255,255,0.18)' : '1.5px solid transparent',
              }}
            >
              {active && (
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <path d="M1.5 5.5l2.5 2.5 5-5" stroke="black" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <span
              className="text-[9px] font-bold"
              style={{ color: isToday ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)' }}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Types ─────────────────────────────────────────────────────────────────────

interface RecentSession {
  id: string;
  startedAt: string;
  setCount: number;
  volume: number;
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const router = useRouter();
  const gymId = useEntitlementStore((s) => s.gymId);
  const entitlementsReady = useEntitlementStore((s) => s.cachedAt !== null);

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const [thisWeek, setThisWeek] = useState(0);
  const [streak, setStreak] = useState(0);
  const [totalVolume, setTotalVolume] = useState(0);
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const [activeDays, setActiveDays] = useState<Set<number>>(new Set());

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setUser(session.user);
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setHasActiveSession(!!getSavedSessionId());
  }, []);

  useEffect(() => {
    async function claimGuest() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const savedId = getSavedSessionId();
      if (!savedId) return;
      try {
        await useWorkoutStore.getState().loadSession(
          savedId,
          resolveTenantId(session.user.id, gymId),
          'local-browser',
          session.user.id,
        );
      } catch (e) {
        console.error('claimGuest session failed', e);
      }
    }
    claimGuest();
  }, [gymId]);

  // Auto-join gym stored from QR scan on the explore page
  useEffect(() => {
    async function claimPendingGym() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      let pending: { gymId: string; gymName?: string; timestamp: number } | null = null;
      try {
        const raw = localStorage.getItem('gymapp:pendingGymJoin');
        if (!raw) return;
        pending = JSON.parse(raw);
      } catch {
        localStorage.removeItem('gymapp:pendingGymJoin');
        return;
      }

      // Clear immediately so we don't retry on next visit
      localStorage.removeItem('gymapp:pendingGymJoin');

      if (!pending?.gymId) return;
      if (Date.now() - pending.timestamp > 7 * 24 * 60 * 60 * 1000) return;

      try {
        await fetch('/api/gym/join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gymId: pending.gymId }),
        });
        // 409 = already member/pending — both are fine, just continue
      } catch {
        // Silent fail: the user can always join manually
      }
    }
    claimPendingGym();
  }, []);

  useEffect(() => {
    async function loadStats() {
      try {
        const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
        const weekStartIso = weekStart.toISOString();

        const [completedSessions, allSets, exercises] = await Promise.all([
          db.workout_sessions.where('status').equals('completed').toArray(),
          db.set_logs.toArray(),
          getAllExercises(),
        ]);

        const exerciseMap = Object.fromEntries(exercises.map((e) => [e.id, e]));

        const weekSessions = completedSessions.filter((s) => s.started_at >= weekStartIso);
        const currentStreak = computeStreak(completedSessions);
        const currentActiveDays = computeActiveDays(completedSessions, weekStart);

        const vol = allSets.reduce((acc, set) => {
          const exercise = exerciseMap[set.exercise_id];
          return usesVolumeExercise(exercise) ? acc + (set.weight || 0) * (set.reps || 0) : acc;
        }, 0);

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

        setThisWeek(weekSessions.length);
        setStreak(currentStreak);
        setTotalVolume(Math.round(vol));
        setRecentSessions(recent);
        setActiveDays(currentActiveDays);
      } catch {
        // Dexie not ready yet
      }
    }
    loadStats();
  }, []);

  if (loading) return <LoadingPage />;

  const firstName = user?.email ? getFirstName(user.email) : 'there';
  const unit = getWeightUnit();
  const todayLabel = new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <div className="dashboard-bg min-h-screen">
      <div className="max-w-md mx-auto px-5 pt-14">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-[13px] text-white/35 font-medium tracking-wide mb-1">
              {getTimeGreeting()}
            </p>
            <h1
              className="font-black text-white leading-none"
              style={{ fontSize: 'clamp(36px, 11vw, 48px)', letterSpacing: '-0.03em' }}
            >
              {firstName}.
            </h1>
          </div>
          <p className="text-[11px] text-white/25 font-medium mt-2">{todayLabel}</p>
        </div>

        {/* Active session banner */}
        {hasActiveSession && (
          <button
            onClick={() => router.push('/workout')}
            className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl mb-5 transition-all active:scale-[0.98]"
            style={{
              background: 'rgba(52,211,153,0.07)',
              border: '1px solid rgba(52,211,153,0.18)',
            }}
          >
            <div className="flex items-center gap-3">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <span className="text-[13px] font-semibold text-emerald-400">Workout in progress</span>
            </div>
            <span className="text-[12px] text-emerald-400/50 font-medium">Resume →</span>
          </button>
        )}

        {/* Hero ring card */}
        <div
          className="w-full rounded-[28px] flex flex-col items-center py-10 px-6 gap-8 mb-4"
          style={{
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <ActivityRing value={thisWeek} max={7} size={188} />
          <WeekDots activeDays={activeDays} />
          <button
            onClick={() => router.push('/workout')}
            className="w-full h-14 rounded-2xl bg-white text-black font-bold tracking-tight transition-all active:scale-[0.97]"
            style={{ fontSize: 15 }}
          >
            {hasActiveSession ? 'Continue Workout' : 'Start Workout'}
          </button>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-2.5 mb-6">
          {[
            { label: 'Streak', value: streak > 0 ? `${streak}d` : '—' },
            { label: 'Last Sets', value: recentSessions.length > 0 ? String(recentSessions[0].setCount) : '—' },
            { label: `Vol (${unit})`, value: totalVolume > 0 ? `${Math.round(totalVolume / 1000)}k` : '—' },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="flex flex-col items-center py-4 rounded-2xl"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.055)',
              }}
            >
              <span
                className="font-black text-white leading-none"
                style={{ fontSize: value.length > 3 ? 22 : 26, letterSpacing: '-0.02em' }}
              >
                {value}
              </span>
              <span className="text-[9px] text-white/25 mt-2 font-bold tracking-[0.15em] uppercase">{label}</span>
            </div>
          ))}
        </div>

        {/* Gym connect prompt — only show after entitlements confirm no gym */}
        {entitlementsReady && !gymId && (
          <div
            className="w-full rounded-[22px] p-5 mb-6"
            style={{
              background: 'rgba(255,255,255,0.025)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <h3 className="text-[15px] font-bold text-white mb-1">Connect with a Gym</h3>
            <p className="text-[12px] leading-relaxed mb-5" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Join your local gym to access programs, check-ins, and trainer guidance.
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => router.push('/join')}
                className="h-11 rounded-xl bg-white text-black text-[13px] font-bold transition-all active:scale-[0.97]"
              >
                Find a Gym
              </button>
              <button
                onClick={() => router.push('/onboarding')}
                className="h-11 rounded-xl text-white text-[13px] font-bold transition-all active:scale-[0.97]"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                I own a Gym
              </button>
            </div>
          </div>
        )}

        {/* Recent activity */}
        <div className="mb-6">
          <p
            className="text-[9px] font-bold uppercase mb-3 ml-1"
            style={{ color: 'rgba(255,255,255,0.22)', letterSpacing: '0.22em' }}
          >
            Recent Activity
          </p>
          {recentSessions.length === 0 ? (
            <div
              className="rounded-2xl p-6 text-center"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.055)' }}
            >
              <p className="text-[13px] font-medium" style={{ color: 'rgba(255,255,255,0.25)' }}>No workouts yet</p>
              <p className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.12)' }}>Your sessions will appear here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentSessions.map((session, idx) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between px-4 py-3.5 rounded-2xl"
                  style={{
                    background: 'rgba(255,255,255,0.025)',
                    border: '1px solid rgba(255,255,255,0.055)',
                    opacity: 1 - idx * 0.14,
                  }}
                >
                  <div>
                    <p className="text-[14px] font-semibold text-white">{formatRelativeDate(session.startedAt)}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      {session.setCount} sets
                      {session.volume > 0
                        ? ` · ${Math.round(convertWeight(session.volume, unit)).toLocaleString()} ${unit}`
                        : ''}
                    </p>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: 'rgba(255,255,255,0.15)' }}>
                    <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="mb-4">
          <p
            className="text-[9px] font-bold uppercase mb-3 ml-1"
            style={{ color: 'rgba(255,255,255,0.22)', letterSpacing: '0.22em' }}
          >
            Explore
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { label: 'Exercise Library', icon: Compass, href: '/explore', desc: 'Browse & learn' },
              { label: 'My Progress', icon: TrendingUp, href: '/progress', desc: 'Track your gains' },
            ].map(({ label, icon: Icon, href, desc }) => (
              <button
                key={href}
                onClick={() => router.push(href)}
                className="flex flex-col items-start p-4 rounded-2xl text-left transition-all active:scale-[0.97]"
                style={{
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.055)',
                }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <Icon size={17} style={{ color: 'rgba(255,255,255,0.55)' }} />
                </div>
                <p className="text-[13px] font-semibold text-white leading-tight">{label}</p>
                <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.28)' }}>{desc}</p>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
