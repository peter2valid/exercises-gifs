'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Dumbbell, LayoutDashboard, History, Settings } from 'lucide-react';

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Dash', icon: LayoutDashboard, href: '/' },
    { label: 'Work', icon: PlayIcon, href: '/workout/active' },
    { label: 'Exercises', icon: Dumbbell, href: '/exercises' },
    { label: 'History', icon: History, href: '/history' },
  ];

  function PlayIcon({ className }: { className?: string }) {
     return <div className={`p-2 rounded-full bg-blue-600 text-white -mt-8 shadow-lg shadow-blue-200 ${className}`}><Dumbbell className="h-6 w-6" /></div>
  }

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-slate-200 flex justify-around items-center p-2 z-50">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;

        if (item.label === 'Work') {
           return (
             <Link key={item.href} href={item.href} className="flex flex-col items-center">
               <Icon />
               <span className="text-[10px] font-bold mt-1 text-slate-400">TRAIN</span>
             </Link>
           );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center p-2 transition-colors ${
              isActive ? 'text-blue-600' : 'text-slate-400'
            }`}
          >
            <Icon className="h-5 w-5" />
            <span className="text-[10px] font-bold mt-1 uppercase tracking-tighter">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}