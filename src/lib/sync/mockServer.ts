import { type GymEvent } from '@/lib/db/schema';

/**
 * MOCK SERVER STATE (In-memory)
 * In a real app, this would be a Postgres database (Supabase).
 * For Phase 2B, we use a global singleton to simulate the server.
 */

class MockServerStore {
  private events: GymEvent[] = [];
  private idempotencyKeys = new Set<string>();
  private serverSequence = 0;

  push(events: GymEvent[]) {
    const syncedIds: string[] = [];
    const failedIds: { id: string; error: string; retryable: boolean }[] = [];

    for (const event of events) {
      // 1. Idempotency Check
      if (this.idempotencyKeys.has(event.idempotency_key)) {
        syncedIds.push(event.id);
        continue;
      }

      // 2. Global Ordering (Server-assigned sequence)
      this.serverSequence++;
      const serverEvent = {
        ...event,
        server_sequence: this.serverSequence,
        received_at: new Date().toISOString(),
      };

      // 3. Persist
      this.events.push(serverEvent as any);
      this.idempotencyKeys.add(event.idempotency_key);
      syncedIds.push(event.id);
    }

    return { success: true, synced_ids: syncedIds, failed_ids: failedIds };
  }

  pull(sinceSequence: number, tenantId: string, excludeDeviceId: string) {
    return this.events.filter(e => 
      (e as any).server_sequence > sinceSequence && 
      e.tenant_id === tenantId && 
      e.device_id !== excludeDeviceId
    );
  }
}

// Singleton for the mock server
export const mockServer = new MockServerStore();
