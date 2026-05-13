import { redirect } from 'next/navigation';
import { getServerSupabase } from '@/lib/supabase/server';
import { JoinSearchClient } from './JoinSearchClient';

export const dynamic = 'force-dynamic';

interface Gym {
  id: string;
  name: string;
  slug: string;
  type: string | null;
  location: string | null;
}

export default async function JoinSearchPage({ searchParams }: { searchParams: Promise<{ gymId?: string }> }) {
  const { gymId } = await searchParams;
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const next = gymId ? `/join?gymId=${encodeURIComponent(gymId)}` : '/join';
    redirect(`/auth?next=${encodeURIComponent(next)}`);
  }

  let preselectedGym: Gym | null = null;
  if (gymId) {
    const { data } = await supabase
      .from('gyms')
      .select('id, name, slug, type, location')
      .eq('id', gymId)
      .maybeSingle();
    preselectedGym = data ?? null;
  }

  return <JoinSearchClient preselectedGym={preselectedGym} />;
}
