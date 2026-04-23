import { create } from 'zustand';

type WorkoutPhase = 'idle' | 'active' | 'resting' | 'finished' | 'abandoned';

type WorkoutStore = {
  phase: WorkoutPhase;
  setPhase: (phase: WorkoutPhase) => void;
  reset: () => void;
};

export const useWorkoutStore = create<WorkoutStore>((set) => ({
  phase: 'idle',
  setPhase: (phase) => set({ phase }),
  reset: () => set({ phase: 'idle' }),
}));
