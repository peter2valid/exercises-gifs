import { requireAdminAccess } from '@/lib/admin/access';
import { GymProfileForm } from '@/components/admin/GymProfileForm';

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
