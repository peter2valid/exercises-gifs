import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const PAYSTACK_SECRET  = process.env.PAYSTACK_SECRET_KEY!;
const SUPABASE_URL     = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY      = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const APP_URL          = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

// Service role bypasses RLS — safe here because this route validates Paystack reference
const adminSupabase = createClient(SUPABASE_URL, SERVICE_KEY);

/**
 * GET /api/billing/verify?reference=<ref>
 *
 * Paystack redirects the user here after payment (success or failure).
 * We verify server-side before granting any entitlement.
 */
export async function GET(req: Request): Promise<NextResponse> {
  const url = new URL(req.url);
  const reference = url.searchParams.get('reference');

  if (!reference) {
    return redirectWithStatus('error');
  }

  // ── Server-side Paystack verification ────────────────────────────────────
  let verifyData: any;
  try {
    const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
    });
    verifyData = await res.json();
  } catch {
    console.error('[billing/verify] Paystack verify network error');
    return redirectWithStatus('error');
  }

  if (!verifyData.status || verifyData.data.status !== 'success') {
    await adminSupabase
      .from('payments')
      .update({ status: verifyData.data?.status ?? 'failed', updated_at: new Date().toISOString() })
      .eq('reference', reference)
      .neq('status', 'success'); // don't downgrade an already-successful payment
    return redirectWithStatus('failed');
  }

  // ── Idempotency guard: skip if webhook already activated this payment ─────
  const { data: existingPayment } = await adminSupabase
    .from('payments')
    .select('status')
    .eq('reference', reference)
    .maybeSingle();

  if (existingPayment?.status === 'success') {
    // Payment already processed (likely by webhook) — just redirect
    return redirectWithStatus('success');
  }

  const { metadata, id: providerId } = verifyData.data;
  const now = new Date();

  // ── Activate the correct subscription ────────────────────────────────────
  if (metadata?.type === 'member_subscription') {
    const { user_id, period } = metadata;
    const periodEnd = addPeriod(now, period);

    // Safety: check if user already has a subscription that ends LATER than this one
    const { data: current } = await adminSupabase
      .from('user_subscriptions')
      .select('current_period_end')
      .eq('user_id', user_id)
      .maybeSingle();
    
    if (!current?.current_period_end || new Date(current.current_period_end) <= periodEnd) {
      await adminSupabase.from('user_subscriptions').upsert(
        {
          user_id,
          plan: 'plus',
          billing_period: period,
          status: 'active',
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          grace_period_end: new Date(periodEnd.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: now.toISOString(),
        },
        { onConflict: 'user_id' },
      );
    }
  }

  if (metadata?.type === 'gym_subscription') {
    const { gym_id, plan } = metadata;
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    await adminSupabase.from('gym_subscriptions').upsert(
      {
        gym_id,
        plan,
        status: 'active',
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        grace_period_end: new Date(periodEnd.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: now.toISOString(),
      },
      { onConflict: 'gym_id' },
    );
  }

  // Mark payment as verified
  await adminSupabase
    .from('payments')
    .update({ 
      status: 'success', 
      verified_at: now.toISOString(), 
      updated_at: now.toISOString(),
      paystack_reference: providerId?.toString()
    })
    .eq('reference', reference);

  return redirectWithStatus('success');
}

function redirectWithStatus(status: 'success' | 'failed' | 'error'): NextResponse {
  return NextResponse.redirect(`${APP_URL}/profile?payment=${status}`);
}

function addPeriod(from: Date, period: string): Date {
  const d = new Date(from);
  switch (period) {
    case 'weekly':    d.setDate(d.getDate() + 7);     break;
    case 'monthly':   d.setMonth(d.getMonth() + 1);   break;
    case 'quarterly': d.setMonth(d.getMonth() + 3);   break;
  }
  return d;
}
