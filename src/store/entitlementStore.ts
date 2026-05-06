import { create } from 'zustand';
import type { Feature, GymPlan, SubscriptionStatus, MemberBillingPeriod } from '@/lib/billing/types';
import { loadCachedEntitlements, fetchAndCacheEntitlements, clearEntitlementCache } from '@/lib/billing/entitlementCache';
import { CORE_FEATURES } from '@/lib/billing/gymPlans';

type EntitlementStore = {
  // Resolved effective state
  features: Set<Feature>;
  gymPlan: GymPlan | null;
  gymPlanStatus: SubscriptionStatus | null;
  hasMemberPremium: boolean;
  memberPlanStatus: SubscriptionStatus | null;
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
  gymPlan: null,
  gymPlanStatus: null,
  hasMemberPremium: false,
  memberPlanStatus: null,
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
      gymPlan: cached.gymPlan,
      gymPlanStatus: cached.gymPlanStatus,
      hasMemberPremium: cached.hasMemberPremium,
      memberPlanStatus: cached.memberPlanStatus,
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
        gymPlan: fresh.gymPlan,
        gymPlanStatus: fresh.gymPlanStatus,
        hasMemberPremium: fresh.hasMemberPremium,
        memberPlanStatus: fresh.memberPlanStatus,
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
