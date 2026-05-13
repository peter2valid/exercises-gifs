import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/supabase/server';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { hasGymRole } from '@/lib/auth/roles';

// POST /api/admin/gym/members — Approve or reject membership requests
export async function POST(req: Request): Promise<NextResponse> {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { gymId, membershipId, action } = body;

  if (!gymId || !membershipId || !['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'gymId, membershipId, and action (approve/reject) required' }, { status: 400 });
  }

  const allowed = await hasGymRole(user.id, gymId, 'gym_admin');
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const admin = getAdminSupabase();

  if (action === 'reject') {
    await admin.from('gym_memberships').delete().eq('id', membershipId).eq('gym_id', gymId);
    return NextResponse.json({ ok: true });
  }

  // Approve
  const { data: membership, error: fetchErr } = await admin
    .from('gym_memberships')
    .select('user_id, role')
    .eq('id', membershipId)
    .eq('gym_id', gymId)
    .single();

  if (fetchErr || !membership) return NextResponse.json({ error: 'Request not found' }, { status: 404 });

  const { error: updateErr } = await admin
    .from('gym_memberships')
    .update({ status: 'active', joined_at: new Date().toISOString() })
    .eq('id', membershipId);

  if (updateErr) {
    console.error('[admin/members] approve update error:', updateErr);
    return NextResponse.json({ error: 'Failed to approve request' }, { status: 500 });
  }

  // Also add to user_gym_roles to grant permissions
  await admin.from('user_gym_roles').upsert({
    user_id: membership.user_id,
    gym_id: gymId,
    role: membership.role as any
  }, { onConflict: 'user_id,gym_id,role' });

  return NextResponse.json({ ok: true });
}

// PUT /api/admin/gym/members — Directly add a member by email
export async function PUT(req: Request): Promise<NextResponse> {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { gymId, email, role = 'member' } = body;

  if (!gymId || !email) {
    return NextResponse.json({ error: 'gymId and email required' }, { status: 400 });
  }

  const allowed = await hasGymRole(user.id, gymId, 'gym_admin');
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const admin = getAdminSupabase();
  
  // Look up user by email with the supported admin API.
  const normalizedEmail = email.toLowerCase().trim();
  const { data: usersPage, error: authErr } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const target = usersPage?.users?.find((candidate) => candidate.email?.toLowerCase() === normalizedEmail) ?? null;

  if (authErr || !target) {
    console.log('[admin/members] lookup failed for:', email, authErr);
    return NextResponse.json({ 
      error: 'User not found. Please ask them to sign up first or use the invite system.' 
    }, { status: 404 });
  }

  // 1. Create/Update membership record
  const { error: memErr } = await admin
    .from('gym_memberships')
    .upsert({
      user_id: target.id,
      gym_id: gymId,
      status: 'active',
      role: role,
      joined_at: new Date().toISOString()
    }, { onConflict: 'user_id,gym_id' });

  if (memErr) {
    console.error('[admin/members] membership upsert error:', memErr);
    return NextResponse.json({ error: 'Failed to create membership' }, { status: 500 });
  }

  // 2. Grant role (Sync with user_gym_roles)
  // To keep it clean, we remove existing roles for this gym and user first
  await admin.from('user_gym_roles')
    .delete()
    .eq('user_id', target.id)
    .eq('gym_id', gymId);

  const { error: roleErr } = await admin.from('user_gym_roles').insert({
    user_id: target.id,
    gym_id: gymId,
    role: role as any
  });

  if (roleErr) {
    console.error('[admin/members] role insert error:', roleErr);
    // Don't fail the whole request if membership succeeded, but log it
  }

  return NextResponse.json({ ok: true });
}

// DELETE /api/admin/gym/members — Remove a member
export async function DELETE(req: Request): Promise<NextResponse> {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { gymId, membershipId } = body;

  if (!gymId || !membershipId) {
    return NextResponse.json({ error: 'gymId and membershipId required' }, { status: 400 });
  }

  const allowed = await hasGymRole(user.id, gymId, 'gym_owner');
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const admin = getAdminSupabase();

  // Get the user_id before deleting
  const { data: membership } = await admin
    .from('gym_memberships')
    .select('user_id')
    .eq('id', membershipId)
    .single();

  if (!membership) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

  // Delete from both tables
  await Promise.all([
    admin.from('gym_memberships').delete().eq('id', membershipId),
    admin.from('user_gym_roles').delete().eq('user_id', membership.user_id).eq('gym_id', gymId)
  ]);

  return NextResponse.json({ ok: true });
}
