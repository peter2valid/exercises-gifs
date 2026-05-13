'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, QrCode, Building2 } from 'lucide-react';

interface Props {
  qrSrc: string | null;
  gymName: string | null;
  userEmail: string;
}

export function QRDisplay({ qrSrc, gymName, userEmail }: Props) {
  const router = useRouter();

  return (
    <div className="dashboard-bg min-h-screen flex flex-col">
      <div className="flex items-center gap-3 px-4 pt-12 pb-4">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full flex items-center justify-center text-white/50 hover:text-white bg-white/5 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-lg font-bold text-white">My Check-in Code</h1>
      </div>

      <div className="flex flex-col items-center justify-center flex-1 px-6 pb-24">
        {qrSrc ? (
          <>
            <div className="rounded-3xl bg-white p-5 shadow-[0_20px_60px_rgba(255,255,255,0.1)] mb-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrSrc} alt="Check-in QR code" width={260} height={260} className="block" />
            </div>

            <div className="text-center space-y-1 mb-6">
              {gymName && (
                <div className="flex items-center justify-center gap-1.5">
                  <Building2 size={13} className="text-white/40" />
                  <p className="text-sm text-white/60">{gymName}</p>
                </div>
              )}
              <p className="text-xs text-white/30">{userEmail}</p>
            </div>

            <div className="glass-panel px-5 py-3 max-w-xs text-center">
              <p className="text-xs text-white/40 leading-relaxed">
                Show this code to staff or hold it to the scanner at the gym entrance to check in.
              </p>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
              <QrCode size={28} className="text-white/30" />
            </div>
            <div>
              <p className="text-white font-semibold">No gym membership</p>
              <p className="text-sm text-white/40 mt-1">
                You need to join a gym to get a check-in code.
                Ask your gym to send you an invite link.
              </p>
            </div>
            <button
              onClick={() => router.push('/home')}
              className="mt-2 px-5 py-2.5 rounded-xl bg-white/10 text-sm text-white font-medium"
            >
              Back to home
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
