import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/supabase/server';
import { getAdminSupabase } from '@/lib/supabase/admin';

// POST /api/gym/join — Request to join a gym (self-enrollment)
export async function POST(req: Request): Promise<NextResponse> {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { gymId, slug } = body;

  if (!gymId && !slug) {
    return NextResponse.json({ error: 'gymId or slug required' }, { status: 400 });
  }

  const admin = getAdminSupabase();
  let targetGymId = gymId;

  if (!targetGymId && slug) {
    const { data: gym } = await admin
      .from('gyms')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();
    if (!gym) return NextResponse.json({ error: 'Gym not found' }, { status: 404 });
    targetGymId = gym.id;
  }

  // Check if already a member or has a pending request
  const { data: existing } = await admin
    .from('gym_memberships')
    .select('status')
    .eq('user_id', user.id)
    .eq('gym_id', targetGymId)
    .maybeSingle();

  if (existing) {
    if (existing.status === 'active') {
      return NextResponse.json({ error: 'You are already a member of this gym.' }, { status: 409 });
    }
    if (existing.status === 'pending') {
      return NextResponse.json({ error: 'Your request to join is already pending approval.' }, { status: 409 });
    }
  }

  const { error } = await admin
    .from('gym_memberships')
    .upsert({
      user_id: user.id,
      gym_id: targetGymId,
      status: 'pending',
      role: 'member',
    }, { onConflict: 'user_id,gym_id' });

  if (error) {
    console.error('[gym/join] error:', error);
    return NextResponse.json({ error: 'Could not submit join request.' }, { status: 500 });
  }

  return NextResponse.json({ success: true, status: 'pending' });
}
