import { db } from '@/lib/db/dexie';
import type { EventPayload } from '@/types';
import type { GymEvent, SyncQueue } from '@/lib/db/schema';
import { deterministicId, generateIdempotencyKey } from './id';

export type CreateEventInput = EventPayload & {
  tenant_id: string;
  device_id: string;
  user_id: string;
};

export async function createEvent(input: CreateEventInput): Promise<GymEvent> {
  const idempotency_key = generateIdempotencyKey(input, input.tenant_id, input.device_id);
  const id = deterministicId(idempotency_key);

  // Idempotency guard — same action on retry returns the existing event
  const existing = await db.events.get(id);
  if (existing) return existing;

  const now = new Date().toISOString();

  const event: GymEvent = {
    id,
    type: input.type,
    payload: input.payload,
    session_id: input.payload.session_id,
    user_id: input.user_id,
    tenant_id: input.tenant_id,
    device_id: input.device_id,
    idempotency_key,
    created_at: now,
    sync_state: 'pending',
    version: 1,
  };

  const syncEntry: SyncQueue = {
    id: deterministicId(idempotency_key + ':sync'),
    event_id: id,
    status: 'pending',
    attempts: 0,
    next_retry_at: null,
    last_error: null,
    created_at: now,
    updated_at: now,
  };

  // Atomic write — event + sync_queue entry together or not at all.
  // Catch ConstraintError to handle the TOCTOU window between the
  // idempotency check above and the add() inside the transaction.
  try {
    await db.transaction('rw', [db.events, db.sync_queue], async () => {
      await db.events.add(event);
      await db.sync_queue.add(syncEntry);
    });
  } catch (err) {
    if (err instanceof Error && err.name === 'ConstraintError') {
      const raceExisting = await db.events.get(id);
      if (raceExisting) return raceExisting;
    }
    throw err;
  }

  return event;
}
