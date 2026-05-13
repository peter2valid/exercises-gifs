import './admin.css';
import { AdminShell } from '@/components/admin/AdminShell';
import { requireAdminAccess } from '@/lib/admin/access';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, gym } = await requireAdminAccess();

  return (
    <AdminShell
      variant="admin"
      gymName={gym?.name ?? 'Gym Admin'}
      userEmail={user.email ?? ''}
    >
      {children}
    </AdminShell>
  );
}
