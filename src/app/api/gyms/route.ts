import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/supabase/server';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { getUserRoles } from '@/lib/auth/roles';

export async function POST(req: Request): Promise<NextResponse> {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const roles = await getUserRoles(user.id);
  if (roles.some(r => r.role === 'gym_owner')) {
    return NextResponse.json({ error: 'You already own a gym.' }, { status: 409 });
  }

  const body = await req.json().catch(() => ({}));
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const type = typeof body.type === 'string' ? body.type.trim() : null;
  const location = typeof body.location === 'string' ? body.location.trim() : null;

  if (name.length < 2 || name.length > 80) {
    return NextResponse.json({ error: 'Gym name must be 2–80 characters.' }, { status: 400 });
  }

  // Generate a basic slug
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  const admin = getAdminSupabase();

  const { data: gym, error: gymErr } = await admin
    .from('gyms')
    .insert({
      name,
      slug,
      type: type || null,
      location: location || null,
      owner_id: user.id
    })
    .select('id, name')
    .single();

  if (gymErr || !gym) {
    console.error('[gyms] create:', gymErr);
    return NextResponse.json({ error: 'Could not create gym.' }, { status: 500 });
  }

  const { error: roleErr } = await admin
    .from('user_gym_roles')
    .insert({ user_id: user.id, gym_id: gym.id, role: 'gym_owner' });

  if (roleErr) {
    console.error('[gyms] role assign:', roleErr);
    await admin.from('gyms').delete().eq('id', gym.id);
    return NextResponse.json({ error: 'Could not assign owner role.' }, { status: 500 });
  }

  return NextResponse.json({ gym }, { status: 201 });
}
