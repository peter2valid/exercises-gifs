# 18. Billing Architecture

## Overview
Viewora uses a hybrid B2B/B2C billing model designed for the Kenyan fitness market. The system manages entitlements through two primary subscription layers: Gym Plans (B2B) and Member Premium (B2C).

## Core Entities

### 1. Gyms (`gyms`)
- Represents a physical gym location or franchise.
- Multi-tenant anchor for all member data and subscriptions.

### 2. Gym Subscriptions (`gym_subscriptions`)
- Linked to a `gym`.
- Plans: `START`, `ACTIVE`, `ELITE`.
- Controls feature access for ALL members of that gym.

### 3. User Subscriptions (`user_subscriptions`)
- Linked to a specific `auth.user`.
- Plan: `VIEWORA PLUS`.
- Allows individual members to unlock premium features regardless of their gym's plan.

### 4. Entitlements
- Computed "Effective Entitlements" based on the union of Gym and User plans.
- Cached locally in Dexie for offline-first reliability.

## Subscription Tiers

### Gym: START (KES 1,500/mo)
- Exercise Library
- HD Demos
- Workout Browsing
- Offline Viewing

### Gym: ACTIVE (KES 4,500/mo)
- Everything in START
- Streaks & Badges
- Workout History & PRs
- Progress Tracking
- Saved Routines
- Coach-created Plans

### Gym: ELITE (KES 9,500/mo)
- Everything in ACTIVE
- Gym Branding
- Coach Dashboards
- Advanced Analytics
- Member Insights
- Transformation Tracking

### Member: VIEWORA PLUS (KES 349/mo)
- AI Technique Analysis
- Recovery Insights
- Advanced Progress Visualisations
- Premium Challenges
- Elite Streaks

## Data Flow
1. User logs in.
2. `EntitlementProvider` fetches current gym and user subscription status.
3. `resolveEntitlements()` merges plans into a flat set of `Feature` flags.
4. UI gates features using `PremiumGate` or `hasFeature()`.
5. Local cache updated in Dexie for zero-latency startup and offline usage.
