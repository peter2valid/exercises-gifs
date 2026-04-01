'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BottomNav } from '@/components/ui';
import { useEffect, useState } from 'react';
import { useWorkoutStore } from '@/store/workout-store';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(() => new QueryClient());
  const syncLogs = useWorkoutStore(state => state.syncLogs);
  
  useEffect(() => {
    // Initial sync
    syncLogs();
    
    // Resume sync when network connects
    window.addEventListener('online', syncLogs);
    return () => window.removeEventListener('online', syncLogs);
  }, [syncLogs]);

  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${inter.className} bg-gray-50 text-gray-900`}>
        <QueryClientProvider client={queryClient}>
          <div className="min-h-screen pb-20">
            {children}
          </div>
          <BottomNav />
        </QueryClientProvider>
      </body>
    </html>
  );
}