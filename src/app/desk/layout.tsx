import { AdminShell } from '@/components/admin/AdminShell';
import { requireDeskAccess } from '@/lib/admin/access';

export const dynamic = 'force-dynamic';

export default async function DeskLayout({ children }: { children: React.ReactNode }) {
  const { user, gym } = await requireDeskAccess();

  return (
    <AdminShell
      variant="desk"
      gymName={gym?.name ?? 'Front Desk'}
      userEmail={user.email ?? ''}
    >
      {children}
    </AdminShell>
  );
}
