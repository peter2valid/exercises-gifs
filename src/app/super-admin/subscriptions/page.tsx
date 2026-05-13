import { requireSuperAdmin } from '@/lib/admin/access';
import { getAdminSupabase } from '@/lib/supabase/server';
import { AdminTable, type AdminColumn } from '@/components/admin/AdminTable';
import { CancelSubscriptionButton, EditGymSubscriptionButton } from '@/components/super-admin/ActionButtons';

export const dynamic = 'force-dynamic';

const STATUS_CLASS: Record<string, string> = {
  active:   'a-badge a-badge-ok',
  past_due: 'a-badge a-badge-warn',
  canceled: 'a-badge a-badge-err',
  trialing: 'a-badge a-badge-blue',
};

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

const gymCols: AdminColumn[] = [
  {
    key: 'gym_name',
    label: 'Gym',
    render: (v) => <span className="text-[#e8e8e8]">{String(v ?? '—')}</span>,
  },
  {
    key: 'plan',
    label: 'Plan',
    render: (v) => <span className="a-badge a-badge-gray uppercase">{String(v)}</span>,
  },
  {
    key: 'status',
    label: 'Status',
    render: (v) => <span className={STATUS_CLASS[v as string] ?? 'a-badge a-badge-gray capitalize'}>{String(v)}</span>,
  },
  {
    key: 'current_period_end',
    label: 'Expires',
    render: (v) => fmtDate(v as string | null),
  },
  {
    key: 'actions',
    label: '',
    render: (_, row) => (
      <div className="flex items-center justify-end gap-1">
        <EditGymSubscriptionButton subscription={row} />
        <CancelSubscriptionButton id={row.gym_id as string} type="gym" status={row.status as string} />
      </div>
    ),
  }
];

const userCols: AdminColumn[] = [
  {
    key: 'user_id',
    label: 'User',
    render: (v) => <span className="font-mono text-[12px] text-[#909090]">{String(v).slice(0, 8).toUpperCase()}</span>,
  },
  {
    key: 'plan',
    label: 'Plan',
    render: (v) => <span className="a-badge a-badge-gray uppercase">{String(v)}</span>,
  },
  {
    key: 'status',
    label: 'Status',
    render: (v) => <span className={STATUS_CLASS[v as string] ?? 'a-badge a-badge-gray capitalize'}>{String(v)}</span>,
  },
  {
    key: 'current_period_end',
    label: 'Expires',
    render: (v) => fmtDate(v as string | null),
  },
  {
    key: 'actions',
    label: '',
    render: (_, row) => <CancelSubscriptionButton id={row.user_id as string} type="user" status={row.status as string} />,
  }
];

export default async function SubscriptionsPage() {
  await requireSuperAdmin();
  const admin = getAdminSupabase();

  const [gymSubsRes, gymsRes, userSubsRes] = await Promise.all([
    admin.from('gym_subscriptions').select('gym_id, plan, status, current_period_end').order('status'),
    admin.from('gyms').select('id, name'),
    admin.from('user_subscriptions').select('user_id, plan, status, current_period_end').order('status').limit(200),
  ]);

  const gymMap = Object.fromEntries((gymsRes.data ?? []).map(g => [g.id, g.name]));

  const gymRows = (gymSubsRes.data ?? []).map(s => ({
    ...s,
    gym_name: gymMap[s.gym_id] ?? s.gym_id,
  })) as Record<string, unknown>[];

  const userRows = (userSubsRes.data ?? []) as Record<string, unknown>[];

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h2 className="text-[18px] font-bold text-[#e8e8e8]">Subscriptions</h2>
        <p className="text-[13px] text-[#555] mt-0.5">All active and past subscriptions</p>
        <p className="mt-1 text-[12px] text-[#444]">Use Edit to manually set gym plan and expiry for cash or M-Pesa payments.</p>
      </div>

      <div className="space-y-3">
        <p className="text-[13px] font-semibold text-[#e8e8e8]">Gym Plans <span className="text-[#555] font-normal">({gymRows.length})</span></p>
        <AdminTable columns={gymCols} rows={gymRows} emptyMessage="No gym subscriptions" />
      </div>

      <div className="space-y-3">
        <p className="text-[13px] font-semibold text-[#e8e8e8]">User Subscriptions <span className="text-[#555] font-normal">({userRows.length})</span></p>
        <AdminTable columns={userCols} rows={userRows} emptyMessage="No user subscriptions" />
      </div>
    </div>
  );
}
