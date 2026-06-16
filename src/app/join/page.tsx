import { redirect } from 'next/navigation';
import { getServerSupabase } from '@/lib/supabase/server';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { JoinSearchClient } from './JoinSearchClient';
import { JoinSuccessClient } from './JoinSuccessClient';

export const dynamic = 'force-dynamic';

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ gymId?: string }>;
}) {
  const { gymId } = await searchParams;
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const next = gymId ? `/join?gymId=${encodeURIComponent(gymId)}` : '/join';
    redirect(`/auth?next=${encodeURIComponent(next)}`);
  }

  // Auto-join flow when arriving from a gym QR scan
  if (gymId) {
    const admin = getAdminSupabase();

    const { data: gym } = await admin
      .from('gyms')
      .select('id, name')
      .eq('id', gymId)
      .maybeSingle();

    if (!gym) redirect('/explore');

    const { data: existing } = await admin
      .from('gym_memberships')
      .select('status')
      .eq('user_id', user.id)
      .eq('gym_id', gymId)
      .maybeSingle();

    if (!existing) {
      await admin.from('gym_memberships').insert({
        user_id: user.id,
        gym_id: gymId,
        status: 'pending',
        role: 'member',
      });
    }

    return <JoinSuccessClient gymName={gym.name} alreadyMember={!!existing} />;
  }

  // Manual search flow (no gymId in URL)
  return <JoinSearchClient preselectedGym={null} />;
}
