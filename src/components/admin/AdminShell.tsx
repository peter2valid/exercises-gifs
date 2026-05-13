'use client';

import { useState } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { AdminTopbar } from './AdminTopbar';

interface Props {
  variant: 'admin' | 'super-admin';
  gymName: string;
  userEmail: string;
  children: React.ReactNode;
}

export function AdminShell({ variant, gymName, userEmail, children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="admin-root fixed inset-0 z-10 flex overflow-hidden">
      <AdminSidebar
        variant={variant}
        gymName={gymName}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex flex-1 min-w-0 flex-col">
        <AdminTopbar
          userEmail={userEmail}
          onMenuOpen={() => setSidebarOpen(true)}
        />
        <main className="flex-1 overflow-y-auto bg-[#0a0a0a] p-5 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
