'use client';

import { Inter } from 'next/font/google';
import { Suspense } from 'react';
import './globals.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { GymProvider } from '@/context/GymContext';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(() => new QueryClient());

  useEffect(() => {
    const reloadKey = 'chunk-reload-attempted';

    const shouldRecover = (value: unknown) => {
      const message = String(value ?? '');
      return /ChunkLoadError|Loading chunk|app-pages-internals|_next\/static\/chunks/i.test(message);
    };

    const recover = () => {
      if (sessionStorage.getItem(reloadKey) === '1') return;
      sessionStorage.setItem(reloadKey, '1');
      window.location.reload();
    };

    const onError = (event: ErrorEvent) => {
      if (shouldRecover(event.error?.message ?? event.message)) {
        recover();
      }
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      if (shouldRecover(reason?.message ?? reason)) {
        recover();
      }
    };

    sessionStorage.removeItem(reloadKey);
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onUnhandledRejection);

    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
    };
  }, []);

  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${inter.className} bg-gray-50 text-gray-900`}>
        <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
          <GymProvider>
            <QueryClientProvider client={queryClient}>
              <div className="min-h-screen">
                {children}
              </div>
            </QueryClientProvider>
          </GymProvider>
        </Suspense>
      </body>
    </html>
  );
}
