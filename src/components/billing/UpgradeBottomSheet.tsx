'use client';

import { useState } from 'react';
import { X, Sparkles, CheckCircle, Shield, Zap } from 'lucide-react';
import { useEntitlementStore } from '@/store/entitlementStore';
import { PLUS_PRICING, PLUS_HIGHLIGHT_FEATURES } from '@/lib/billing/memberPlans';
import { getFeatureMeta } from '@/lib/billing/featureRegistry';
import type { MemberBillingPeriod } from '@/lib/billing/types';

/**
 * Bottom sheet upgrade prompt — Refined for Viewora Plus.
 * 
 * Design follows:
 * - Luxury futuristic OS aesthetic
 * - Emerald energy accents
 * - Tactile, premium materials
 */
export function UpgradeBottomSheet() {
  const {
    upgradeSheetVisible,
    upgradeTargetFeature,
    upgradePreselectedPeriod,
    dismissUpgradeSheet,
  } = useEntitlementStore();

  const [period, setPeriod] = useState<MemberBillingPeriod>(upgradePreselectedPeriod);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!upgradeSheetVisible) return null;

  const targetMeta = upgradeTargetFeature ? getFeatureMeta(upgradeTargetFeature) : null;
  const price = PLUS_PRICING[period];

  const highlightFeatures = [
    ...(upgradeTargetFeature ? [upgradeTargetFeature] : []),
    ...PLUS_HIGHLIGHT_FEATURES.filter(f => f !== upgradeTargetFeature),
  ].slice(0, 5);

  const handleUpgrade = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/paystack/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'member', planId: period }),
      });

      if (!res.ok) throw new Error('Payment initialisation failed');

      const data = await res.json();
      window.location.href = data.authorization_url;
    } catch {
      setError('Connection failed. Please check your network.');
      setLoading(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/80 backdrop-blur-md"
        onClick={dismissUpgradeSheet}
        aria-hidden="true"
      />

      <div
        className="fixed bottom-0 inset-x-0 z-50 bg-[#0a0a0b] rounded-t-[32px]
                   border-t border-white/10 animate-slide-up shadow-[0_-20px_50px_rgba(0,0,0,0.5)]"
        role="dialog"
        aria-modal="true"
      >
        <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mt-4 mb-2" />

        <div className="px-7 pt-5 pb-12">
          <button
            onClick={dismissUpgradeSheet}
            className="absolute right-6 top-6 p-2 text-white/20 hover:text-white/60
                       transition-colors rounded-xl bg-white/5 border border-white/5"
            aria-label="Close"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10
                            flex items-center justify-center flex-shrink-0 shadow-2xl glow-emerald">
              <Zap className="w-7 h-7 text-emerald-500 fill-emerald-500/20" />
            </div>
            <div>
              <p className="text-white font-black text-2xl tracking-tighter uppercase italic">Viewora Plus</p>
              {targetMeta && (
                <p className="text-white/40 text-[13px] mt-0.5 tracking-tight font-medium">
                  Unlock <span className="text-white font-bold">{targetMeta.label}</span>
                </p>
              )}
            </div>
          </div>

          <div className="space-y-4 mb-8">
            {highlightFeatures.map(f => {
              const fm = getFeatureMeta(f);
              const isTarget = f === upgradeTargetFeature;
              return (
                <div key={f} className={`flex items-start gap-3 ${isTarget ? 'opacity-100' : 'opacity-60'}`}>
                  <CheckCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isTarget ? 'text-emerald-500' : 'text-white/20'}`} />
                  <div>
                    <span className={`text-sm font-bold tracking-tight ${isTarget ? 'text-white' : 'text-white/80'}`}>
                      {fm.label}
                    </span>
                    {isTarget && (
                      <p className="text-white/40 text-xs mt-0.5 leading-relaxed">{fm.description}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-2.5 mb-8 p-1.5 bg-white/5 rounded-2xl border border-white/5">
            {(Object.keys(PLUS_PRICING) as MemberBillingPeriod[]).map(p => {
              const pr = PLUS_PRICING[p];
              const active = period === p;
              return (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`flex-1 flex flex-col items-center justify-center py-4 rounded-xl border transition-all relative ${
                    active
                      ? 'bg-white/10 border-white/20 text-white shadow-xl scale-[1.02]'
                      : 'border-transparent text-white/30 hover:text-white/50'
                  }`}
                >
                  <span className="text-[10px] font-black uppercase tracking-widest mb-1">{p}</span>
                  <span className="text-base font-black tracking-tighter">{pr.label.split('—')[0]}</span>
                  {pr.saveLabel && (
                    <span className={`absolute -top-2 left-1/2 -translate-x-1/2
                                     px-2 py-0.5 rounded-full
                                     text-[9px] font-black uppercase tracking-tighter
                                     whitespace-nowrap shadow-xl transition-opacity duration-300 ${
                                       active ? 'bg-emerald-500 text-black opacity-100' : 'bg-white/10 text-white/40 opacity-0'
                                     }`}>
                      {pr.saveLabel}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {error && (
            <p className="text-rose-500 text-xs font-bold text-center mb-4 uppercase tracking-tighter">{error}</p>
          )}

          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="w-full h-16 rounded-2xl font-black text-lg transition-all active:scale-[0.97] bg-white text-black shadow-[0_20px_50px_rgba(0,0,0,0.4)] hover:bg-white/90 relative overflow-hidden group glow-emerald disabled:opacity-50"
          >
            <div className="absolute inset-0 bg-emerald-500/0 group-hover:bg-emerald-500/5 transition-colors" />
            {loading ? (
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                CONNECTING...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Zap size={18} fill="currentColor" className="text-emerald-500" />
                UPGRADE NOW
              </div>
            )}
          </button>

          <div className="flex items-center justify-center gap-2 mt-5 opacity-30">
            <Shield size={12} />
            <p className="text-[10px] font-bold uppercase tracking-widest">Paystack Secure Integration</p>
          </div>
        </div>
      </div>
    </>
  );
}
