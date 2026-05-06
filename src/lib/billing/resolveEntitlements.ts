import type {
  Feature,
  GymSubscriptionState,
  MemberSubscriptionState,
  PromotionState,
  EffectiveEntitlements,
} from './types';
import { GYM_PLAN_FEATURES, CORE_FEATURES } from './gymPlans';
import { MEMBER_PLAN_FEATURES } from './memberPlans';

const CACHE_STALE_MS  = 48 * 60 * 60 * 1000; // 48 hours

/**
 * Determines whether a subscription should grant access.
 *
 * active/trialing     → always grant
 * past_due            → grant within grace period only
 * canceled/paused/expired → deny
 */
function grantsAccess(
  status: string,
  gracePeriodEnd: string | null,
  periodEnd: string | null,
): boolean {
  if (status === 'active' || status === 'trialing') return true;

  if (status === 'past_due') {
    // Grace period end is set by the webhook handler; fall back to periodEnd + 7d
    const graceTs = gracePeriodEnd
      ? new Date(gracePeriodEnd).getTime()
      : periodEnd
        ? new Date(periodEnd).getTime() + 7 * 24 * 60 * 60 * 1000
        : null;
    return graceTs !== null && Date.now() < graceTs;
  }

  return false;
}

/**
 * Pure function — deterministic, testable, no side effects.
 * Merges gym-level and user-level entitlements into a single effective set.
 *
 * Priority: Core < Gym plan < User premium < Promotions
 */
export function resolveEntitlements(
  gym: GymSubscriptionState | null,
  member: MemberSubscriptionState | null,
  promotions: PromotionState[],
  cachedAt: string,
): EffectiveEntitlements {
  const features = new Set<Feature>(CORE_FEATURES);

  // ── Gym plan ─────────────────────────────────────────────────────────────
  let gymPlan = gym?.plan ?? null;
  let gymPlanStatus = gym?.status ?? null;

  if (gym && grantsAccess(gym.status, gym.gracePeriodEnd, gym.periodEnd)) {
    GYM_PLAN_FEATURES[gym.plan].forEach(f => features.add(f));
  } else {
    gymPlan = null; // Plan expired or not active — exclude from effective state
  }

  // ── Member premium ────────────────────────────────────────────────────────
  let hasMemberPremium = false;
  let memberPlanStatus = member?.status ?? null;

  if (member && grantsAccess(member.status, member.gracePeriodEnd, member.periodEnd)) {
    MEMBER_PLAN_FEATURES[member.plan].forEach(f => features.add(f));
    hasMemberPremium = true;
  }

  // ── Promotions (trials, coupons, gym-sponsored unlocks) ──────────────────
  const activePromotions: string[] = [];
  const now = Date.now();

  for (const promo of promotions) {
    if (promo.validUntil && now > new Date(promo.validUntil).getTime()) continue;
    promo.features.forEach(f => features.add(f));
    activePromotions.push(promo.code);
  }

  const ageMs = now - new Date(cachedAt).getTime();

  return {
    features,
    gymPlan,
    gymPlanStatus,
    hasMemberPremium,
    memberPlanStatus,
    activePromotions,
    cachedAt,
    isStale: ageMs > CACHE_STALE_MS,
  };
}
