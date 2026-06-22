import Link from 'next/link';
import { requireTrainerAccess } from '@/lib/admin/access';
import { getAdminSupabase } from '@/lib/supabase/server';
import { getAttendanceSummary, type AttendanceTrend } from '@/lib/admin/attendance';
import { AdminCard } from '@/components/admin/AdminCard';
import { AdminTable, type AdminColumn } from '@/components/admin/AdminTable';
import { Dumbbell, Users, ClipboardList, Plus, ChevronRight, Activity, ScanLine, QrCode, AlertTriangle } from 'lucide-react';

export const dynamic = 'force-dynamic';

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function getTimeGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function getFirstName(user: { email?: string; user_metadata?: Record<string, string> }): string {
  const full = user.user_metadata?.full_name ?? '';
  if (full.trim()) return full.trim().split(/\s+/)[0];
  const local = (user.email ?? '').split('@')[0];
  const first = local.split(/[.+_]/)[0].replace(/\d+$/, '');
  return first.charAt(0).toUpperCase() + first.slice(1) || 'coach';
}

const TREND_DOT: Record<AttendanceTrend, string> = {
  improving: 'bg-emerald-400',
  slipping:  'bg-amber-400',
  steady:    'bg-[#555]',
  inactive:  'bg-red-400',
  new:       'bg-blue-400',
};

const checkInCols: AdminColumn[] = [
  { key: 'profiles', label: 'Member', render: (v) => <span className="font-medium text-[#e8e8e8]">{(v as any)?.full_name || 'Anonymous'}</span> },
  { key: 'method', label: 'Method', render: (v) => <span className="a-badge a-badge-gray capitalize">{v as string}</span> },
  { key: 'checked_in_at', label: 'Time', render: (v) => new Date(v as string).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
];

export default async function TrainerDashboardPage() {
  const { gymId, gym, user } = await requireTrainerAccess();

  if (!gymId) {
    return <div className="text-[#555] text-sm">No gym associated with this account.</div>;
  }

  const admin = getAdminSupabase();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [programsRes, assignmentsRes, membersRes, recentCheckInsRes, checkInsTodayRes, attendance] = await Promise.all([
    admin
      .from('templates')
      .select('id, name, description, created_at, template_exercises(id)')
      .eq('gym_id', gymId)
      .order('created_at', { ascending: false }),
    admin
      .from('template_assignments')
      .select('id', { count: 'exact', head: true })
      .eq('gym_id', gymId),
    admin
      .from('gym_memberships')
      .select('id', { count: 'exact', head: true })
      .eq('gym_id', gymId)
      .eq('status', 'active'),
    admin
      .from('member_check_ins')
      .select('id, checked_at, method, checked_in_at, profiles:member_user_id(full_name)')
      .eq('gym_id', gymId)
      .order('checked_in_at', { ascending: false })
      .limit(5),
    admin
      .from('member_check_ins')
      .select('id', { count: 'exact', head: true })
      .eq('gym_id', gymId)
      .gte('checked_in_at', todayStart.toISOString()),
    getAttendanceSummary(gymId),
  ]);

  const programs = programsRes.data ?? [];
  const assignedCount = assignmentsRes.count ?? 0;
  const recentCheckIns = (recentCheckInsRes.data ?? []) as any[];

  const needsAttention = [...attendance]
    .sort((a, b) => a.thisMonthCount - b.thisMonthCount || a.lastMonthCount - b.lastMonthCount)
    .slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 animate-fade-in">
        <div>
          <p className="text-[12px] font-semibold text-blue-400/80 uppercase tracking-[0.08em]">
            {getTimeGreeting()}, {getFirstName(user)}
          </p>
          <h2 className="text-[20px] font-bold text-[#e8e8e8] tracking-tight mt-0.5">{gym?.name ?? 'Trainer Dashboard'}</h2>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/scan"
            className="flex items-center gap-1.5 h-9 px-4 rounded-lg border border-[#262626] bg-[#141414] text-[#e8e8e8] text-sm font-semibold hover:border-[#3b82f6]/40 transition-colors"
          >
            <QrCode size={16} /> Scan member
          </Link>
          <Link
            href="/admin/programs"
            className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500 transition-all hover:shadow-[0_8px_28px_rgba(59,130,246,0.35)] shadow-lg shadow-blue-600/20"
          >
            <Plus size={16} /> New Program
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 animate-slide-up">
        <AdminCard title="Active Programs" value={programs.length} icon={<Dumbbell size={16} />} />
        <AdminCard title="Total Assignments" value={assignedCount} accent="blue" icon={<ClipboardList size={16} />} />
        <AdminCard title="Gym Members" value={(membersRes.count ?? 0)} accent="green" icon={<Users size={16} />} />
        <AdminCard title="Check-ins Today" value={checkInsTodayRes.count ?? 0} accent="amber" icon={<ScanLine size={16} />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2 animate-slide-up" style={{ animationDelay: '60ms' }}>
        {/* Recent Activity */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[14px] font-bold text-[#e8e8e8] flex items-center gap-2">
              <Activity size={16} className="text-blue-500" />
              Recent Check-ins
            </h3>
            <Link href="/admin/check-ins" className="text-[12px] text-blue-500 hover:text-blue-400">View all</Link>
          </div>
          <div className="a-card p-0 overflow-hidden">
            <AdminTable columns={checkInCols} rows={recentCheckIns} emptyMessage="No recent check-ins" />
          </div>
        </div>

        {/* Latest Programs */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[14px] font-bold text-[#e8e8e8] flex items-center gap-2">
              <Dumbbell size={16} className="text-amber-500" />
              Latest Programs
            </h3>
            <Link href="/admin/programs" className="text-[12px] text-blue-500 hover:text-blue-400">Manage all</Link>
          </div>
          <div className="space-y-2">
            {programs.length === 0 ? (
              <div className="a-card text-sm text-[#555] py-10 text-center">No programs created yet.</div>
            ) : (
              programs.slice(0, 5).map((program: any) => (
                <div key={program.id} className="a-card group hover:border-white/20 hover:-translate-y-0.5 transition-all p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#e8e8e8]">{program.name}</p>
                      <p className="text-[11px] text-[#555] mt-0.5">
                        {program.template_exercises?.length ?? 0} exercises • Created {fmtDate(program.created_at)}
                      </p>
                    </div>
                    <Link
                      href="/admin/programs"
                      className="p-2 rounded-full hover:bg-white/5 text-[#444] group-hover:text-blue-400 transition-all"
                    >
                      <ChevronRight size={18} />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Members needing attention */}
      <div className="space-y-4 animate-slide-up" style={{ animationDelay: '120ms' }}>
        <div className="flex items-center justify-between">
          <h3 className="text-[14px] font-bold text-[#e8e8e8] flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-500" />
            Members Needing Attention
          </h3>
          <Link href="/admin/attendance" className="text-[12px] text-blue-500 hover:text-blue-400">View full attendance</Link>
        </div>
        {needsAttention.length === 0 ? (
          <div className="a-card text-sm text-[#555] py-10 text-center">No members yet.</div>
        ) : (
          <div className="a-card p-0 overflow-hidden divide-y divide-[#262626]">
            {needsAttention.map((m) => (
              <Link
                key={m.memberId}
                href="/admin/attendance"
                className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors"
              >
                <span className="flex items-center gap-2.5 text-sm font-medium text-[#e8e8e8]">
                  <span className={`h-1.5 w-1.5 rounded-full ${TREND_DOT[m.trend]}`} />
                  {m.fullName}
                </span>
                <span className="text-[12px] text-[#555]">
                  <span className="text-[#e8e8e8] font-semibold">{m.thisMonthCount}</span> this month ·{' '}
                  <span className="text-[#909090]">{m.lastMonthCount}</span> last month
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
