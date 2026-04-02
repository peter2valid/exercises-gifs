import { LucidePlus, LucideLink } from 'lucide-react';

export function AddLinkInput() {
  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
      <h3 className="text-white text-sm font-black uppercase tracking-widest">Add Existing Link</h3>
      <div className="flex gap-3">
        <div className="flex-1 relative group">
           <LucideLink className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-green-400 transition-colors" />
           <input 
             type="text" 
             placeholder="https://example.com/video/123"
             className="w-full bg-white/5 border border-white/10 rounded-xl h-12 pl-12 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-green-400/50 transition-all placeholder:text-white/20"
           />
        </div>
        <button className="bg-green-400 hover:bg-green-500 text-black p-3 rounded-xl transition-all active:scale-95 shadow-lg shadow-green-400/20">
           <LucidePlus className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
