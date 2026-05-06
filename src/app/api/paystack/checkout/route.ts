import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';
import { initializeTransaction } from '@/lib/paystack';

export async function POST(req: Request) {
  try {
    const supabase = getServerSupabase();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { planId, type } = await req.json(); // type: 'gym' | 'member'

    let amount = 0;
    if (type === 'member') {
      amount = planId === 'weekly' ? 99 : planId === 'monthly' ? 349 : 899;
    } else {
      amount = planId === 'START' ? 1500 : planId === 'ACTIVE' ? 4500 : 9500;
    }

    const metadata = {
      userId: session.user.id,
      type,
      planId,
    };

    const checkoutData = await initializeTransaction(session.user.email!, amount, metadata);

    // Store payment attempt
    await supabase.from('payments').insert({
      user_id: session.user.id,
      amount: amount * 100,
      status: 'pending',
      paystack_reference: checkoutData.reference,
    });

    return NextResponse.json(checkoutData);
  } catch (err: any) {
    console.error('Checkout error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
