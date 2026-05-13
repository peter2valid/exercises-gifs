import { requireSuperAdmin } from '@/lib/admin/access';
import { getAdminSupabase } from '@/lib/supabase/server';
import { AdminTable, type AdminColumn } from '@/components/admin/AdminTable';

export const dynamic = 'force-dynamic';

const cols: AdminColumn[] = [
  {
    key: 'email',
    label: 'Email',
    render: (v) => <span className="text-[13px] text-[#e8e8e8]">{String(v ?? '—')}</span>,
  },
  {
    key: 'id',
    label: 'User ID',
    render: (v) => <span className="font-mono text-[12px] text-[#555]">{String(v).slice(0, 8).toUpperCase()}</span>,
  },
  {
    key: 'created_at',
    label: 'Signed Up',
    render: (v) => new Date(v as string).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
  },
  {
    key: 'last_sign_in_at',
    label: 'Last Seen',
    render: (v) => v
      ? new Date(v as string).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
      : <span className="text-[#555]">—</span>,
  },
];

export default async function UsersPage() {
  await requireSuperAdmin();
  const admin = getAdminSupabase();

  const { data, error } = await admin.auth.admin.listUsers({ perPage: 200 });

  if (error) {
    return (
      <div className="space-y-4 max-w-5xl">
        <h2 className="text-[18px] font-bold text-[#e8e8e8]">Users</h2>
        <p className="text-[13px] text-red-400">Failed to load users: {error.message}</p>
      </div>
    );
  }

  const rows = (data.users ?? []).map(u => ({
    id: u.id,
    email: u.email,
    created_at: u.created_at,
    last_sign_in_at: u.last_sign_in_at,
  })) as Record<string, unknown>[];

  return (
    <div className="space-y-4 max-w-5xl">
      <div>
        <h2 className="text-[18px] font-bold text-[#e8e8e8]">Users</h2>
        <p className="text-[13px] text-[#555] mt-0.5">{rows.length} user{rows.length !== 1 ? 's' : ''}</p>
      </div>
      <AdminTable
        columns={cols}
        rows={rows}
        emptyMessage="No users found"
      />
    </div>
  );
}
