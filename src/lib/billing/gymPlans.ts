import type { Feature, GymPlan } from './types';

export const GYM_PLAN_PRICES_KES: Record<GymPlan, number> = {
  start:  1500,
  active: 4500,
  elite:  9500,
};

export const GYM_PLAN_LABELS: Record<GymPlan, string> = {
  start:  'Start',
  active: 'Active',
  elite:  'Elite',
};

// Strict ordering used for tier comparisons
export const GYM_PLAN_ORDER: Record<GymPlan, number> = {
  start:  1,
  active: 2,
  elite:  3,
};

export function gymPlanAtLeast(plan: GymPlan, minimum: GymPlan): boolean {
  return GYM_PLAN_ORDER[plan] >= GYM_PLAN_ORDER[minimum];
}

// Feature sets are cumulative — each plan inherits the previous tier's features
const START_FEATURES: Feature[] = [
  'exercise_library',
  'exercise_search',
  'workout_browsing',
  'hd_demos',
  'offline_viewing',
  'favorites',
];

const ACTIVE_FEATURES: Feature[] = [
  ...START_FEATURES,
  'streaks',
  'workout_history',
  'pr_tracking',
  'progress_tracking',
  'saved_routines',
  'attendance',
  'coach_plans',
  'reminders',
  'badges',
];

const ELITE_FEATURES: Feature[] = [
  ...ACTIVE_FEATURES,
  'gym_branding',
  'coach_dashboards',
  'advanced_analytics',
  'branch_management',
  'member_insights',
  'transformation_tracking',
  'priority_support',
];

export const GYM_PLAN_FEATURES: Record<GymPlan, readonly Feature[]> = {
  start:  START_FEATURES,
  active: ACTIVE_FEATURES,
  elite:  ELITE_FEATURES,
};

// Minimum set granted to all authenticated users regardless of plan/expiry
export const CORE_FEATURES: readonly Feature[] = [
  'exercise_library',
  'exercise_search',
  'workout_browsing',
];
