import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/supabase/server';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { hasGymRole } from '@/lib/auth/roles';

type Params = { params: Promise<{ id: string }> };

async function getGymIdForTemplate(templateId: string): Promise<string | null> {
  const admin = getAdminSupabase();
  const { data } = await admin.from('templates').select('gym_id').eq('id', templateId).maybeSingle();
  return data?.gym_id ?? null;
}

export async function POST(req: Request, { params }: Params): Promise<NextResponse> {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: templateId } = await params;
  const gymId = await getGymIdForTemplate(templateId);
  if (!gymId) return NextResponse.json({ error: 'Program not found.' }, { status: 404 });

  const allowed = await hasGymRole(user.id, gymId, 'trainer');
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const { exerciseId, exerciseName, sets, reps, restSeconds, ord } = body;

  if (!exerciseId || !exerciseName) {
    return NextResponse.json({ error: 'exerciseId and exerciseName required' }, { status: 400 });
  }

  const admin = getAdminSupabase();

  // Get current max ord
  const { data: existing } = await admin
    .from('template_exercises')
    .select('ord')
    .eq('template_id', templateId)
    .order('ord', { ascending: false })
    .limit(1);
  const nextOrd = ord ?? ((existing?.[0]?.ord ?? -1) + 1);

  const { data, error } = await admin
    .from('template_exercises')
    .insert({
      template_id: templateId,
      exercise_id: exerciseId,
      exercise_name: exerciseName,
      sets: sets ?? 3,
      reps: reps ?? 10,
      rest_seconds: restSeconds ?? 90,
      ord: nextOrd,
    })
    .select()
    .single();

  if (error || !data) {
    console.error('[programs] add exercise:', error);
    return NextResponse.json({ error: 'Could not add exercise.' }, { status: 500 });
  }

  return NextResponse.json({ exercise: data }, { status: 201 });
}

export async function DELETE(req: Request, { params }: Params): Promise<NextResponse> {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: templateId } = await params;
  const gymId = await getGymIdForTemplate(templateId);
  if (!gymId) return NextResponse.json({ error: 'Program not found.' }, { status: 404 });

  const allowed = await hasGymRole(user.id, gymId, 'trainer');
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const { exerciseRowId } = body;
  if (!exerciseRowId) return NextResponse.json({ error: 'exerciseRowId required' }, { status: 400 });

  const admin = getAdminSupabase();
  await admin.from('template_exercises').delete().eq('id', exerciseRowId).eq('template_id', templateId);

  return NextResponse.json({ ok: true });
}
