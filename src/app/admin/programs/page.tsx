import { requireAdminAccess } from '@/lib/admin/access';
import { getAdminSupabase } from '@/lib/supabase/server';
import { ProgramsClient } from './ProgramsClient';

export const dynamic = 'force-dynamic';

export default async function ProgramsPage() {
  const { gymId } = await requireAdminAccess();

  if (!gymId) {
    return <div className="text-[#555] text-sm">No gym associated with this account.</div>;
  }

  const admin = getAdminSupabase();

  const { data: programs } = await admin
    .from('templates')
    .select('id, name, description, created_by, created_at, template_exercises(id, exercise_id, exercise_name)')
    .eq('gym_id', gymId)
    .order('created_at', { ascending: false });

  const programIds = (programs ?? []).map((program) => program.id);

  const [assignmentsRes, usersRes] = await Promise.all([
    programIds.length
      ? admin.from('template_assignments').select('template_id, assigned_to, assigned_by').in('template_id', programIds)
      : { data: [] },
    admin.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  const userDirectory = (usersRes.data?.users ?? []).map((user) => ({
    id: user.id,
    email: user.email ?? null,
    name: (user.user_metadata?.full_name as string | undefined) ?? null,
  }));

  const { data: exercises } = await admin
    .from('exercises')
    .select('id, name, body_part')
    .order('name');

  const assignments = (assignmentsRes.data ?? []) as { template_id: string; assigned_to: string; assigned_by: string | null }[];

  return (
    <ProgramsClient
      gymId={gymId}
      initialPrograms={(programs ?? []) as any[]}
      assignments={assignments}
      userDirectory={userDirectory}
      exercises={(exercises ?? []) as { id: string; name: string; body_part: string }[]}
    />
  );
}
