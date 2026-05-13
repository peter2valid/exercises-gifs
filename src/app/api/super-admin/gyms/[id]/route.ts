import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/admin/access';
import { getAdminSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { user } = await requireSuperAdmin().catch(() => ({ user: null }));
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const gymId = params.id;
  const body = await req.json().catch(() => ({}));
  const { name, slug, ownerEmail } = body;

  const admin = getAdminSupabase();

  // 1. Update gym basic info
  const updates: any = {};
  if (name) updates.name = name;
  if (slug) updates.slug = slug;
  updates.updated_at = new Date().toISOString();

  if (Object.keys(updates).length > 1) {
    const { error: gymError } = await admin
      .from('gyms')
      .update(updates)
      .eq('id', gymId);

    if (gymError) {
      console.error('[super-admin/gyms] update error:', gymError);
      return NextResponse.json({ error: 'Failed to update gym' }, { status: 500 });
    }
  }

  // 2. Handle owner assignment if email provided
  if (ownerEmail !== undefined) {
    if (ownerEmail === '') {
      // Remove owner
      await admin.from('gyms').update({ admin_user_id: null }).eq('id', gymId);
      await admin.from('user_gym_roles').delete().eq('gym_id', gymId).eq('role', 'gym_owner');
    } else if (ownerEmail.trim().includes('@')) {
      const email = ownerEmail.toLowerCase().trim();
      
      // Look up user
      const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 1000 });
      const target = users?.find(u => u.email?.toLowerCase() === email);

      if (target) {
        // Remove old owner role first if any
        await admin.from('user_gym_roles').delete().eq('gym_id', gymId).eq('role', 'gym_owner');
        
        // Grant owner role immediately
        await admin.from('user_gym_roles').upsert({
          user_id: target.id,
          gym_id: gymId,
          role: 'gym_owner'
        }, { onConflict: 'user_id,gym_id,role' });
        
        // Update admin_user_id
        await admin.from('gyms').update({ admin_user_id: target.id }).eq('id', gymId);
      } else {
        // Create invitation
        const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
        await admin.from('gym_invitations').insert({
          gym_id: gymId,
          invited_by: user.id,
          email,
          role: 'gym_owner',
          token,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        });
      }
    }
  }

  return NextResponse.json({ success: true });
}
