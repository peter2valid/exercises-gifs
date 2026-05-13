import { requireAdminAccess } from '@/lib/admin/access';
import { getAdminSupabase } from '@/lib/supabase/server';
import { ProgramsClient } from './ProgramsClient';

export const dynamic = 'force-dynamic';

export default async function ProgramsPage() {
  const { gymId } = await requireAdminAccess();
  const admin = getAdminSupabase();

  const { data: programs } = await admin
    .from('templates')
    .select('id, name, description, created_at, template_exercises(id)')
    .eq('gym_id', gymId ?? '')
    .order('created_at', { ascending: false });

  // Fetch exercises for the picker
  const { data: exercises } = await admin
    .from('exercises')
    .select('id, name, body_part')
    .order('name');

  return (
    <ProgramsClient
      gymId={gymId ?? ''}
      initialPrograms={(programs ?? []) as any[]}
      exercises={(exercises ?? []) as { id: string; name: string; body_part: string }[]}
    />
  );
}
