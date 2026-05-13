import { requireAdminAccess } from '@/lib/admin/access';
import { getAdminSupabase } from '@/lib/supabase/server';
import { AdminTable, type AdminColumn } from '@/components/admin/AdminTable';

export const dynamic = 'force-dynamic';

const ROLE_CLASS: Record<string, string> = {
  gym_owner: 'a-badge a-badge-blue',
  gym_admin: 'a-badge a-badge-ok',
  trainer:   'a-badge a-badge-warn',
};

const ROLE_LABEL: Record<string, string> = {
  gym_owner: 'Owner',
  gym_admin: 'Admin',
  trainer:   'Trainer',
};

const cols: AdminColumn[] = [
  {
    key: 'user_id',
    label: 'User ID',
    render: (v) => <span className="font-mono text-[12px] text-[#909090]">{String(v).slice(0, 8).toUpperCase()}</span>,
  },
  {
    key: 'role',
    label: 'Role',
    render: (v) => (
      <span className={ROLE_CLASS[v as string] ?? 'a-badge a-badge-gray'}>
        {ROLE_LABEL[v as string] ?? String(v)}
      </span>
    ),
  },
  {
    key: 'created_at',
    label: 'Added',
    render: (v) => new Date(v as string).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
  },
];

export default async function StaffPage() {
  const { gymId } = await requireAdminAccess();
  const admin = getAdminSupabase();

  const { data: staff } = await admin
    .from('user_gym_roles')
    .select('id, user_id, role, created_at')
    .eq('gym_id', gymId ?? '')
    .in('role', ['gym_owner', 'gym_admin', 'trainer'])
    .order('created_at', { ascending: false });

  const rows = (staff ?? []) as Record<string, unknown>[];

  return (
    <div className="space-y-4 max-w-4xl">
      <div>
        <h2 className="text-[18px] font-bold text-[#e8e8e8]">Staff</h2>
        <p className="text-[13px] text-[#555] mt-0.5">{rows.length} staff member{rows.length !== 1 ? 's' : ''}</p>
      </div>
      <AdminTable
        columns={cols}
        rows={rows}
        emptyMessage="No staff assigned"
        emptyDescription="Staff are added via the user_gym_roles table or invitation flow."
      />
    </div>
  );
}
