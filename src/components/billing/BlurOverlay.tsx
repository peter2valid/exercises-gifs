'use client';

import { Lock, Zap } from 'lucide-react';
import type { Feature } from '@/lib/billing/types';
import { getFeatureMeta } from '@/lib/billing/featureRegistry';

interface BlurOverlayProps {
  feature: Feature;
  children: React.ReactNode;
  onUpgrade: () => void;
  title?: string;
  description?: string;
}

/**
 * Wraps locked content in a glassmorphism overlay.
 * Refined to follow the Viewora premium design system:
 * - Restrained emerald accents
 * - Dark translucent surfaces
 * - Expensive, tactile feel
 */
export function BlurOverlay({ 
  feature, 
  children, 
  onUpgrade,
  title,
  description 
}: BlurOverlayProps) {
  const meta = getFeatureMeta(feature);
  const displayTitle = title || meta.label;
  const displayDescription = description || meta.description;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/5">
      {/* Content stays in DOM, blurred — non-punishing teaser */}
      <div
        className="pointer-events-none select-none blur-md opacity-40 saturate-[0.25]"
        aria-hidden="true"
      >
        {children}
      </div>

      {/* Cinematic Glassmorphism overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl
                      bg-black/40 backdrop-blur-[2px]">
        <div className="flex flex-col items-center gap-4 px-6 py-6 text-center max-w-[240px]">
          {/* Lock icon with restrained emerald glow */}
          <div className="w-12 h-12 rounded-2xl
                          bg-white/5 border border-white/10
                          flex items-center justify-center
                          shadow-2xl">
            <Lock className="w-5 h-5 text-white/50" />
          </div>

          <div className="space-y-1.5">
            <p className="text-white font-bold text-sm tracking-tight">{displayTitle}</p>
            <p className="text-white/40 text-[11px] leading-relaxed">{displayDescription}</p>
          </div>

          <button
            onClick={onUpgrade}
            className="mt-2 px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest
                       bg-white text-black hover:bg-white/90 active:scale-95
                       transition-all shadow-xl flex items-center gap-2"
          >
            <Zap size={14} fill="currentColor" className="text-emerald-500" />
            Unlock
          </button>
        </div>
      </div>
    </div>
  );
}
