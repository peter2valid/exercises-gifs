import { create } from 'zustand';
import type { Feature, GymPlan, SubscriptionStatus, MemberBillingPeriod } from '@/lib/billing/types';
import { loadCachedEntitlements, fetchAndCacheEntitlements, clearEntitlementCache } from '@/lib/billing/entitlementCache';
import { CORE_FEATURES } from '@/lib/billing/gymPlans';

type EntitlementStore = {
  // Resolved effective state
  features: Set<Feature>;
  gymId: string | null;           // primary gym — use as tenant_id when non-null
  gymPlan: GymPlan | null;
  gymPlanStatus: SubscriptionStatus | null;
  gymPeriodEnd: string | null;
  hasMemberPremium: boolean;
  memberPlanStatus: SubscriptionStatus | null;
  memberPeriodEnd: string | null;
  activePromotions: string[];
  cachedAt: string | null;
  isStale: boolean;
  isLoading: boolean;
  userId: string | null;

  // Upgrade sheet state — centralises all upgrade prompt logic
  upgradeSheetVisible: boolean;
  upgradeTargetFeature: Feature | null;
  upgradePreselectedPeriod: MemberBillingPeriod;

  // Actions
  initEntitlements: (userId: string) => Promise<void>;
  refreshEntitlements: () => Promise<void>;
  clearEntitlements: () => Promise<void>;
  hasFeature: (feature: Feature) => boolean;
  triggerUpgrade: (feature: Feature, period?: MemberBillingPeriod) => void;
  dismissUpgradeSheet: () => void;
};

const INITIAL_FEATURES = new Set<Feature>(CORE_FEATURES as Feature[]);

export const useEntitlementStore = create<EntitlementStore>((set, get) => ({
  features: INITIAL_FEATURES,
  gymId: null,
  gymPlan: null,
  gymPlanStatus: null,
  gymPeriodEnd: null,
  hasMemberPremium: false,
  memberPlanStatus: null,
  memberPeriodEnd: null,
  activePromotions: [],
  cachedAt: null,
  isStale: false,
  isLoading: false,
  userId: null,
  upgradeSheetVisible: false,
  upgradeTargetFeature: null,
  upgradePreselectedPeriod: 'monthly',

  initEntitlements: async (userId: string) => {
    set({ isLoading: true, userId });

    // Load from Dexie first — fast (~1ms), fully offline-safe
    const cached = await loadCachedEntitlements(userId);
    set({
      features: cached.features,
      gymId: cached.gymId,
      gymPlan: cached.gymPlan,
      gymPlanStatus: cached.gymPlanStatus,
      gymPeriodEnd: cached.gymPeriodEnd,
      hasMemberPremium: cached.hasMemberPremium,
      memberPlanStatus: cached.memberPlanStatus,
      memberPeriodEnd: cached.memberPeriodEnd,
      activePromotions: cached.activePromotions,
      cachedAt: cached.cachedAt,
      isStale: cached.isStale,
      isLoading: false,
    });

    // Background refresh from Supabase — does not block UI
    get().refreshEntitlements();
  },

  refreshEntitlements: async () => {
    const { userId } = get();
    if (!userId) return;

    try {
      const fresh = await fetchAndCacheEntitlements(userId);
      set({
        features: fresh.features,
        gymId: fresh.gymId,
        gymPlan: fresh.gymPlan,
        gymPlanStatus: fresh.gymPlanStatus,
        gymPeriodEnd: fresh.gymPeriodEnd,
        hasMemberPremium: fresh.hasMemberPremium,
        memberPlanStatus: fresh.memberPlanStatus,
        memberPeriodEnd: fresh.memberPeriodEnd,
        activePromotions: fresh.activePromotions,
        cachedAt: fresh.cachedAt,
        isStale: false,
      });
    } catch {
      // Silent — cached data remains valid
    }
  },

  clearEntitlements: async () => {
    await clearEntitlementCache();
    set({
      features: INITIAL_FEATURES,
      gymId: null,
      gymPlan: null,
      gymPlanStatus: null,
      hasMemberPremium: false,
      memberPlanStatus: null,
      activePromotions: [],
      cachedAt: null,
      isStale: false,
      userId: null,
    });
  },

  hasFeature: (feature: Feature) => get().features.has(feature),

  triggerUpgrade: (feature: Feature, period: MemberBillingPeriod = 'monthly') => {
    set({
      upgradeTargetFeature: feature,
      upgradePreselectedPeriod: period,
      upgradeSheetVisible: true,
    });
  },

  dismissUpgradeSheet: () => {
    set({ upgradeSheetVisible: false, upgradeTargetFeature: null });
  },
}));
