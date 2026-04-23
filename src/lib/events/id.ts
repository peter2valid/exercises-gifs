import type { EventPayload } from '@/types';

// FNV-1a 32-bit — fast, deterministic, no external deps
function fnv1a(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash;
}

// Format four uint32 values as a UUID-shaped string.
// Version bits → 4 (segment 3). Variant bits → 10xx (segment 4).
function toUuid(a: number, b: number, c: number, d: number): string {
  const h = (n: number, len: number) => (n >>> 0).toString(16).padStart(len, '0');
  return [
    h(a, 8),
    h(b >>> 16, 4),
    h((b & 0x0fff) | 0x4000, 4),
    h(((c >>> 16) & 0x3fff) | 0x8000, 4),
    h(c & 0xffff, 4) + h(d, 8),
  ].join('-');
}

// Given the same key, always returns the same UUID-format string.
export function deterministicId(key: string): string {
  return toUuid(
    fnv1a(key),
    fnv1a(key + '\x01'),
    fnv1a(key + '\x02'),
    fnv1a(key + '\x03'),
  );
}

function extractContext(event: EventPayload): string {
  switch (event.type) {
    case 'SESSION_STARTED':
      return `${event.payload.session_id}:${event.payload.user_id}`;
    case 'SET_LOGGED':
      return `${event.payload.session_id}:${event.payload.set_id}`;
    case 'REST_STARTED':
      // Include started_at so distinct rest periods after the same set each get
      // their own event. Without this, a second rest after the same set would
      // match the first event's key and be silently swallowed as a duplicate.
      return `${event.payload.session_id}:${event.payload.set_id}:${event.payload.started_at}`;
    case 'SESSION_COMPLETED':
      return event.payload.session_id;
    case 'SET_EDITED':
      // Include new values so distinct edits get distinct IDs,
      // while retrying the same edit remains idempotent.
      return `${event.payload.session_id}:${event.payload.set_id}:edit:${event.payload.weight}:${event.payload.reps}`;
    case 'SET_DELETED':
      return `${event.payload.session_id}:${event.payload.set_id}:delete`;
  }
}

// Stable key that uniquely identifies an action across retries.
export function generateIdempotencyKey(
  event: EventPayload,
  tenantId: string,
  deviceId: string,
): string {
  return `${event.type}:${tenantId}:${deviceId}:${extractContext(event)}`;
}
