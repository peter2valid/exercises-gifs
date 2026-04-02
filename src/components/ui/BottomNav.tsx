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
    <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white/10 backdrop-blur-md border-t border-white/20 flex items-center justify-around px-6 z-50">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-1 transition-all active:scale-90",
              isActive ? "text-green-400" : "text-white/60 hover:text-white"
            )}
          >
            <item.icon className={cn("w-6 h-6", isActive && "drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]")} />
            <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
