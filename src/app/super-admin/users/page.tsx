import { requireSuperAdmin } from '@/lib/admin/access';
import { getAdminSupabase } from '@/lib/supabase/server';
import { AdminTable, type AdminColumn } from '@/components/admin/AdminTable';
import { UserActions } from '@/components/super-admin/UserActions';

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  await requireSuperAdmin();
  const admin = getAdminSupabase();

  const [usersRes, gymsRes, rolesRes] = await Promise.all([
    admin.auth.admin.listUsers({ perPage: 200 }),
    admin.from('gyms').select('id, name'),
    admin.from('user_gym_roles').select('*')
  ]);

  if (usersRes.error) {
    return (
      <div className="space-y-4 max-w-5xl">
        <h2 className="text-[18px] font-bold text-[#e8e8e8]">Users</h2>
        <p className="text-[13px] text-red-400">Failed to load users: {usersRes.error.message}</p>
      </div>
    );
  }

  const gyms = gymsRes.data ?? [];
  const allRoles = rolesRes.data ?? [];
  const gymMap = Object.fromEntries(gyms.map(g => [g.id, g.name]));

  const cols: AdminColumn[] = [
    {
      key: 'email',
      label: 'Email',
      render: (v) => <span className="text-[13px] text-[#e8e8e8]">{String(v ?? '—')}</span>,
    },
    {
      key: 'roles',
      label: 'Roles / Gyms',
      render: (_, row) => {
        const userRoles = allRoles.filter(r => r.user_id === row.id);
        if (userRoles.length === 0) return <span className="text-[#333] italic text-[12px]">No roles</span>;
        
        return (
          <div className="flex flex-wrap gap-1">
            {userRoles.map((r, i) => (
              <span key={i} className={`a-badge text-[10px] ${r.role === 'super_admin' ? 'a-badge-blue' : 'a-badge-gray'}`}>
                {r.role === 'super_admin' ? 'Super Admin' : `${r.role} @ ${gymMap[r.gym_id!] || 'Unknown'}`}
              </span>
            ))}
          </div>
        );
      }
    },
    {
      key: 'created_at',
      label: 'Signed Up',
      render: (v) => new Date(v as string).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
    },
    {
      key: 'actions',
      label: '',
      render: (_, row) => (
        <div className="flex justify-end">
          <UserActions 
            user={row} 
            gyms={gyms} 
            roles={allRoles.filter(r => r.user_id === row.id)} 
          />
        </div>
      ),
    },
  ];

  const rows = (usersRes.data.users ?? []).map(u => ({
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
