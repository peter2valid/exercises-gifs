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
  title: 'Supafast Gym - Efficient Workout Tracking',
  description: 'Track your gym progress with lightning speed and offline-first reliability.',
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
          <div className="min-h-screen relative">
            <main>{children}</main>
          </div>
          <BottomNav />
        </EntitlementProvider>
      </body>
    </html>
  );
}
