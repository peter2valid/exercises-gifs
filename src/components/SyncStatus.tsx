'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { db } from '@/lib/db/dexie';
import { useLiveQuery } from 'dexie-react-hooks';
import { CloudOff, AlertCircle, RefreshCw } from 'lucide-react';

export function SyncStatus() {
  const pathname = usePathname();
  const [isOnline, setIsOnline] = useState(
    typeof window !== 'undefined' ? window.navigator.onLine : true
  );

  // Hard failures
  const failedCount =
    useLiveQuery(() => db.sync_queue.where('status').equals('failed').count()) || 0;

  // Stalled: pending items that have already been tried 3+ times
  const stalledCount =
    useLiveQuery(() =>
      db.sync_queue
        .where('status')
        .equals('pending')
        .filter(item => (item.attempts ?? 0) >= 3)
        .count()
    ) || 0;

  useEffect(() => {
    const up = () => setIsOnline(true);
    const down = () => setIsOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    };
  }, []);

  if (pathname.startsWith('/admin') || pathname.startsWith('/super-admin')) return null;
  if (isOnline && failedCount === 0 && stalledCount === 0) return null;

  const label = !isOnline
    ? 'Offline'
    : failedCount > 0
    ? `${failedCount} sync ${failedCount === 1 ? 'failure' : 'failures'}`
    : `Syncing (${stalledCount} retrying)`;

  const Icon = !isOnline ? CloudOff : failedCount > 0 ? AlertCircle : RefreshCw;
  const color = !isOnline ? 'text-white/40' : failedCount > 0 ? 'text-rose-400' : 'text-amber-400';

  return (
    <div className="fixed top-4 right-4 z-50 animate-fade-in">
      <div className="glass-panel px-3 py-2 flex items-center gap-2 shadow-2xl border-white/10">
        <Icon
          size={14}
          className={`${color} ${!isOnline || failedCount > 0 ? '' : 'animate-spin'}`}
        />
        <span className={`text-[10px] font-bold uppercase tracking-widest ${color}`}>
          {label}
        </span>
      </div>
    </div>
  );
}
