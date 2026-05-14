import Link from 'next/link';
import { requireAdminAccess } from '@/lib/admin/access';
import { getAdminSupabase } from '@/lib/supabase/server';
import { AdminCard } from '@/components/admin/AdminCard';
import { Dumbbell, Users, ClipboardList, PlusCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function TrainerDashboardPage() {
  const { gymId, gym } = await requireAdminAccess();

  if (!gymId) {
    return <div className="text-[#555] text-sm">No gym associated with this account.</div>;
  }

  const admin = getAdminSupabase();

  const [programsRes, assignmentsRes, membersRes] = await Promise.all([
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
  ]);

  const programs = programsRes.data ?? [];
  const assignedCount = assignmentsRes.count ?? 0;

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-[18px] font-bold text-[#e8e8e8]">Trainer Dashboard</h2>
        <p className="text-[13px] text-[#555] mt-0.5">{gym?.name ?? 'Your gym'} · Training overview</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <AdminCard title="Programs" value={programs.length} icon={<Dumbbell size={16} />} />
        <AdminCard title="Assigned" value={assignedCount} accent="blue" icon={<ClipboardList size={16} />} />
        <AdminCard title="Active Members" value={(membersRes.count ?? 0)} accent="green" icon={<Users size={16} />} />
        <AdminCard title="Quick Action" value="Open programs" accent="amber" icon={<PlusCircle size={16} />} />
      </div>

      <div className="a-card space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[13px] font-semibold text-[#e8e8e8]">Need to manage workouts?</p>
            <p className="text-[12px] text-[#555] mt-0.5">Use the program editor to create templates and assign them to members already in your gym.</p>
          </div>
          <Link href="/admin/programs" className="h-9 inline-flex items-center justify-center rounded-lg bg-[#3b82f6] px-4 text-sm font-medium text-white">
            Open Programs
          </Link>
        </div>
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-[12px] text-[#555]">
          Trainers are scoped to gym programs and members. Admin-only finance and staff controls stay in the main admin area.
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-[13px] font-semibold text-[#e8e8e8]">Latest Programs</p>
        <div className="space-y-2">
          {programs.length === 0 ? (
            <div className="a-card text-sm text-[#555]">No programs created yet.</div>
          ) : (
            programs.slice(0, 6).map((program: any) => (
              <div key={program.id} className="a-card flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[#e8e8e8]">{program.name}</p>
                  <p className="text-[12px] text-[#555]">{program.template_exercises?.length ?? 0} exercises · {new Date(program.created_at).toLocaleDateString()}</p>
                </div>
                <Link href="/admin/programs" className="shrink-0 text-[12px] text-blue-400 hover:text-blue-300">
                  Edit
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}