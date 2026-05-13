import { requireAdminAccess } from '@/lib/admin/access';
import { GymQRClient } from './GymQRClient';
import QRCode from 'qrcode';

export const dynamic = 'force-dynamic';

export default async function GymQRPage() {
  const { gym } = await requireAdminAccess();
  if (!gym) {
    return (
      <div className="space-y-2 max-w-3xl">
        <h2 className="text-[18px] font-bold text-[#e8e8e8]">Gym QR Code</h2>
        <p className="text-[13px] text-[#ef4444]">No gym found for this account.</p>
      </div>
    );
  }

  const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const joinUrl = `${APP_URL}/join?gymId=${gym.id}`;
  
  const qrCodeDataUrl = await QRCode.toDataURL(joinUrl, {
    width: 1024,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-[18px] font-bold text-[#e8e8e8]">Gym QR Code</h2>
        <p className="text-[13px] text-[#555] mt-0.5">Use this QR code on posters for members to join your gym</p>
      </div>

      <GymQRClient 
        gymName={gym.name} 
        qrCodeDataUrl={qrCodeDataUrl} 
        joinUrl={joinUrl} 
      />
    </div>
  );
}
