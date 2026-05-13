import { redirect } from 'next/navigation';
import { getServerSupabase } from '@/lib/supabase/server';
import { JoinSearchClient } from './JoinSearchClient';

export const dynamic = 'force-dynamic';

export default async function JoinSearchPage() {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth?next=/join');

  return <JoinSearchClient />;
}
