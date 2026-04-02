import { LucideHeart } from 'lucide-react';

export function LikedSection() {
  return (
    <div className="glass-panel rounded-[28px] p-6 flex items-center justify-between group cursor-pointer hover:bg-white/20 transition-all active:scale-[0.98]">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-[var(--accent-orange)]/15 rounded-xl group-hover:bg-[var(--accent-orange)]/25 transition-colors">
          <LucideHeart className="w-6 h-6 text-[var(--accent-orange)] transition-all" />
        </div>
        <div>
          <h3 className="text-[var(--text-primary)] text-sm font-bold uppercase tracking-[0.22em]">Liked</h3>
          <p className="text-[var(--text-secondary)] text-[10px] font-bold uppercase">Total Interactions</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-[var(--text-primary)] text-2xl font-extrabold">1,248</p>
        <span className="text-[10px] font-bold text-[var(--accent-lime)] uppercase">+12%</span>
      </div>
    </div>
  );
}
