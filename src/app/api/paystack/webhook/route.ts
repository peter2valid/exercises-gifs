import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase/server';
import { verifyWebhookSignature } from '@/lib/paystack';
import { addMonths, addWeeks } from 'date-fns';

export async function POST(req: Request) {
  const supabase = getAdminSupabase();
  const body = await req.text();
  const signature = req.headers.get('x-paystack-signature') || '';

  if (!verifyWebhookSignature(body, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const event = JSON.parse(body);

  // 1. Log the event
  await supabase.from('webhook_events').insert({
    event_type: event.event,
    payload: event,
    status: 'pending',
  });

  try {
    if (event.event === 'charge.success') {
      const { metadata, reference, amount } = event.data;
      const { userId, type, planId } = metadata;

      // 2. Update payment status
      await supabase
        .from('payments')
        .update({ status: 'success' })
        .eq('paystack_reference', reference);

      // 3. Update subscription
      const now = new Date();
      let periodEnd = now;

      if (type === 'member') {
        if (planId === 'weekly') periodEnd = addWeeks(now, 1);
        else if (planId === 'monthly') periodEnd = addMonths(now, 1);
        else periodEnd = addMonths(now, 3);

        await supabase.from('user_subscriptions').upsert({
          user_id: userId,
          status: 'active',
          current_period_end: periodEnd.toISOString(),
          updated_at: now.toISOString(),
        }, { onConflict: 'user_id' });
      } else {
        // Gym subscription logic
        // For simplicity, assuming one gym per user for now or gymId in metadata
        const { data: profile } = await supabase.from('profiles').select('gym_id').eq('id', userId).single();
        if (profile?.gym_id) {
          periodEnd = addMonths(now, 1);
          await supabase.from('gym_subscriptions').upsert({
            gym_id: profile.gym_id,
            plan_id: planId,
            status: 'active',
            current_period_end: periodEnd.toISOString(),
            updated_at: now.toISOString(),
          }, { onConflict: 'gym_id' });
        }
      }
    }

    return NextResponse.json({ status: 'success' });
  } catch (err: any) {
    console.error('Webhook error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
