import { getAdminSupabase } from '@/lib/supabase/admin';

export type AttendanceTrend = 'improving' | 'slipping' | 'steady' | 'inactive' | 'new';

export interface MemberAttendance {
  memberId: string;
  fullName: string;
  joinedAt: string;
  thisMonthCount: number;
  lastMonthCount: number;
  trend: AttendanceTrend;
  visitsInWindow: string[]; // checked_in_at ISO timestamps, most recent first
}

function startOfMonth(date: Date, monthsAgo = 0): Date {
  return new Date(date.getFullYear(), date.getMonth() - monthsAgo, 1);
}

function trendFor(thisMonth: number, lastMonth: number, joinedThisMonth: boolean): AttendanceTrend {
  if (thisMonth === 0 && lastMonth === 0) return joinedThisMonth ? 'new' : 'inactive';
  if (joinedThisMonth && lastMonth === 0) return 'new';
  if (thisMonth > lastMonth) return 'improving';
  if (thisMonth < lastMonth) return 'slipping';
  return 'steady';
}

/**
 * Builds a this-month-vs-last-month attendance summary for every active
 * member of a gym. Only looks at check-ins within the current + previous
 * calendar month — members with no visits in that window are flagged
 * 'inactive' rather than resolving their true last-ever visit date, which
 * would need a second per-member query for a case this signal already covers.
 */
export async function getAttendanceSummary(gymId: string): Promise<MemberAttendance[]> {
  const admin = getAdminSupabase();
  const now = new Date();
  const windowStart = startOfMonth(now, 1);
  const thisMonthStart = startOfMonth(now, 0);

  const [membersRes, checkInsRes] = await Promise.all([
    admin
      .from('gym_memberships')
      .select('user_id, created_at, profiles:user_id(full_name)')
      .eq('gym_id', gymId)
      .eq('status', 'active'),
    admin
      .from('member_check_ins')
      .select('member_user_id, checked_in_at')
      .eq('gym_id', gymId)
      .gte('checked_in_at', windowStart.toISOString())
      .order('checked_in_at', { ascending: false }),
  ]);

  const members = (membersRes.data ?? []) as unknown as { user_id: string; created_at: string; profiles?: { full_name: string } | { full_name: string }[] | null }[];
  const checkIns = (checkInsRes.data ?? []) as { member_user_id: string; checked_in_at: string }[];

  const visitsByMember = new Map<string, string[]>();
  for (const c of checkIns) {
    const list = visitsByMember.get(c.member_user_id) ?? [];
    list.push(c.checked_in_at);
    visitsByMember.set(c.member_user_id, list);
  }

  return members.map((m) => {
    const visits = visitsByMember.get(m.user_id) ?? [];
    const thisMonthCount = visits.filter(v => new Date(v) >= thisMonthStart).length;
    const lastMonthCount = visits.length - thisMonthCount;
    const joinedThisMonth = new Date(m.created_at) >= thisMonthStart;
    const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;

    return {
      memberId: m.user_id,
      fullName: profile?.full_name || 'Anonymous User',
      joinedAt: m.created_at,
      thisMonthCount,
      lastMonthCount,
      trend: trendFor(thisMonthCount, lastMonthCount, joinedThisMonth),
      visitsInWindow: visits,
    };
  });
}
