import { NextResponse } from 'next/server';
import { getUserFromRequest, getAdminSupabase } from '@/lib/supabase/server';
import type { EventType } from '@/types';

const VALID_EVENT_TYPES = new Set<EventType>([
  'SESSION_STARTED',
  'SET_LOGGED',
  'REST_STARTED',
  'SESSION_COMPLETED',
  'SET_EDITED',
  'SET_DELETED',
  'MEMBER_CHECKED_IN',
]);

type PushFailure = { id: string; error: string; retryable: boolean };

function validateEvent(e: any, userId: string): string | null {
  if (!e || typeof e !== 'object') return 'Event must be an object';
  if (typeof e.id !== 'string' || !e.id) return 'Missing id';
  if (!VALID_EVENT_TYPES.has(e.type)) return `Unknown event type: ${e.type}`;
  if (!e.payload || typeof e.payload !== 'object') return 'Missing payload';
  if (typeof e.idempotency_key !== 'string' || !e.idempotency_key) return 'Missing idempotency_key';
  if (typeof e.created_at !== 'string' || !e.created_at) return 'Missing created_at';
  if (typeof e.session_id !== 'string' || !e.session_id) return 'Missing session_id';

  // Payload-level validation for set-mutating events
  if (e.type === 'SET_LOGGED' || e.type === 'SET_EDITED') {
    const { weight, reps } = e.payload;
    if (typeof weight !== 'number' || !isFinite(weight) || weight < 0) return 'payload.weight must be a finite number >= 0';
    if (typeof reps !== 'number' || !isFinite(reps) || reps < 1) return 'payload.reps must be a finite number >= 1';
  }

  return null;
}

export async function POST(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { events } = body;

    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ error: 'events must be a non-empty array' }, { status: 400 });
    }

    if (events.length > 200) {
      return NextResponse.json({ error: 'Batch too large (max 200)' }, { status: 400 });
    }

    // Partition valid vs invalid events before touching DB
    const validEvents: any[] = [];
    const failures: PushFailure[] = [];

    for (const e of events) {
      const err = validateEvent(e, userId);
      if (err) {
        failures.push({ id: e?.id ?? 'unknown', error: err, retryable: false });
      } else {
        validEvents.push(e);
      }
    }

    if (validEvents.length === 0) {
      return NextResponse.json({
        success: false,
        synced_ids: [],
        failed_ids: failures,
      });
    }

    const adminClient = getAdminSupabase();

    const eventsToInsert = validEvents.map(e => ({
      id: e.id,
      type: e.type,
      payload: e.payload,
      session_id: e.session_id,
      tenant_id: e.tenant_id || 'default',
      device_id: e.device_id,
      user_id: userId, // always force to authenticated user
      idempotency_key: e.idempotency_key,
      created_at: e.created_at,
      version: e.version || 1,
    }));

    const { error } = await adminClient
      .from('events')
      .upsert(eventsToInsert, {
        onConflict: 'idempotency_key',
        ignoreDuplicates: true,
      });

    if (error) {
      console.error('[sync/push] Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      synced_ids: validEvents.map(e => e.id),
      failed_ids: failures,
    });
  } catch (err) {
    console.error('[sync/push] Fatal error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
