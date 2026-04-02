export function ActiveUsersBar() {
  const bars = [100, 200, 300, 400, 500];
  
  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-xl space-y-4">
      <h3 className="text-white text-sm font-black uppercase tracking-widest">Active Users Right Now</h3>
      <div className="flex items-end justify-between h-32 gap-3">
        {bars.map((height, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
            <div 
              className="w-full bg-green-400/20 group-hover:bg-green-400/40 rounded-t-lg transition-all"
              style={{ height: `${(height / 500) * 100}%` }}
            />
            <span className="text-[10px] font-bold text-white/40 group-hover:text-green-400 transition-colors uppercase">
               {height}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
