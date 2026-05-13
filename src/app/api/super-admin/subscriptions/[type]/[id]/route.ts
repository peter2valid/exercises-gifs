import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/admin/access';
import { getAdminSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(
  req: Request, 
  { params }: { params: Promise<{ type: string, id: string }> }
): Promise<NextResponse> {
  const { user } = await requireSuperAdmin().catch(() => ({ user: null }));
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { type, id } = await params;

  if (!['gym', 'user'].includes(type)) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  }

  const admin = getAdminSupabase();
  const table = type === 'gym' ? 'gym_subscriptions' : 'user_subscriptions';
  const idCol = type === 'gym' ? 'gym_id' : 'user_id';

  const { error } = await admin
    .from(table)
    .update({ 
      status: 'canceled', 
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq(idCol, id);

  if (error) {
    console.error(`[super-admin/subscriptions] cancel ${type} error:`, error);
    return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
