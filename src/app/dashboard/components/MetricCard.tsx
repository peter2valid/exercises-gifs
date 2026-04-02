import { LucideArrowUpRight, LucideArrowDownRight } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string;
  trend: string;
  isPositive: boolean;
}

export function MetricCard({ label, value, trend, isPositive }: MetricCardProps) {
  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 shadow-xl">
      <p className="text-white/60 text-sm font-medium uppercase tracking-widest mb-1">{label}</p>
      <h3 className="text-white text-2xl font-black">{value}</h3>
      <div className="flex items-center gap-1 mt-2">
        {isPositive ? (
          <LucideArrowUpRight className="w-4 h-4 text-green-400" />
        ) : (
          <LucideArrowDownRight className="w-4 h-4 text-red-400" />
        )}
        <span className={`text-xs font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
          {trend}
        </span>
      </div>
    </div>
  );
}
