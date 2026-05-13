import { requireAdminAccess } from '@/lib/admin/access';
import { GymProfileForm } from '@/components/admin/GymProfileForm';
import { QrCode, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const { gym, user } = await requireAdminAccess();

  if (!gym) return null;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-[18px] font-bold text-[#e8e8e8]">Settings</h2>
        <p className="text-[13px] text-[#555] mt-0.5">Gym account details and profile</p>
      </div>

      <GymProfileForm gym={gym} />

      <div className="a-card space-y-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#555]">Marketing Assets</p>
        <Link 
          href="/admin/settings/qr"
          className="flex items-center justify-between p-3 rounded-xl border border-[#262626] bg-[#0a0a0a] hover:border-[#3b82f6]/40 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600/10 border border-blue-600/20 flex items-center justify-center text-blue-500">
              <QrCode size={20} />
            </div>
            <div>
              <p className="text-[13px] font-bold text-[#e8e8e8]">Poster QR Code</p>
              <p className="text-[11px] text-[#555]">Download high-res QR for your gym posters</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-[#333] group-hover:text-[#e8e8e8] transition-colors" />
        </Link>
      </div>

      <div className="a-card space-y-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#555]">Account</p>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-[#1e1e1e]">
            <span className="text-[13px] text-[#909090]">Admin email</span>
            <span className="text-[13px] text-[#e8e8e8]">{user.email ?? '—'}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-[#1e1e1e]">
            <span className="text-[13px] text-[#909090]">Gym ID</span>
            <span className="font-mono text-[12px] text-[#555]">{gym?.id ?? '—'}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-[13px] text-[#909090]">User ID</span>
            <span className="font-mono text-[12px] text-[#555]">{user.id.slice(0, 16)}…</span>
          </div>
        </div>
      </div>
    </div>
  );
}
