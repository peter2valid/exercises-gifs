import Dexie, { type Table } from 'dexie';

export interface Exercise {
  id: string;
  name: string;
  body_part: string;
  equipment: string;
  instructions: string;
  target_muscles: string;
  video_url: string;
}

export interface Workout {
  id?: number;
  name: string;
  type: string;
}

export interface WorkoutExercise {
  id?: number;
  workoutId: number;
  exerciseId: string;
  sets: number;
  targetReps: number;
  restTime: number; // in seconds
  order: number;
}

export interface AssignedWorkout {
  id?: number;
  userId: string;
  workoutId: number;
  assignedBy?: string;
  dateScheduled: string; // ISO format YYYY-MM-DD
  status: 'pending' | 'active' | 'completed' | 'skipped';
  startedAt?: number;
  completedAt?: number;
  syncStatus: 'local' | 'synced';
  priority: number;
}

export interface WorkoutSession {
  id?: number;
  workoutId: number;
  currentExerciseIndex: number; // Stays for legacy reference but mostly superseded by SessionStateCache
  startTime: number;
  endTime?: number;
  status: 'active' | 'completed';
}

export type WorkoutStateEnum = 'idle' | 'active_set' | 'resting' | 'transition' | 'completed';

export interface SessionStateCache {
  sessionId: number;
  activeWorkoutId: number;
  workoutState: WorkoutStateEnum;
  currentStepIndex: number;
  restTimeRemaining: number;
  flatSessionPlan: any; 
  timestamp: number;
}

export interface WorkoutResult {
  id?: number;
  workoutId: number;
  userId: string;
  assignedWorkoutId?: number;
  completedAt: string;
  totalVolume: number; // lbs/kg lifted
  totalDurationSeconds: number;
  syncStatus: 'local' | 'synced';
}

export interface SetLog {
  id?: number;
  sessionId: number;
  exerciseId: string;
  weight: number;
  reps: number;
  timestamp: number;
  synced: 0 | 1; // 0 for offline, 1 for synced
}

export class AppDatabase extends Dexie {
  exercises!: Table<Exercise>;
  workouts!: Table<Workout>;
  workoutExercises!: Table<WorkoutExercise>;
  sessions!: Table<WorkoutSession>;
  setLogs!: Table<SetLog>;
  sessionStateCache!: Table<SessionStateCache>;
  assignedWorkouts!: Table<AssignedWorkout>;
  workoutResults!: Table<WorkoutResult>;

  constructor() {
    super('SupaFastGymDB');
    this.version(7).stores({
      exercises: 'id, name, body_part, target_muscles',
      workouts: '++id, name, type',
      workoutExercises: '++id, workoutId, exerciseId, order',
      sessions: '++id, workoutId, startTime, status',
      setLogs: '++id, sessionId, exerciseId, timestamp, synced',
      sessionStateCache: 'sessionId',
      assignedWorkouts: '++id, userId, workoutId, [status+dateScheduled], syncStatus',
      workoutResults: '++id, workoutId, userId, syncStatus'
    });

    this.on('populate', async () => {
      // Create a mock workout for testing the engine
      const workoutId = await this.workouts.add({ name: 'Chest & Core Demo', type: 'strength' });
      await this.workoutExercises.bulkAdd([
        { workoutId, exerciseId: '0001', sets: 3, targetReps: 12, restTime: 60, order: 1 }, // 3/4 sit-up
        { workoutId, exerciseId: '0002', sets: 3, targetReps: 15, restTime: 45, order: 2 }, // 45 side bend
      ]);
    });
  }
}

export const db = new AppDatabase();