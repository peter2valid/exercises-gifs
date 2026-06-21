import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { BottomNav } from '@/components/BottomNav';
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister';
import { SyncInitializer } from '@/components/SyncInitializer';
import { SyncStatus } from '@/components/SyncStatus';
import { EntitlementProvider } from '@/components/billing/EntitlementProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'GymApp - Workout Tracking & Gym Management',
  description: 'Track your gym progress and manage your gym with offline-first reliability.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-black text-white selection:bg-emerald-500/30`}>
        <div className="fixed inset-0 z-[9999] pointer-events-none opacity-[0.03] grain-overlay" />
        <EntitlementProvider>
          <ServiceWorkerRegister />
          <SyncInitializer />
          <SyncStatus />
          <div className="fixed inset-0 overflow-y-auto overflow-x-hidden">
            <main className="min-h-full" style={{ paddingBottom: 'calc(var(--bottom-nav-height,76px) + 20px + env(safe-area-inset-bottom))' }}>{children}</main>
            <BottomNav />
          </div>
        </EntitlementProvider>
      </body>
    </html>
  );
}
