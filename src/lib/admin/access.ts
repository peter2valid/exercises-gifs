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

  const GYM_FIELDS = 'id, name, address, phone, type, location, description, logo_url, website';
  const GYM_FIELDS_FALLBACK = 'id, name';
  const nullDetails = { address: null, phone: null, type: null, location: null, description: null, logo_url: null, website: null };

  if (gymId) {
    const { data, error } = await admin
      .from('gyms')
      .select(GYM_FIELDS)
      .eq('id', gymId)
      .maybeSingle();
    if (error) {
      // Columns may not exist yet — fall back to core fields
      const { data: basicData } = await admin
        .from('gyms')
        .select(GYM_FIELDS_FALLBACK)
        .eq('id', gymId)
        .maybeSingle();
      gym = basicData ? { ...basicData, ...nullDetails } : null;
    } else {
      gym = data;
    }
  } else if (isSA) {
    const { data, error } = await admin
      .from('gyms')
      .select(GYM_FIELDS)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();
    if (error) {
      const { data: basicData } = await admin
        .from('gyms')
        .select(GYM_FIELDS_FALLBACK)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();
      gym = basicData ? { ...basicData, ...nullDetails } : null;
    } else {
      gym = data;
    }
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
