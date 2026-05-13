'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { useWorkoutStore } from '@/store/workoutStore';
import { getAllExercises } from '@/lib/db/exerciseQueries';
import { seedExercises } from '@/lib/db/seed';
import {
  saveSessionId,
  getSavedSessionId,
  clearSessionId,
  getDeviceUserId,
} from '@/lib/device/identity';
import { resolveTenantId } from '@/lib/config';
import { supabase } from '@/lib/supabase/client';
import { useEntitlementStore } from '@/store/entitlementStore';

import {
  RestoringView,
  IdleView,
  ActiveView,
  RestingView,
  FinishedView,
} from './views';

export default function WorkoutPageClient({ initialExerciseId }: { initialExerciseId: string }) {
  const router = useRouter();
  const gymId = useEntitlementStore((s) => s.gymId);

  // Read store state
  const phase = useWorkoutStore((s) => s.phase);
  const session = useWorkoutStore((s) => s.session);
  const sets = useWorkoutStore((s) => s.sets);
  const activeRest = useWorkoutStore((s) => s.activeRest);

  // Store actions — stable references, safe to read once
  const startSession = useWorkoutStore((s) => s.startSession);
  const logSet = useWorkoutStore((s) => s.logSet);
  const startRest = useWorkoutStore((s) => s.startRest);
  const endRest = useWorkoutStore((s) => s.endRest);
  const adjustRest = useWorkoutStore((s) => s.adjustRest);
  const completeSession = useWorkoutStore((s) => s.completeSession);
  const loadSession = useWorkoutStore((s) => s.loadSession);
  const reset = useWorkoutStore((s) => s.reset);

  const [exercises, setExercises] = useState<any[]>([]);
  const [exercisesError, setExercisesError] = useState(false);
  const [assignedPrograms, setAssignedPrograms] = useState<any[]>([]);
  const [lastSetId, setLastSetId] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Refs prevent double-fire regardless of React batching
  const startingRef = useRef(false);
  const autoStarted = useRef(false);

  // Dismiss error automatically after 5 s
  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), 5000);
    return () => clearTimeout(t);
  }, [error]);

  useEffect(() => {
    async function init() {
      const deviceUser = getDeviceUserId();
      const { data: { session: authSession } } = await supabase.auth.getSession();
      const effectiveUserId = authSession ? authSession.user.id : deviceUser;
      setUserId(effectiveUserId);

      try {
        await seedExercises();
      } catch {
        // Non-fatal — existing exercises still usable
      }

      try {
        const exs = await getAllExercises();
        if (exs.length === 0) {
          setExercisesError(true);
        }
        setExercises(exs);
      } catch {
        setExercisesError(true);
        setExercises([]);
      }

      if (authSession) {
        try {
          const res = await fetch('/api/programs/assigned');
          const data = await res.json();
          if (res.ok) setAssignedPrograms(data.programs || []);
        } catch (err) {
          console.error('[workout] failed to fetch programs:', err);
        }
      }

      const savedId = getSavedSessionId();
      if (savedId) {
        try {
          // Use gymId from entitlement store — may be null for non-gym users
          const currentGymId = useEntitlementStore.getState().gymId;
          await loadSession(savedId, resolveTenantId(effectiveUserId, currentGymId), 'local-browser', effectiveUserId);
          const restoredSets = Object.values(useWorkoutStore.getState().sets);
          if (restoredSets.length > 0) {
            const latest = restoredSets.sort((a, b) => b.logged_at.localeCompare(a.logged_at))[0];
            setLastSetId(latest.id);
          }
        } catch (e) {
          console.error('[workout] session restore failed:', e);
          // Clear the stale session ID so the user can start fresh
          clearSessionId();
          setError('Could not restore your previous session. Starting fresh.');
        }
      }

      setIsRestoring(false);
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-start when launched from exercise detail page
  useEffect(() => {
    if (isRestoring || !userId || !initialExerciseId || phase !== 'idle' || autoStarted.current) return;
    autoStarted.current = true;
    const currentGymId = useEntitlementStore.getState().gymId;
    const sessionId = crypto.randomUUID();
    startingRef.current = true;
    setIsStarting(true);
    startSession(sessionId, userId, resolveTenantId(userId, currentGymId), 'local-browser')
      .then(() => saveSessionId(sessionId))
      .catch((e) => {
        console.error('[workout] auto-start failed:', e);
        setError('Could not start the workout. Tap "Start new workout" to try again.');
        autoStarted.current = false;
      })
      .finally(() => {
        startingRef.current = false;
        setIsStarting(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRestoring, userId]);

  const handleStart = () => {
    if (startingRef.current || !userId) return;
    startingRef.current = true;
    const currentGymId = useEntitlementStore.getState().gymId;
    const sessionId = crypto.randomUUID();
    setIsStarting(true);
    startSession(sessionId, userId, resolveTenantId(userId, currentGymId), 'local-browser')
      .then(() => saveSessionId(sessionId))
      .catch((e) => {
        console.error('[workout] start failed:', e);
        setError('Could not start the workout. Please try again.');
      })
      .finally(() => {
        startingRef.current = false;
        setIsStarting(false);
      });
  };

  const handleStartProgram = (program: any) => {
    if (startingRef.current || !userId) return;
    startingRef.current = true;
    const currentGymId = useEntitlementStore.getState().gymId;
    const sessionId = crypto.randomUUID();
    
    // Pre-fill roster with program exercises
    if (program.template_exercises?.length > 0) {
      const roster = program.template_exercises
        .sort((a: any, b: any) => a.ord - b.ord)
        .map((e: any) => e.exercise_id);
      try {
        localStorage.setItem(`gymapp-workout-roster:${sessionId}`, JSON.stringify(roster));
      } catch (err) {
        console.error('Failed to save program roster:', err);
      }
    }

    setIsStarting(true);
    startSession(sessionId, userId, resolveTenantId(userId, currentGymId), 'local-browser')
      .then(() => saveSessionId(sessionId))
      .catch((e) => {
        console.error('[workout] start program failed:', e);
        setError('Could not start the program. Please try again.');
      })
      .finally(() => {
        startingRef.current = false;
        setIsStarting(false);
      });
  };

  const handleLogSet = async (exerciseId: string, weight: number, reps: number): Promise<void> => {
    const setId = crypto.randomUUID();
    await logSet(setId, exerciseId, weight, reps);
    setLastSetId(setId);
  };

  const handleStartRest = () => {
    if (!lastSetId) return;
    startRest(lastSetId, 90).catch((e) => {
      console.error('[workout] startRest failed:', e);
      setError('Could not start rest timer.');
    });
  };

  const handleComplete = () => {
    completeSession()
      .then(clearSessionId)
      .catch((e) => {
        console.error('[workout] completeSession failed:', e);
        setError('Could not save your workout. Your sets are stored locally and will sync when you reconnect.');
      });
  };

  const handleAbandon = () => {
    // Clear session state without emitting SESSION_COMPLETED
    if (session?.id) {
      try { localStorage.removeItem(`gymapp-workout-roster:${session.id}`); } catch {}
    }
    reset();
    clearSessionId();
    setLastSetId(null);
    autoStarted.current = false;
    setError(null);
  };

  const handleReset = () => {
    // Clean up this session's roster from localStorage
    if (session?.id) {
      try { localStorage.removeItem(`gymapp-workout-roster:${session.id}`); } catch {}
    }
    reset();
    clearSessionId();
    setLastSetId(null);
    autoStarted.current = false;
    setError(null);
  };

  const setList = Object.values(sets);
  const exMap = Object.fromEntries(exercises.map((ex) => [ex.id, ex]));
  const preselectedExercise = initialExerciseId ? (exMap[initialExerciseId] ?? null) : null;

  if (isRestoring) return <RestoringView />;

  return (
    <div className="dashboard-bg min-h-screen flex flex-col">
      {phase === 'idle' && (
        <IdleView
          onStart={handleStart}
          onBrowseLibrary={() => router.push('/explore')}
          isLoading={isStarting}
          preselectedExercise={preselectedExercise}
          exercisesError={exercisesError}
          assignedPrograms={assignedPrograms}
          onStartProgram={handleStartProgram}
        />
      )}
      {phase === 'active' && (
        <ActiveView
          sets={setList}
          exercises={exercises}
          exMap={exMap}
          initialExerciseId={initialExerciseId}
          sessionId={session?.id ?? ''}
          sessionStartedAt={session?.started_at ?? null}
          onLogSet={handleLogSet}
          onStartRest={handleStartRest}
          onComplete={handleComplete}
          onAbandon={handleAbandon}
          hasLastSet={!!lastSetId}
        />
      )}
      {phase === 'resting' && (
        <RestingView
          lastSet={lastSetId ? (sets[lastSetId] ?? null) : null}
          exMap={exMap}
          activeRest={activeRest}
          onEndRest={endRest}
          onAdjustRest={adjustRest}
        />
      )}
      {phase === 'finished' && (
        <FinishedView sets={setList} exMap={exMap} onReset={handleReset} onHome={() => router.push('/home')} />
      )}

      {/* Global error toast — shown over all views */}
      {error && (
        <div className="fixed bottom-24 inset-x-4 z-[100] mx-auto max-w-md">
          <div className="flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-950/95 px-4 py-3 shadow-2xl backdrop-blur-sm">
            <p className="flex-1 text-sm text-red-300 leading-snug">{error}</p>
            <button
              type="button"
              onClick={() => setError(null)}
              className="shrink-0 rounded-full p-0.5 text-red-400 transition-colors hover:text-red-200"
              aria-label="Dismiss"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
