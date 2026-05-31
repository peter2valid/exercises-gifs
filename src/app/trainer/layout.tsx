import { AdminShell } from '@/components/admin/AdminShell';
import { requireTrainerAccess } from '@/lib/admin/access';

export const dynamic = 'force-dynamic';

export default async function TrainerLayout({ children }: { children: React.ReactNode }) {
  const { user, gym } = await requireTrainerAccess();

  return (
    <AdminShell
      variant="trainer"
      gymName={gym?.name ?? 'Gym Trainer'}
      userEmail={user.email ?? ''}
    >
      {children}
    </AdminShell>
  );
}
