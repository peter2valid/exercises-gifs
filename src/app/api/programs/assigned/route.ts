import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/supabase/server';
import { getAdminSupabase } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(req: Request): Promise<NextResponse> {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = getAdminSupabase();

  // Find all template_assignments for this user
  const { data: assignments, error: assignErr } = await admin
    .from('template_assignments')
    .select('template_id')
    .eq('assigned_to', user.id);

  if (assignErr) {
    console.error('[programs/assigned] error fetching assignments:', assignErr);
    return NextResponse.json({ error: 'Could not fetch assigned programs' }, { status: 500 });
  }

  if (!assignments || assignments.length === 0) {
    return NextResponse.json({ programs: [] });
  }

  const templateIds = assignments.map(a => a.template_id);

  const { data: programs, error: progErr } = await admin
    .from('templates')
    .select('id, name, description, gym_id, created_at, template_exercises(id, exercise_id, exercise_name, sets, reps, rest_seconds, ord)')
    .in('id', templateIds)
    .order('created_at', { ascending: false });

  if (progErr) {
    console.error('[programs/assigned] error fetching templates:', progErr);
    return NextResponse.json({ error: 'Could not fetch programs' }, { status: 500 });
  }

  return NextResponse.json({ programs: programs ?? [] });
}
