import { getAdminSupabase } from '@/lib/supabase/server';
import type { GymRoleType } from '@/lib/db/schema';

export type { GymRoleType };

export interface UserRole {
  id: string;
  user_id: string;
  gym_id: string | null;
  role: GymRoleType;
}

/**
 * Fetch all roles for a user.
 * Uses the service-role client so RLS does not block the lookup.
 */
export async function getUserRoles(userId: string): Promise<UserRole[]> {
  const admin = getAdminSupabase();
  const { data, error } = await admin
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
export async function isSuperAdmin(userId: string): Promise<boolean> {
  const roles = await getUserRoles(userId);
  return roles.some(r => r.role === 'super_admin');
}

/**
 * Returns the gym_id if the user has an owner or admin role for any gym,
 * or a specific gym if gymId is provided.
 */
export async function getAdminGymId(
  userId: string,
  gymId?: string,
): Promise<string | null> {
  const roles = await getUserRoles(userId);

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
): Promise<boolean> {
  const hierarchy: Record<Exclude<GymRoleType, 'super_admin'>, number> = {
    gym_owner: 4,
    gym_admin: 3,
    trainer: 2,
    member: 1,
  };

  const superAdmin = await isSuperAdmin(userId);
  if (superAdmin) return true;

  const roles = await getUserRoles(userId);
  const gymRole = roles.find(r => r.gym_id === gymId && r.role !== 'super_admin');
  if (!gymRole) return false;

  return (hierarchy[gymRole.role as keyof typeof hierarchy] ?? 0) >=
    hierarchy[minimumRole];
}
