import { redirect } from 'next/navigation';
import { getServerSupabase } from '@/lib/supabase/server';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { buildQrPayload } from '@/lib/qr/token';
import QRCode from 'qrcode';
import { QRDisplay } from './QRDisplay';

export const dynamic = 'force-dynamic';

export default async function MyQRPage() {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth?next=/my-qr');

  const admin = getAdminSupabase();
  const { data: role } = await admin
    .from('user_gym_roles')
    .select('gym_id')
    .eq('user_id', user.id)
    .eq('role', 'member')
    .maybeSingle();

  const gymId = role?.gym_id ?? null;

  let qrSrc: string | null = null;
  let gymName: string | null = null;

  if (gymId) {
    const payload = buildQrPayload(user.id, gymId);
    qrSrc = await QRCode.toDataURL(payload, { width: 280, margin: 2, color: { dark: '#000000', light: '#ffffff' } });

    const { data: gym } = await admin.from('gyms').select('name').eq('id', gymId).maybeSingle();
    gymName = gym?.name ?? null;
  }

  return <QRDisplay qrSrc={qrSrc} gymName={gymName} userEmail={user.email ?? ''} />;
}
