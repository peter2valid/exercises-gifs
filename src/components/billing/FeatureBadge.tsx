import { Sparkles } from 'lucide-react';
import type { Feature } from '@/lib/billing/types';
import { FEATURE_REGISTRY } from '@/lib/billing/featureRegistry';

interface FeatureBadgeProps {
  feature: Feature;
  className?: string;
}

const GYM_TIER_LABELS: Record<string, string> = {
  start:  'Start',
  active: 'Active',
  elite:  'Elite',
};

/**
 * Informational badge showing which plan unlocks a feature.
 * Does NOT perform access checks — use PremiumGate for gating.
 */
export function FeatureBadge({ feature, className = '' }: FeatureBadgeProps) {
  const meta = FEATURE_REGISTRY[feature];

  if (meta.tier === 'core') return null;

  if (meta.tier === 'plus') {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                    bg-violet-500/20 border border-violet-400/30
                    text-violet-300 text-[10px] font-semibold ${className}`}
      >
        <Sparkles size={9} />
        Plus
      </span>
    );
  }

  const tierLabel = GYM_TIER_LABELS[meta.tier] ?? meta.tier;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full
                  bg-amber-500/20 border border-amber-400/30
                  text-amber-300 text-[10px] font-semibold ${className}`}
    >
      Gym {tierLabel}
    </span>
  );
}
