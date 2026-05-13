import { redirect } from 'next/navigation';
import { getServerSupabase, getAdminSupabase } from '@/lib/supabase/server';
import { getUserRoles } from '@/lib/auth/roles';

const GYM_STAFF = new Set(['super_admin', 'gym_owner', 'gym_admin', 'trainer']);

export async function requireAdminAccess() {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth');

  const roles = await getUserRoles(user.id);
  const isSA = roles.some(r => r.role === 'super_admin');
  const gymRole = roles.find(r => r.role !== 'super_admin' && GYM_STAFF.has(r.role));

  if (!isSA && !gymRole) redirect('/home');

  const admin = getAdminSupabase();
  const gymId = gymRole?.gym_id ?? null;

  let gym: { 
    id: string; 
    name: string;
    address: string | null;
    phone: string | null;
    type: string | null;
    location: string | null;
    description: string | null;
    logo_url: string | null;
    website: string | null;
  } | null = null;

  if (gymId) {
    const { data } = await admin
      .from('gyms')
      .select('id, name, address, phone, type, location, description, logo_url, website')
      .eq('id', gymId)
      .maybeSingle();
    gym = data;
  } else if (isSA) {
    const { data } = await admin
      .from('gyms')
      .select('id, name, address, phone, type, location, description, logo_url, website')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();
    gym = data;
  }

  return {
    user,
    gym,
    gymId: gym?.id ?? null,
    isSuperAdmin: isSA,
  };
}

export async function requireSuperAdmin() {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth');

  const roles = await getUserRoles(user.id);
  if (!roles.some(r => r.role === 'super_admin')) redirect('/home');

  return { user };
}
