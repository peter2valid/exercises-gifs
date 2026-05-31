import { requireAdminAccess } from '@/lib/admin/access';
import { getAdminSupabase } from '@/lib/supabase/server';
import { MembersPanel } from '@/components/admin/MembersPanel';

export const dynamic = 'force-dynamic';

export default async function MembersPage() {
  const { gymId } = await requireAdminAccess();

  if (!gymId) {
    return (
      <div className="space-y-4 max-w-5xl">
        <p className="text-sm text-[#555]">No gym found for your account.</p>
      </div>
    );
  }

  const admin = getAdminSupabase();

  const { data: allMembers, error } = await admin
    .from('gym_memberships')
    .select(`
      id, 
      user_id, 
      role, 
      status, 
      created_at,
      profiles:user_id (
        full_name,
        avatar_url
      )
    `)
    .eq('gym_id', gymId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[MembersPage] Error fetching members:', error);
  }

  const members = (allMembers ?? []).filter(m => m.status === 'active');
  const requests = (allMembers ?? []).filter(m => m.status === 'pending');

  return (
    <div className="space-y-4 max-w-5xl">
      <div>
        <h2 className="text-[18px] font-bold text-[#e8e8e8]">Members</h2>
        <p className="text-[13px] text-[#555] mt-0.5">
          {members.length} active · {requests.length} pending requests
        </p>
      </div>

      <MembersPanel
        gymId={gymId}
        initialMembers={members as any} 
        initialRequests={requests as any} 
      />
    </div>
  );
}
