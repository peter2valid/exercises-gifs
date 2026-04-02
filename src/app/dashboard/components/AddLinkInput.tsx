import { LucidePlus, LucideLink } from 'lucide-react';

export function AddLinkInput() {
  return (
    <div className="glass-panel rounded-[28px] p-6 space-y-4">
      <h3 className="text-[var(--text-primary)] text-sm font-bold uppercase tracking-[0.22em]">Add Existing Link</h3>
      <div className="flex gap-3">
        <div className="flex-1 relative group">
           <LucideLink className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)] group-focus-within:text-[var(--accent-orange)] transition-colors" />
           <input 
             type="text" 
             placeholder="https://example.com/video/123"
             className="w-full bg-white/10 border border-white/10 rounded-xl h-12 pl-12 pr-4 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-orange)]/40 transition-all placeholder:text-[var(--text-secondary)]"
           />
        </div>
        <button className="bg-[var(--accent-orange)] hover:bg-[#ff7f24] text-white p-3 rounded-xl transition-all active:scale-95 shadow-[0_0_28px_rgba(255,107,0,0.35)]">
           <LucidePlus className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
