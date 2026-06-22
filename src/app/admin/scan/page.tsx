import { requireAdminAccess } from '@/lib/admin/access';
import { getAdminSupabase } from '@/lib/supabase/server';
import { ScanTabs } from '@/components/admin/ScanTabs';

export const dynamic = 'force-dynamic';

export default async function ScanPage() {
  const { gymId, gym } = await requireAdminAccess();

  if (!gymId) {
    return (
      <div className="text-[#555] text-sm">No gym associated with this account.</div>
    );
  }

  const admin = getAdminSupabase();
  const { data: memberships } = await admin
    .from('gym_memberships')
    .select('user_id, profiles:user_id(full_name)')
    .eq('gym_id', gymId)
    .eq('status', 'active');

  const members = ((memberships ?? []) as unknown as { user_id: string; profiles?: { full_name: string } | { full_name: string }[] | null }[])
    .map(m => {
      const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
      return { id: m.user_id, fullName: profile?.full_name || 'Anonymous User' };
    });

  return (
    <div className="space-y-4 max-w-lg">
      <div>
        <h2 className="text-[18px] font-bold text-[#e8e8e8]">Check-in Scanner</h2>
        <p className="text-[13px] text-[#555] mt-0.5">
          Scan a member&apos;s QR code, or look them up manually if they don&apos;t have it.
        </p>
      </div>
      <ScanTabs gymId={gymId} gymName={gym?.name ?? ''} members={members} />
    </div>
  );
}
