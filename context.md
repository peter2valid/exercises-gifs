# exercises-gifs context

This file is the single visible handoff for future agents working in this repo. Read it first.

## Repository Snapshot

- Repo: `exercises-gifs`
- App name: `supafast-gym-app`
- Branch: `master`
- Default branch: `master`
- Goal of the branch: local-first exercise browser + lightweight workout tracker with a dark, Spotify-like UI
- Current status: build passes

## Product Intent

- Users browse exercises locally, inspect details, and deep-link into a workout flow.
- The app is intentionally offline-friendly and fast on weak networks.
- The UX is split into two stages:
	- `/explore` is the icon-first landing surface.
	- `/explore/browse` is the full browsing/search/results surface.
- The current branch should stay focused on UI, local data, and client-side interaction layers.

## Core Flow

1. `/` redirects to `/home`.
2. `/home` provides the landing page and quick actions.
3. `/explore` shows the muscle/category icon grid only.
4. Clicking an icon goes to `/explore/browse?muscle=...`.
5. `/explore/browse` exposes search, filters, list/grid toggle, and results.
6. Clicking a card goes to `/explore/[id]`.
7. `/explore/[id]` shows exercise detail and deep-links into workout.
8. `/workout` accepts `exerciseId` and drives the workout session UI.
9. `/progress` reads live state from `useWorkoutStore`.

## Data Pipeline

Source of truth:

- `exercises.csv` is the canonical exercise source file.
- `scripts/parse-exercises-to-json.ts` converts the CSV into the generated JSON dataset.
- `data/exercises.json` is the local data used by the UI.

Pipeline shape:

1. CSV data is parsed locally.
2. The parser normalizes records into the JSON shape the app expects.
3. The generated JSON is imported directly by the explore and detail pages.
4. Search, filters, counts, and exercise detail lookups all use that local JSON.

Important data shape:

- Each exercise has fields like `id`, `name`, `bodyPart`, `target`, `equipment`, `instructions`, and `secondaryMuscles`.
- There are about 1323 exercises in the generated dataset.
- Body parts currently used by the app include back, cardio, chest, lower arms, lower legs, neck, shoulders, upper arms, upper legs, and waist.

## Search Pipeline

Search has already been upgraded from a simple substring check.

- The shared search logic lives in `src/lib/search.ts`.
- Search now uses weighted multi-field scoring plus fuzzy typo tolerance.
- Relevance priority is:
	- name
	- target muscle
	- secondary muscles
	- body part
	- equipment
- Search supports exact phrase matches, substring matches, word matches, and Levenshtein-based fuzzy matches.
- The browse page memoizes filtered results so search remains fast across the full dataset.

What to preserve:

- Do not regress search back to a single `includes()` call.
- Keep the ranking behavior stable so the most relevant result appears first.
- Keep the implementation lightweight; this is a local dataset, not a backend search service.

## Route / UI Pipeline

### `/explore`

- Purpose: icon-first entry point.
- It should stay minimal and not turn into the full results page.
- Muscle tiles are used to route users into the browse experience.
- The page references the body-group icon set in `src/assets/icons/bodyparts/`.

### `/explore/browse`

- Purpose: full browsing and filtering surface.
- Supports search, muscle filtering, equipment filtering, and grid/list switching.
- Uses `ExerciseCard` for result rendering.
- Hides the large icon grid when the page is already scoped by a muscle query param.

### `/explore/[id]`

- Purpose: exercise detail page.
- Shows instructions and exercise metadata.
- Deep-links into workout with the selected exercise id.

### `/workout`

- Purpose: workout tracker/session surface.
- It expects query-param-driven state and is split into a server wrapper plus client component.
- The split exists to keep `useSearchParams()` usage safe with Next.js rendering rules.

### `/progress`

- Purpose: live progress/stats view.
- Reads directly from `useWorkoutStore`.
- It is not historical analytics or server-backed reporting.

## Media Pipeline

The app is tuned for slow networks.

- GIFs live in the source `assets/` folder.
- Build/prebuild scripts copy or prepare media into `public/exercise-media/`.
- Posters are generated into `public/exercise-posters/` to give a lightweight first paint.
- `ExerciseCard` uses a poster-first pattern so users see something immediately and the GIF can fade in later.

Key idea:

- Poster images are tiny and load quickly.
- GIFs are expensive and should not block initial rendering.
- The app should remain usable even when network conditions are poor.

## Offline / Caching Pipeline

- A service worker is registered from the app shell in production.
- The service worker uses cache-first behavior for exercise media and a more network-aware strategy for pages.
- The intent is to keep browsing useful when connectivity is unstable.
- Do not add heavy backend assumptions; the app is designed to work primarily from local assets and generated data.

## Build Pipeline

Current build flow:

1. Prebuild prepares public media.
2. Posters are generated or reused.
3. Next.js build runs.
4. Static pages are generated.

Current expectation:

- `npm run build` should succeed.
- Any change that touches search, data, routing, or media should be checked against the build.

## Important Files

- `src/app/explore/page.tsx` - icon-first explore landing page
- `src/app/explore/browse/page.tsx` - searchable browse/results page
- `src/app/explore/[id]/page.tsx` - exercise detail page
- `src/app/workout/page.tsx` - workout server wrapper
- `src/app/workout/WorkoutPageClient.tsx` - workout client flow
- `src/app/progress/page.tsx` - live progress view
- `src/components/ExerciseCard.tsx` - result card and media loading behavior
- `src/lib/search.ts` - weighted + fuzzy search implementation
- `src/store/workoutStore.ts` - Zustand workout state
- `scripts/parse-exercises-to-json.ts` - CSV to JSON parser
- `scripts/prepare-public-media.mjs` - media preparation before build
- `scripts/generate-posters.mjs` - poster generation for slow networks

## Design / UX Notes

- Visual direction: black, glassy, high-contrast, slightly premium.
- Keep the explore landing minimal and deliberate.
- Keep result browsing dense and useful, not decorative.
- Avoid adding unrelated product surfaces like auth, billing, analytics, or external sync.

## Constraints For Future Agents

- This repo is local-first.
- Do not reintroduce Supabase, R2 sync, auth, analytics, or other backend-only machinery for this branch.
- Prefer small, composable changes.
- When in doubt, preserve the existing local data pipeline and performance optimizations.
- If you need to understand the current state fast, start with this file, then inspect the important files listed above.
