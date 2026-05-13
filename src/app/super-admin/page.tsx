import { requireSuperAdmin } from '@/lib/admin/access';
import { getAdminSupabase } from '@/lib/supabase/server';
import { AdminCard } from '@/components/admin/AdminCard';
import { Building2, Users, CreditCard, TrendingUp } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function SuperAdminDashboard() {
  await requireSuperAdmin();
  const admin = getAdminSupabase();

  const thisMonthStart = new Date();
  thisMonthStart.setDate(1);
  thisMonthStart.setHours(0, 0, 0, 0);

  const [gymsRes, activeSubs, userSubsRes, mrrRes] = await Promise.all([
    admin.from('gyms').select('id', { count: 'exact', head: true }),
    admin.from('gym_subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    admin.from('user_subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    admin.from('payments')
      .select('amount_kobo')
      .eq('status', 'success')
      .gte('created_at', thisMonthStart.toISOString()),
  ]);

  const mrr = (mrrRes.data ?? []).reduce((sum, p) => sum + (p.amount_kobo as number), 0);
  const mrrFormatted = `KES ${(mrr / 100).toLocaleString()}`;

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-[18px] font-bold text-[#e8e8e8]">Super Admin</h2>
        <p className="text-[13px] text-[#555] mt-0.5">Platform overview</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <AdminCard
          title="Total Gyms"
          value={gymsRes.count ?? 0}
          icon={<Building2 size={16} />}
        />
        <AdminCard
          title="Active Gym Plans"
          value={activeSubs.count ?? 0}
          accent="green"
          icon={<CreditCard size={16} />}
        />
        <AdminCard
          title="Active User Subs"
          value={userSubsRes.count ?? 0}
          accent="blue"
          icon={<Users size={16} />}
        />
        <AdminCard
          title="Revenue (MTD)"
          value={mrrFormatted}
          accent="amber"
          icon={<TrendingUp size={16} />}
        />
      </div>
    </div>
  );
}
