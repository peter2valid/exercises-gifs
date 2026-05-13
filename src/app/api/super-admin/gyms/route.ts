import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/admin/access';
import { getAdminSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const { user } = await requireSuperAdmin().catch(() => ({ user: null }));
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { name, slug } = body;

  if (!name || !slug) {
    return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
  }

  const admin = getAdminSupabase();
  const { data, error } = await admin
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

  if (error) {
    console.error('[super-admin/gyms] create error:', error);
    return NextResponse.json({ error: 'Failed to create gym' }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}
