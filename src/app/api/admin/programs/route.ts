import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/supabase/server';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { hasGymRole } from '@/lib/auth/roles';

export async function GET(req: Request): Promise<NextResponse> {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const gymId = searchParams.get('gymId');
  if (!gymId) return NextResponse.json({ error: 'gymId required' }, { status: 400 });

  const allowed = await hasGymRole(user.id, gymId, 'trainer');
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const admin = getAdminSupabase();
  const { data } = await admin
    .from('templates')
    .select('id, name, description, created_by, created_at, template_exercises(id)')
    .eq('gym_id', gymId)
    .order('created_at', { ascending: false });

  return NextResponse.json({ programs: data ?? [] });
}

export async function POST(req: Request): Promise<NextResponse> {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { gymId, name, description } = body;

  if (!gymId || typeof gymId !== 'string') return NextResponse.json({ error: 'gymId required' }, { status: 400 });
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return NextResponse.json({ error: 'Program name must be at least 2 characters.' }, { status: 400 });
  }

  const allowed = await hasGymRole(user.id, gymId, 'trainer');
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const admin = getAdminSupabase();
  const { data, error } = await admin
    .from('templates')
    .insert({ name: name.trim(), description: description?.trim() ?? null, created_by: user.id, gym_id: gymId })
    .select('id, name, description, created_at')
    .single();

  if (error || !data) {
    console.error('[programs] create:', error);
    return NextResponse.json({ error: 'Could not create program.' }, { status: 500 });
  }

  return NextResponse.json({ program: data }, { status: 201 });
}
