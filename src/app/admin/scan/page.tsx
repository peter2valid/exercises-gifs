import { requireAdminAccess } from '@/lib/admin/access';
import { QRScanner } from '@/components/admin/QRScanner';

export const dynamic = 'force-dynamic';

export default async function ScanPage() {
  const { gymId, gym } = await requireAdminAccess();
  return (
    <div className="space-y-4 max-w-lg">
      <div>
        <h2 className="text-[18px] font-bold text-[#e8e8e8]">Check-in Scanner</h2>
        <p className="text-[13px] text-[#555] mt-0.5">
          Point the camera at a member&apos;s QR code to check them in
        </p>
      </div>
      <QRScanner gymId={gymId ?? ''} gymName={gym?.name ?? ''} />
    </div>
  );
}
