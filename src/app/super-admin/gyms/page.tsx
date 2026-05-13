import { requireSuperAdmin } from '@/lib/admin/access';
import { getAdminSupabase } from '@/lib/supabase/server';
import { AdminTable, type AdminColumn } from '@/components/admin/AdminTable';
import { SuspendGymButton, EditGymButton, EditGymSubscriptionButton } from '@/components/super-admin/ActionButtons';
import { NewGymButton } from '@/components/super-admin/NewGymModal';

export const dynamic = 'force-dynamic';

const STATUS_CLASS: Record<string, string> = {
  active:   'a-badge a-badge-ok',
  past_due: 'a-badge a-badge-warn',
  canceled: 'a-badge a-badge-err',
  trialing: 'a-badge a-badge-blue',
};

const GYM_STATUS_CLASS: Record<string, string> = {
  active: 'a-badge a-badge-ok',
  suspended: 'a-badge a-badge-err',
};

const cols: AdminColumn[] = [
  {
    key: 'name',
    label: 'Gym',
    render: (v) => <span className="font-medium text-[#e8e8e8]">{String(v)}</span>,
  },
  {
    key: 'admin_email',
    label: 'Owner / Admin',
    render: (v) => v 
      ? <span className="text-[13px] text-[#909090]">{String(v)}</span>
      : <span className="text-[#333] italic text-[12px]">Unassigned</span>,
  },
  {
    key: 'status',
    label: 'Account Status',
    render: (v) => <span className={GYM_STATUS_CLASS[v as string] ?? 'a-badge a-badge-gray capitalize'}>{String(v)}</span>,
  },
  {
    key: 'plan',
    label: 'Plan',
    render: (v) => v
      ? <span className="a-badge a-badge-gray uppercase">{String(v)}</span>
      : <span className="text-[#555]">—</span>,
  },
  {
    key: 'sub_status',
    label: 'Sub Status',
    render: (v) => v
      ? <span className={STATUS_CLASS[v as string] ?? 'a-badge a-badge-gray capitalize'}>{String(v)}</span>
      : <span className="text-[#555]">—</span>,
  },
  {
    key: 'created_at',
    label: 'Created',
    render: (v) => new Date(v as string).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
  },
  {
    key: 'actions',
    label: '',
    render: (_, row) => (
      <div className="flex items-center justify-end gap-1">
        <EditGymButton gym={row} ownerEmail={row.admin_email as string} />
        <EditGymSubscriptionButton subscription={row} />
        <SuspendGymButton gymId={row.id as string} status={row.status as string} />
      </div>
    ),
  }
];

export default async function GymsPage() {
  await requireSuperAdmin();
  const admin = getAdminSupabase();

  const { data: gyms } = await admin
    .from('gyms')
    .select('id, name, slug, status, created_at, owner_id')
    .order('created_at', { ascending: false });

  const gymIds = (gyms ?? []).map(g => g.id);

  // Fetch subscriptions and users (to get emails)
  const [subsRes, usersRes] = await Promise.all([
    gymIds.length
      ? admin.from('gym_subscriptions').select('gym_id, plan, status, current_period_end').in('gym_id', gymIds)
      : { data: [] },
    admin.auth.admin.listUsers({ perPage: 1000 })
  ]);

  const subMap = Object.fromEntries((subsRes.data ?? []).map(s => [s.gym_id, s]));
  const userMap = Object.fromEntries((usersRes.data?.users ?? []).map(u => [u.id, u.email]));

  const rows = (gyms ?? []).map(g => ({
    ...g,
    admin_email: g.owner_id ? userMap[g.owner_id] : null,
    plan: subMap[g.id]?.plan ?? null,
    sub_status: subMap[g.id]?.status ?? null,
    current_period_end: subMap[g.id]?.current_period_end ?? null,
  })) as Record<string, unknown>[];

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[18px] font-bold text-[#e8e8e8]">Gyms</h2>
          <p className="text-[13px] text-[#555] mt-0.5">{rows.length} gym{rows.length !== 1 ? 's' : ''}</p>
        </div>
        <NewGymButton />
      </div>
      <AdminTable
        columns={cols}
        rows={rows}
        emptyMessage="No gyms yet"
      />
    </div>
  );
}
