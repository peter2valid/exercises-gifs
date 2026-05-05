'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Home,
  Compass,
  Dumbbell,
  TrendingUp,
  User,
} from 'lucide-react';

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/home', icon: Home, label: 'Home' },
    { href: '/explore', icon: Compass, label: 'Explore' },
    { href: '/workout', icon: Dumbbell, label: 'Workout' },
    { href: '/progress', icon: TrendingUp, label: 'Progress' },
    { href: '/profile', icon: User, label: 'Profile' },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-black/95 backdrop-blur-xl">
      <div className="max-w-md mx-auto px-2 py-3 flex items-center justify-around">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all duration-200"
              style={{
                background: active
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'transparent',
              }}
            >
              <Icon
                size={22}
                className="transition-colors duration-200"
                style={{
                  color: active ? '#ffffff' : '#ffffff',
                  opacity: active ? 1 : 0.4,
                }}
              />
              <span className="text-[9px] mt-1 font-medium tracking-tight" style={{
                color: active ? '#ffffff' : '#ffffff',
                opacity: active ? 1 : 0.4,
              }}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
