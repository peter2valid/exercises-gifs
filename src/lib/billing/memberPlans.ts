import type { Feature, MemberBillingPeriod, MemberPlan } from './types';

// All features unlocked by Viewora Plus
// Note: advanced_analytics appears in both ELITE gym plan and Plus —
// the entitlement resolver handles this via Set union (no duplication).
export const PLUS_FEATURES: readonly Feature[] = [
  'ai_recommendations',
  'advanced_analytics',
  'elite_streaks',
  'recovery_insights',
  'transformation_timelines',
  'premium_challenges',
  'advanced_progress',
  'personalized_insights',
  'premium_visualizations',
  'advanced_achievements',
];

export const MEMBER_PLAN_FEATURES: Record<MemberPlan, readonly Feature[]> = {
  plus: PLUS_FEATURES,
};

// Pricing in KES (whole currency, not kobo)
export const PLUS_PRICING: Record<MemberBillingPeriod, { amountKes: number; label: string; saveLabel?: string }> = {
  weekly:    { amountKes: 99,  label: 'KES 99 / week' },
  monthly:   { amountKes: 349, label: 'KES 349 / month', saveLabel: 'Save 11%' },
  quarterly: { amountKes: 899, label: 'KES 899 / quarter', saveLabel: 'Best value — save 24%' },
};

// Key Plus features to highlight in upgrade prompts (ordered by impact)
export const PLUS_HIGHLIGHT_FEATURES: readonly Feature[] = [
  'ai_recommendations',
  'elite_streaks',
  'recovery_insights',
  'advanced_progress',
  'advanced_achievements',
];
