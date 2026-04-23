import { db } from './dexie';

export async function seedDatabase(): Promise<void> {
  // Foundation placeholder: no default seed data yet.
  await db.transaction('rw', db.events, async () => {
    // Intentionally left blank.
  });
}
