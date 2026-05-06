# 19. Entitlement System

## Design Philosophy
The Entitlement System is the gatekeeper of the Viewora experience. It is designed to be **non-punishing**, **emotionally engaging**, and **offline-resilient**.

## The resolver
The core logic resides in `resolveEntitlements.ts`. It takes the current state of a user (their gym's plan and their personal plan) and produces a unique set of enabled features.

### Priority & Merging
- **Personal Premium > Gym Plan**: If a user buys Viewora Plus, they get premium features even if their gym is on the `START` plan.
- **Gym Upgrade**: If a gym moves from `START` to `ACTIVE`, all members immediately gain access to streaks and PR tracking without personal payment.
- **Grace Periods**: The system supports grace periods for expired payments, allowing continued access while reconciliation happens.

## Feature Gating
We use the `PremiumGate` component to wrap UI elements.

### Modes
- `blur`: (Default) Shows the content with a glassmorphism overlay and an invitation to upgrade. This creates curiosity and shows the value of the feature.
- `hide`: For structural elements that should simply not exist for non-premium users (e.g., Coach Dashboards).
- `replace`: Shows an alternative piece of UI for non-premium users.

## Offline Performance
To prevent "feature flickering" on startup, the system:
1. Loads the last known entitlements from **Dexie** (IndexedDB) immediately.
2. Initialises the UI with these cached flags.
3. Performs a background refresh from Supabase.
4. Updates the UI and cache only if changes are detected.

## Real-time Sync
When a payment is processed via Paystack, the webhook updates the Supabase subscription table. The `EntitlementProvider` listens via **Postgres Realtime** and automatically refreshes the local state across all active devices for that user.
