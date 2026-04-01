import { create } from 'zustand';

export interface DraftExercise {
  draftId: string;
  exerciseId: string;
  name: string;
  body_part: string;
  sets: number;
  targetReps: number;
  restTime: number; // seconds
  supersetId?: string; // Links exercises sharing this ID
  isSection?: boolean; // If true, rendering swaps to a Section Header Block
}

interface BuilderState {
  workoutName: string;
  exercises: DraftExercise[];
  
  // Actions
  setWorkoutName: (name: string) => void;
  addExercise: (ex: { id: string; name: string; body_part: string }) => void;
  addSection: (name: string) => void;
  duplicateExercise: (draftId: string) => void;
  removeExercise: (draftId: string) => void;
  updateExercise: (draftId: string, field: keyof DraftExercise, value: any) => void;
  toggleSuperset: (draftId: string) => void;
  reorderExercises: (activeIndex: number, overIndex: number) => void;
  clearDraft: () => void;
  overwriteState: (state: Partial<BuilderState>) => void;
}

export const useBuilderStore = create<BuilderState>((set) => ({
  workoutName: '',
  exercises: [],

  setWorkoutName: (workoutName) => set({ workoutName }),

  addExercise: (ex) => set((state) => {
    // Smart Defaults based on Exercise Category
    // E.g., compound body parts generally require more rest and fewer target reps
    const bodyPartStr = (ex.body_part || '').toLowerCase();
    const isCompound = ['chest', 'back', 'legs'].includes(bodyPartStr);
    const isBodyweight = ['waist', 'cardio'].includes(bodyPartStr);
    
    let defaultReps = 10;
    let defaultRest = 60;
    
    if (isCompound) {
       defaultReps = 8;
       defaultRest = 90;
    } else if (isBodyweight) {
       defaultReps = 15;
       defaultRest = 45;
    }

    return {
      exercises: [...state.exercises, {
        draftId: Math.random().toString(36).substring(2, 9),
        exerciseId: ex.id,
        name: ex.name,
        body_part: ex.body_part,
        sets: 3,
        targetReps: defaultReps,
        restTime: defaultRest
      }]
    };
  }),

  addSection: (name) => set((state) => ({
     exercises: [...state.exercises, {
        draftId: Math.random().toString(36).substring(2, 9),
        exerciseId: 'section_break',
        name: name,
        body_part: 'section',
        sets: 0,
        targetReps: 0,
        restTime: 0,
        isSection: true
     }]
  })),

  duplicateExercise: (draftId) => set((state) => {
     const currentIndex = state.exercises.findIndex(e => e.draftId === draftId);
     if (currentIndex === -1) return state;
     const target = state.exercises[currentIndex];
     
     const clone: DraftExercise = {
        ...target,
        draftId: Math.random().toString(36).substring(2, 9),
        supersetId: undefined // Don't auto-superset the clone 
     };
     
     const list = [...state.exercises];
     list.splice(currentIndex + 1, 0, clone);
     return { exercises: list };
  }),

  removeExercise: (draftId) => set((state) => ({
    exercises: state.exercises.filter(e => e.draftId !== draftId)
  })),

  updateExercise: (draftId, field, value) => set((state) => ({
    exercises: state.exercises.map(ex => 
      ex.draftId === draftId ? { ...ex, [field]: value } : ex
    )
  })),

  toggleSuperset: (draftId) => set((state) => {
     const list = [...state.exercises];
     const idx = list.findIndex(e => e.draftId === draftId);
     if (idx < 1) return state; // Can't superset the very first item alone
     
     const current = list[idx];
     const previous = list[idx - 1];
     
     // Link them using a shared superset hash
     const shareId = previous.supersetId || Math.random().toString(36).substring(2, 9);
     
     if (current.supersetId === shareId) {
        // Toggle OFF
        return { exercises: list.map(e => e.draftId === draftId ? { ...e, supersetId: undefined } : e) };
     } else {
        // Toggle ON
        return { exercises: list.map((e, i) => i === idx || i === idx - 1 ? { ...e, supersetId: shareId } : e) };
     }
  }),

  reorderExercises: (activeIndex, overIndex) => set((state) => {
    if (activeIndex < 0 || activeIndex >= state.exercises.length || overIndex < 0 || overIndex >= state.exercises.length) {
       return state;
    }
    const list = [...state.exercises];
    const [moved] = list.splice(activeIndex, 1);
    list.splice(overIndex, 0, moved);
    return { exercises: list };
  }),

  clearDraft: () => set({ workoutName: '', exercises: [] }),
  overwriteState: (newState) => set((state) => ({
     workoutName: newState.workoutName ?? state.workoutName,
     exercises: Array.isArray(newState.exercises) ? newState.exercises : state.exercises
  }))
}));
