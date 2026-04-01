// src/components/ui/Button.tsx
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({ className, variant = 'primary', size = 'md', ...props }: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center rounded-xl font-semibold transition-all active:scale-95 disabled:opacity-50";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm",
    outline: "border-2 border-gray-200 text-gray-700 hover:bg-gray-50",
    ghost: "text-gray-500 hover:bg-gray-100",
  };
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-5 py-2.5",
    lg: "px-8 py-4 text-lg",
  };

  return <button className={cn(baseStyles, variants[variant], sizes[size], className)} {...props} />;
}

// src/components/ui/Input.tsx
export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input 
      className={cn(
        "flex h-12 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 outline-none transition-all",
        className
      )}
      {...props}
    />
  );
}

// src/components/ui/BottomNav.tsx
import { LucideDumbbell, LucideHistory, LucideLayoutDashboard, LucideSearch, LucideClipboardEdit } from 'lucide-react';
import Link from 'next/link';

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white border-t border-gray-100 flex items-center justify-around px-2 pb-2">
      <Link href="/" className="flex flex-col items-center text-blue-600 gap-1">
        <LucideLayoutDashboard className="w-6 h-6" />
        <span className="text-[10px] font-bold">Home</span>
      </Link>
      <Link href="/exercises" className="flex flex-col items-center text-gray-400 gap-1 hover:text-blue-600 transition-colors">
        <LucideSearch className="w-6 h-6" />
        <span className="text-[10px] font-medium">Browse</span>
      </Link>
      <Link href="/workout" className="flex flex-col items-center bg-blue-600 text-white p-3 rounded-full -mt-12 shadow-lg shadow-blue-200">
        <LucideDumbbell className="w-7 h-7" />
      </Link>
      <Link href="/history" className="flex flex-col items-center text-gray-400 gap-1 hover:text-blue-600 transition-colors">
        <LucideHistory className="w-6 h-6" />
        <span className="text-[10px] font-medium">History</span>
      </Link>
      <Link href="/coach/builder" className="flex flex-col items-center text-gray-400 gap-1 hover:text-blue-600 transition-colors">
        <LucideClipboardEdit className="w-6 h-6" />
        <span className="text-[10px] font-medium">Builder</span>
      </Link>
    </nav>
  );
}

// Explicit Exports to avoid Star Export conflicts
export { Card, CardHeader, CardTitle, CardContent } from './card';
export { Badge } from './badge';
