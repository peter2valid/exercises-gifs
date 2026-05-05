'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui';
import { RotateCcw, AlertTriangle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="dashboard-bg min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <div className="mb-8 p-4 rounded-full bg-red-500/10 text-red-400">
        <AlertTriangle size={48} />
      </div>
      <h1 className="text-2xl font-bold text-white mb-2">Something went wrong</h1>
      <p className="text-sm text-white/40 mb-8 max-w-xs">
        An unexpected error occurred. We've been notified and are working on it.
      </p>
      <Button
        onClick={() => reset()}
        className="flex items-center gap-2 px-8"
        variant="primary"
      >
        <RotateCcw size={18} />
        Try again
      </Button>
    </div>
  );
}
