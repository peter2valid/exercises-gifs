'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/db/dexie';
import { useLiveQuery } from 'dexie-react-hooks';
import { Cloud, CloudOff, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

export function SyncStatus() {
  const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? window.navigator.onLine : true);

  const pendingCount = useLiveQuery(() => db.sync_queue.where('status').equals('pending').count()) || 0;
  const syncingCount = useLiveQuery(() => db.sync_queue.where('status').equals('syncing').count()) || 0;
  const failedCount = useLiveQuery(() => db.sync_queue.where('status').equals('failed').count()) || 0;
  const completedCount = useLiveQuery(() => db.sync_queue.where('status').equals('completed').count()) || 0;

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

  if (pendingCount === 0 && syncingCount === 0 && failedCount === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-fade-in">
      <div className="glass-panel px-3 py-2 flex items-center gap-3 shadow-2xl border-white/10">
        <div className="flex items-center gap-2">
          {syncingCount > 0 ? (
            <RefreshCw size={14} className="text-indigo-400 animate-spin" />
          ) : !isOnline ? (
            <CloudOff size={14} className="text-white/40" />
          ) : failedCount > 0 ? (
            <AlertCircle size={14} className="text-rose-400" />
          ) : (
            <Cloud size={14} className="text-emerald-400" />
          )}
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">
            {syncingCount > 0 ? 'Syncing...' : !isOnline ? 'Offline' : 'Sync Engine'}
          </span>
        </div>

        <div className="h-4 w-[1px] bg-white/10" />

        <div className="flex gap-3">
          {pendingCount > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
              <span className="text-[10px] tabular-nums font-medium text-white/50">{pendingCount}</span>
            </div>
          )}
          {failedCount > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span className="text-[10px] tabular-nums font-medium text-rose-400">{failedCount}</span>
            </div>
          )}
          {syncingCount === 0 && pendingCount === 0 && failedCount === 0 && completedCount > 0 && (
            <CheckCircle2 size={14} className="text-emerald-500" />
          )}
        </div>
      </div>
    </div>
  );
}
