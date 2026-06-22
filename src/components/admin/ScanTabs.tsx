'use client';

import { useState } from 'react';
import { QRScanner } from './QRScanner';
import { ManualCheckIn } from './ManualCheckIn';

interface Props {
  gymId: string;
  gymName: string;
  members: { id: string; fullName: string }[];
}

type Tab = 'scan' | 'manual';

export function ScanTabs({ gymId, gymName, members }: Props) {
  const [tab, setTab] = useState<Tab>('scan');

  return (
    <div className="space-y-4">
      <div className="inline-flex items-center gap-0.5 rounded-xl border border-[#262626] bg-[#141414] p-0.5">
        {([
          ['scan', 'QR Scan'],
          ['manual', 'Manual'],
        ] as const).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-4 py-1.5 rounded-lg text-[12px] font-semibold transition-colors ${
              tab === id ? 'bg-[#3b82f6] text-white' : 'text-[#909090] hover:text-[#e8e8e8]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'scan' ? (
        <QRScanner gymId={gymId} gymName={gymName} />
      ) : (
        <ManualCheckIn gymId={gymId} members={members} />
      )}
    </div>
  );
}
