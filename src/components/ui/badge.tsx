'use client';

export function Badge({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${className}`}>
      {children}
    </span>
  );
}