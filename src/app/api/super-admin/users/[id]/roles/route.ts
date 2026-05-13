import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/admin/access';
import { getAdminSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user: currentUser } = await requireSuperAdmin().catch(() => ({ user: null }));
  if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: userId } = await params;
  const { isSuperAdmin, gymRoles } = await req.json().catch(() => ({}));

  const admin = getAdminSupabase();

  // 1. Delete existing roles
  await admin.from('user_gym_roles').delete().eq('user_id', userId);

  // 2. Insert new roles
  const rolesToInsert = [];

  if (isSuperAdmin) {
    rolesToInsert.push({ user_id: userId, gym_id: null, role: 'super_admin' });
  }

  for (const gr of gymRoles) {
    rolesToInsert.push({ 
      user_id: userId, 
      gym_id: gr.gym_id, 
      role: gr.role 
    });
  }

  if (rolesToInsert.length > 0) {
    const { error } = await admin.from('user_gym_roles').insert(rolesToInsert);
    if (error) {
      console.error('[super-admin/users] role update error:', error);
      return NextResponse.json({ error: 'Failed to update roles' }, { status: 500 });
    }
  }

  // 3. Update gym owner_id if any gym_owner role was added
  const ownerRoles = gymRoles.filter((r: any) => r.role === 'gym_owner');
  for (const r of ownerRoles) {
    await admin.from('gyms').update({ owner_id: userId }).eq('id', r.gym_id);
  }

  return NextResponse.json({ success: true });
}
