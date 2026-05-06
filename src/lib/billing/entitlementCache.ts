import { db } from '@/lib/db/dexie';
import { supabase } from '@/lib/supabase/client';
import type {
  Feature,
  GymSubscriptionState,
  MemberSubscriptionState,
  PromotionState,
  EffectiveEntitlements,
} from './types';
import { resolveEntitlements } from './resolveEntitlements';
import { CORE_FEATURES } from './gymPlans';

// Returns cached entitlements from Dexie — fast, works fully offline.
// Falls back to CORE features if no cache exists for this user.
export async function loadCachedEntitlements(userId: string): Promise<EffectiveEntitlements> {
  try {
    const cached = await db.entitlement_cache.get('current');

    if (cached && cached.user_id === userId) {
      return {
        features: new Set<Feature>(cached.effective_features as Feature[]),
        gymPlan: cached.gym_plan as any ?? null,
        gymPlanStatus: cached.gym_plan_status as any ?? null,
        hasMemberPremium: cached.has_member_premium,
        memberPlanStatus: cached.member_plan_status as any ?? null,
        activePromotions: cached.active_promotions,
        cachedAt: cached.cached_at,
        isStale: Date.now() - new Date(cached.cached_at).getTime() > 48 * 60 * 60 * 1000,
      };
    }
  } catch {
    // Dexie not ready yet — safe to ignore, fall through to CORE
  }

  return coreOnlyEntitlements();
}

// Fetches fresh subscription state from Supabase, resolves entitlements,
// writes result to Dexie, and returns the resolved set.
// Safe to call on reconnect, background refresh, or post-payment.
export async function fetchAndCacheEntitlements(userId: string): Promise<EffectiveEntitlements> {
  try {
    // ── Step 1: Gym membership and gym subscription ──────────────────────────
    let gym: GymSubscriptionState | null = null;

    const { data: memberships } = await supabase
      .from('gym_memberships')
      .select('gym_id')
      .eq('user_id', userId)
      .limit(1);
      
    const primaryGymId = memberships?.[0]?.gym_id;

    if (primaryGymId) {
      const { data: gymSub } = await supabase
        .from('gym_subscriptions')
        .select('plan, status, current_period_end, grace_period_end')
        .eq('gym_id', primaryGymId)
        .maybeSingle();

      if (gymSub) {
        gym = {
          gymId: primaryGymId,
          plan: gymSub.plan as any,
          status: gymSub.status as any,
          periodEnd: gymSub.current_period_end,
          gracePeriodEnd: gymSub.grace_period_end,
        };
      }
    }

    // ── Step 2: User subscription (Viewora Plus) ─────────────────────────────
    let member: MemberSubscriptionState | null = null;

    const { data: userSub } = await supabase
      .from('user_subscriptions')
      .select('plan, billing_period, status, current_period_end, grace_period_end, trial_ends_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (userSub) {
      member = {
        userId,
        plan: userSub.plan as any || 'plus',
        billingPeriod: userSub.billing_period as any || 'monthly',
        status: userSub.status as any,
        periodEnd: userSub.current_period_end,
        gracePeriodEnd: userSub.grace_period_end,
        trialEndsAt: userSub.trial_ends_at,
      };
    }

    // ── Step 3: Active promotions ────────────────────────────────────────────
    const { data: promoRows } = await supabase
      .from('promotion_rules')
      .select('code, features, valid_until')
      .or(`subject_type.eq.global,and(subject_type.eq.user,subject_id.eq.${userId})`);

    const promotions: PromotionState[] = (promoRows ?? []).map((p: any) => ({
      code: p.code as string,
      features: p.features as Feature[],
      validUntil: p.valid_until as string | null,
    }));

    // ── Step 4: Resolve and cache ────────────────────────────────────────────
    const cachedAt = new Date().toISOString();
    const resolved = resolveEntitlements(gym, member, promotions, cachedAt);

    await db.entitlement_cache.put({
      id: 'current',
      user_id: userId,
      effective_features: Array.from(resolved.features),
      gym_plan: resolved.gymPlan,
      gym_plan_status: resolved.gymPlanStatus,
      has_member_premium: resolved.hasMemberPremium,
      member_plan_status: resolved.memberPlanStatus,
      active_promotions: resolved.activePromotions,
      cached_at: cachedAt,
      version: 1,
    });

    return resolved;
  } catch (err) {
    console.error('[entitlementCache] fetch failed, falling back to local cache:', err);
    return loadCachedEntitlements(userId);
  }
}

// Clears the local entitlement cache (call on sign-out)
export async function clearEntitlementCache(): Promise<void> {
  try {
    await db.entitlement_cache.delete('current');
  } catch {
    // Ignore — cache may not exist
  }
}

function coreOnlyEntitlements(): EffectiveEntitlements {
  return {
    features: new Set<Feature>(CORE_FEATURES as Feature[]),
    gymPlan: null,
    gymPlanStatus: null,
    hasMemberPremium: false,
    memberPlanStatus: null,
    activePromotions: [],
    cachedAt: new Date().toISOString(),
    isStale: false,
  };
}
