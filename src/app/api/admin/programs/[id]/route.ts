import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/supabase/server';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { hasGymRole } from '@/lib/auth/roles';

type Params = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Params): Promise<NextResponse> {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const admin = getAdminSupabase();

  const { data: program } = await admin
    .from('templates')
    .select('id, name, description, gym_id, created_by, created_at, template_exercises(id, exercise_id, exercise_name, sets, reps, rest_seconds, ord)')
    .eq('id', id)
    .maybeSingle();

  if (!program) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

  const allowed = await hasGymRole(user.id, program.gym_id, 'trainer');
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  return NextResponse.json({ program });
}

export async function PUT(req: Request, { params }: Params): Promise<NextResponse> {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const admin = getAdminSupabase();

  const { data: existing } = await admin.from('templates').select('gym_id').eq('id', id).maybeSingle();
  if (!existing) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

  const allowed = await hasGymRole(user.id, existing.gym_id, 'trainer');
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const { name, description } = body;
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return NextResponse.json({ error: 'Name required.' }, { status: 400 });
  }

  const { data, error } = await admin
    .from('templates')
    .update({ name: name.trim(), description: description?.trim() ?? null, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('id, name, description')
    .single();

  if (error) return NextResponse.json({ error: 'Update failed.' }, { status: 500 });
  return NextResponse.json({ program: data });
}

export async function DELETE(req: Request, { params }: Params): Promise<NextResponse> {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const admin = getAdminSupabase();

  const { data: existing } = await admin.from('templates').select('gym_id').eq('id', id).maybeSingle();
  if (!existing) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

  const allowed = await hasGymRole(user.id, existing.gym_id, 'gym_admin');
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await admin.from('templates').delete().eq('id', id);
  return NextResponse.json({ ok: true });
}
