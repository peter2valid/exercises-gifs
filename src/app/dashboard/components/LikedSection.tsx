import { LucideHeart } from 'lucide-react';

export function LikedSection() {
  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl flex items-center justify-between group cursor-pointer hover:bg-white/10 transition-all active:scale-[0.98]">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-red-500/10 rounded-xl group-hover:bg-red-500/20 transition-colors">
          <LucideHeart className="w-6 h-6 text-red-500 group-hover:fill-red-500 transition-all" />
        </div>
        <div>
          <h3 className="text-white text-sm font-black uppercase tracking-widest">Liked</h3>
          <p className="text-white/40 text-[10px] font-bold uppercase">Total Interactions</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-white text-2xl font-black italic">1,248</p>
        <span className="text-[10px] font-bold text-green-400 uppercase">+12%</span>
      </div>
    </div>
  );
}
