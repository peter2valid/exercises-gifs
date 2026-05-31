import Link from 'next/link';
import { requireTrainerAccess } from '@/lib/admin/access';
import { getAdminSupabase } from '@/lib/supabase/server';
import { AdminCard } from '@/components/admin/AdminCard';
import { AdminTable, type AdminColumn } from '@/components/admin/AdminTable';
import { Dumbbell, Users, ClipboardList, Plus, ChevronRight, Activity } from 'lucide-react';

export const dynamic = 'force-dynamic';

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const checkInCols: AdminColumn[] = [
  { key: 'profiles', label: 'Member', render: (v) => <span className="font-medium text-[#e8e8e8]">{(v as any)?.full_name || 'Anonymous'}</span> },
  { key: 'method', label: 'Method', render: (v) => <span className="a-badge a-badge-gray capitalize">{v as string}</span> },
  { key: 'checked_in_at', label: 'Time', render: (v) => new Date(v as string).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
];

export default async function TrainerDashboardPage() {
  const { gymId, gym } = await requireTrainerAccess();

  if (!gymId) {
    return <div className="text-[#555] text-sm">No gym associated with this account.</div>;
  }

  const admin = getAdminSupabase();

  const [programsRes, assignmentsRes, membersRes, recentCheckInsRes] = await Promise.all([
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
  ]);

  const programs = programsRes.data ?? [];
  const assignedCount = assignmentsRes.count ?? 0;
  const recentCheckIns = (recentCheckInsRes.data ?? []) as any[];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-bold text-[#e8e8e8] tracking-tight">{gym?.name ?? 'Trainer Dashboard'}</h2>
          <p className="text-[13px] text-[#555] mt-0.5">Welcome back, coach.</p>
        </div>
        <Link 
          href="/admin/programs" 
          className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/10"
        >
          <Plus size={16} /> New Program
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <AdminCard title="Active Programs" value={programs.length} icon={<Dumbbell size={16} />} />
        <AdminCard title="Total Assignments" value={assignedCount} accent="blue" icon={<ClipboardList size={16} />} />
        <AdminCard title="Gym Members" value={(membersRes.count ?? 0)} accent="green" icon={<Users size={16} />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
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
                <div key={program.id} className="a-card group hover:border-white/20 transition-colors p-3">
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

      {/* Scoped Information */}
      <div className="rounded-2xl border border-blue-500/10 bg-blue-500/[0.02] p-5">
        <p className="text-[13px] font-semibold text-blue-400/80 mb-1">Trainer Access Level</p>
        <p className="text-[12px] text-[#555] leading-relaxed">
          You are currently in the Trainer Workspace. You have full access to manage training programs and view member progress. 
          Financial records and gym staff settings are restricted to Gym Owners.
        </p>
      </div>
    </div>
  );
}
