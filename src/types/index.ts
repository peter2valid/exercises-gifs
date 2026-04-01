export interface Exercise {
  id: string;
  name: string;
  body_part: string;
  equipment: string;
  instructions: string;
  target_muscles: string;
  gif_url: string;
  created_at?: string;
}

export interface WorkoutSession {
  id: string;
  startTime: number;
  endTime?: number;
  status: 'active' | 'completed';
}

export interface SetLog {
  id: string;
  sessionId: string;
  exerciseId: string;
  reps: number;
  weight: number;
  timestamp: number;
}

export interface SyncQueueItem {
  id: string;
  type: 'workout' | 'set';
  operation: 'insert' | 'update' | 'delete';
  payload: any;
  timestamp: number;
}