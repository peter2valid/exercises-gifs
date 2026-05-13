import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/supabase/server';
import { getAdminSupabase } from '@/lib/supabase/admin';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
): Promise<NextResponse> {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { token } = await params;
  const admin = getAdminSupabase();

  const { data: invite } = await admin
    .from('gym_invitations')
    .select('id, gym_id, role, accepted_at, expires_at')
    .eq('token', token)
    .maybeSingle();

  if (!invite) return NextResponse.json({ error: 'Invitation not found.' }, { status: 404 });
  if (invite.accepted_at) return NextResponse.json({ error: 'Invitation already used.' }, { status: 409 });
  if (new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Invitation has expired.' }, { status: 410 });
  }

  const { error: roleErr } = await admin
    .from('user_gym_roles')
    .upsert(
      { user_id: user.id, gym_id: invite.gym_id, role: invite.role },
      { onConflict: 'user_id,gym_id,role', ignoreDuplicates: true },
    );

  if (roleErr) {
    console.error('[invite] accept:', roleErr);
    return NextResponse.json({ error: 'Could not assign role.' }, { status: 500 });
  }

  if (invite.role === 'member') {
    await admin
      .from('gym_memberships')
      .upsert(
        { user_id: user.id, gym_id: invite.gym_id, role: 'member' },
        { onConflict: 'user_id,gym_id', ignoreDuplicates: true },
      );
  }

  await admin
    .from('gym_invitations')
    .update({ accepted_at: new Date().toISOString() })
    .eq('id', invite.id);

  const redirectTo = invite.role === 'member' ? '/home' : '/admin';
  return NextResponse.json({ redirectTo, gymId: invite.gym_id });
}
