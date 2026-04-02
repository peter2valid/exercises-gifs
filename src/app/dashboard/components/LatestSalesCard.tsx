import { LucideDollarSign, LucideTrendingUp } from 'lucide-react';

export function LatestSalesCard() {
  return (
    <div className="glass-panel rounded-[32px] p-8 relative overflow-hidden group">
      <div className="relative z-10 flex flex-col justify-between h-full">
        <div>
           <div className="w-12 h-12 bg-[var(--accent-orange)] rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_26px_rgba(255,107,0,0.35)]">
              <LucideDollarSign className="w-6 h-6 text-white" />
           </div>
           <h3 className="text-[var(--text-secondary)] text-xs font-semibold uppercase tracking-[0.22em] mb-2">Latest Sales</h3>
           <p className="text-[var(--text-primary)] text-5xl font-extrabold tracking-tight">$586</p>
        </div>
        
        <div className="mt-8 flex items-center gap-2 text-[var(--accent-lime)] font-bold">
           <LucideTrendingUp className="w-5 h-5" />
           <span className="text-sm uppercase tracking-widest">+24% Today</span>
        </div>
      </div>
      
      {/* Decorative Glow */}
      <div className="absolute -right-14 -bottom-14 w-52 h-52 bg-[var(--accent-orange)]/20 rounded-full blur-3xl transition-all duration-700" />
    </div>
  );
}
