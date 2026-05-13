import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/supabase/server';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { hasGymRole } from '@/lib/auth/roles';

export const dynamic = 'force-dynamic';

export async function PUT(req: Request): Promise<NextResponse> {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { gymId: string; name: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { gymId, name } = body;
  if (!gymId || typeof gymId !== 'string') return NextResponse.json({ error: 'gymId required' }, { status: 400 });
  const trimmed = (name ?? '').trim();
  if (!trimmed || trimmed.length < 2) return NextResponse.json({ error: 'Gym name must be at least 2 characters' }, { status: 400 });
  if (trimmed.length > 80) return NextResponse.json({ error: 'Gym name too long (max 80 characters)' }, { status: 400 });

  const allowed = await hasGymRole(user.id, gymId, 'gym_admin');
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const admin = getAdminSupabase();
  const { error } = await admin.from('gyms').update({ name: trimmed, updated_at: new Date().toISOString() }).eq('id', gymId);

  if (error) {
    console.error('[admin/gym] update error:', error);
    return NextResponse.json({ error: 'Failed to update gym name' }, { status: 500 });
  }

  return NextResponse.json({ success: true, name: trimmed });
}
