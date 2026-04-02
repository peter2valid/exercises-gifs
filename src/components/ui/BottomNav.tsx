'use client';

import { LucideHome, LucideBarChart2, LucideUsers, LucideSettings } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { icon: LucideHome, label: 'Home', href: '/dashboard' },
    { icon: LucideBarChart2, label: 'Analytics', href: '/dashboard/analytics' },
    { icon: LucideUsers, label: 'Users', href: '/dashboard/users' },
    { icon: LucideSettings, label: 'Settings', href: '/dashboard/settings' },
  ];

  return (
    <nav className="fixed left-6 top-1/2 -translate-y-1/2 z-50">
      <div className="glass-panel w-14 rounded-[28px] p-2 flex flex-col items-center gap-2 bg-white/10">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              "h-10 w-10 rounded-xl flex items-center justify-center transition-all active:scale-90 border",
              isActive
                ? "text-[var(--accent-orange)] border-white/20 bg-white/10 shadow-[0_0_18px_rgba(255,107,0,0.25)]"
                : "text-white/70 border-white/10 bg-white/10 hover:text-white"
            )}
            aria-label={item.label}
            title={item.label}
          >
            <item.icon className={cn("w-[18px] h-[18px] stroke-[1.6]")} />
          </Link>
        );
      })}
      </div>
    </nav>
  );
}
