'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/db/dexie';
import { useLiveQuery } from 'dexie-react-hooks';
import { CloudOff, AlertCircle } from 'lucide-react';

export function SyncStatus() {
  const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? window.navigator.onLine : true);

  const failedCount = useLiveQuery(() => db.sync_queue.where('status').equals('failed').count()) || 0;

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && failedCount === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-fade-in">
      <div className="glass-panel px-3 py-2 flex items-center gap-2 shadow-2xl border-white/10">
        {!isOnline ? (
          <>
            <CloudOff size={14} className="text-white/40" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">Offline</span>
          </>
        ) : (
          <>
            <AlertCircle size={14} className="text-rose-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-rose-400/80">Sync issue</span>
          </>
        )}
      </div>
    </div>
  );
}
