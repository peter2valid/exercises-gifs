'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkoutStore } from '@/store/workoutStore';
import { getAllExercises } from '@/lib/db/exerciseQueries';
import { seedExercises } from '@/lib/db/seed';
import {
  saveSessionId,
  getSavedSessionId,
  clearSessionId,
} from '@/lib/device/identity';
import { TENANT_ID } from '@/lib/config';
import { supabase } from '@/lib/supabase/client';

import {
  RestoringView,
  IdleView,
  ActiveView,
  RestingView,
  FinishedView,
} from './views';

export default function WorkoutPageClient({ initialExerciseId }: { initialExerciseId: string }) {
  const router = useRouter();
  const phase = useWorkoutStore((s) => s.phase);
  const session = useWorkoutStore((s) => s.session);
  const sets = useWorkoutStore((s) => s.sets);

  const startSession = useWorkoutStore((s) => s.startSession);
  const logSet = useWorkoutStore((s) => s.logSet);
  const startRest = useWorkoutStore((s) => s.startRest);
  const endRest = useWorkoutStore((s) => s.endRest);
  const adjustRest = useWorkoutStore((s) => s.adjustRest);
  const completeSession = useWorkoutStore((s) => s.completeSession);
  const loadSession = useWorkoutStore((s) => s.loadSession);
  const reset = useWorkoutStore((s) => s.reset);
  const activeRest = useWorkoutStore((s) => s.activeRest);

  const [exercises, setExercises] = useState<any[]>([]);
  const [lastSetId, setLastSetId] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const autoStarted = useRef(false);

  useEffect(() => {
    async function init() {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession) {
        router.push('/auth');
        return;
      }
      setUserId(authSession.user.id);

      await seedExercises().catch(console.error);
      const exs = await getAllExercises().catch(() => []);
      setExercises(exs);

      const savedId = getSavedSessionId();
      if (savedId) {
        await loadSession(savedId, TENANT_ID, 'local-browser', authSession.user.id)
          .catch(console.error)
          .finally(() => setIsRestoring(false));
      } else {
        setIsRestoring(false);
      }
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (
      !isRestoring &&
      userId &&
      initialExerciseId &&
      phase === 'idle' &&
      !autoStarted.current
    ) {
      autoStarted.current = true;
      const sessionId = crypto.randomUUID();
      setIsStarting(true);
      startSession(sessionId, userId, TENANT_ID, 'local-browser')
        .then(() => saveSessionId(sessionId))
        .catch(console.error)
        .finally(() => setIsStarting(false));
    }
  }, [isRestoring, userId]);  // eslint-disable-line react-hooks/exhaustive-deps

  const handleStart = () => {
    if (isStarting || !userId) return;
    const sessionId = crypto.randomUUID();
    setIsStarting(true);
    startSession(sessionId, userId, TENANT_ID, 'local-browser')
      .then(() => saveSessionId(sessionId))
      .catch(console.error)
      .finally(() => setIsStarting(false));
  };

  const handleLogSet = async (exerciseId: string, weight: number, reps: number): Promise<void> => {
    const setId = crypto.randomUUID();
    await logSet(setId, exerciseId, weight, reps);
    setLastSetId(setId);
  };

  const handleStartRest = () => {
    if (!lastSetId) return;
    startRest(lastSetId, 90).catch(console.error);
  };

  const handleComplete = () => {
    completeSession().then(clearSessionId).catch(console.error);
  };

  const handleReset = () => {
    reset();
    clearSessionId();
    setLastSetId(null);
    autoStarted.current = false;
  };

  const setList = Object.values(sets);
  const exMap = Object.fromEntries(exercises.map((exercise) => [exercise.id, exercise]));
  const preselectedExercise = initialExerciseId ? (exMap[initialExerciseId] ?? null) : null;

  if (isRestoring || !userId) return <RestoringView />;

  return (
    <div className="dashboard-bg min-h-screen flex flex-col">
      {phase === 'idle' && (
        <IdleView
          onStart={handleStart}
          onBrowseLibrary={() => router.push('/explore')}
          isLoading={isStarting}
          preselectedExercise={preselectedExercise}
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
      {phase === 'finished' && <FinishedView sets={setList} exMap={exMap} onReset={handleReset} />}
    </div>
  );
}
