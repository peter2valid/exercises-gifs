import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/supabase/server';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { parseQrPayload } from '@/lib/qr/token';
import { hasAnyGymRole } from '@/lib/auth/roles';

// Roles allowed to check members in — a flat set, not a hierarchy, since
// front_desk shouldn't inherit trainer's program-management permissions.
const CHECKIN_ROLES = ['gym_owner', 'gym_admin', 'trainer', 'front_desk'] as const;

export async function POST(req: Request): Promise<NextResponse> {
  const staff = await getUserFromRequest(req);
  if (!staff) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { qrPayload, gymId } = body;

  if (!qrPayload || !gymId) {
    return NextResponse.json({ error: 'qrPayload and gymId required' }, { status: 400 });
  }

  // Staff must hold a check-in-capable role for this gym
  const allowed = await hasAnyGymRole(staff.id, gymId, [...CHECKIN_ROLES]);
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const parsed = parseQrPayload(qrPayload);
  if (!parsed) {
    return NextResponse.json({ error: 'Invalid or tampered QR code.' }, { status: 422 });
  }
  if (parsed.gymId !== gymId) {
    return NextResponse.json({ error: 'QR code is for a different gym.' }, { status: 422 });
  }

  const admin = getAdminSupabase();
  const now = new Date().toISOString();
  const checkInId = crypto.randomUUID();

  // 1. Create the projection (idempotent state for fast read)
  const { data, error } = await admin
    .from('member_check_ins')
    .insert({
      id: checkInId,
      gym_id: gymId,
      member_user_id: parsed.userId,
      checked_in_at: now,
      method: 'qr_scan',
      staff_user_id: staff.id,
    })
    .select('id, member_user_id, checked_in_at')
    .single();

  if (error) {
    console.error('[checkin] insert:', error);
    return NextResponse.json({ error: 'Could not record check-in.' }, { status: 500 });
  }

  // 2. Fire the event (append-only log for sync/audit)
  await admin.from('events').insert({
    id: crypto.randomUUID(),
    type: 'MEMBER_CHECKED_IN',
    payload: {
      check_in_id: checkInId,
      gym_id: gymId,
      member_user_id: parsed.userId,
      checked_in_at: now,
      method: 'qr_scan',
      staff_user_id: staff.id,
    },
    session_id: checkInId, // check-in is its own 'session' for event grouping
    user_id: parsed.userId,
    tenant_id: gymId,
    idempotency_key: `checkin_${checkInId}`,
  });

  return NextResponse.json({ checkIn: data });
}

// Manual check-in by staff (no QR — lookup by partial user ID or email)
export async function PUT(req: Request): Promise<NextResponse> {
  const staff = await getUserFromRequest(req);
  if (!staff) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { memberId, gymId } = body;

  if (!memberId || !gymId) {
    return NextResponse.json({ error: 'memberId and gymId required' }, { status: 400 });
  }

  const allowed = await hasAnyGymRole(staff.id, gymId, [...CHECKIN_ROLES]);
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // Verify the member actually belongs to this gym
  const admin = getAdminSupabase();
  const { data: memberRole } = await admin
    .from('user_gym_roles')
    .select('id')
    .eq('user_id', memberId)
    .eq('gym_id', gymId)
    .maybeSingle();

  if (!memberRole) {
    return NextResponse.json({ error: 'Member not found in this gym.' }, { status: 404 });
  }

  const now = new Date().toISOString();
  const checkInId = crypto.randomUUID();

  const { data, error } = await admin
    .from('member_check_ins')
    .insert({
      id: checkInId,
      gym_id: gymId,
      member_user_id: memberId,
      checked_in_at: now,
      method: 'manual',
      staff_user_id: staff.id,
    })
    .select('id, member_user_id, checked_in_at')
    .single();

  if (error) {
    console.error('[checkin] manual insert:', error);
    return NextResponse.json({ error: 'Could not record check-in.' }, { status: 500 });
  }

  // Fire the event
  await admin.from('events').insert({
    id: crypto.randomUUID(),
    type: 'MEMBER_CHECKED_IN',
    payload: {
      check_in_id: checkInId,
      gym_id: gymId,
      member_user_id: memberId,
      checked_in_at: now,
      method: 'manual',
      staff_user_id: staff.id,
    },
    session_id: checkInId,
    user_id: memberId,
    tenant_id: gymId,
    idempotency_key: `checkin_${checkInId}`,
  });

  return NextResponse.json({ checkIn: data });
}
