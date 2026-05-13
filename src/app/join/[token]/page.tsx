import { getAdminSupabase } from '@/lib/supabase/admin';
import { getServerSupabase } from '@/lib/supabase/server';
import { JoinClient } from './JoinClient';

export const dynamic = 'force-dynamic';

interface Invite {
  id: string;
  email: string;
  role: string;
  accepted_at: string | null;
  expires_at: string;
  gyms: { name: string } | null;
}

export default async function JoinPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const admin = getAdminSupabase();

  const { data: invite } = await admin
    .from('gym_invitations')
    .select('id, email, role, accepted_at, expires_at, gyms(name)')
    .eq('token', token)
    .maybeSingle() as { data: Invite | null };

  if (!invite) {
    return (
      <JoinClient
        token={token}
        error="This invitation link is invalid or has been removed."
        isLoggedIn={false}
      />
    );
  }

  if (invite.accepted_at) {
    return (
      <JoinClient
        token={token}
        error="This invitation has already been used."
        isLoggedIn={false}
      />
    );
  }

  if (new Date(invite.expires_at) < new Date()) {
    return (
      <JoinClient
        token={token}
        error="This invitation has expired. Ask the gym owner to send a new one."
        isLoggedIn={false}
      />
    );
  }

  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <JoinClient
      token={token}
      gymName={invite.gyms?.name ?? 'a gym'}
      email={invite.email}
      role={invite.role}
      isLoggedIn={!!user}
    />
  );
}
