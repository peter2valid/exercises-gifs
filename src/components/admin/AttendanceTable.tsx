'use client';

import { Fragment, useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { MemberAttendance, AttendanceTrend } from '@/lib/admin/attendance';

const TREND_BADGE: Record<AttendanceTrend, { label: string; cls: string }> = {
  improving: { label: '↑ Improving', cls: 'a-badge a-badge-ok' },
  slipping:  { label: '↓ Slipping',  cls: 'a-badge a-badge-warn' },
  steady:    { label: 'Steady',      cls: 'a-badge a-badge-gray' },
  inactive:  { label: 'Inactive',    cls: 'a-badge a-badge-err' },
  new:       { label: 'New',         cls: 'a-badge a-badge-blue' },
};

function fmtTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function AttendanceTable({ rows }: { rows: MemberAttendance[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const sorted = useMemo(
    () =>
      [...rows].sort((a, b) => {
        if (a.thisMonthCount !== b.thisMonthCount) return a.thisMonthCount - b.thisMonthCount;
        return a.lastMonthCount - b.lastMonthCount;
      }),
    [rows],
  );

  if (sorted.length === 0) {
    return (
      <div className="a-card text-center py-12">
        <p className="text-sm font-medium text-[#555]">No active members yet</p>
      </div>
    );
  }

  return (
    <div className="a-card p-0 overflow-hidden">
      <table className="a-table">
        <thead>
          <tr>
            <th>Member</th>
            <th>This month</th>
            <th>Last month</th>
            <th>Trend</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => {
            const isOpen = expanded === row.memberId;
            const badge = TREND_BADGE[row.trend];
            return (
              <Fragment key={row.memberId}>
                <tr
                  className="cursor-pointer"
                  onClick={() => setExpanded(isOpen ? null : row.memberId)}
                >
                  <td className="text-[13px] font-medium text-[#e8e8e8]">{row.fullName}</td>
                  <td className="text-[13px] font-bold text-[#e8e8e8] tabular-nums">{row.thisMonthCount}</td>
                  <td className="text-[13px] text-[#909090] tabular-nums">{row.lastMonthCount}</td>
                  <td><span className={badge.cls}>{badge.label}</span></td>
                  <td className="text-right">
                    <ChevronDown
                      size={14}
                      className={`text-[#555] transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </td>
                </tr>
                {isOpen && (
                  <tr>
                    <td colSpan={5} className="bg-white/[0.02] !py-3">
                      {row.visitsInWindow.length === 0 ? (
                        <p className="text-[12px] text-[#555]">No check-ins in the last 2 months.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {row.visitsInWindow.slice(0, 10).map((v) => (
                            <span key={v} className="a-badge a-badge-gray font-normal">{fmtTime(v)}</span>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
