import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/admin/access';
import { getAdminSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const { user } = await requireSuperAdmin().catch(() => ({ user: null }));
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { name, slug, ownerEmail } = body;

  if (!name || !slug) {
    return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
  }

  const admin = getAdminSupabase();
  
  // 1. Create the gym
  const { data: gym, error: gymError } = await admin
    .from('gyms')
    .insert({
      name,
      slug,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (gymError || !gym) {
    console.error('[super-admin/gyms] create error:', gymError);
    return NextResponse.json({ error: 'Failed to create gym' }, { status: 500 });
  }

  // 2. Handle owner assignment if email provided
  if (ownerEmail && ownerEmail.trim().includes('@')) {
    const email = ownerEmail.toLowerCase().trim();
    
    // Look up user
    const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 1000 });
    const target = users?.find(u => u.email?.toLowerCase() === email);

    if (target) {
      // Grant owner role immediately
      await admin.from('user_gym_roles').upsert({
        user_id: target.id,
        gym_id: gym.id,
        role: 'gym_owner'
      }, { onConflict: 'user_id,gym_id,role' });
      
      // Also update admin_user_id for legacy compatibility
      await admin.from('gyms').update({ admin_user_id: target.id }).eq('id', gym.id);
    } else {
      // Create invitation
      const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
      await admin.from('gym_invitations').insert({
        gym_id: gym.id,
        invited_by: user.id,
        email,
        role: 'gym_owner',
        token,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }
  }

  return NextResponse.json({ success: true, data: gym });
}
