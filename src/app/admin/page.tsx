import { getServerSupabase } from '@/lib/supabase/server';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { isSuperAdmin, getAdminGymId } from '@/lib/auth/roles';
import { redirect } from 'next/navigation';
import {
  Users,
  ChevronRight,
  ChevronLeft,
  Lock,
  LayoutDashboard,
  ShieldCheck,
  Zap,
  ArrowUpRight
} from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth');
  }

  const adminSupabase = getAdminSupabase();

  // 1. Resolve gym access: check user_gym_roles first (new system),
  //    fall back to legacy admin_user_id column for backward compatibility.
  const superAdmin = await isSuperAdmin(user.id);
  const roleGymId = await getAdminGymId(user.id);

  let gymQuery = adminSupabase
    .from('gyms')
    .select('*, gym_subscriptions(plan, status)');

  if (superAdmin) {
    // Super admin sees the first gym for now; /super-admin will show all
    gymQuery = gymQuery.limit(1);
  } else if (roleGymId) {
    gymQuery = gymQuery.eq('id', roleGymId);
  } else {
    // Legacy fallback: admin_user_id on the gyms table
    gymQuery = gymQuery.eq('admin_user_id', user.id);
  }

  const { data: gym } = await gymQuery.maybeSingle();

  // 2. Access Denied State
  if (!gym && !superAdmin) {
    return (
      <div className="dashboard-bg min-h-screen flex items-center justify-center p-4 text-center">
        <div className="glass-panel p-10 max-w-sm w-full animate-fade-in border border-white/10 rounded-[32px] shadow-2xl">
          <div className="w-20 h-20 rounded-3xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-6">
            <Lock className="text-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.3)]" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3 tracking-tight">Access Denied</h1>
          <p className="text-white/40 text-sm mb-8 leading-relaxed">
            This dashboard is reserved for gym administrators. Please sign in with an administrator account to view this page.
          </p>
          <Link 
            href="/home" 
            className="block w-full py-4 rounded-2xl bg-white text-black font-bold text-sm hover:bg-white/90 transition-all active:scale-[0.98]"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // 3. Fetch members for the gym
  const { data: members } = await adminSupabase
    .from('gym_memberships')
    .select('*')
    .eq('gym_id', gym.id)
    .order('joined_at', { ascending: false });

  const subscription = gym.gym_subscriptions?.[0] || null;
  const planName = subscription?.plan || 'start';
  const status = subscription?.status || 'active';

  return (
    <div className="dashboard-bg min-h-screen pb-24 pt-8">
      <div className="max-w-md mx-auto px-4">

        {/* Header */}
        <header className="mb-10 animate-fade-in flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link 
              href="/home" 
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-white transition-all"
            >
              <ChevronLeft size={20} />
            </Link>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <LayoutDashboard size={12} className="text-white/30" />
                <p className="text-[10px] tracking-[0.3em] text-white/30 uppercase font-bold">Gym Admin</p>
              </div>
              <h1 className="text-2xl font-black text-white tracking-tighter italic uppercase leading-none">{gym.name}</h1>
            </div>
          </div>
        </header>


        {/* Subscription Status Card */}
        <div className="glass-panel p-6 mb-4 animate-slide-up relative overflow-hidden group border border-white/10 rounded-[28px]">
          <div className="absolute top-0 right-0 p-4">
            <div className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
              status === 'active' 
                ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]' 
                : 'bg-rose-500 text-white'
            }`}>
              {status}
            </div>
          </div>
          
          <div className="flex flex-col gap-1 mb-6">
            <p className="text-[10px] text-white/40 tracking-[0.2em] uppercase font-bold">Current Package</p>
            <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic flex items-center gap-2">
              {planName} 
              {planName === 'elite' && <Zap className="text-amber-400 fill-amber-400/20" size={24} />}
            </h2>
          </div>

          <Link
            href="/subscription"
            className="flex items-center justify-center w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-xs uppercase tracking-widest hover:bg-white/10 transition-all active:scale-[0.98] group"
          >
            Manage Subscription <ArrowUpRight size={14} className="ml-1.5 opacity-40 group-hover:opacity-100 transition-opacity" />
          </Link>
        </div>

        {/* Quick Stats */}
        <div className="mb-8 animate-slide-up delay-75">
          <div className="glass-panel p-5 border border-white/10 rounded-[24px] flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center shrink-0">
              <Users size={18} className="text-sky-400" />
            </div>
            <div>
              <p className="text-[10px] text-white/40 tracking-[0.1em] uppercase font-bold mb-0.5">Total Members</p>
              <p className="text-3xl font-black text-white tracking-tight">{members?.length || 0}</p>
            </div>
          </div>
        </div>

        {/* Member List */}
        <div className="animate-slide-up delay-150">
          <div className="flex items-center justify-between mb-4 px-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/30">Recent Members</p>
            <div className="text-[10px] text-white/20 font-bold uppercase tracking-widest">
              Total: {members?.length || 0}
            </div>
          </div>
          <div className="space-y-2">
            {members?.map((member: any) => (
              <div key={member.id} className="glass-panel p-4 flex items-center justify-between border border-white/5 hover:border-white/10 transition-colors rounded-2xl">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-black text-white/20">
                    ID
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white tracking-tight">Member {member.user_id.slice(0, 8).toUpperCase()}</p>
                    <p className="text-[10px] text-white/30 mt-0.5 uppercase tracking-wider font-medium">
                      {member.role} • Joined {new Date(member.joined_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/[0.02] flex items-center justify-center text-white/10 group-hover:text-white/30 transition-colors">
                  <ChevronRight size={16} />
                </div>
              </div>
            ))}
            {(!members || members.length === 0) && (
              <div className="glass-panel p-12 text-center border border-dashed border-white/10 rounded-[32px]">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                  <Users size={20} className="text-white/10" />
                </div>
                <p className="text-sm text-white/30 font-bold uppercase tracking-widest">No members found</p>
                <p className="text-[10px] text-white/20 mt-1">New members will appear here as they join.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-12 text-center opacity-20">
          <div className="flex items-center justify-center gap-2 mb-1">
            <ShieldCheck size={12} />
            <span className="text-[10px] font-black uppercase tracking-widest">Secure Admin Access</span>
          </div>
          <p className="text-[9px] font-medium text-white/60">Server-verified administrator session active.</p>
        </div>
      </div>
    </div>
  );
}
