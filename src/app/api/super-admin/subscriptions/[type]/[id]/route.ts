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

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ type: string, id: string }> }
): Promise<NextResponse> {
  const { user } = await requireSuperAdmin().catch(() => ({ user: null }));
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { type, id } = await params;
  if (type !== 'gym') {
    return NextResponse.json({ error: 'Gym subscriptions only' }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const plan = body.plan;
  const status = body.status;
  const currentPeriodEnd = typeof body.currentPeriodEnd === 'string' ? body.currentPeriodEnd : null;

  if (!['start', 'active', 'elite'].includes(plan)) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
  }

  if (!['active', 'trialing', 'past_due', 'canceled', 'paused', 'expired'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const admin = getAdminSupabase();
  const payload: Record<string, unknown> = {
    gym_id: id,
    plan,
    status,
    updated_at: new Date().toISOString(),
  };

  if (currentPeriodEnd) {
    payload.current_period_end = new Date(currentPeriodEnd).toISOString();
  }

  const { error } = await admin
    .from('gym_subscriptions')
    .upsert(payload, { onConflict: 'gym_id' });

  if (error) {
    console.error('[super-admin/subscriptions] patch gym error:', error);
    return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
