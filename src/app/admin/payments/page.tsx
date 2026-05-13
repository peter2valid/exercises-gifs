import { requireAdminAccess } from '@/lib/admin/access';
import { getAdminSupabase } from '@/lib/supabase/server';
import { AdminTable, type AdminColumn } from '@/components/admin/AdminTable';

export const dynamic = 'force-dynamic';

const STATUS_CLASS: Record<string, string> = {
  success:   'a-badge a-badge-ok',
  pending:   'a-badge a-badge-warn',
  failed:    'a-badge a-badge-err',
  abandoned: 'a-badge a-badge-gray',
  reversed:  'a-badge a-badge-gray',
};

const cols: AdminColumn[] = [
  {
    key: 'reference',
    label: 'Reference',
    render: (v) => <span className="font-mono text-[12px]">{String(v)}</span>,
  },
  {
    key: 'amount_kobo',
    label: 'Amount',
    render: (v, row) => `${row.currency ?? 'KES'} ${((v as number) / 100).toLocaleString()}`,
  },
  {
    key: 'status',
    label: 'Status',
    render: (v) => <span className={STATUS_CLASS[v as string] ?? 'a-badge a-badge-gray'}>{String(v)}</span>,
  },
  {
    key: 'created_at',
    label: 'Date',
    render: (v) => new Date(v as string).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
  },
];

export default async function PaymentsPage() {
  const { gymId } = await requireAdminAccess();
  const admin = getAdminSupabase();

  const { data: payments } = await admin
    .from('payments')
    .select('id, reference, amount_kobo, currency, status, created_at')
    .eq('subject_id', gymId ?? '')
    .eq('subject_type', 'gym_subscription')
    .order('created_at', { ascending: false })
    .limit(50);

  const rows = (payments ?? []) as Record<string, unknown>[];

  return (
    <div className="space-y-4 max-w-4xl">
      <div>
        <h2 className="text-[18px] font-bold text-[#e8e8e8]">Payments</h2>
        <p className="text-[13px] text-[#555] mt-0.5">{rows.length} records</p>
      </div>
      <AdminTable
        columns={cols}
        rows={rows}
        emptyMessage="No payments found"
      />
    </div>
  );
}
