import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/supabase/server';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { parseQrPayload } from '@/lib/qr/token';
import { hasGymRole } from '@/lib/auth/roles';

export async function POST(req: Request): Promise<NextResponse> {
  const staff = await getUserFromRequest(req);
  if (!staff) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { qrPayload, gymId } = body;

  if (!qrPayload || !gymId) {
    return NextResponse.json({ error: 'qrPayload and gymId required' }, { status: 400 });
  }

  // Staff must be at least a trainer for this gym
  const allowed = await hasGymRole(staff.id, gymId, 'trainer');
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

  const { data, error } = await admin
    .from('member_check_ins')
    .insert({
      id: crypto.randomUUID(),
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

  const allowed = await hasGymRole(staff.id, gymId, 'trainer');
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

  const { data, error } = await admin
    .from('member_check_ins')
    .insert({
      id: crypto.randomUUID(),
      gym_id: gymId,
      member_user_id: memberId,
      checked_in_at: new Date().toISOString(),
      method: 'manual',
      staff_user_id: staff.id,
    })
    .select('id, member_user_id, checked_in_at')
    .single();

  if (error) {
    console.error('[checkin] manual insert:', error);
    return NextResponse.json({ error: 'Could not record check-in.' }, { status: 500 });
  }

  return NextResponse.json({ checkIn: data });
}
