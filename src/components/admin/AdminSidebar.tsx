'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import {
  LayoutDashboard, Users, ScanLine, CreditCard, Package,
  UserCheck, Settings2, Building2, Tag, X, LogOut, Zap,
  QrCode, Dumbbell,
} from 'lucide-react';

const ADMIN_NAV = [
  { href: '/admin',             label: 'Dashboard',   icon: LayoutDashboard, exact: true },
  { href: '/admin/members',     label: 'Members',     icon: Users },
  { href: '/admin/scan',        label: 'Scan QR',     icon: QrCode },
  { href: '/admin/check-ins',   label: 'Check-ins',   icon: ScanLine },
  { href: '/admin/programs',    label: 'Programs',    icon: Dumbbell },
  { href: '/admin/payments',    label: 'Payments',    icon: CreditCard },
  { href: '/admin/packages',    label: 'Packages',    icon: Package },
  { href: '/admin/staff',       label: 'Staff',       icon: UserCheck },
  { href: '/admin/settings',    label: 'Settings',    icon: Settings2 },
];

const SUPER_NAV = [
  { href: '/super-admin',                  label: 'Dashboard',     icon: LayoutDashboard, exact: true },
  { href: '/super-admin/gyms',             label: 'Gyms',          icon: Building2 },
  { href: '/super-admin/users',            label: 'Users',         icon: Users },
  { href: '/super-admin/subscriptions',    label: 'Subscriptions', icon: CreditCard },
  { href: '/super-admin/promotions',       label: 'Promotions',    icon: Tag },
];

interface Props {
  variant: 'admin' | 'super-admin';
  gymName: string;
  isOpen: boolean;
  onClose: () => void;
}

function NavItem({
  href, label, icon: Icon, exact, onClick,
}: {
  href: string; label: string; icon: React.ElementType;
  exact?: boolean; onClick?: () => void;
}) {
  const pathname = usePathname();
  const active = exact ? pathname === href : (pathname === href || pathname.startsWith(href + '/'));
  return (
    <Link href={href} onClick={onClick} className={`a-nav-link${active ? ' active' : ''}`}>
      <Icon size={15} />
      {label}
    </Link>
  );
}

export function AdminSidebar({ variant, gymName, isOpen, onClose }: Props) {
  const router = useRouter();
  const navItems = variant === 'admin' ? ADMIN_NAV : SUPER_NAV;

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth');
  };

  const content = (
    <div className="flex h-full flex-col bg-[#0d0d0d] border-r border-[#262626]">
      {/* Brand */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#262626] px-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-600">
            <Zap size={13} className="text-white" fill="currentColor" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-[#e8e8e8] leading-none">{gymName}</p>
            <p className="text-[10px] text-[#555] mt-0.5 leading-none uppercase tracking-wide">
              {variant === 'admin' ? 'Gym Admin' : 'Super Admin'}
            </p>
          </div>
        </div>
        <button onClick={onClose} className="shrink-0 rounded-md p-1 text-[#555] hover:text-[#e8e8e8] lg:hidden">
          <X size={17} />
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {navItems.map(({ href, label, icon, exact }) => (
          <NavItem key={href} href={href} label={label} icon={icon} exact={exact} onClick={onClose} />
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="border-t border-[#262626] px-2 py-3 space-y-0.5">
        <button onClick={handleSignOut} className="a-nav-link">
          <LogOut size={15} />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop: always visible */}
      <aside className="hidden lg:block w-[220px] shrink-0">
        <div className="fixed inset-y-0 w-[220px]">{content}</div>
      </aside>

      {/* Mobile: overlay drawer */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={onClose} />
          <aside className="fixed inset-y-0 left-0 z-50 w-[220px] lg:hidden">{content}</aside>
        </>
      )}
    </>
  );
}
