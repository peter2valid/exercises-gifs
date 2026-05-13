import '../admin/admin.css';
import { AdminShell } from '@/components/admin/AdminShell';
import { requireSuperAdmin } from '@/lib/admin/access';

export const dynamic = 'force-dynamic';

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireSuperAdmin();

  return (
    <AdminShell
      variant="super-admin"
      gymName="Viewora"
      userEmail={user.email ?? ''}
    >
      {children}
    </AdminShell>
  );
}
