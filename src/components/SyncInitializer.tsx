'use client';

import { useEffect } from 'react';
import { syncWorker } from '@/lib/sync/SyncWorker';

export function SyncInitializer() {
  useEffect(() => {
    // Start the worker on mount
    syncWorker.start();

    return () => {
      // Cleanup on unmount (though this is a root component)
      syncWorker.stop();
    };
  }, []);

  return null; // This component doesn't render anything
}
