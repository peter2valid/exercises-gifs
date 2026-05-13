interface AdminCardProps {
  title: string;
  value: string | number;
  description?: string;
  accent?: 'blue' | 'green' | 'amber' | 'red' | 'none';
  icon?: React.ReactNode;
}

const ACCENT_COLORS: Record<string, string> = {
  blue:  'text-blue-400',
  green: 'text-emerald-400',
  amber: 'text-amber-400',
  red:   'text-red-400',
  none:  'text-[#e8e8e8]',
};

export function AdminCard({ title, value, description, accent = 'none', icon }: AdminCardProps) {
  return (
    <div className="a-card">
      <div className="flex items-start justify-between gap-3 mb-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#555]">{title}</p>
        {icon && <span className="text-[#555]">{icon}</span>}
      </div>
      <p className={`text-3xl font-bold tabular-nums leading-none ${ACCENT_COLORS[accent]}`}>
        {value}
      </p>
      {description && (
        <p className="mt-2 text-[12px] text-[#606060]">{description}</p>
      )}
    </div>
  );
}
