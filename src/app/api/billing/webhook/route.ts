import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHmac } from 'crypto';

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!;
const SUPABASE_URL    = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY     = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Service role client — webhook handler has no user session
const adminSupabase = createClient(SUPABASE_URL, SERVICE_KEY);

/**
 * POST /api/billing/webhook
 *
 * Receives Paystack webhook events. This is the PRIMARY path for:
 * - Confirming payments (charge.success)
 * - Disabling subscriptions (subscription.disable)
 * - Handling failed renewals (invoice.payment_failed)
 *
 * Security:
 * - HMAC-SHA512 signature verified before any DB writes
 * - Idempotency enforced via webhook_events.event_id UNIQUE constraint
 * - Uses service role — never trusts payload alone without signature
 *
 * Webhook URL to configure in Paystack dashboard:
 *   https://<your-domain>/api/billing/webhook
 */
export async function POST(req: Request): Promise<NextResponse> {
  // ── 1. Verify Paystack signature ─────────────────────────────────────────
  const signature = req.headers.get('x-paystack-signature');
  const rawBody   = await req.text();

  const expectedSig = createHmac('sha512', PAYSTACK_SECRET)
    .update(rawBody)
    .digest('hex');

  if (!signature || signature !== expectedSig) {
    console.warn('[webhook] Invalid Paystack signature');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // ── 2. Parse event ────────────────────────────────────────────────────────
  let event: { event: string; data: Record<string, any> };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Paystack uses numeric `id` on the data object as the unique event identifier
  const eventId = `${event.event}:${event.data?.id ?? Date.now()}`;

  // ── 3. Idempotency guard ──────────────────────────────────────────────────
  const { data: existing } = await adminSupabase
    .from('webhook_events')
    .select('id')
    .eq('event_id', eventId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ received: true }); // Already processed — safe no-op
  }

  // ── 4. Record event (audit log) ───────────────────────────────────────────
  await adminSupabase.from('webhook_events').insert({
    provider: 'paystack',
    event_type: event.event,
    event_id: eventId,
    payload: event,
  });

  // ── 5. Process event ──────────────────────────────────────────────────────
  try {
    await handleEvent(event);

    await adminSupabase
      .from('webhook_events')
      .update({ processed_at: new Date().toISOString() })
      .eq('event_id', eventId);
  } catch (err) {
    // Log but return 200 — Paystack retries on non-2xx which can cause loops.
    // Failed events are flagged via missing processed_at for manual reconciliation.
    console.error('[webhook] Event processing error:', err, { eventId });
  }

  return NextResponse.json({ received: true });
}

async function handleEvent(event: { event: string; data: Record<string, any> }): Promise<void> {
  const { event: type, data } = event;
  const now = new Date();

  switch (type) {
    // ── Successful payment (one-time or recurring renewal) ──────────────────
    case 'charge.success': {
      const reference = data.reference as string;
      const metadata  = data.metadata ?? {};

      await adminSupabase
        .from('payments')
        .update({ status: 'success', verified_at: now.toISOString(), updated_at: now.toISOString() })
        .eq('paystack_reference', reference);

      if (metadata.type === 'member_subscription') {
        const { user_id, period } = metadata;
        const periodEnd = addPeriod(now, period);

        await adminSupabase.from('user_subscriptions').upsert(
          {
            user_id,
            plan: 'plus',
            billing_period: period,
            status: 'active',
            current_period_start: now.toISOString(),
            current_period_end: periodEnd.toISOString(),
            grace_period_end: null,
            updated_at: now.toISOString(),
          },
          { onConflict: 'user_id' },
        );
      }

      if (metadata.type === 'gym_subscription') {
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
            grace_period_end: null,
            updated_at: now.toISOString(),
          },
          { onConflict: 'gym_id' },
        );
      }
      break;
    }

    // ── Subscription explicitly disabled (cancellation) ────────────────────
    case 'subscription.disable': {
      const userId = data.metadata?.user_id;
      const gymId  = data.metadata?.gym_id;

      if (userId) {
        await adminSupabase
          .from('user_subscriptions')
          .update({ status: 'canceled', canceled_at: now.toISOString(), updated_at: now.toISOString() })
          .eq('user_id', userId);
      }

      if (gymId) {
        await adminSupabase
          .from('gym_subscriptions')
          .update({ status: 'canceled', canceled_at: now.toISOString(), updated_at: now.toISOString() })
          .eq('gym_id', gymId);
      }
      break;
    }

    // ── Failed renewal — enter grace period ────────────────────────────────
    case 'invoice.payment_failed': {
      const userId = data.metadata?.user_id;
      const gymId  = data.metadata?.gym_id;
      const gracePeriodEnd = new Date(now);
      gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 7); // 7-day grace

      if (userId) {
        await adminSupabase
          .from('user_subscriptions')
          .update({
            status: 'past_due',
            grace_period_end: gracePeriodEnd.toISOString(),
            updated_at: now.toISOString(),
          })
          .eq('user_id', userId);
      }

      if (gymId) {
        await adminSupabase
          .from('gym_subscriptions')
          .update({
            status: 'past_due',
            grace_period_end: gracePeriodEnd.toISOString(),
            updated_at: now.toISOString(),
          })
          .eq('gym_id', gymId);
      }
      break;
    }

    // ── Subscription created (for recurring billing) ───────────────────────
    case 'subscription.create': {
      const userId = data.metadata?.user_id;
      if (userId) {
        await adminSupabase
          .from('user_subscriptions')
          .update({ paystack_subscription_code: data.subscription_code, updated_at: now.toISOString() })
          .eq('user_id', userId);
      }
      break;
    }
  }
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
