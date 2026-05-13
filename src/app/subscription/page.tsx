'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ChevronLeft, Zap, CheckCircle, Shield, ArrowRight, Star, Crown, AlertTriangle, Loader2 } from 'lucide-react';
import { useEntitlementStore } from '@/store/entitlementStore';
import { PLUS_PRICING, PLUS_FEATURES } from '@/lib/billing/memberPlans';
import { getFeatureMeta } from '@/lib/billing/featureRegistry';
import { CORE_FEATURES } from '@/lib/billing/gymPlans';
import { LoadingPage } from '@/components/ui';

export default function SubscriptionPage() {
  const router = useRouter();
  const { 
    features, 
    gymPlan, 
    hasMemberPremium, 
    memberPeriodEnd,
    memberPlanStatus,
    isLoading, 
    triggerUpgrade 
  } = useEntitlementStore();

  const [canceling, setCanceling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState(false);

  if (isLoading) return <LoadingPage />;

  const isPlus = hasMemberPremium;
  const currentPlanLabel = isPlus ? 'GymApp Plus' : (gymPlan ? `${gymPlan.toUpperCase()} Plan` : 'Free');

  const handleCancel = async () => {
    setCanceling(true);
    setCancelError(null);
    try {
      const res = await fetch('/api/billing/cancel', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to cancel subscription');
      setCancelSuccess(true);
      setShowCancelConfirm(false);
      router.refresh();
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setCanceling(false);
    }
  };

  return (
    <div className="dashboard-bg min-h-screen pb-24 pt-8">
      <div className="max-w-md mx-auto px-4">
        <header className="mb-8 flex items-center justify-between">
          <button 
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-white transition-all"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Current Plan</span>
            <span className={`text-sm font-bold tracking-tight ${isPlus ? 'text-emerald-400' : 'text-white'}`}>
              {currentPlanLabel}
            </span>
          </div>
        </header>

        <section className="mb-10 text-center animate-fade-in">
          <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6 shadow-2xl relative">
            {isPlus ? (
              <Crown className="w-10 h-10 text-emerald-500 fill-emerald-500/20" />
            ) : (
              <Zap className="w-10 h-10 text-white/40" />
            )}
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full blur-lg opacity-50" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter mb-2 uppercase italic">
            {isPlus ? 'You are Elite' : 'Level Up'}
          </h1>
          <p className="text-sm text-white/40 max-w-[280px] mx-auto leading-relaxed">
            {isPlus 
              ? 'Enjoy unrestricted access to all premium GymApp features.'
              : 'Unlock advanced analytics, AI recommendations, and deeper insights.'}
          </p>
        </section>

        {isPlus && memberPlanStatus !== 'canceled' && (
          <div className="mb-10 p-5 rounded-2xl bg-white/[0.03] border border-white/10 animate-slide-up">
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-sm font-bold text-white">Active Subscription</p>
                {memberPeriodEnd && (
                  <p className="text-xs text-white/50 mt-1">
                    Renews on {new Date(memberPeriodEnd).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                )}
              </div>
              <div className="px-2 py-1 rounded border border-emerald-500/20 bg-emerald-500/10 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                Active
              </div>
            </div>
            
            {cancelError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
                {cancelError}
              </div>
            )}

            {cancelSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
                Subscription canceled. Your premium features remain active until the end of your billing period.
              </div>
            )}

            {showCancelConfirm ? (
              <div className="space-y-2">
                <p className="text-xs text-white/50 text-center">Are you sure? You will lose Plus features at the end of your billing cycle.</p>
                <div className="flex gap-2">
                  <button
                    onClick={handleCancel}
                    disabled={canceling}
                    className="flex-1 py-2.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-400 text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {canceling ? <Loader2 size={14} className="animate-spin" /> : null}
                    {canceling ? 'Canceling…' : 'Yes, Cancel'}
                  </button>
                  <button
                    onClick={() => setShowCancelConfirm(false)}
                    className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/50 text-sm font-bold"
                  >
                    Keep Plan
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowCancelConfirm(true)}
                disabled={canceling || cancelSuccess}
                className="w-full py-2.5 rounded-xl border border-rose-500/20 text-rose-400 text-sm font-bold hover:bg-rose-500/10 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <AlertTriangle size={16} />
                Cancel Subscription
              </button>
            )}
          </div>
        )}

        {isPlus && memberPlanStatus === 'canceled' && (
          <div className="mb-10 p-5 rounded-2xl bg-rose-500/5 border border-rose-500/10 animate-slide-up">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-bold text-white">Subscription Canceled</p>
              <div className="px-2 py-1 rounded border border-rose-500/20 bg-rose-500/10 text-[10px] font-bold text-rose-400 uppercase tracking-wider">
                Canceled
              </div>
            </div>
            {memberPeriodEnd && (
              <p className="text-xs text-white/50">
                You will retain access to Plus features until {new Date(memberPeriodEnd).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}.
              </p>
            )}
          </div>
        )}

        {!isPlus && (
          <div className="mb-10 space-y-3 animate-slide-up">
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.25em] ml-1">Available Plans</p>
            <button
              onClick={() => triggerUpgrade('ai_recommendations')}
              className="w-full glass-panel p-6 flex flex-col items-start gap-4 border-emerald-500/30 bg-emerald-500/[0.02] relative overflow-hidden group active:scale-[0.98] transition-all"
            >
              <div className="absolute top-0 right-0 p-3 bg-emerald-500 text-black text-[10px] font-black uppercase tracking-tighter rounded-bl-xl italic">
                Most Popular
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <Star className="w-5 h-5 text-emerald-500 fill-emerald-500/20" />
                </div>
                <div className="text-left">
                  <p className="text-lg font-black text-white tracking-tight uppercase italic">GymApp Plus</p>
                  <p className="text-xs text-emerald-500/60 font-bold uppercase tracking-widest">Starting at KES 99</p>
                </div>
              </div>
              <div className="space-y-2">
                {PLUS_FEATURES.slice(0, 3).map((f) => (
                  <div key={f} className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500/40" />
                    <span className="text-xs text-white/60 font-medium">{getFeatureMeta(f).label}</span>
                  </div>
                ))}
              </div>
              <div className="w-full h-12 rounded-xl bg-white text-black flex items-center justify-center font-black text-sm uppercase tracking-tighter group-hover:bg-emerald-400 transition-colors">
                Upgrade Now <ArrowRight size={16} className="ml-2" />
              </div>
            </button>
          </div>
        )}

        <div className="space-y-8 mb-12 animate-slide-up delay-100">
          <div>
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.25em] ml-1 mb-4">What you get</p>
            <div className="space-y-4">
              {PLUS_FEATURES.map((f) => {
                const meta = getFeatureMeta(f);
                const hasIt = features.has(f);
                return (
                  <div key={f} className={`flex items-start gap-4 p-4 rounded-2xl border ${hasIt ? 'bg-white/[0.03] border-white/10' : 'bg-white/[0.01] border-white/5 opacity-50'}`}>
                    <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center ${hasIt ? 'bg-emerald-500/10 text-emerald-500' : 'bg-white/5 text-white/20'}`}>
                      <CheckCircle size={14} />
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-bold tracking-tight ${hasIt ? 'text-white' : 'text-white/60'}`}>
                        {meta.label}
                      </p>
                      <p className="text-[11px] text-white/30 leading-relaxed mt-0.5">
                        {meta.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.25em] ml-1 mb-4">Core Features</p>
            <div className="grid grid-cols-1 gap-2">
              {CORE_FEATURES.map((f) => (
                <div key={f} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <CheckCircle size={12} className="text-white/20" />
                  <span className="text-xs font-medium text-white/40">{getFeatureMeta(f as any).label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <footer className="text-center pb-8 opacity-20">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield size={12} />
            <span className="text-[10px] font-black uppercase tracking-widest">Secure Payments</span>
          </div>
          <p className="text-[9px] font-bold text-white/60">© 2026 GymApp. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
