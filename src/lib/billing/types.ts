export type Feature =
  // Core — available on all accounts
  | 'exercise_library'
  | 'exercise_search'
  | 'workout_browsing'
  // START gym plan
  | 'hd_demos'
  | 'offline_viewing'
  | 'favorites'
  // ACTIVE gym plan
  | 'streaks'
  | 'workout_history'
  | 'pr_tracking'
  | 'progress_tracking'
  | 'saved_routines'
  | 'attendance'
  | 'coach_plans'
  | 'reminders'
  | 'badges'
  // ELITE gym plan
  | 'gym_branding'
  | 'coach_dashboards'
  | 'advanced_analytics'
  | 'branch_management'
  | 'member_insights'
  | 'transformation_tracking'
  | 'priority_support'
  // VIEWORA PLUS (member premium)
  | 'ai_recommendations'
  | 'elite_streaks'
  | 'recovery_insights'
  | 'transformation_timelines'
  | 'premium_challenges'
  | 'advanced_progress'
  | 'personalized_insights'
  | 'premium_visualizations'
  | 'advanced_achievements';

export type GymPlan = 'start' | 'active' | 'elite';

export type MemberPlan = 'plus';

export type MemberBillingPeriod = 'weekly' | 'monthly' | 'quarterly';

export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'paused'
  | 'expired';

export type FeatureTier = 'core' | 'start' | 'active' | 'elite' | 'plus';

export type PaymentStatus = 'pending' | 'success' | 'failed' | 'abandoned' | 'reversed';

export interface GymSubscriptionState {
  gymId: string;
  plan: GymPlan;
  status: SubscriptionStatus;
  periodEnd: string | null;
  gracePeriodEnd: string | null;
}

export interface MemberSubscriptionState {
  userId: string;
  plan: MemberPlan;
  billingPeriod: MemberBillingPeriod;
  status: SubscriptionStatus;
  periodEnd: string | null;
  gracePeriodEnd: string | null;
  trialEndsAt: string | null;
}

export interface PromotionState {
  code: string;
  features: Feature[];
  validUntil: string | null;
}

export interface EffectiveEntitlements {
  features: Set<Feature>;
  gymId: string | null;          // primary gym the user belongs to
  gymPlan: GymPlan | null;
  gymPlanStatus: SubscriptionStatus | null;
  gymPeriodEnd: string | null;
  hasMemberPremium: boolean;
  memberPlanStatus: SubscriptionStatus | null;
  memberPeriodEnd: string | null;
  activePromotions: string[];
  cachedAt: string;
  isStale: boolean;
}

export interface PaystackInitData {
  authorization_url: string;
  access_code: string;
  reference: string;
}
