import { requireAdminAccess } from '@/lib/admin/access';
import { getAdminSupabase } from '@/lib/supabase/server';
import { AdminTable, type AdminColumn } from '@/components/admin/AdminTable';

export const dynamic = 'force-dynamic';

const cols: AdminColumn[] = [
  {
    key: 'user_id',
    label: 'Member ID',
    render: (v) => <span className="font-mono text-[12px] text-[#909090]">{String(v).slice(0, 8).toUpperCase()}</span>,
  },
  {
    key: 'role',
    label: 'Role',
    render: (v) => (
      <span className="a-badge a-badge-gray capitalize">{String(v)}</span>
    ),
  },
  {
    key: 'joined_at',
    label: 'Joined',
    render: (v) => new Date(v as string).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
  },
];

export default async function MembersPage() {
  const { gymId } = await requireAdminAccess();
  const admin = getAdminSupabase();

  const { data: members } = await admin
    .from('gym_memberships')
    .select('id, user_id, role, joined_at')
    .eq('gym_id', gymId ?? '')
    .order('joined_at', { ascending: false });

  const rows = (members ?? []) as Record<string, unknown>[];

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[18px] font-bold text-[#e8e8e8]">Members</h2>
          <p className="text-[13px] text-[#555] mt-0.5">{rows.length} total</p>
        </div>
      </div>
      <AdminTable
        columns={cols}
        rows={rows}
        emptyMessage="No members yet"
        emptyDescription="Members will appear here once they join your gym."
      />
    </div>
  );
}
