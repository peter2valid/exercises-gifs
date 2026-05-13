import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/admin/access';
import { getAdminSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const { user } = await requireSuperAdmin().catch(() => ({ user: null }));
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const { action } = body;

  if (!['suspend', 'restore'].includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  const admin = getAdminSupabase();
  const status = action === 'suspend' ? 'suspended' : 'active';

  const { error } = await admin
    .from('gyms')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('[super-admin/gyms] error:', error);
    return NextResponse.json({ error: 'Failed to update gym' }, { status: 500 });
  }

  return NextResponse.json({ success: true, status });
}
