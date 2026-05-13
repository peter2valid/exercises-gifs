import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/supabase/server';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { hasGymRole } from '@/lib/auth/roles';

export async function POST(req: Request): Promise<NextResponse> {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { templateId, gymId, email } = body;

  if (!templateId || !gymId || !email) {
    return NextResponse.json({ error: 'templateId, gymId, and email required' }, { status: 400 });
  }

  const allowed = await hasGymRole(user.id, gymId, 'trainer');
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const admin = getAdminSupabase();

  // Look up user by email via auth admin
  const { data: { users }, error: listErr } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (listErr) return NextResponse.json({ error: 'Could not look up users.' }, { status: 500 });

  const target = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
  if (!target) {
    return NextResponse.json({ error: `No account found for ${email}` }, { status: 404 });
  }

  // Verify target is a member of this gym
  const { data: memberRole } = await admin
    .from('user_gym_roles')
    .select('id')
    .eq('user_id', target.id)
    .eq('gym_id', gymId)
    .maybeSingle();

  if (!memberRole) {
    return NextResponse.json({ error: `${email} is not a member of this gym.` }, { status: 404 });
  }

  const { error } = await admin
    .from('template_assignments')
    .upsert(
      { template_id: templateId, assigned_to: target.id, assigned_by: user.id, gym_id: gymId },
      { onConflict: 'template_id,assigned_to', ignoreDuplicates: true },
    );

  if (error) {
    console.error('[programs] assign:', error);
    return NextResponse.json({ error: 'Assignment failed.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
