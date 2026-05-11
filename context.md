# SUPAFAST / VIEWORA GYM APP — AGENT CONTEXT & CHECKPOINT FILE

> READ THIS FIRST. This is the single source of truth for all agents.
> The old context.md was severely outdated and has been replaced.
> Last updated: 2026-05-11 after full codebase audit.
> Update the STAGE STATUS section every time you complete a stage.
> Log your work in Section 19 (Checkpoint Log) when you finish a stage.

---

## SECURITY NOTICE

**Never store passwords, API keys, JWT secrets, or Paystack secret keys in this file.**
Use `.env.local` for secrets (never committed). Use environment variable names only when listing requirements.
If you see a raw secret in this file, remove it immediately.

---

## 1. PROJECT IDENTITY

| Field | Value |
| --- | --- |
| App name | Supafast (UI brand: Viewora) |
| package.json name | supafast-gym-app |
| Framework | Next.js 15, App Router, Turbopack in dev |
| Language | TypeScript 5.4 |
| Package manager | npm |
| Working branch | feature/mvp-implementation (never edit master directly) |
| Target market | Kenya / Africa (currency: KES, payment: Paystack) |
| Architecture | Offline-first, event-sourced, local IndexedDB + Supabase backend |

---

## 2. WHAT THIS APP IS

A mobile-first gym workout tracker and exercise browser.

Core flow:

```text
/auth → /home → /explore → /explore/browse → /explore/[id] → /workout → /progress
```

Users:

- Browse ~1,323 exercises by muscle group, equipment, or search
- Start a workout session, add exercises, log sets
- Track volume, rest with a timer, finish the session
- View cumulative progress stats
- Eventually: subscribe to gym packages or personal premium

---

## 3. ARCHITECTURE — DO NOT TOUCH THESE

These systems are foundational and should not be rewritten. Extend or fix them carefully only when necessary.

### Event Sourcing Engine

```text
User action
  → createEvent()         src/lib/events/createEvent.ts
  → applyEvent()          src/lib/reducer/applyEvent.ts
  → projectFromEvents()   src/lib/reducer/projectState.ts
  → Writes to Dexie: db.workout_sessions, db.set_logs
  → Zustand store updated with projected state
```

### Dexie Schema (currently v4)

File: `src/lib/db/dexie.ts`

Tables: events, workout_sessions, set_logs, sync_queue, snapshots, templates, template_exercises, exercises, entitlement_cache

RULE: Only add new `this.version(N).stores({...})` blocks. Never modify existing version blocks. Version numbers must only go up.

### Search Engine

File: `src/lib/search.ts`

Algorithm: Weighted scoring (name > target > secondary muscles > body_part > equipment) + Levenshtein fuzzy matching.

RULE: Do not replace with a simple includes() check. Do not remove fuzzy matching.

### Zustand Stores

- `src/store/workoutStore.ts` — workout FSM (idle → active → resting → finished → abandoned)
- `src/store/entitlementStore.ts` — billing/feature access state

### Dexie Seed

File: `src/lib/db/seed.ts`

Reads: `data/exercises.json` (1,323 exercises)

RULE: Always store weight in kg internally. Convert to lbs for display only.

### Design System

File: `src/app/globals.css`

Classes: `.glass-panel`, `.dashboard-bg`, `.btn-base`, `.btn-primary`, `.btn-secondary`, `.scrollbar-hide`, `.grain-overlay`

RULE: Preserve the dark glass premium aesthetic. No white backgrounds, no light mode, no flat design.

---

## 4. STAGE STATUS — UPDATE THIS AS YOU WORK

Format: [ ] = not started, [~] = in progress, [x] = complete

```text
[x] STAGE 1 — Safety setup
    Branch: feature/mvp-implementation created
    Build: passes on master before changes

[x] STAGE 2 — Critical fixes
    [x] Delete public/CS100_Study_Checklist.pdf
    [x] Fix Next.js 15 async params in /explore/[id]/page.tsx
    [x] Hide BottomNav on /auth route
    [x] Remove duplicate equipment toggle button in explore/page.tsx
    [x] Add auth guard to /progress/page.tsx
    [x] npm run build passes

[x] STAGE 3 — Workout flow audit and fixes
    [x] Full manual walk-through passes (see acceptance test below)
    [x] Session restore after page refresh works
    [x] Deep-link from /explore/[id] to /workout?exerciseId= works
    [x] npm run build passes

[ ] STAGE 4 — Home page
    [ ] Greeting shows clean name (e.g. "Hey, Peter" not "peter.smith+gym")
    [ ] "All-Time Volume" label (was "Total Volume")
    [ ] Today's Focus section with Start/Browse buttons
    [ ] Recent Activity section (last 3 sessions or empty state)
    [ ] Quick Actions 2x2 grid
    [ ] npm run build passes

[ ] STAGE 5 — Explore and browse
    [ ] EQUIPMENT_ICON_MAP extracted to src/lib/explore/constants.ts (shared)
    [ ] Stationary bike icon consistent (use Bike, not Activity)
    [ ] Result count label is contextual ("163 Chest Exercises")
    [ ] Empty state shows search query in message
    [ ] Equipment filter verified: dumbbell does not show barbell exercises
    [ ] npm run build passes

[ ] STAGE 6 — Progress page
    [ ] Auth guard added
    [ ] Empty state when no workouts completed
    [ ] Recent Sessions section (last 10)
    [ ] Decorative chart icons removed or made useful
    [ ] npm run build passes

[ ] STAGE 7 — Profile and settings
    [ ] src/lib/settings.ts created (getWeightUnit, convertWeight, displayWeight)
    [ ] Weight unit applies in workout views (suffix, volume display)
    [ ] Weight unit applies in progress page volume label
    [ ] Weight unit applies in home page volume label
    [ ] Subscription card added to profile page
    [ ] npm run build passes

[ ] STAGE 8 — Subscription UI
    [ ] src/app/subscription/page.tsx created
    [ ] UpgradeBottomSheet wired to /api/billing/initialize
    [ ] PremiumGate applied to workout history on progress page
    [ ] Entitlement merge logic verified (gym plan + personal premium)
    [ ] npm run build passes

[ ] STAGE 9 — Admin page
    [ ] src/app/admin/page.tsx created
    [ ] Admin role verified server-side (not client-side)
    [ ] Non-admins see "Access Denied"
    [ ] Gym admin sees: gym name, package, status, member list
    [ ] Upgrade button visible
    [ ] npm run build passes

[ ] STAGE 10 — Paystack connection
    [ ] Environment variables confirmed
    [ ] /api/billing/initialize tested manually
    [ ] /api/billing/verify implemented and tested
    [ ] /api/billing/webhook signature verified
    [ ] Entitlements refresh after payment confirmed
    [ ] Offline entitlement cache tested
    [ ] npm run build passes

[ ] STAGE 11 — Final QA
    [ ] All auth flows
    [ ] All exercise browse flows
    [ ] Full workout flow
    [ ] Subscription gate and upgrade flow
    [ ] Admin access
    [ ] npm run lint passes
    [ ] npm run build passes
    [ ] No red console errors on any page
    [ ] Mobile 375px works
```

---

## 5. ACCEPTANCE TESTS (copy-paste these to verify a stage)

### Stage 3 — Workout flow

```text
1. Sign in
2. Go to /workout
3. Press "Start new workout"
4. Press "Add exercises"
5. Search "bench"
6. Tap "Barbell Bench Press" — "Selected" badge appears
7. Press "Add selected (1)"
8. Tap the exercise in the roster
9. Set Weight: 60, Reps: 5
10. Press "Log set"
11. Roster shows "1 set logged · 60 kg × 5"
12. Session header: Volume = 300 kg, Sets = 1
13. Press "Take rest" — timer starts at 1:30
14. Wait or press "+30s" / "-15s"
15. Press "Back to workout"
16. Press "Finish" (top right, was disabled until set was logged)
17. Summary screen shows: 1 set, 300 kg volume, Barbell Bench Press
18. Navigate to /progress
19. Total Sets = 1, Total Volume = 300 kg

Page refresh test:
Start workout → log 1 set → reload page → session and sets still visible
```

### Stage 4 — Home page

```text
After completing a workout:
1. Go to /home
2. Greeting: "Hey, [clean first name]"
3. This Week: 1 Workout (if done this week)
4. All-Time Volume: 300 kg (or more)
5. Today's Focus section with 2 buttons
6. Recent Activity shows the workout just completed
7. Quick Actions grid has 4 tiles
```

### Stage 7 — Weight unit

```text
1. Go to /profile → Settings
2. Select LBS
3. Go to /workout → start workout → add exercise
4. Weight control suffix shows "lbs"
5. Log 60 "lbs" × 5
6. Go to /progress → Total Volume shown in lbs
7. Go to /profile → Settings → select KG
8. Go to /workout → suffix is "kg" again
```

### Stage 8 — Subscription

```text
1. Go to /subscription
2. See current plan (core features unlocked)
3. Workout history section on /progress is blurred
4. Tap blurred section → UpgradeBottomSheet opens
5. Tap "Upgrade" → redirects to Paystack
6. Complete Paystack test payment
7. Return to app → /subscription shows premium active
8. Workout history section on /progress is no longer blurred
```

---

## 6. FILE MAP — EXACT FILES PER STAGE

```text
STAGE 2 — Critical fixes
  DELETE  public/CS100_Study_Checklist.pdf
  EDIT    src/app/explore/[id]/page.tsx        async params fix
  EDIT    src/components/BottomNav.tsx          hide on /auth
  EDIT    src/app/explore/page.tsx              remove duplicate toggle button
  EDIT    src/app/progress/page.tsx             add auth guard

STAGE 3 — Workout flow
  EDIT    src/app/workout/views.tsx             picker virtual scroll (if needed)
  VERIFY  src/app/workout/WorkoutPageClient.tsx session restore path and deep-link
  VERIFY  src/store/workoutStore.ts             FSM transitions and loadSession()
  VERIFY  src/lib/reducer/projectState.ts       projectFromEvents() integrity
  VERIFY  src/lib/events/createEvent.ts         event construction shape

STAGE 4 — Home page
  EDIT    src/app/home/page.tsx                 full layout update

STAGE 5 — Explore/browse
  EDIT    src/lib/explore/constants.ts          add EQUIPMENT_ICON_MAP export
  EDIT    src/app/explore/page.tsx              import map from constants
  EDIT    src/app/explore/browse/page.tsx       import map, labels, empty state

STAGE 6 — Progress
  EDIT    src/app/progress/page.tsx             auth guard, empty state, recent sessions

STAGE 7 — Profile/settings
  CREATE  src/lib/settings.ts                   getWeightUnit, convertWeight, displayWeight
  EDIT    src/app/workout/views.tsx             apply unit in controls and headers
  EDIT    src/lib/workout/exerciseClassification.ts  unit param in formatWorkoutSet
  EDIT    src/app/progress/page.tsx             apply unit label
  EDIT    src/app/home/page.tsx                 apply unit label
  EDIT    src/app/profile/page.tsx              add subscription card

STAGE 8 — Subscription
  CREATE  src/app/subscription/page.tsx         new subscription page
  EDIT    src/components/billing/UpgradeBottomSheet.tsx  wire to /api/billing/initialize
  EDIT    src/app/progress/page.tsx             PremiumGate on workout history
  EDIT    src/app/profile/page.tsx              link to /subscription

STAGE 9 — Admin
  CREATE  src/app/admin/page.tsx                new admin dashboard (server-verified role)

STAGE 10 — Paystack
  EDIT    src/app/api/billing/verify/route.ts   implement verify logic
  EDIT    src/app/api/billing/webhook/route.ts  signature check + subscription update
```

---

## 7. WHAT ALREADY EXISTS AND WORKS

Do not rebuild these. Verify, then move on.

| System | Location | Status |
| --- | --- | --- |
| Event sourcing engine | src/lib/events/, src/lib/reducer/ | Complete |
| Dexie schema v4 | src/lib/db/dexie.ts | Complete |
| Workout FSM (5 phases) | src/store/workoutStore.ts | Complete |
| Weighted + fuzzy search | src/lib/search.ts | Complete |
| Exercise seeding (1,323) | src/lib/db/seed.ts | Complete |
| Supabase auth | src/app/auth/, src/middleware.ts | Complete |
| Sync push/pull API | src/app/api/sync/ | Complete |
| Billing API routes | src/app/api/billing/ | Present — verify each route before Stage 10 |
| Entitlement store | src/store/entitlementStore.ts | Complete |
| PremiumGate component | src/components/billing/PremiumGate.tsx | Complete |
| UpgradeBottomSheet | src/components/billing/UpgradeBottomSheet.tsx | Complete |
| BlurOverlay | src/components/billing/BlurOverlay.tsx | Complete |
| Feature registry | src/lib/billing/featureRegistry.ts | Complete |
| Gym plans config | src/lib/billing/gymPlans.ts | Complete |
| Member plans config | src/lib/billing/memberPlans.ts | Complete |
| Service worker | public/sw.js | Complete |
| Glass design system | src/app/globals.css | Complete |
| BottomNav | src/components/BottomNav.tsx | Complete |
| ExerciseThumbnail | src/components/ExerciseCard.tsx | Complete |
| SyncWorker | src/lib/sync/SyncWorker.ts | Complete |
| EntitlementProvider | src/components/billing/EntitlementProvider.tsx | Complete |
| Exercise classification | src/lib/workout/exerciseClassification.ts | Complete |

---

## 8. KNOWN BUGS AT AUDIT DATE (2026-05-11)

These are real bugs. Fix them in Stage 2 unless noted.

| # | Bug | File | Stage |
| --- | --- | --- | --- |
| 1 | CS100_Study_Checklist.pdf is in public/ — personal document deployed publicly | public/ | 2 |
| 2 | Next.js 15 async params: `params?.id` accessed synchronously in client component | src/app/explore/[id]/page.tsx | 2 |
| 3 | BottomNav renders on /auth page | src/components/BottomNav.tsx | 2 |
| 4 | Duplicate equipment toggle button in explore landing header | src/app/explore/page.tsx | 2 |
| 5 | /progress has no auth guard | src/app/progress/page.tsx | 2 |
| 6 | Weight unit preference (kg/lbs) saved in Profile but never applied in workout | src/app/workout/views.tsx | 7 |
| 7 | EQUIPMENT_ICON_MAP copy-pasted between two files; stationary bike icon differs | explore/page.tsx, browse/page.tsx | 5 |
| 8 | ExerciseHero component defined but never imported anywhere (dead code) | src/components/ExerciseHero.tsx | cleanup |
| 9 | seedExercises() called independently on every page that loads exercises | multiple pages | low priority |
| 10 | Exercise picker in ActiveView renders 1,323 items without virtual scrolling | src/app/workout/views.tsx | 3 (if slow) |
| 11 | @supabase/auth-helpers-nextjs is deprecated | package.json | post-MVP |
| 12 | @tanstack/react-query, date-fns, @dnd-kit/* installed but never used | package.json | post-MVP |

---

## 9. KEY RULES FOR ALL AGENTS

Read these before touching any file.

### Never do these

- Do not edit the master branch directly
- Do not modify existing Dexie version blocks (only add new ones)
- Do not replace src/lib/search.ts with a simple includes() check
- Do not rewrite the createEvent → applyEvent → projectFromEvents chain
- Do not store weight values in lbs in Dexie (always kg internally)
- Do not grant entitlements from the client based on Paystack redirect response alone
- Do not hide premium features (always blur, not hide)
- Do not add heavy backend calls to the exercise browse flow — it is intentionally local-first
- Do not store any secret, password, API key, or token in this file or in any committed file

### Admin access — server-verified only

The admin role must be verified on the server via Supabase service role queries.
Never gate `/admin` based on a client-side value like a Zustand store flag or localStorage.
The server route or page server component must check the user's role before rendering.
If role check fails, return 403 / redirect to /home — never trust the client for admin claims.

### Always do these

- Run `npm run build` after completing each stage
- Check browser console for red errors after changes
- Use the glass design system classes (.glass-panel, .dashboard-bg) for new UI
- Keep new pages mobile-first with `max-w-md mx-auto px-4`
- Wrap premium features with `<PremiumGate feature="..." mode="blur">` not `mode="hide"`
- Update the STAGE STATUS section of this file when you complete a stage
- Add a row to Section 19 (Checkpoint Log) after completing each stage

### Weight unit rule

Store in kg. Display in user preference. The `getWeightUnit()` function (Stage 7) reads localStorage. Call it at render time in components, never in Dexie writes.

### Entitlement rule

Final access = gym plan features UNION personal premium features.
Never ask users to pay for features already included in their gym's plan.
Core features (exercise_library, exercise_search, workout_browsing) are always free.
Exercise video demos are free — do not gate them with PremiumGate.

---

## 10. ENVIRONMENT VARIABLES REQUIRED

Check `.env.local` before working on auth, billing, or sync stages.

```text
NEXT_PUBLIC_SUPABASE_URL=           required for all Supabase features
NEXT_PUBLIC_SUPABASE_ANON_KEY=      required for all Supabase features
SUPABASE_SERVICE_ROLE_KEY=          required for admin/server routes
MEMBER_QR_SECRET=                   required for QR/billing secret
NEXT_PUBLIC_APP_URL=                required for Paystack callback URLs
PAYSTACK_SECRET_KEY=                required for billing (use sk_test_... in dev)
NEXT_PUBLIC_R2_PUBLIC_URL=          optional — only if media hosted on R2
```

If `NEXT_PUBLIC_SUPABASE_URL` is missing, the app will load but auth and sync will fail silently. Exercise browsing still works (Dexie is seeded from local JSON).

---

## 11. DATA PIPELINE

```text
Source:     exercises.csv (734 KB, raw)
            ↓
Script:     scripts/parse-exercises-to-json.ts  [run manually: npm run db:parse-local]
            ↓
Output:     data/exercises.json (1,323 records, ~24,856 lines)
            ↓
App boot:   seedExercises() → reads exercises.json → bulkPut() into Dexie
            ↓
Queries:    getAllExercises() → Dexie.exercises.toArray() → filter is_active !== false
            getExerciseById(id) → Dexie.exercises.get(id)
            ↓
Search:     searchExercises(exercises, query) → weighted + fuzzy ranking
```

Exercise shape in Dexie:

```ts
{
  id: string           // e.g. "0001", "3294"
  name: string         // e.g. "Barbell Bench Press"
  body_part: string    // e.g. "chest", "back", "cardio", "waist"
  equipment: string    // e.g. "barbell", "dumbbell", "body weight"
  target: string       // e.g. "pectorals", "biceps"
  instructions: string[]
  secondaryMuscles: string[]
  tenant_id: string    // always "default" for seeded data
  is_active: boolean
}
```

---

## 12. MEDIA PIPELINE

```text
Source GIFs:    assets/         (3,303 files — gitignored, not committed)
Source MP4s:    assets_mp4/     (1,323 files — gitignored, not committed)
                ↓
Prebuild:       scripts/prepare-public-media.mjs
                  → deletes public/exercise-media/
                  → copies GIFs from assets/
                  → copies MP4s from assets_mp4/ (adds/overwrites)
                  → runs scripts/generate-posters.mjs
                ↓
Posters:        public/exercise-posters/{id}.jpg  (first frame of each MP4)
Media:          public/exercise-media/{id}.gif + {id}.mp4
                ↓
Runtime:        ExerciseThumbnail component
                  → shows poster immediately via <Image>
                  → loads <video> lazily (IntersectionObserver)
                  → skips video on low-end devices
                  → falls back to gradient if both fail
```

**Important:** `assets/` and `assets_mp4/` are gitignored and not in the repository. They must be provisioned separately on any machine or CI environment before running `npm run build`, which triggers `prebuild` and requires them. If they are missing, the build will fail. Contact the project owner for the media archive location.

---

## 13. ROUTING MAP

```text
/                   → redirects to /home (client-side)
/auth               → sign in / sign up (no BottomNav)
/auth/callback      → OAuth callback route
/home               → dashboard (auth required)
/explore            → muscle + equipment tile grid
/explore/browse     → search + filter + virtual scroll list
/explore/[id]       → exercise detail (video, instructions, Start Workout)
/workout            → full session FSM (auth required)
/progress           → aggregate stats (auth required — add in Stage 2)
/profile            → user settings, sign out (auth required)
/subscription       → plan page (create in Stage 8)
/admin              → gym admin only (create in Stage 9)

API:
POST /api/sync/push         — upload local events to Supabase
GET  /api/sync/pull         — fetch remote events from Supabase
POST /api/billing/initialize — create Paystack transaction
GET  /api/billing/verify    — confirm Paystack payment
POST /api/billing/webhook   — Paystack webhook (server-confirmed)
```

---

## 14. BILLING / SUBSCRIPTION SYSTEM

The billing architecture is present in the codebase. The UI connections are not yet wired (that is Stage 8 and 10 work). Before working on Stage 10, manually verify that each API route (`/api/billing/initialize`, `/api/billing/verify`, `/api/billing/webhook`) responds correctly in your environment — do not assume all routes are fully implemented without testing them.

### Plans

```text
Gym packages (B2B):
  START  → exercise_library, exercise_search, workout_browsing (always free)
  ACTIVE → START + streaks, workout_history, pr_tracking, progress_tracking,
            saved_routines, attendance, coach_plans, reminders, badges
  ELITE  → ACTIVE + gym_branding, coach_dashboards, advanced_analytics,
            branch_management, member_insights, transformation_tracking,
            priority_support

Personal premium (B2C, any user):
  PLUS   → ai_recommendations, elite_streaks, recovery_insights,
            transformation_timelines, premium_challenges, advanced_progress,
            personalized_insights, premium_visualizations, advanced_achievements
```

### Entitlement merge rule

`final_features = gym_plan_features UNION personal_premium_features`

If gym is ACTIVE and user has no personal premium → user gets ACTIVE features free.
If gym is START and user pays for PLUS → user gets START + PLUS features.
Never charge for features already included in the gym plan.

### Key files

```text
src/lib/billing/featureRegistry.ts    — Feature enum + metadata
src/lib/billing/gymPlans.ts           — gym plan → feature sets
src/lib/billing/memberPlans.ts        — member pricing (KES)
src/lib/billing/resolveEntitlements.ts — server-side resolution from Supabase
src/lib/billing/entitlementCache.ts   — Dexie read/write for offline cache
src/store/entitlementStore.ts         — Zustand state + actions
src/components/billing/PremiumGate.tsx — <PremiumGate feature="..." mode="blur">
src/components/billing/UpgradeBottomSheet.tsx — upgrade sheet UI
src/app/api/billing/                  — Paystack API routes
```

### PremiumGate usage pattern

```tsx
// CORRECT — blur mode shows content locked, user can tap to upgrade
<PremiumGate feature="workout_history" title="Workout History" description="Review all your past sessions">
  <RecentSessions />
</PremiumGate>

// WRONG — never use hide mode on content users should know exists
<PremiumGate feature="workout_history" mode="hide">
  <RecentSessions />
</PremiumGate>
```

---

## 15. WORKOUT FSM REFERENCE

States and transitions in `src/store/workoutStore.ts`:

```text
idle
  → startSession() → active

active
  → logSet() → active (stays active, sets update)
  → startRest() → resting
  → completeSession() → finished

resting
  → endRest() → active
  → adjustRest(seconds) → resting (timer adjusts)

finished
  → reset() → idle

abandoned
  (terminal state — no transitions defined in current UI)
```

Session persistence:

- Session ID stored in localStorage via `src/lib/device/identity.ts`
- On page load: `getSavedSessionId()` → `loadSession()` → `projectFromEvents()`
- On complete: `clearSessionId()`
- Roster (exercise list) stored separately in localStorage: `supafast-workout-roster:{sessionId}`

---

## 16. WHAT TO POSTPONE — NOT MVP

Do not start these until Stages 1–11 are complete and marked [x].

```text
- Per-session workout history drill-down page
- Set edit / delete UI (store actions exist, no UI)
- Workout templates (Dexie schema exists, no UI)
- PR tracking
- Streaks engine
- Favorites
- Coach dashboard
- Class schedules / attendance
- Multi-branch admin
- Charts and graphs on progress page
- Push notification reminders
- Cloudflare R2 / CDN media migration
- @supabase/auth-helpers-nextjs → @supabase/ssr migration
- Remove unused packages (react-query, date-fns, dnd-kit)
```

---

## 17. DEFINITION OF DONE — MVP

### Core MVP

The user-facing product is complete when all of these are true:

```text
[ ] User can sign up, sign in, sign out
[ ] /auth does not show BottomNav
[ ] User can browse 1,323 exercises by muscle, equipment, or search
[ ] Search ranks results with fuzzy typo tolerance ("dumbel" finds dumbbell)
[ ] User can view exercise detail with video demo and instructions
[ ] User can start a workout session
[ ] User can add exercises from the picker during a session
[ ] User can log sets (strength: weight+reps, bodyweight: reps, timed: duration)
[ ] User can take a timed rest between sets with a beep alert
[ ] User can finish a workout and see a summary
[ ] Workout session survives a page refresh (event sourcing restore)
[ ] Weight unit preference (kg/lbs) applies across workout, home, and progress
[ ] /progress shows accurate all-time stats and recent sessions
[ ] /subscription page shows current plan and feature list
[ ] Locked premium features are visible but blurred (not hidden)
[ ] Tapping a locked feature opens the upgrade sheet
[ ] All pages work on 375px mobile screen
[ ] Service worker caches exercise media for offline use
```

### Business MVP

The billing integration is complete when all of these are additionally true:

```text
[ ] Paystack test payment flow completes end-to-end
[ ] Entitlements update and persist after payment (including offline cache)
[ ] Gym admin can access /admin — role verified server-side
[ ] Non-admin gets Access Denied on /admin
[ ] npm run lint passes with no errors
[ ] npm run build passes with no TypeScript errors
[ ] No red errors in browser console on any page
```

---

## 18. HOW TO PICK UP WORK AS A NEW AGENT

1. Read this entire file first (you are doing that now)
2. Check STAGE STATUS (section 4) to find the current stage
3. Read the checklist for that stage in the implementation plan
4. Run `git status` to confirm you are on the right branch
5. Run `npm run build` to confirm build is passing before you start
6. Make your changes
7. Run `npm run build` again to confirm nothing broke
8. Update STAGE STATUS in this file (mark completed items [x])
9. Commit with a clear message: `git commit -m "feat(stage-N): description"`
10. Add a row to the Checkpoint Log below (Section 19)

If you are unsure whether something already exists, check the FILE MAP (section 6) and the WHAT ALREADY EXISTS table (section 7) before writing any new code.

If you are unsure about the workout flow, read `src/app/workout/views.tsx` and `src/store/workoutStore.ts` first.

If you are unsure about the billing system, read `src/lib/billing/featureRegistry.ts` and `src/store/entitlementStore.ts` first.

Do not guess. Do not rewrite what already works.

---

## 19. CHECKPOINT LOG

Add one row here each time you complete a stage. Keep it short — one line per stage.

| Date | Agent | Stage | Summary | Build |
| --- | --- | --- | --- | --- |
| 2026-05-11 | claude-sonnet-4-6 | context | Full codebase audit; replaced outdated context.md with this document | N/A |
| 2026-05-11 | claude-sonnet-4-6 | Stage 2 | Deleted CS100 PDF, fixed async params, hid BottomNav on /auth, removed duplicate explore toggle, added auth guard to /progress | ✓ |
| 2026-05-11 | claude-sonnet-4-6 | Stage 3 | Audited full engine chain (no bugs found); added FixedSizeList virtual scroll to exercise picker; restored lastSetId after session reload | ✓ |
