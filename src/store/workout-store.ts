import { create } from 'zustand';
import { db, type SetLog, type WorkoutExercise, type WorkoutStateEnum, type SessionStateCache } from '@/lib/db/dexie';
import { supabase } from '@/lib/supabase/client';

export interface FlatSessionStep {
  exerciseId: string;
  setIndex: number;
  targetWeight: number;
  targetReps: number;
  restTime: number;
  isLastSetOfExercise: boolean;
}

interface WorkoutState {
  activeSessionId: number | null;
  activeWorkoutId: number | null;
  activeAssignmentId: number | null;
  workoutState: WorkoutStateEnum;
  logs: SetLog[];
  
  // Flattened session
  flatSessionPlan: FlatSessionStep[];
  currentStepIndex: number;
  
  // Smart Rest System
  restTimeRemaining: number;

  // Actions
  startSession: (sessionId: number, workoutId: number, exercises: WorkoutExercise[], assignmentId?: number) => void;
  recoverSession: (stateCache: SessionStateCache) => void;
  endSession: () => void;
  
  // State Machine Transitions
  completeSet: (weight: number, reps: number) => Promise<void>;
  skipRest: () => void;
  extendRest: (seconds: number) => void;
  tickRest: () => void;
  
  // Logging & Sync
  syncLogs: () => Promise<void>;
  saveStateToCache: () => Promise<void>;
}

// Helper to flatten exercises into individual sets
function flattenSequence(exercises: WorkoutExercise[]): FlatSessionStep[] {
  const steps: FlatSessionStep[] = [];
  exercises.forEach(ex => {
    for (let i = 0; i < ex.sets; i++) {
        steps.push({
           exerciseId: ex.exerciseId,
           setIndex: i + 1,
           targetWeight: 0,
           targetReps: ex.targetReps,
           restTime: ex.restTime,
           isLastSetOfExercise: i === ex.sets - 1
        });
    }
  });
  return steps;
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  activeSessionId: null,
  activeWorkoutId: null,
  activeAssignmentId: null,
  workoutState: 'idle',
  logs: [],
  flatSessionPlan: [],
  currentStepIndex: 0,
  restTimeRemaining: 0,

  startSession: async (sessionId, workoutId, exercises, assignmentId) => {
    const flatPlan = flattenSequence(exercises);
    set({ 
      activeSessionId: sessionId, 
      activeWorkoutId: workoutId,
      activeAssignmentId: assignmentId || null,
      workoutState: flatPlan.length > 0 ? 'active_set' : 'completed',
      flatSessionPlan: flatPlan,
      currentStepIndex: 0,
      restTimeRemaining: 0,
      logs: [] 
    });
    
    // Mark assignment as active immediately
    if (assignmentId) {
      await db.assignedWorkouts.update(assignmentId, { 
        status: 'active', 
        startedAt: Date.now(),
        syncStatus: 'local'
      });
    }

    get().saveStateToCache();
  },

  recoverSession: (stateCache) => {
     set({
        activeSessionId: stateCache.sessionId,
        activeWorkoutId: stateCache.activeWorkoutId,
        workoutState: stateCache.workoutState,
        flatSessionPlan: stateCache.flatSessionPlan,
        currentStepIndex: stateCache.currentStepIndex,
        restTimeRemaining: stateCache.restTimeRemaining,
        // (Assignment ID isn't directly cached in sessionStateCache unless added, but we can query it)
     });
     // Optionally fetch active assignment and set it
     if (stateCache.activeWorkoutId) {
        db.assignedWorkouts.where({ workoutId: stateCache.activeWorkoutId, status: 'active' }).first().then(hw => {
           if (hw && hw.id) set({ activeAssignmentId: hw.id });
        });
     }
  },

  endSession: async () => {
    const { activeSessionId, activeAssignmentId, activeWorkoutId, logs } = get();
    
    let totalVolume = 0;
    logs.forEach(log => { 
      const weight = Number(log.weight) || 0;
      const reps = Number(log.reps) || 0;
      totalVolume += (weight * reps); 
    });

    let finalDuration = 0;

    if (activeSessionId) {
       const sessionRecord = await db.sessions.get(activeSessionId);
       if (sessionRecord) {
           finalDuration = Math.floor((Date.now() - sessionRecord.startTime) / 1000);
       }
       await db.sessions.update(activeSessionId, { status: 'completed', endTime: Date.now() });
       await db.sessionStateCache.delete(activeSessionId);
    }

    if (activeWorkoutId) {
       await db.workoutResults.add({
          workoutId: activeWorkoutId,
          userId: 'test_user',
          assignedWorkoutId: activeAssignmentId || undefined,
          completedAt: new Date().toISOString(),
          totalVolume,
          totalDurationSeconds: finalDuration,
          syncStatus: 'local'
       });
    }
    
    if (activeAssignmentId) {
       await db.assignedWorkouts.update(activeAssignmentId, {
          status: 'completed',
          completedAt: Date.now(),
          syncStatus: 'local'
       });
    }

    set({ 
      activeSessionId: null, 
      activeWorkoutId: null,
      activeAssignmentId: null,
      workoutState: 'idle',
      flatSessionPlan: [],
      currentStepIndex: 0,
      restTimeRemaining: 0,
      logs: [] 
    });
  },

  completeSet: async (weight: number, reps: number) => {
    const state = get();
    if (state.workoutState !== 'active_set') return;

    const currentStep = state.flatSessionPlan[state.currentStepIndex];
    if (!currentStep) return;

    // 1. Log the set
    const newLog: SetLog = {
      sessionId: state.activeSessionId!,
      exerciseId: currentStep.exerciseId,
      weight,
      reps,
      timestamp: Date.now(),
      synced: 0,
    };
    
    // Save to Dexie & update logs array locally
    const id = await db.setLogs.add(newLog);
    set(s => ({ logs: [...s.logs, { ...newLog, id }] }));
    
    // Trigger sync silently
    get().syncLogs();

    // 2. Automate Transition
    if (state.currentStepIndex >= state.flatSessionPlan.length - 1) {
       // Everything is done
       set({ workoutState: 'completed', restTimeRemaining: 0 });
    } else {
       // Progress to rest
       set({ 
          workoutState: 'resting', 
          restTimeRemaining: currentStep.restTime 
       });
    }

    get().saveStateToCache();
  },

  skipRest: () => {
     const state = get();
     if (state.workoutState !== 'resting') return;
     
     // Advance immediately to next step
     set({ 
       workoutState: 'active_set', 
       currentStepIndex: state.currentStepIndex + 1,
       restTimeRemaining: 0 
     });

     get().saveStateToCache();
  },

  extendRest: (seconds) => {
     const state = get();
     if (state.workoutState === 'resting') {
        set({ restTimeRemaining: state.restTimeRemaining + seconds });
        get().saveStateToCache();
     }
  },

  tickRest: () => {
     const state = get();
     if (state.workoutState === 'resting' && state.restTimeRemaining > 0) {
        if (state.restTimeRemaining <= 1) {
           // Auto transition out of rest
           set({ 
             workoutState: 'active_set', 
             restTimeRemaining: 0,
             currentStepIndex: state.currentStepIndex + 1
           });
           get().saveStateToCache();
        } else {
           set({ restTimeRemaining: state.restTimeRemaining - 1 });
           // Save less frequently if needed, or don't save every tick to save DB IO
           // We could save only on transition, but resting state is good to save
           if (state.restTimeRemaining % 5 === 0) get().saveStateToCache();
        }
     }
  },

  saveStateToCache: async () => {
     const state = get();
     if (!state.activeSessionId) return;

     await db.sessionStateCache.put({
        sessionId: state.activeSessionId,
        activeWorkoutId: state.activeWorkoutId!,
        workoutState: state.workoutState,
        currentStepIndex: state.currentStepIndex,
        restTimeRemaining: state.restTimeRemaining,
        flatSessionPlan: state.flatSessionPlan,
        timestamp: Date.now()
     });
  },

  syncLogs: async () => {
    try {
      const unsyncedLogs = await db.setLogs.where('synced').equals(0).toArray();
      if (unsyncedLogs.length === 0) return;

      const { error } = await supabase.from('set_logs').insert(
        unsyncedLogs.map(log => ({
          session_id: log.sessionId,
          exercise_id: log.exerciseId,
          weight: log.weight,
          reps: log.reps,
          timestamp: new Date(log.timestamp).toISOString()
        }))
      );

      if (error) throw error;

      const syncedIds = unsyncedLogs.map(l => l.id!).filter(Boolean);
      await Promise.all(
        syncedIds.map(id => db.setLogs.update(id, { synced: 1 }))
      );
      
    } catch (error) {
      console.warn('Sync failed. Will retry later:', error);
    }
  },
}));