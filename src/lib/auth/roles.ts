import { getAdminSupabase } from '@/lib/supabase/admin';
import type { GymRoleType } from '@/lib/db/schema';
import type { SupabaseClient } from '@supabase/supabase-js';

export type { GymRoleType };

export interface UserRole {
  id: string;
  user_id: string;
  gym_id: string | null;
  role: GymRoleType;
}

/**
 * Fetch all roles for a user.
 * 
 * If a supabaseClient is provided, it uses that (useful for Client Components).
 * Otherwise, it defaults to the admin client (Server-side ONLY).
 */
export async function getUserRoles(userId: string, supabaseClient?: SupabaseClient): Promise<UserRole[]> {
  // If we're on the server and no client provided, use admin
  // If we're on the client and no client provided, this will throw/fail 
  // because getAdminSupabase needs the service role key.
  const client = supabaseClient || getAdminSupabase();
  
  const { data, error } = await client
    .from('user_gym_roles')
    .select('id, user_id, gym_id, role')
    .eq('user_id', userId);

  if (error) {
    console.error('[roles] getUserRoles error:', error);
    return [];
  }
  return (data ?? []) as UserRole[];
}

/** Returns true if the user has the super_admin platform role. */
export async function isSuperAdmin(userId: string, supabaseClient?: SupabaseClient): Promise<boolean> {
  const roles = await getUserRoles(userId, supabaseClient);
  return roles.some(r => r.role === 'super_admin');
}

/**
 * Returns the gym_id if the user has an owner or admin role for any gym,
 * or a specific gym if gymId is provided.
 */
export async function getAdminGymId(
  userId: string,
  gymId?: string,
  supabaseClient?: SupabaseClient,
): Promise<string | null> {
  const roles = await getUserRoles(userId, supabaseClient);

  const adminRoles = roles.filter(
    r =>
      (r.role === 'gym_owner' || r.role === 'gym_admin') &&
      (gymId ? r.gym_id === gymId : true),
  );

  return adminRoles[0]?.gym_id ?? null;
}

/**
 * Returns true if user has at least the given role for a specific gym.
 * Role hierarchy: gym_owner > gym_admin > trainer > member
 */
export async function hasGymRole(
  userId: string,
  gymId: string,
  minimumRole: Exclude<GymRoleType, 'super_admin'>,
  supabaseClient?: SupabaseClient,
): Promise<boolean> {
  const hierarchy: Record<Exclude<GymRoleType, 'super_admin'>, number> = {
    gym_owner: 4,
    gym_admin: 3,
    trainer: 2,
    member: 1,
  };

  const superAdmin = await isSuperAdmin(userId, supabaseClient);
  if (superAdmin) return true;

  const roles = await getUserRoles(userId, supabaseClient);
  const gymRole = roles.find(r => r.gym_id === gymId && r.role !== 'super_admin');
  if (!gymRole) return false;

  return (hierarchy[gymRole.role as keyof typeof hierarchy] ?? 0) >=
    hierarchy[minimumRole];
}
