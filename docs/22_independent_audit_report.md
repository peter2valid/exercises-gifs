# Independent Audit Report — Viewora Platform
**Date:** 2026-05-06  
**Scope:** Billing system, webhook security, UI consistency, offline/sync correctness  
**Verdict: DO NOT SHIP.** Six critical defects found, two of which are exploitable.

---

## Severity Classification

| # | Finding | Severity | Category |
|---|---------|----------|----------|
| 1 | Webhook replay attack — no idempotency guard | **CRITICAL** | Security |
| 2 | Webhook returns HTTP 500 → Paystack retry loop | **CRITICAL** | Security |
| 3 | `payments` insert uses wrong column names → every checkout crashes | **CRITICAL** | Data |
| 4 | `profile_gyms` queried but table doesn't exist in schema | **CRITICAL** | Data |
| 5 | `plan_id` vs `plan` column mismatch — gym subscription upsert always fails | **CRITICAL** | Data |
| 6 | `webhook_events` insert includes nonexistent `status` column | **CRITICAL** | Data |
| 7 | Reconcile: `metadata` null crash — silent unresolved payments | **HIGH** | Reliability |
| 8 | Reconcile: overwrites active subscription with stale billing period | **HIGH** | Business Logic |
| 9 | Unfiltered `gym_subscriptions` Realtime — global fan-out storm | **HIGH** | Performance |
| 10 | `setupForUser` called twice on mount — Realtime channel leak | **HIGH** | Stability |
| 11 | Clock skew causes premature offline lockout | **MEDIUM** | Offline-First |
| 12 | Duplicate API route trees — dead code at `/api/billing/*` | **MEDIUM** | Maintenance |
| 13 | `require('crypto')` — CommonJS in ES module tree | **MEDIUM** | Correctness |
| 14 | String interpolation `{exercise.name}` rendered literally | **MEDIUM** | UI |
| 15 | `blur-md opacity-40` contradicts "soft teaser" design principle | **LOW** | UX |
| 16 | 11 unsafe `as any` casts in entitlementCache.ts | **LOW** | Type Safety |
| 17 | Gym plan casing mismatch: `'START'` vs `'start'` | **LOW** | Logic |

---

## CRITICAL FINDINGS

---

### CRITICAL-1: Webhook Replay Attack — No Idempotency Guard

**File:** `src/app/api/paystack/webhook/route.ts`

```ts
// Current code — no existence check before insert
await supabase.from('webhook_events').insert({
  event_type: event.event,
  payload: event,
  status: 'pending',  // ← also: column doesn't exist (see CRITICAL-6)
});

// Then immediately:
await processSuccessfulPayment(metadata, reference, amount);
```

**The exploit:**  
An attacker who intercepts a single valid webhook delivery can replay it arbitrary times. The HMAC signature verification passes (same payload), no prior-event check is performed, and `processSuccessfulPayment` runs again. Result: a subscription that was already activated gets `upserted` again — harmless in isolation, but combined with CRITICAL-8 (downgrade via old pending payment), this becomes a vector for subscription state corruption.

**The correct guard** (already implemented correctly in `/api/billing/webhook/route.ts`):
```ts
const { data: existing } = await adminSupabase
  .from('webhook_events')
  .select('id')
  .eq('event_id', eventId)
  .maybeSingle();
if (existing) return NextResponse.json({ received: true }); // idempotent no-op
```

**Fix:** The `/api/paystack/webhook/route.ts` must adopt the same check-first pattern before calling `processSuccessfulPayment`. The `event_id` should be `${event.event}:${event.data?.id}`.

---

### CRITICAL-2: Webhook Returns HTTP 500 → Infinite Retry Loop

**File:** `src/app/api/paystack/webhook/route.ts`

```ts
} catch (err: any) {
  console.error('Webhook error:', err);
  return NextResponse.json({ error: err.message }, { status: 500 }); // ← triggers Paystack retry
}
```

Paystack retries any webhook that does not receive an HTTP 2xx response. A transient error (network timeout, Supabase cold start) will cause Paystack to retry the webhook repeatedly. Combined with CRITICAL-1, each retry re-activates a subscription.

**Rule:** Webhook handlers must ALWAYS return 200. Record failures in the audit log for manual reconciliation. The correct `/api/billing/webhook/route.ts` already does this correctly.

---

### CRITICAL-3: Payments Table Insert — Wrong Column Names

**File:** `src/app/api/paystack/checkout/route.ts` (line 31–36)

```ts
await supabase.from('payments').insert({
  user_id: session.user.id,       // Column doesn't exist in schema
  amount: amount * 100,           // Column is 'amount_kobo', not 'amount'
  status: 'pending',
  paystack_reference: checkoutData.reference,
  // Missing NOT NULL columns: reference, subject_type, subject_id
});
```

**Actual payments schema:**
```sql
reference     TEXT UNIQUE NOT NULL,   -- Missing → constraint violation
subject_type  TEXT NOT NULL,          -- Missing → constraint violation
subject_id    TEXT NOT NULL,          -- Missing → constraint violation
amount_kobo   INTEGER NOT NULL,       -- Named differently
```

**Every single checkout call throws a PostgreSQL constraint violation.** The user is redirected to Paystack and pays, but no payment record is created. The reconcile job has no record to query. The audit trail is permanently broken.

---

### CRITICAL-4: `profile_gyms` Table Does Not Exist

**Files:** `src/lib/billing/entitlementCache.ts` (line 46–52), `src/lib/paystack.ts` (line 84)

```ts
// entitlementCache.ts
const { data: profileGyms } = await supabase
  .from('profile_gyms')        // ← Table doesn't exist in billing_schema.sql
  .select('gym_id')
  .eq('profile_id', userId)    // ← Column is 'user_id', not 'profile_id'
  .limit(1);

// paystack.ts (processSuccessfulPayment)
const { data: profileGyms } = await supabase
  .from('profile_gyms')        // ← Same nonexistent table
  .select('gym_id')
  .eq('profile_id', userId)
  .limit(1);
```

The SQL schema creates `gym_memberships` with `user_id`. The code queries `profile_gyms` with `profile_id`. These are different table and column names. Supabase returns an error silently (`data: null`), so `primaryGymId` is always undefined. 

**Result:** No user ever gets gym entitlements. All gym plan features are permanently invisible. Gym subscriptions are never activated for members.

---

### CRITICAL-5: `plan_id` vs `plan` Column Mismatch

**File:** `src/lib/paystack.ts` (line 91–97), `src/lib/billing/entitlementCache.ts` (line 64)

```ts
// processSuccessfulPayment:
await supabase.from('gym_subscriptions').upsert({
  gym_id: primaryGymId,
  plan_id: planId,   // ← Column is 'plan', not 'plan_id'
  ...
});

// entitlementCache.ts:
plan: gymSub.plan_id as any,  // ← Column is 'plan', so gymSub.plan_id is undefined
```

The `gym_subscriptions` table has column `plan TEXT NOT NULL CHECK (plan IN ('start','active','elite'))`. Writing `plan_id` writes to a nonexistent column. Supabase with PostgREST either silently ignores or rejects this. The plan is never persisted. Every gym subscription query returns `undefined` for the plan.

---

### CRITICAL-6: `webhook_events` Insert Has Nonexistent `status` Column

**File:** `src/app/api/paystack/webhook/route.ts` (line 17–21)

```ts
await supabase.from('webhook_events').insert({
  event_type: event.event,
  payload: event,
  status: 'pending',  // ← Schema has 'processed_at', not 'status'
  // Also missing: event_id NOT NULL
});
```

The `webhook_events` schema:
```sql
event_id     TEXT UNIQUE NOT NULL,  -- Missing → constraint violation
processed_at TIMESTAMPTZ,           -- Not 'status'
```

This insert fails with a NOT NULL constraint on `event_id`. Every webhook call throws a DB error, falls to the catch block, and returns 500 (see CRITICAL-2), triggering infinite Paystack retries.

---

## HIGH FINDINGS

---

### HIGH-7: Reconcile — Null Metadata Crash

**File:** `src/app/api/paystack/reconcile/route.ts` (line 43)

```ts
const txData = await verifyTransaction(payment.paystack_reference);

if (txData.status === 'success') {
  await processSuccessfulPayment(txData.metadata, txData.reference, txData.amount / 100);
  //                             ^^^^^^^^^^^^^^
  //  Paystack does not guarantee metadata on the verify endpoint.
  //  If null, the next line throws:
  //  const { userId, type, planId } = metadata → TypeError: Cannot destructure null
}
```

The error is caught and logged, but the payment stays `pending`. The reconcile job will retry it on the next run — forever. No alert, no escalation path.

---

### HIGH-8: Reconcile Can Downgrade an Active Subscription

**File:** `src/lib/paystack.ts` — `processSuccessfulPayment`

```ts
await supabase.from('user_subscriptions').upsert({
  user_id: userId,
  plan: 'plus',
  billing_period: planId,   // ← Will overwrite existing billing_period
  status: 'active',
  current_period_end: periodEnd.toISOString(),
  ...
}, { onConflict: 'user_id' });
```

**Scenario:**
1. User subscribes to quarterly plan (KES 899) → subscription activated, `billing_period = 'quarterly'`
2. User had a failed weekly checkout from last month → payment sits in `pending` state
3. Reconcile job runs, Paystack verifies the old weekly reference as 'success' (Paystack marks charges as success even for subscriptions)
4. `processSuccessfulPayment` runs with `planId = 'weekly'`
5. Upsert replaces `billing_period = 'quarterly'` with `billing_period = 'weekly'`
6. `current_period_end` = now + 7 days (from weekly calc), overwriting the quarterly end date

The user loses 3 months of access because of a stale reconcile pass. No compensation, no detection.

**Fix:** Before upserting, check if an active subscription with a later `current_period_end` already exists. Only upsert if the new period_end is in the future relative to the existing one.

---

### HIGH-9: Unfiltered `gym_subscriptions` Realtime → Global Fan-Out Storm

**File:** `src/components/billing/EntitlementProvider.tsx` (line 44–51)

```ts
.on('postgres_changes', {
  event: '*',
  schema: 'public',
  table: 'gym_subscriptions',
  // NO filter — fires for ALL gym changes to ALL connected users
}, () => refreshEntitlements())
```

When one gym's subscription changes (e.g., a payment succeeds), every user in the app — regardless of gym — receives this Realtime event and calls `refreshEntitlements()`. With 1,000 active users, that's 1,000 concurrent Supabase queries in seconds.

**Impact:** Supabase free tier rate limits at ~100 requests/second. Even a modest user base will hit 429 errors. Each failed refresh silently falls back to stale cache — invisible to the user, but entitlements stop refreshing.

**Fix:**
```ts
// Filter by the user's gym_id
filter: `gym_id=eq.${userGymId}`,
```
This requires storing `gymId` in the entitlement store after the initial load, which is already available from `EffectiveEntitlements`.

---

### HIGH-10: `setupForUser` Called Twice on Mount — Realtime Channel Leak

**File:** `src/components/billing/EntitlementProvider.tsx` (lines 56–63)

```ts
// Path 1: fires on mount if user is already signed in
supabase.auth.getSession().then(({ data: { session } }) => {
  if (session?.user) setupForUser(session.user.id);
});

// Path 2: Supabase fires SIGNED_IN on initial subscription for already-signed-in user
const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN' && session?.user) {
    setupForUser(session.user.id);  // runs AGAIN
  }
```

`onAuthStateChange` emits `SIGNED_IN` for the existing session on initial subscription. Both paths run within milliseconds of each other. `setupForUser` creates a Realtime channel each time. The `realtimeChannel` variable is overwritten by the second call, so the first channel is never cleaned up — it leaks for the lifetime of the browser tab.

With 3 devices open, each device creates 2 channels (6 total). Each channel makes its own Supabase Realtime WebSocket connection.

**Fix:** Guard with a `isSetup` ref:
```ts
const isSetup = useRef(false);
// Inside setupForUser: if (isSetup.current) return; isSetup.current = true;
```
Or use the `getSession` result directly inside `onAuthStateChange` by checking for the `INITIAL_SESSION` event instead.

---

## MEDIUM FINDINGS

---

### MEDIUM-11: Clock Skew Causes Premature Offline Lockout

**File:** `src/lib/billing/resolveEntitlements.ts`

```ts
function grantsAccess(status, gracePeriodEnd, periodEnd) {
  if (status === 'past_due') {
    const graceTs = gracePeriodEnd ? new Date(gracePeriodEnd).getTime() : ...;
    return graceTs !== null && Date.now() < graceTs;
    //                         ^^^^^^^^^
    //   Uses device clock, not server clock
  }
}
```

If a user's device clock is set to a future date (intentionally or via drift), `Date.now()` returns a time after `gracePeriodEnd` even though real time is within the grace period. The user gets locked out of gym features with no explanation and no recovery path until they connect online (which triggers a server refresh via `fetchAndCacheEntitlements`).

The inverse is also true: a device set to the past would grant access past the actual grace period end.

**Mitigation:** Store `server_time_offset_ms` during each `fetchAndCacheEntitlements` call (compare `Date.now()` to a server timestamp from the response) and apply the offset in `resolveEntitlements`.

---

### MEDIUM-12: Duplicate API Route Trees — Dead Code

The following routes exist and are functional:
- `/api/billing/initialize/route.ts` — correct implementation
- `/api/billing/webhook/route.ts` — correct implementation
- `/api/billing/verify/route.ts` — correct implementation

The following routes were added alongside them and are broken:
- `/api/paystack/checkout/route.ts` — used by UpgradeBottomSheet, but has column mismatches (CRITICAL-3)
- `/api/paystack/webhook/route.ts` — no idempotency, returns 500 (CRITICAL-1, CRITICAL-2, CRITICAL-6)
- `/api/paystack/reconcile/route.ts` — null crash risk (HIGH-7, HIGH-8)

The app now calls the broken routes. The correct routes sit unused. There is no architectural clarity about which set is canonical.

**Recommendation:** Delete `/api/paystack/*`. Use `/api/billing/*` exclusively.

---

### MEDIUM-13: `require('crypto')` — CommonJS in ESM Tree

**File:** `src/lib/paystack.ts` (line 47)

```ts
export function verifyWebhookSignature(payload: string, signature: string) {
  const crypto = require('crypto');  // ← CommonJS require inside ES module
```

This is a dynamic `require()` inside an exported ESM function. In strict ESM environments or if this file is ever bundled for an Edge runtime, this will throw `ReferenceError: require is not defined`. The correct fix matches what `/api/billing/webhook/route.ts` already does:

```ts
import { createHmac } from 'crypto'; // top-level ESM import
```

---

### MEDIUM-14: String Template Literal Bug — `{exercise.name}` Rendered Literally

**File:** `src/app/explore/[id]/page.tsx` (line 175)

```tsx
<PremiumGate 
  feature="advanced_analytics"
  title="Advanced Analytics"
  description="Track your performance trends and strength projections for {exercise.name}."
  //                                                                      ^^^^^^^^^^^^^^
  //  JSX string prop — curly braces are literal characters, not interpolation
>
```

The rendered description shows: `"...for {exercise.name}."` — the variable name, not the exercise name.

**Fix:**
```tsx
description={`Track your performance trends and strength projections for ${exercise.name}.`}
```

---

## LOW FINDINGS

---

### LOW-15: `blur-md opacity-40 saturate-[0.25]` Contradicts Design Philosophy

**File:** `src/components/billing/BlurOverlay.tsx`

The overlay applies `blur-md` (8px blur) + `opacity-40` + `saturate-[0.25]`. This is an aggressive combination that desaturates and darkens content to near-invisibility. The stated UX principle — "let users sense the value" — requires enough visibility to create desire, not enough obscurity to remove all signal.

Truecaller uses ~`blur-sm opacity-60`. Spotify shows full thumbnails behind a translucent modal. The current implementation is closer to "hidden" than "teased."

**Recommendation:** `blur-sm opacity-50 saturate-[0.5]` — enough to signal locked content, enough to show its value.

---

### LOW-16: Eleven `as any` Casts in `entitlementCache.ts`

**File:** `src/lib/billing/entitlementCache.ts`

```
Line 22: gymPlan: cached.gym_plan as any ?? null
Line 23: gymPlanStatus: cached.gym_plan_status as any ?? null
Line 25: memberPlanStatus: cached.member_plan_status as any ?? null
Line 64: plan: gymSub.plan_id as any,        ← Also wrong column name
Line 65: status: gymSub.status as any,
Line 84: plan: userSub.plan as any || 'plus',
Line 85: billingPeriod: userSub.billing_period as any || 'monthly',
Line 86: status: userSub.status as any,
Line 99: .map((p: any) => ({
```

Each `as any` suppresses a type error that is pointing at a real problem (column name mismatches). These are not "string narrowing" casts — they are silence on broken queries. A properly typed Supabase client (via `supabase gen types`) would surface these errors at compile time.

---

### LOW-17: Gym Plan Casing Mismatch — `'START'` vs `'start'`

**File:** `src/app/api/paystack/checkout/route.ts` (line 19)

```ts
amount = planId === 'START' ? 1500 : planId === 'ACTIVE' ? 4500 : 9500;
```

The `gymPlans.ts` constants and the SQL schema both use lowercase: `'start'`, `'active'`, `'elite'`. If a gym admin selects `plan: 'active'`, the conditional never matches `'ACTIVE'`, so `amount = 9500` (the else branch) regardless of actual plan. Every gym checkout charges the elite price.

---

## Summary Table

### Files That Must Change Before Ship

| File | Action Required |
|------|----------------|
| `src/app/api/paystack/webhook/route.ts` | Delete or rewrite with idempotency + always-200 |
| `src/app/api/paystack/checkout/route.ts` | Delete — use `/api/billing/initialize` |
| `src/app/api/paystack/reconcile/route.ts` | Fix null metadata crash + downgrade protection |
| `src/lib/paystack.ts` | Fix `require('crypto')`, fix `profile_gyms`→`gym_memberships`, fix `plan_id`→`plan`, fix null metadata guard |
| `src/lib/billing/entitlementCache.ts` | Fix `profile_gyms`→`gym_memberships`, `profile_id`→`user_id`, `plan_id`→`plan` |
| `src/components/billing/EntitlementProvider.tsx` | Fix double `setupForUser`, add `gym_id` filter to Realtime |
| `src/components/billing/UpgradeBottomSheet.tsx` | Point to `/api/billing/initialize`, not `/api/paystack/checkout` |
| `src/app/explore/[id]/page.tsx` | Fix string interpolation on line 175 |

### Files That Are Correct and Should Not Be Modified

| File | Status |
|------|--------|
| `src/lib/billing/resolveEntitlements.ts` | CORRECT — pure function, grace logic sound |
| `src/lib/billing/gymPlans.ts` | CORRECT |
| `src/lib/billing/memberPlans.ts` | CORRECT |
| `src/lib/billing/featureRegistry.ts` | CORRECT |
| `src/lib/billing/types.ts` | CORRECT |
| `src/store/entitlementStore.ts` | CORRECT |
| `src/lib/billing/gymPlans.ts` | CORRECT |
| `src/app/api/billing/webhook/route.ts` | CORRECT — idempotent, always-200, proper schema |
| `src/app/api/billing/initialize/route.ts` | CORRECT — proper column names, auth guard |
| `src/app/api/billing/verify/route.ts` | CORRECT |
| `docs/sql/billing_schema.sql` | CORRECT — this is the canonical schema |

---

## Architectural Verdict

The **billing architecture as designed** (the `/api/billing/*` routes, the entitlement resolver, the Dexie cache, the Zustand store) is sound. The resolver correctly handles all 8 required scenarios. The SQL schema is correct. The idempotency model is correct.

The failures come entirely from a subsequent editing pass that:
1. Introduced a parallel, broken route tree (`/api/paystack/*`)
2. Changed table and column names in application code without updating the schema
3. Removed the idempotency guard from the new webhook handler
4. Failed to propagate schema changes through all dependent files

The correct path is to revert the broken routes, fix the column name mismatches in `entitlementCache.ts` and `paystack.ts`, and wire `UpgradeBottomSheet` back to the original `/api/billing/initialize` endpoint.
