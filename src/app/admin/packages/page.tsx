import { requireAdminAccess } from '@/lib/admin/access';
import { getAdminSupabase } from '@/lib/supabase/server';
import { AdminCard } from '@/components/admin/AdminCard';
import { UpgradePlanPanel } from '@/components/admin/UpgradePlanPanel';
import { Package, CheckCircle, AlertTriangle } from 'lucide-react';
import type { GymPlan } from '@/lib/billing/types';

export const dynamic = 'force-dynamic';

const PLAN_FEATURES: Record<string, string[]> = {
  start:  ['Exercise library', 'HD video demos', 'Offline viewing', 'Favorites'],
  active: ['Everything in Start', 'Workout history', 'PR tracking', 'Progress tracking', 'Attendance check-in', 'Coach plans', 'Badges'],
  elite:  ['Everything in Active', 'Gym branding', 'Coach dashboards', 'Advanced analytics', 'Branch management', 'Member insights', 'Priority support'],
};

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
}

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
}

export default async function PackagesPage() {
  const { gymId } = await requireAdminAccess();
  const admin = getAdminSupabase();

  const { data: sub } = await admin
    .from('gym_subscriptions')
    .select('plan, status, current_period_start, current_period_end, grace_period_end')
    .eq('gym_id', gymId ?? '')
    .maybeSingle();

  const plan = (sub?.plan ?? null) as GymPlan | null;
  const features = plan ? PLAN_FEATURES[plan] ?? [] : [];
  const daysLeft = daysUntil(sub?.current_period_end ?? null);
  const expiringSoon = daysLeft !== null && daysLeft <= 7 && daysLeft >= 0;
  const expired = daysLeft !== null && daysLeft < 0;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-[18px] font-bold text-[#e8e8e8]">Packages</h2>
        <p className="text-[13px] text-[#555] mt-0.5">Your current gym subscription</p>
      </div>

      {(expiringSoon || expired) && (
        <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${expired ? 'border-red-500/30 bg-red-500/10' : 'border-amber-500/30 bg-amber-500/10'}`}>
          <AlertTriangle size={16} className={`mt-0.5 shrink-0 ${expired ? 'text-red-400' : 'text-amber-400'}`} />
          <div>
            <p className={`text-[13px] font-semibold ${expired ? 'text-red-400' : 'text-amber-400'}`}>
              {expired ? 'Subscription expired' : `Expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`}
            </p>
            <p className="text-[12px] text-[#555] mt-0.5">
              {expired ? 'Your gym has lost access to premium features. Renew below.' : 'Renew before your plan expires to keep access.'}
            </p>
          </div>
        </div>
      )}

      {sub ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            <AdminCard title="Current Plan" value={sub.plan.toUpperCase()} accent="blue" icon={<Package size={16} />} />
            <AdminCard
              title="Status"
              value={sub.status.toUpperCase()}
              accent={sub.status === 'active' ? 'green' : sub.status === 'past_due' ? 'amber' : 'red'}
            />
            <AdminCard title="Expires" value={fmtDate(sub.current_period_end)} description={`Grace until ${fmtDate(sub.grace_period_end)}`} />
          </div>

          <div className="a-card">
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#555] mb-4">
              Included in {plan?.toUpperCase()} plan
            </p>
            <ul className="space-y-2">
              {features.map(f => (
                <li key={f} className="flex items-center gap-2.5 text-[13px] text-[#909090]">
                  <CheckCircle size={14} className="text-emerald-500 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          <UpgradePlanPanel gymId={gymId ?? ''} currentPlan={plan} />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="a-card text-center py-12">
            <Package size={28} className="text-[#444] mx-auto mb-3" />
            <p className="text-[14px] font-medium text-[#555]">No active subscription</p>
            <p className="text-[12px] text-[#444] mt-1">Choose a plan below to get started.</p>
          </div>

          <UpgradePlanPanel gymId={gymId ?? ''} currentPlan={null} />
        </div>
      )}
    </div>
  );
}
