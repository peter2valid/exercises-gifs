import { LucideArrowUpRight, LucideArrowDownRight } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string;
  trend: string;
  isPositive: boolean;
}

export function MetricCard({ label, value, trend, isPositive }: MetricCardProps) {
  return (
    <div className="glass-panel p-5 rounded-[28px]">
      <p className="text-[var(--text-secondary)] text-xs font-semibold uppercase tracking-[0.22em] mb-2">{label}</p>
      <h3 className="text-[var(--text-primary)] text-3xl font-extrabold tracking-tight">{value}</h3>
      <div className="flex items-center gap-1 mt-2">
        {isPositive ? (
          <LucideArrowUpRight className="w-4 h-4 text-[var(--accent-lime)]" />
        ) : (
          <LucideArrowDownRight className="w-4 h-4 text-[var(--accent-orange)]" />
        )}
        <span className={`text-xs font-bold ${isPositive ? 'text-[var(--accent-lime)]' : 'text-[var(--accent-orange)]'}`}>
          {trend}
        </span>
      </div>
    </div>
  );
}
