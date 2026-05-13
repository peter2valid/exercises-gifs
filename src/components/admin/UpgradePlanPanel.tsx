'use client';

import { useState } from 'react';
import { Loader2, Zap, ArrowRight } from 'lucide-react';
import type { GymPlan } from '@/lib/billing/types';
import { GYM_PLAN_PRICES_KES, GYM_PLAN_LABELS, GYM_PLAN_ORDER } from '@/lib/billing/gymPlans';

interface Props {
  gymId: string;
  currentPlan: GymPlan | null;
}

const PLAN_DESCRIPTIONS: Record<GymPlan, string> = {
  start:  'Exercise library, HD videos, offline access',
  active: 'Everything in Start + workout history, PR tracking, coach plans',
  elite:  'Everything in Active + gym branding, analytics, branch management',
};

export function UpgradePlanPanel({ gymId, currentPlan }: Props) {
  const [loading, setLoading] = useState<GymPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  const plans: GymPlan[] = ['start', 'active', 'elite'];
  const currentOrder = currentPlan ? GYM_PLAN_ORDER[currentPlan] : 0;

  const handleUpgrade = async (plan: GymPlan) => {
    setLoading(plan);
    setError(null);

    try {
      const res = await fetch('/api/billing/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'gym', gymId, plan }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Payment initialisation failed');
      const url = json.data?.authorization_url;
      if (!url) throw new Error('No payment URL returned');
      window.location.href = url;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
      setLoading(null);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#555]">Available Plans</p>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-[13px] text-red-400">
          {error}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        {plans.map(plan => {
          const isCurrent = plan === currentPlan;
          const isDowngrade = GYM_PLAN_ORDER[plan] < currentOrder;
          const planLoading = loading === plan;

          return (
            <div
              key={plan}
              className={`a-card flex flex-col gap-3 ${isCurrent ? 'border-blue-500/40' : ''}`}
            >
              {isCurrent && (
                <span className="a-badge a-badge-blue self-start">Current plan</span>
              )}
              <div>
                <p className="text-[15px] font-bold text-[#e8e8e8]">{GYM_PLAN_LABELS[plan]}</p>
                <p className="text-[12px] text-[#555] mt-0.5">
                  KES {GYM_PLAN_PRICES_KES[plan].toLocaleString()} / month
                </p>
              </div>
              <p className="text-[12px] text-[#606060] flex-1">{PLAN_DESCRIPTIONS[plan]}</p>

              {!isCurrent && (
                <button
                  onClick={() => handleUpgrade(plan)}
                  disabled={!!loading || isDowngrade}
                  className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-semibold transition-colors ${
                    isDowngrade
                      ? 'cursor-not-allowed border border-[#262626] text-[#444]'
                      : 'bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-wait'
                  }`}
                >
                  {planLoading ? (
                    <><Loader2 size={13} className="animate-spin" /> Processing…</>
                  ) : isDowngrade ? (
                    'Downgrade'
                  ) : (
                    <><Zap size={13} /> Upgrade <ArrowRight size={13} /></>
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-[12px] text-[#444]">
        Payments are processed securely via Paystack. Subscriptions renew monthly.
      </p>
    </div>
  );
}
