import { requireAdminAccess } from '@/lib/admin/access';
import { getAttendanceSummary } from '@/lib/admin/attendance';
import { AttendanceTable } from '@/components/admin/AttendanceTable';

export const dynamic = 'force-dynamic';

export default async function AttendancePage() {
  const { gymId } = await requireAdminAccess();

  if (!gymId) {
    return <div className="text-[#555] text-sm">No gym associated with this account.</div>;
  }

  const rows = await getAttendanceSummary(gymId);
  const inactive = rows.filter(r => r.trend === 'inactive').length;

  return (
    <div className="space-y-4 max-w-4xl">
      <div>
        <h2 className="text-[18px] font-bold text-[#e8e8e8]">Attendance</h2>
        <p className="text-[13px] text-[#555] mt-0.5">
          This month vs. last month, per member · {inactive} inactive
        </p>
      </div>
      <AttendanceTable rows={rows} />
    </div>
  );
}
