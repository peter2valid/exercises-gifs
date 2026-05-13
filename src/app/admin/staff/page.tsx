import { requireAdminAccess } from '@/lib/admin/access';
import { getAdminSupabase } from '@/lib/supabase/server';
import { StaffPanel } from '@/components/admin/StaffPanel';

export const dynamic = 'force-dynamic';

export default async function StaffPage() {
  const { gymId } = await requireAdminAccess();

  if (!gymId) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-[#555]">No gym found for your account.</p>
      </div>
    );
  }

  const admin = getAdminSupabase();
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  const [staffResult, invitesResult] = await Promise.all([
    admin
      .from('user_gym_roles')
      .select('id, user_id, role, created_at')
      .eq('gym_id', gymId)
      .in('role', ['gym_owner', 'gym_admin', 'trainer', 'member'])
      .order('created_at', { ascending: false }),
    admin
      .from('gym_invitations')
      .select('id, email, role, token, created_at, expires_at')
      .eq('gym_id', gymId)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false }),
  ]);

  const staff = (staffResult.data ?? []) as {
    id: string; user_id: string; role: string; created_at: string;
  }[];
  const invites = (invitesResult.data ?? []) as {
    id: string; email: string; role: string; token: string; created_at: string; expires_at: string;
  }[];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-[18px] font-bold text-[#e8e8e8]">Staff</h2>
        <p className="text-[13px] text-[#555] mt-0.5">
          Invite trainers and admins, or manage existing team members
        </p>
      </div>
      <StaffPanel
        gymId={gymId}
        initialStaff={staff}
        initialInvites={invites}
        appUrl={APP_URL}
      />
    </div>
  );
}
