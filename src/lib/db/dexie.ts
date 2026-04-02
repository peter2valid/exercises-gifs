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

export class AppDatabase extends Dexie {
  exercises!: Table<Exercise>;

  constructor() {
    super('SupaFastGymDB');
    this.version(8).stores({
      exercises: 'id, name, body_part, target_muscles'
    });
  }
}

export const db = new AppDatabase();
