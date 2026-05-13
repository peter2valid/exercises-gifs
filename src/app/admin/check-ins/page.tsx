import { requireAdminAccess } from '@/lib/admin/access';
import { getAdminSupabase } from '@/lib/supabase/server';
import { AdminTable, type AdminColumn } from '@/components/admin/AdminTable';

export const dynamic = 'force-dynamic';

const cols: AdminColumn[] = [
  {
    key: 'member_user_id',
    label: 'Member',
    render: (v) => <span className="font-mono text-[12px]">{String(v).slice(0, 8).toUpperCase()}</span>,
  },
  {
    key: 'method',
    label: 'Method',
    render: (v) => (
      <span className={`a-badge ${v === 'qr_scan' ? 'a-badge-blue' : 'a-badge-gray'}`}>
        {v === 'qr_scan' ? 'QR Scan' : 'Manual'}
      </span>
    ),
  },
  {
    key: 'checked_in_at',
    label: 'Time',
    render: (v) => new Date(v as string).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
  },
  {
    key: 'staff_user_id',
    label: 'Staff',
    render: (v) => v ? <span className="font-mono text-[12px]">{String(v).slice(0, 8).toUpperCase()}</span> : <span className="text-[#555]">—</span>,
  },
];

export default async function CheckInsPage() {
  const { gymId } = await requireAdminAccess();
  const admin = getAdminSupabase();

  const { data: checkIns } = await admin
    .from('member_check_ins')
    .select('id, member_user_id, method, checked_in_at, staff_user_id')
    .eq('gym_id', gymId ?? '')
    .order('checked_in_at', { ascending: false })
    .limit(100);

  const rows = (checkIns ?? []) as Record<string, unknown>[];

  return (
    <div className="space-y-4 max-w-4xl">
      <div>
        <h2 className="text-[18px] font-bold text-[#e8e8e8]">Check-ins</h2>
        <p className="text-[13px] text-[#555] mt-0.5">Last 100 check-ins</p>
      </div>
      <AdminTable
        columns={cols}
        rows={rows}
        emptyMessage="No check-ins recorded"
        emptyDescription="Check-ins appear here when members scan QR codes or are checked in manually."
      />
    </div>
  );
}
