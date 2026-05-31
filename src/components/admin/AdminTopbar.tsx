'use client';

import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';

const TITLES: Record<string, string> = {
  '/admin':                       'Dashboard',
  '/admin/members':               'Members',
  '/admin/check-ins':             'Check-ins',
  '/admin/payments':              'Payments',
  '/admin/packages':              'Packages',
  '/admin/staff':                 'Staff',
  '/admin/settings':              'Settings',
  '/trainer':                     'Dashboard',
  '/super-admin':                 'Dashboard',
  '/super-admin/gyms':            'Gyms',
  '/super-admin/users':           'Users',
  '/super-admin/subscriptions':   'Subscriptions',
  '/super-admin/promotions':      'Promotions',
};

interface Props {
  userEmail: string;
  onMenuOpen: () => void;
}

export function AdminTopbar({ userEmail, onMenuOpen }: Props) {
  const pathname = usePathname();
  const title = TITLES[pathname] ?? 'Admin';
  const shortEmail = userEmail.length > 28 ? userEmail.slice(0, 28) + '…' : userEmail;

  return (
    <header className="flex h-14 shrink-0 items-center border-b border-[#262626] bg-[#0d0d0d] px-4 gap-3">
      <button
        onClick={onMenuOpen}
        className="rounded-lg p-1.5 text-[#555] hover:text-[#e8e8e8] transition-colors lg:hidden"
        aria-label="Open sidebar"
      >
        <Menu size={19} />
      </button>
      <h1 className="text-[15px] font-semibold text-[#e8e8e8]">{title}</h1>
      <div className="ml-auto hidden sm:block text-[12px] text-[#555]">
        {shortEmail}
      </div>
    </header>
  );
}
