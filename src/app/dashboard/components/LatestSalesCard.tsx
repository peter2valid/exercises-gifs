import { LucideDollarSign, LucideTrendingUp } from 'lucide-react';

export function LatestSalesCard() {
  return (
    <div className="bg-gradient-to-br from-green-400/20 to-transparent backdrop-blur-md border border-white/20 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
      <div className="relative z-10 flex flex-col justify-between h-full">
        <div>
           <div className="w-12 h-12 bg-green-400 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-green-400/20">
              <LucideDollarSign className="w-6 h-6 text-white" />
           </div>
           <h3 className="text-white/60 text-sm font-black uppercase tracking-widest mb-1">Latest Sales</h3>
           <p className="text-white text-5xl font-black italic tracking-tighter">$586</p>
        </div>
        
        <div className="mt-8 flex items-center gap-2 text-green-400 font-bold">
           <LucideTrendingUp className="w-5 h-5" />
           <span className="text-sm uppercase tracking-widest">+24% Today</span>
        </div>
      </div>
      
      {/* Decorative Glow */}
      <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-green-400/10 rounded-full blur-3xl group-hover:bg-green-400/20 transition-all duration-700" />
    </div>
  );
}
