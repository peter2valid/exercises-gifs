interface AdminCardProps {
  title: string;
  value: string | number;
  description?: string;
  accent?: 'blue' | 'green' | 'amber' | 'red' | 'none';
  icon?: React.ReactNode;
}

const ACCENT_TEXT: Record<string, string> = {
  blue:  'text-blue-400',
  green: 'text-emerald-400',
  amber: 'text-amber-400',
  red:   'text-red-400',
  none:  'text-[#e8e8e8]',
};

const ACCENT_CHIP: Record<string, string> = {
  blue:  'bg-blue-400/10 text-blue-400',
  green: 'bg-emerald-400/10 text-emerald-400',
  amber: 'bg-amber-400/10 text-amber-400',
  red:   'bg-red-400/10 text-red-400',
  none:  'bg-white/[0.05] text-[#909090]',
};

const ACCENT_GLOW: Record<string, string> = {
  blue:  'hover:shadow-[0_8px_28px_rgba(59,130,246,0.12)]',
  green: 'hover:shadow-[0_8px_28px_rgba(16,185,129,0.12)]',
  amber: 'hover:shadow-[0_8px_28px_rgba(245,158,11,0.12)]',
  red:   'hover:shadow-[0_8px_28px_rgba(239,68,68,0.12)]',
  none:  'hover:shadow-[0_8px_28px_rgba(0,0,0,0.3)]',
};

export function AdminCard({ title, value, description, accent = 'none', icon }: AdminCardProps) {
  return (
    <div
      className={`a-card transition-all duration-200 hover:-translate-y-0.5 hover:border-white/15 ${ACCENT_GLOW[accent]}`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#555]">{title}</p>
        {icon && (
          <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${ACCENT_CHIP[accent]}`}>
            {icon}
          </span>
        )}
      </div>
      <p className={`text-3xl font-bold tabular-nums leading-none ${ACCENT_TEXT[accent]}`}>
        {value}
      </p>
      {description && (
        <p className="mt-2 text-[12px] text-[#606060]">{description}</p>
      )}
    </div>
  );
}
