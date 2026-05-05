'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkoutStore } from '@/store/workoutStore';
import { seedExercises } from '@/lib/db/seed';
import {
  getDeviceUserId,
  saveSessionId,
  getSavedSessionId,
} from '@/lib/device/identity';
import { TENANT_ID } from '@/lib/config';
import { Button } from '@/components/ui';

// ─── Entry point ──────────────────────────────────────────────────────────────

export default function HomePage() {
  const phase        = useWorkoutStore(s => s.phase);
  const sets         = useWorkoutStore(s => s.sets);
  const startSession = useWorkoutStore(s => s.startSession);
  const loadSession  = useWorkoutStore(s => s.loadSession);

  const router = useRouter();

  const [isRestoring, setIsRestoring] = useState(true);
  const [isStarting,  setIsStarting]  = useState(false);

  useEffect(() => {
    seedExercises().catch(console.error);

    const savedId = getSavedSessionId();
    if (savedId) {
      loadSession(savedId, TENANT_ID, getDeviceUserId())
        .catch(console.error)
        .finally(() => setIsRestoring(false));
    } else {
      setIsRestoring(false);
    }
  }, []);

  const handleStart = () => {
    if (isStarting) return;
    const sessionId = crypto.randomUUID();
    const userId    = getDeviceUserId();
    setIsStarting(true);
    startSession(sessionId, userId, TENANT_ID, userId)
      .then(() => saveSessionId(sessionId))
      .then(() => router.push('/workout'))
      .catch(console.error)
      .finally(() => setIsStarting(false));
  };

  const setCount      = Object.keys(sets).length;
  const hasActive     = phase === 'active' || phase === 'resting';

  if (isRestoring) {
    return (
      <div className="dashboard-bg min-h-screen flex items-center justify-center">
        <span className="text-white/20 text-xs tracking-[0.3em] uppercase">Loading</span>
      </div>
    );
  }

  return (
    <div className="dashboard-bg min-h-screen flex flex-col">
      <div className="flex-1 max-w-md mx-auto w-full px-5 pb-36">

        {/* Header */}
        <div className="pt-14 pb-10">
          <p className="text-[11px] tracking-[0.25em] text-white/25 uppercase font-medium mb-2">Supafast</p>
          <h1 className="text-[32px] font-semibold text-white leading-tight tracking-tight">
            {greeting()}
          </h1>
        </div>

        {/* Card */}
        {hasActive ? (
          <ActiveCard
            phase={phase as 'active' | 'resting'}
            setCount={setCount}
            onContinue={() => router.push('/workout')}
          />
        ) : (
          <IdleCard onStart={handleStart} isStarting={isStarting} />
        )}

      </div>

      <BottomNav active="home" />
    </div>
  );
}

// ─── Greeting ─────────────────────────────────────────────────────────────────

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning.';
  if (h < 17) return 'Good afternoon.';
  return 'Good evening.';
}

// ─── Cards ────────────────────────────────────────────────────────────────────

function ActiveCard({
  phase,
  setCount,
  onContinue,
}: {
  phase: 'active' | 'resting';
  setCount: number;
  onContinue: () => void;
}) {
  return (
    <div className="glass-panel p-6 space-y-5">
      <div className="flex items-center gap-2.5">
        <span className="w-1.5 h-1.5 rounded-full bg-white/70 animate-pulse" />
        <span className="text-[11px] tracking-[0.2em] text-white/40 uppercase font-medium">
          {phase === 'resting' ? 'Resting' : 'In Progress'}
        </span>
      </div>

      <div>
        <p className="text-white font-semibold text-[26px] tracking-tight leading-none">
          {setCount} set{setCount !== 1 ? 's' : ''}
        </p>
        <p className="text-white/35 text-sm mt-2">Session is still open</p>
      </div>

      <button
        onClick={onContinue}
        className="w-full h-14 rounded-2xl font-semibold text-[15px] tracking-tight transition-all active:scale-[0.98]"
        style={{
          background: 'rgba(255,255,255,0.10)',
          border: '1px solid rgba(255,255,255,0.16)',
          color: '#ffffff',
        }}
      >
        Continue Workout
      </button>
    </div>
  );
}

function IdleCard({
  onStart,
  isStarting,
}: {
  onStart: () => void;
  isStarting: boolean;
}) {
  return (
    <div className="glass-panel p-6 space-y-5">
      <div>
        <p className="text-[11px] tracking-[0.2em] text-white/25 uppercase font-medium mb-3">Today</p>
        <p className="text-white font-semibold text-[26px] tracking-tight leading-none">
          Ready to train?
        </p>
        <p className="text-white/35 text-sm mt-2">No active session</p>
      </div>

      <button
        onClick={onStart}
        disabled={isStarting}
        className="w-full h-16 rounded-2xl font-semibold text-[16px] tracking-tight transition-all active:scale-[0.98] disabled:opacity-40"
        style={{
          background: 'rgba(255,255,255,0.92)',
          border: '1px solid rgba(255,255,255,0.30)',
          color: '#0a0a0b',
        }}
      >
        {isStarting ? 'Starting…' : 'Start Workout'}
      </button>
    </div>
  );
}

// ─── Bottom Nav ───────────────────────────────────────────────────────────────

function BottomNav({ active }: { active: 'home' | 'workout' }) {
  return (
    <div className="fixed bottom-8 left-0 right-0 flex justify-center pointer-events-none z-50">
      <nav
        className="pointer-events-auto flex items-center gap-1 px-3 py-2.5 rounded-full"
        style={{
          background: 'rgba(255, 255, 255, 0.07)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          backdropFilter: 'blur(48px) saturate(200%)',
          WebkitBackdropFilter: 'blur(48px) saturate(200%)',
          boxShadow: '0 2px 0 rgba(255,255,255,0.08) inset, 0 16px 48px rgba(0,0,0,0.5)',
        }}
      >
        <NavItem href="/"        label="Home"     active={active === 'home'}    icon={<HomeIcon />} />
        <NavItem href="/workout" label="Workout"  active={active === 'workout'} icon={<WorkoutIcon />} />
        <NavItem href="#"        label="Explore"  active={false}                icon={<ExploreIcon />}  disabled />
        <NavItem href="#"        label="Progress" active={false}                icon={<ProgressIcon />} disabled />
      </nav>
    </div>
  );
}

function NavItem({
  href,
  label,
  active,
  icon,
  disabled,
}: {
  href: string;
  label: string;
  active: boolean;
  icon: React.ReactNode;
  disabled?: boolean;
}) {
  const base = 'flex flex-col items-center gap-1 px-4 py-2 rounded-full transition-all select-none';
  const cls  = active
    ? `${base} bg-white/10`
    : disabled
    ? `${base} opacity-25 cursor-default`
    : `${base} hover:bg-white/6 active:bg-white/10`;

  return (
    <a href={disabled ? undefined : href} className={cls}>
      <span className={active ? 'text-white' : 'text-white/50'}>{icon}</span>
      <span className={`text-[9px] tracking-[0.15em] uppercase font-semibold ${active ? 'text-white' : 'text-white/40'}`}>
        {label}
      </span>
    </a>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function HomeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function WorkoutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 5v14M18 5v14M3 8h3M18 8h3M3 16h3M18 16h3" />
    </svg>
  );
}

function ExploreIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function ProgressIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}
