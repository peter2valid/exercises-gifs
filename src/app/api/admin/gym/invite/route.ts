import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/supabase/server';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { hasGymRole } from '@/lib/auth/roles';

const VALID_ROLES = new Set(['gym_admin', 'trainer', 'member']);

export async function POST(req: Request): Promise<NextResponse> {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { gymId, email, role } = body;

  if (!gymId || typeof gymId !== 'string') {
    return NextResponse.json({ error: 'gymId required' }, { status: 400 });
  }
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
  }
  if (!role || !VALID_ROLES.has(role)) {
    return NextResponse.json({ error: 'Role must be gym_admin, trainer, or member' }, { status: 400 });
  }

  const allowed = await hasGymRole(user.id, gymId, 'gym_admin');
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const admin = getAdminSupabase();
  const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');

  const { data: invite, error } = await admin
    .from('gym_invitations')
    .insert({
      gym_id: gymId,
      invited_by: user.id,
      email: email.toLowerCase().trim(),
      role,
      token,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select('token')
    .single();

  if (error || !invite) {
    console.error('[invite] create:', error);
    return NextResponse.json({ error: 'Could not create invitation.' }, { status: 500 });
  }

  const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  return NextResponse.json({ inviteUrl: `${APP_URL}/join/${invite.token}` });
}

export async function GET(req: Request): Promise<NextResponse> {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const gymId = searchParams.get('gymId');
  if (!gymId) return NextResponse.json({ error: 'gymId required' }, { status: 400 });

  const allowed = await hasGymRole(user.id, gymId, 'gym_admin');
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const admin = getAdminSupabase();
  const { data, error } = await admin
    .from('gym_invitations')
    .select('id, email, role, token, created_at, expires_at')
    .eq('gym_id', gymId)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[invite] list:', error);
    return NextResponse.json({ error: 'Failed to fetch invitations' }, { status: 500 });
  }

  return NextResponse.json({ invitations: data ?? [] });
}

export async function DELETE(req: Request): Promise<NextResponse> {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { inviteId, gymId } = body;
  if (!inviteId || !gymId) return NextResponse.json({ error: 'inviteId and gymId required' }, { status: 400 });

  const allowed = await hasGymRole(user.id, gymId, 'gym_admin');
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const admin = getAdminSupabase();
  await admin.from('gym_invitations').delete().eq('id', inviteId).eq('gym_id', gymId);

  return NextResponse.json({ ok: true });
}
