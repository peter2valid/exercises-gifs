import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/supabase/server';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { hasGymRole } from '@/lib/auth/roles';

// DELETE /api/admin/gym/staff — remove a staff member's role
export async function DELETE(req: Request): Promise<NextResponse> {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { roleId, gymId } = body;
  if (!roleId || !gymId) return NextResponse.json({ error: 'roleId and gymId required' }, { status: 400 });

  const allowed = await hasGymRole(user.id, gymId, 'gym_owner');
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const admin = getAdminSupabase();

  // Prevent removing yourself
  const { data: target } = await admin
    .from('user_gym_roles')
    .select('user_id, role')
    .eq('id', roleId)
    .eq('gym_id', gymId)
    .maybeSingle();

  if (!target) return NextResponse.json({ error: 'Role not found.' }, { status: 404 });
  if (target.user_id === user.id) {
    return NextResponse.json({ error: 'You cannot remove yourself.' }, { status: 400 });
  }
  if (target.role === 'gym_owner') {
    return NextResponse.json({ error: 'Cannot remove the gym owner.' }, { status: 400 });
  }

  await admin.from('user_gym_roles').delete().eq('id', roleId).eq('gym_id', gymId);

  return NextResponse.json({ ok: true });
}
