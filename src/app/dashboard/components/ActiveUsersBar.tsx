export function ActiveUsersBar() {
  const bars = [100, 200, 300, 400, 500];
  
  return (
    <div className="glass-panel rounded-[28px] p-6 space-y-4">
      <h3 className="text-[var(--text-primary)] text-sm font-bold uppercase tracking-[0.22em]">Active Users Right Now</h3>
      <div className="flex items-end justify-between h-32 gap-3">
        {bars.map((height, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
            <div 
              className="w-full bg-[var(--accent-lime)]/25 group-hover:bg-[var(--accent-lime)]/45 rounded-t-lg transition-all"
              style={{ height: `${(height / 500) * 100}%` }}
            />
            <span className="text-[10px] font-bold text-[var(--text-secondary)] group-hover:text-[var(--accent-lime)] transition-colors uppercase">
               {height}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
