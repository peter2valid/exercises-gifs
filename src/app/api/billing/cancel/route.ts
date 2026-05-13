import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/supabase/server';
import { getAdminSupabase } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function POST(req: Request): Promise<NextResponse> {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = getAdminSupabase();

  // Mark the user's subscription as canceled. 
  // In a full Paystack implementation, you would also call:
  // https://api.paystack.co/subscription/disable
  // However, because we only have a 'paystack_reference' from an initial transaction
  // and no formal 'subscription_code' saved in the schema, this handles local 
  // cancellation which will stop any internal renewals.
  
  const { error } = await admin
    .from('user_subscriptions')
    .update({ 
      status: 'canceled', 
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString() 
    })
    .eq('user_id', user.id);

  if (error) {
    console.error('[billing/cancel] error:', error);
    return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
