import type { Feature, FeatureTier } from './types';

export interface FeatureMeta {
  label: string;
  description: string;
  tier: FeatureTier;
}

export const FEATURE_REGISTRY: Record<Feature, FeatureMeta> = {
  exercise_library:        { label: 'Exercise Library',        description: 'Browse 1,000+ exercises with full details',         tier: 'core'   },
  exercise_search:         { label: 'Exercise Search',         description: 'Find exercises instantly by muscle or equipment',   tier: 'core'   },
  workout_browsing:        { label: 'Workout Browsing',        description: 'Browse curated workout programs',                   tier: 'core'   },
  hd_demos:                { label: 'HD Video Demos',          description: 'High-definition exercise demonstration videos',     tier: 'start'  },
  offline_viewing:         { label: 'Offline Viewing',         description: 'Access all content without internet',               tier: 'start'  },
  favorites:               { label: 'Favorites',               description: 'Save and organise your favourite exercises',        tier: 'start'  },
  streaks:                 { label: 'Streaks',                 description: 'Track your workout consistency streak',             tier: 'active' },
  workout_history:         { label: 'Workout History',         description: 'Review every past workout in full detail',          tier: 'active' },
  pr_tracking:             { label: 'PR Tracking',             description: 'Personal records tracked automatically every set',  tier: 'active' },
  progress_tracking:       { label: 'Progress Tracking',       description: 'See your strength gains over time',                 tier: 'active' },
  saved_routines:          { label: 'Saved Routines',          description: 'Save and reuse your best workout routines',         tier: 'active' },
  attendance:              { label: 'Attendance Check-in',     description: 'Gym check-in tracking and attendance log',          tier: 'active' },
  coach_plans:             { label: 'Coach Plans',             description: 'Follow programs designed by your gym coach',        tier: 'active' },
  reminders:               { label: 'Reminders',               description: 'Smart workout reminders and notifications',         tier: 'active' },
  badges:                  { label: 'Badges',                  description: 'Earn badges for milestones and achievements',       tier: 'active' },
  gym_branding:            { label: 'Gym Branding',            description: 'Custom gym logo and colours throughout the app',    tier: 'elite'  },
  coach_dashboards:        { label: 'Coach Dashboards',        description: 'Detailed per-member analytics for coaches',         tier: 'elite'  },
  advanced_analytics:      { label: 'Advanced Analytics',      description: 'Deep performance insights and gym-wide data',       tier: 'elite'  },
  branch_management:       { label: 'Branch Management',       description: 'Manage multiple gym locations from one account',    tier: 'elite'  },
  member_insights:         { label: 'Member Insights',         description: 'Understand member behaviour and retention risks',   tier: 'elite'  },
  transformation_tracking: { label: 'Transformation Tracking', description: 'Before/after photo-based body transformation log', tier: 'elite'  },
  priority_support:        { label: 'Priority Support',        description: 'Direct 24/7 support line with guaranteed SLA',     tier: 'elite'  },
  ai_recommendations:      { label: 'AI Recommendations',      description: 'Personalised AI-powered workout suggestions',       tier: 'plus'   },
  elite_streaks:           { label: 'Elite Streaks',           description: 'Advanced streak system with real rewards',          tier: 'plus'   },
  recovery_insights:       { label: 'Recovery Insights',       description: 'Smart recovery recommendations based on your load', tier: 'plus'   },
  transformation_timelines:{ label: 'Transformation Timelines','description': 'Visual transformation journey with milestones',  tier: 'plus'   },
  premium_challenges:      { label: 'Premium Challenges',      description: 'Exclusive fitness challenges with leaderboards',    tier: 'plus'   },
  advanced_progress:       { label: 'Advanced Progress',       description: 'Volume, tonnage and periodisation analysis',        tier: 'plus'   },
  personalized_insights:   { label: 'Personalised Insights',   description: 'AI-powered analytics built around your body',      tier: 'plus'   },
  premium_visualizations:  { label: 'Premium Visualisations',  description: 'Beautiful charts and progress dashboards',          tier: 'plus'   },
  advanced_achievements:   { label: 'Advanced Achievements',   description: 'Elite achievement system with rare unlocks',        tier: 'plus'   },
};

export function getFeatureMeta(feature: Feature): FeatureMeta {
  return FEATURE_REGISTRY[feature];
}
