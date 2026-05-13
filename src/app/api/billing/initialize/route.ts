import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';
import { PLUS_PRICING } from '@/lib/billing/memberPlans';
import { GYM_PLAN_PRICES_KES } from '@/lib/billing/gymPlans';
import { hasGymRole } from '@/lib/auth/roles';
import type { MemberBillingPeriod, GymPlan } from '@/lib/billing/types';

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? (() => {
  if (process.env.NODE_ENV === 'production') {
    console.error('[billing] NEXT_PUBLIC_APP_URL is not set! Paystack callbacks will point to localhost.');
  }
  return 'http://localhost:3000';
})();

type MemberPayload = { type: 'member'; period: MemberBillingPeriod };
type GymPayload    = { type: 'gym'; gymId: string; plan: GymPlan };
type InitPayload   = MemberPayload | GymPayload;

/**
 * POST /api/billing/initialize
 *
 * Initialises a Paystack transaction and records a pending payment row.
 * Returns { data: { authorization_url, access_code, reference } }.
 *
 * Payment success is confirmed ONLY via server-side webhook or verify endpoint.
 * Frontend NEVER grants entitlements based on this response alone.
 */
export async function POST(req: Request): Promise<NextResponse> {
  const supabase = await getServerSupabase();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: InitPayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (body.type === 'member') {
    return initMemberUpgrade(session.user, body, supabase);
  }

  if (body.type === 'gym') {
    return initGymUpgrade(session.user, body, supabase);
  }

  return NextResponse.json({ error: 'Unknown payment type' }, { status: 400 });
}

async function guardPendingSpam(
  supabase: any,
  subjectId: string,
): Promise<boolean> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from('payments')
    .select('id', { count: 'exact', head: true })
    .eq('subject_id', subjectId)
    .eq('status', 'pending')
    .gte('created_at', since);
  return (count ?? 0) >= 10;
}

async function initMemberUpgrade(
  user: { id: string; email?: string },
  payload: MemberPayload,
  supabase: any,
): Promise<NextResponse> {
  const { period } = payload;

  const VALID_PERIODS: MemberBillingPeriod[] = ['weekly', 'monthly', 'quarterly'];
  if (!VALID_PERIODS.includes(period) || !PLUS_PRICING[period]) {
    return NextResponse.json({ error: 'Invalid billing period' }, { status: 400 });
  }

  if (await guardPendingSpam(supabase, user.id)) {
    return NextResponse.json({ error: 'Too many pending payments — please wait' }, { status: 429 });
  }

  const amountKobo = PLUS_PRICING[period].amountKes * 100; // Paystack expects kobo
  const reference  = `plus_${user.id}_${period}_${Date.now()}`;

  const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: user.email,
      amount: amountKobo,
      reference,
      currency: 'KES',
      callback_url: `${APP_URL}/api/billing/verify?reference=${reference}`,
      metadata: {
        type: 'member_subscription',
        user_id: user.id,
        period,
        custom_fields: [
          {
            display_name: 'Plan',
            variable_name: 'plan',
            value: `Viewora Plus (${period})`,
          },
        ],
      },
    }),
  });

  const paystackData = await paystackRes.json();

  if (!paystackData.status) {
    console.error('[billing/initialize] Paystack error:', paystackData);
    return NextResponse.json({ error: 'Payment provider error' }, { status: 502 });
  }

  // Record pending payment for reconciliation
  await supabase.from('payments').insert({
    reference,
    subject_type: 'user_subscription',
    subject_id: user.id,
    amount_kobo: amountKobo,
    currency: 'KES',
    status: 'pending',
    paystack_reference: paystackData.data.reference,
    metadata: { period, user_id: user.id },
  });

  return NextResponse.json({ data: paystackData.data });
}

async function initGymUpgrade(
  user: { id: string; email?: string },
  payload: GymPayload,
  supabase: any,
): Promise<NextResponse> {
  const { gymId, plan } = payload;

  if (!GYM_PLAN_PRICES_KES[plan]) {
    return NextResponse.json({ error: 'Invalid gym plan' }, { status: 400 });
  }

  if (await guardPendingSpam(supabase, gymId)) {
    return NextResponse.json({ error: 'Too many pending payments — please wait' }, { status: 429 });
  }

  // Verify requesting user is an admin of this gym
  const hasAccess = await hasGymRole(user.id, gymId, 'gym_admin');

  if (!hasAccess) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: gym } = await supabase
    .from('gyms')
    .select('id, name')
    .eq('id', gymId)
    .maybeSingle();

  if (!gym) {
    return NextResponse.json({ error: 'Gym not found' }, { status: 404 });
  }

  const amountKobo = GYM_PLAN_PRICES_KES[plan] * 100;
  const reference  = `gym_${gymId}_${plan}_${Date.now()}`;

  const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: user.email,
      amount: amountKobo,
      reference,
      currency: 'KES',
      callback_url: `${APP_URL}/api/billing/verify?reference=${reference}`,
      metadata: {
        type: 'gym_subscription',
        gym_id: gymId,
        gym_name: gym.name,
        plan,
        billing_period: 'monthly',
        admin_user_id: user.id,
        custom_fields: [
          {
            display_name: 'Gym',
            variable_name: 'gym_name',
            value: gym.name,
          },
          {
            display_name: 'Plan',
            variable_name: 'plan',
            value: `Gym ${plan.charAt(0).toUpperCase() + plan.slice(1)}`,
          },
        ],
      },
    }),
  });

  const paystackData = await paystackRes.json();

  if (!paystackData.status) {
    console.error('[billing/initialize] Paystack gym error:', paystackData);
    return NextResponse.json({ error: 'Payment provider error' }, { status: 502 });
  }

  await supabase.from('payments').insert({
    reference,
    subject_type: 'gym_subscription',
    subject_id: gymId,
    amount_kobo: amountKobo,
    currency: 'KES',
    status: 'pending',
    paystack_reference: paystackData.data.reference,
    metadata: { plan, gym_id: gymId, admin_user_id: user.id },
  });

  return NextResponse.json({ data: paystackData.data });
}
