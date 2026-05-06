import { Inter } from 'next/font/google';
import './globals.css';
import { BottomNav } from '@/components/BottomNav';
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister';
import { SyncInitializer } from '@/components/SyncInitializer';
import { SyncStatus } from '@/components/SyncStatus';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-black text-white`}>
        <ServiceWorkerRegister />
        <SyncInitializer />
        <SyncStatus />
        <div className="min-h-screen relative">{children}</div>
        <BottomNav />
      </body>
    </html>
  );
}
