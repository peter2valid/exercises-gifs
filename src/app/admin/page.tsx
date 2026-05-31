import { requireAdminAccess } from '@/lib/admin/access';
import { getAdminSupabase } from '@/lib/supabase/server';
import { AdminCard } from '@/components/admin/AdminCard';
import { AdminTable, type AdminColumn } from '@/components/admin/AdminTable';
import { Users, ScanLine, Package, AlertTriangle } from 'lucide-react';

export const dynamic = 'force-dynamic';

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function statusBadge(status: string) {
  const cls: Record<string, string> = {
    success:   'a-badge a-badge-ok',
    pending:   'a-badge a-badge-warn',
    failed:    'a-badge a-badge-err',
    abandoned: 'a-badge a-badge-gray',
  };
  return <span className={cls[status] ?? 'a-badge a-badge-gray'}>{status}</span>;
}

const paymentCols: AdminColumn[] = [
  { key: 'reference', label: 'Reference', render: (v) => <span className="font-mono text-[12px]">{String(v).slice(0, 22)}…</span> },
  { key: 'amount_kobo', label: 'Amount', render: (v) => `KES ${((v as number) / 100).toLocaleString()}` },
  { key: 'status', label: 'Status', render: (v) => statusBadge(v as string) },
  { key: 'created_at', label: 'Date', render: (v) => fmtDate(v as string) },
];

export default async function AdminDashboard() {
  const { gymId, gym } = await requireAdminAccess();

  if (!gymId) {
    return <div className="text-[#555] text-sm">No gym associated with this account.</div>;
  }

  const admin = getAdminSupabase();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [membersRes, activeRes, todayRes, paymentsRes, subRes] = await Promise.all([
    admin.from('gym_memberships').select('id', { count: 'exact', head: true }).eq('gym_id', gymId).eq('status', 'active'),
    admin.from('member_check_ins').select('member_user_id', { count: 'exact', head: true })
      .eq('gym_id', gymId).gte('checked_in_at', new Date(Date.now() - 30 * 86400000).toISOString()),
    admin.from('member_check_ins').select('id', { count: 'exact', head: true })
      .eq('gym_id', gymId).gte('checked_in_at', todayStart.toISOString()),
    admin.from('payments').select('id, reference, amount_kobo, currency, status, created_at')
      .eq('subject_id', gymId).eq('subject_type', 'gym_subscription')
      .order('created_at', { ascending: false }).limit(8),
    admin.from('gym_subscriptions').select('plan, status, current_period_end')
      .eq('gym_id', gymId).maybeSingle(),
  ]);

  const payments = (paymentsRes.data ?? []) as Record<string, unknown>[];
  const sub = subRes.data;

  const subExpiry = sub?.current_period_end ? new Date(sub.current_period_end) : null;
  const daysLeft = subExpiry ? Math.ceil((subExpiry.getTime() - Date.now()) / 86400000) : null;
  const showExpiryWarning = daysLeft !== null && daysLeft <= 7;

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-[18px] font-bold text-[#e8e8e8]">{gym?.name ?? 'Dashboard'}</h2>
        <p className="text-[13px] text-[#555] mt-0.5">Gym overview</p>
      </div>

      {showExpiryWarning && (
        <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${daysLeft < 0 ? 'border-red-500/30 bg-red-500/10' : 'border-amber-500/30 bg-amber-500/10'}`}>
          <AlertTriangle size={16} className={`mt-0.5 shrink-0 ${daysLeft < 0 ? 'text-red-400' : 'text-amber-400'}`} />
          <div className="flex-1 min-w-0">
            <p className={`text-[13px] font-semibold ${daysLeft < 0 ? 'text-red-400' : 'text-amber-400'}`}>
              {daysLeft < 0 ? 'Subscription expired' : `Subscription expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`}
            </p>
            <p className="text-[12px] text-[#555] mt-0.5">
              Go to <a href="/admin/packages" className="text-blue-400 hover:text-blue-300 underline">Packages</a> to renew your plan.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <AdminCard title="Total Members" value={membersRes.count ?? 0} icon={<Users size={16} />} />
        <AdminCard title="Active (30d)" value={activeRes.count ?? 0} description="Unique check-ins" accent="green" icon={<Users size={16} />} />
        <AdminCard title="Check-ins Today" value={todayRes.count ?? 0} accent="blue" icon={<ScanLine size={16} />} />
        <AdminCard
          title="Plan"
          value={sub?.plan?.toUpperCase() ?? '—'}
          description={sub ? `${sub.status} · ${sub.current_period_end ? 'expires ' + fmtDate(sub.current_period_end) : ''}` : 'No subscription'}
          accent={sub?.status === 'active' ? 'green' : 'amber'}
          icon={<Package size={16} />}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[13px] font-semibold text-[#e8e8e8]">Recent Payments</p>
          <a href="/admin/payments" className="text-[12px] text-blue-500 hover:text-blue-400">View all →</a>
        </div>
        <AdminTable columns={paymentCols} rows={payments} emptyMessage="No payments yet" />
      </div>
    </div>
  );
}
