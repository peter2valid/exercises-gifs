export function ChartPlaceholder() {
  const bars = [40, 60, 45, 80, 55, 70, 50, 65, 40, 60, 45, 80];
  
  return (
    <div className="glass-panel rounded-[28px] p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-[var(--text-primary)] text-sm font-bold uppercase tracking-[0.22em]">Avg Click Duration</h3>
        <span className="text-xs font-bold text-[var(--text-secondary)] uppercase">Last 12 Hours</span>
      </div>
      <div className="flex items-end justify-between h-20 gap-1.5 pt-4">
        {bars.map((height, i) => (
          <div 
            key={i} 
            className="flex-1 bg-white/10 rounded-t-sm hover:bg-[var(--accent-lime)]/45 transition-all cursor-pointer group relative"
            style={{ height: `${height}%` }}
          >
             <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[var(--accent-orange)] text-white px-1.5 py-0.5 rounded text-[8px] font-black opacity-0 group-hover:opacity-100 transition-opacity">
                {height}s
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}
