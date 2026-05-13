import { redirect } from 'next/navigation';
import { getServerSupabase } from '@/lib/supabase/server';
import { getUserRoles } from '@/lib/auth/roles';
import { OnboardingClient } from './OnboardingClient';

export const dynamic = 'force-dynamic';

export default async function OnboardingPage() {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth?next=/onboarding');

  const roles = await getUserRoles(user.id);
  if (roles.some(r => r.role === 'gym_owner')) redirect('/admin');

  return <OnboardingClient />;
}
