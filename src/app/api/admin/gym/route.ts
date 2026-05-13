import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/supabase/server';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { hasGymRole } from '@/lib/auth/roles';

export const dynamic = 'force-dynamic';

export async function PUT(req: Request): Promise<NextResponse> {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { 
    gymId: string; 
    name?: string; 
    address?: string; 
    phone?: string; 
    type?: string; 
    location?: string; 
    description?: string;
    website?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { gymId, name, address, phone, type, location, description, website } = body;
  if (!gymId || typeof gymId !== 'string') return NextResponse.json({ error: 'gymId required' }, { status: 400 });

  const allowed = await hasGymRole(user.id, gymId, 'gym_admin');
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const updates: any = { updated_at: new Date().toISOString() };
  if (name !== undefined) {
    const trimmed = name.trim();
    if (!trimmed || trimmed.length < 2) return NextResponse.json({ error: 'Gym name must be at least 2 characters' }, { status: 400 });
    if (trimmed.length > 80) return NextResponse.json({ error: 'Gym name too long' }, { status: 400 });
    updates.name = trimmed;
  }
  if (address !== undefined) updates.address = address.trim() || null;
  if (phone !== undefined) updates.phone = phone.trim() || null;
  if (type !== undefined) updates.type = type.trim() || null;
  if (location !== undefined) updates.location = location.trim() || null;
  if (description !== undefined) updates.description = description.trim() || null;
  if (website !== undefined) updates.website = website.trim() || null;

  const admin = getAdminSupabase();
  const { error } = await admin.from('gyms').update(updates).eq('id', gymId);

  if (error) {
    console.error('[admin/gym] update error:', error);
    return NextResponse.json({ error: 'Failed to update gym' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
