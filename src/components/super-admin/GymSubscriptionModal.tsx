'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { AdminButton } from '@/components/admin/AdminButton';

type GymSubscription = {
  gym_id: string;
  plan?: string | null;
  status?: string | null;
  current_period_end?: string | null;
  gym_name?: string;
};

const PLAN_OPTIONS = ['start', 'active', 'elite'] as const;
const STATUS_OPTIONS = ['active', 'trialing', 'past_due', 'canceled', 'paused', 'expired'] as const;

function toDateInput(iso?: string | null) {
  if (!iso) return '';
  return new Date(iso).toISOString().slice(0, 10);
}

export function GymSubscriptionModal({
  subscription,
  onClose,
}: {
  subscription: GymSubscription;
  onClose: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(subscription.plan ?? 'active');
  const [status, setStatus] = useState(subscription.status ?? 'active');
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState(toDateInput(subscription.current_period_end));
  const [error, setError] = useState<string | null>(null);

  const title = useMemo(() => subscription.gym_name ?? subscription.gym_id, [subscription]);

  const handleSave = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/super-admin/subscriptions/gym/${subscription.gym_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          status,
          currentPeriodEnd: currentPeriodEnd || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to update subscription');
      }

      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error — please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#111] border border-[#262626] rounded-2xl shadow-2xl p-6"
        style={{ maxHeight: 'calc(100vh - (var(--bottom-nav-height,76px) + env(safe-area-inset-bottom) + 48px))', overflowY: 'auto', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-white">Edit Gym Subscription</h3>
            <p className="text-[12px] text-[#555]">{title}</p>
          </div>
          <button onClick={onClose} className="text-[#555] hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-[#555] uppercase tracking-wider">Plan</label>
            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-2 text-sm text-[#e8e8e8] outline-none focus:border-blue-600 transition-colors"
            >
              {PLAN_OPTIONS.map((option) => (
                <option key={option} value={option}>{option.toUpperCase()}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-[#555] uppercase tracking-wider">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-2 text-sm text-[#e8e8e8] outline-none focus:border-blue-600 transition-colors"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-[#555] uppercase tracking-wider">Current Period End</label>
            <input
              type="date"
              value={currentPeriodEnd}
              onChange={(e) => setCurrentPeriodEnd(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-2 text-sm text-[#e8e8e8] outline-none focus:border-blue-600 transition-colors"
            />
            <p className="text-[10px] text-[#444]">Leave blank to keep the existing expiry date.</p>
          </div>

          {error && (
            <p className="text-[13px] text-[#ef4444] bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="pt-2 flex gap-3">
            <AdminButton type="button" variant="ghost" className="flex-1" onClick={onClose}>
              Cancel
            </AdminButton>
            <AdminButton type="button" variant="primary" className="flex-1" loading={loading} onClick={handleSave}>
              Save Changes
            </AdminButton>
          </div>
        </div>
      </div>
    </div>
  );
}