import Link from 'next/link';
import { requireDeskAccess } from '@/lib/admin/access';
import { getAdminSupabase } from '@/lib/supabase/server';
import { AdminCard } from '@/components/admin/AdminCard';
import { AdminTable, type AdminColumn } from '@/components/admin/AdminTable';
import { UserPlus, ScanLine, Clock, QrCode } from 'lucide-react';

export const dynamic = 'force-dynamic';

const checkInCols: AdminColumn[] = [
  { key: 'profiles', label: 'Member', render: (v) => <span className="font-medium text-[#e8e8e8]">{(v as any)?.full_name || 'Anonymous'}</span> },
  { key: 'method', label: 'Method', render: (v) => <span className="a-badge a-badge-gray capitalize">{(v as string).replace('_', ' ')}</span> },
  { key: 'checked_in_at', label: 'Time', render: (v) => new Date(v as string).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
];

export default async function DeskDashboardPage() {
  const { gymId, gym } = await requireDeskAccess();

  if (!gymId) {
    return <div className="text-[#555] text-sm">No gym associated with this account.</div>;
  }

  const admin = getAdminSupabase();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [newTodayRes, checkInsTodayRes, pendingRes, recentCheckInsRes] = await Promise.all([
    admin.from('gym_memberships').select('id', { count: 'exact', head: true })
      .eq('gym_id', gymId).gte('created_at', todayStart.toISOString()),
    admin.from('member_check_ins').select('id', { count: 'exact', head: true })
      .eq('gym_id', gymId).gte('checked_in_at', todayStart.toISOString()),
    admin.from('gym_memberships').select('id', { count: 'exact', head: true })
      .eq('gym_id', gymId).eq('status', 'pending'),
    admin.from('member_check_ins')
      .select('id, checked_at, method, checked_in_at, profiles:member_user_id(full_name)')
      .eq('gym_id', gymId)
      .order('checked_in_at', { ascending: false })
      .limit(8),
  ]);

  const recentCheckIns = (recentCheckInsRes.data ?? []) as any[];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-bold text-[#e8e8e8] tracking-tight">{gym?.name ?? 'Front Desk'}</h2>
          <p className="text-[13px] text-[#555] mt-0.5">Today&apos;s arrivals and check-ins.</p>
        </div>
        <Link
          href="/admin/scan"
          className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/10"
        >
          <QrCode size={16} /> Scan member
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <AdminCard title="New Members Today" value={newTodayRes.count ?? 0} accent="blue" icon={<UserPlus size={16} />} />
        <AdminCard title="Check-ins Today" value={checkInsTodayRes.count ?? 0} accent="green" icon={<ScanLine size={16} />} />
        <AdminCard title="Pending Requests" value={pendingRes.count ?? 0} accent="amber" icon={<Clock size={16} />} />
      </div>

      <div className="space-y-4">
        <h3 className="text-[14px] font-bold text-[#e8e8e8] flex items-center gap-2">
          <ScanLine size={16} className="text-blue-500" />
          Recent Check-ins
        </h3>
        <AdminTable columns={checkInCols} rows={recentCheckIns} emptyMessage="No check-ins yet today" />
      </div>
    </div>
  );
}
