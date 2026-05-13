import { requireSuperAdmin } from '@/lib/admin/access';
import { getAdminSupabase } from '@/lib/supabase/server';
import { AdminTable, type AdminColumn } from '@/components/admin/AdminTable';
import { SuspendGymButton } from '@/components/super-admin/ActionButtons';

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
    key: 'id',
    label: 'ID',
    render: (v) => <span className="font-mono text-[12px] text-[#555]">{String(v).slice(0, 8).toUpperCase()}</span>,
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
    render: (_, row) => <SuspendGymButton gymId={row.id as string} status={row.status as string} />,
  }
];

export default async function GymsPage() {
  await requireSuperAdmin();
  const admin = getAdminSupabase();

  const { data: gyms } = await admin
    .from('gyms')
    .select('id, name, status, created_at')
    .order('created_at', { ascending: false });

  const gymIds = (gyms ?? []).map(g => g.id);

  const { data: subs } = gymIds.length
    ? await admin
        .from('gym_subscriptions')
        .select('gym_id, plan, status')
        .in('gym_id', gymIds)
    : { data: [] };

  const subMap = Object.fromEntries((subs ?? []).map(s => [s.gym_id, s]));

  const rows = (gyms ?? []).map(g => ({
    ...g,
    plan: subMap[g.id]?.plan ?? null,
    sub_status: subMap[g.id]?.status ?? null,
  })) as Record<string, unknown>[];

  return (
    <div className="space-y-4 max-w-5xl">
      <div>
        <h2 className="text-[18px] font-bold text-[#e8e8e8]">Gyms</h2>
        <p className="text-[13px] text-[#555] mt-0.5">{rows.length} gym{rows.length !== 1 ? 's' : ''}</p>
      </div>
      <AdminTable
        columns={cols}
        rows={rows}
        emptyMessage="No gyms yet"
      />
    </div>
  );
}
