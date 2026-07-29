# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install deps (repo pins some packages; always match Expo SDK version — see "Dependency versions" below)
npm install --legacy-peer-deps

# Dev server
npx expo start
npx expo start --tunnel   # different network / remote testing

# Type check (no dedicated script — run directly)
npx tsc --noEmit

# Lint (script exists in package.json but no eslint config file is present in the repo — running it will fail until one is added)
npm run lint

# Tests (jest-expo preset)
npm test                                    # watch mode (package.json default)
npx jest                                    # single run
npx jest src/__tests__/calculations.test.ts # single file

# EAS builds
eas build --platform android --profile preview     # internal APK
eas build --platform android --profile production  # AAB for Play Store
eas build --platform ios --profile production
```

There is no dedicated `typecheck` npm script — use `npx tsc --noEmit` directly.

## Dependency versions — read before touching package.json

This is an Expo-managed project; native module versions (`expo-*`, and some non-expo packages Expo patches) must match what the installed `expo` SDK expects, not just semver-satisfy package.json. Run `npx expo install --check` after any dependency change and `npx expo install --fix` to correct mismatches. Do not hand-edit versions of `expo-*` packages — use `npx expo install <package>` instead so the SDK-compatible version is selected.

`expo-file-system` has changed its public API shape across recent versions: in the version matching SDK 54 (`~19.x`), `File`/`Paths` are exported from the package root (`expo-file-system`). In `~18.x` they lived under the `expo-file-system/next` subpath. If `tsc` reports missing exports for `File`/`Paths`, check which major version is installed before assuming the import path is wrong — don't guess, check `node_modules/expo-file-system/package.json`.

## Architecture

**Stack:** React Native + Expo SDK 54, Expo Router (file-based routing under `app/`), NativeWind (Tailwind for RN), Zustand (state), SQLite via `expo-sqlite` + Drizzle ORM (typed queries, no raw SQL), Firebase (`@react-native-firebase/*`) for auth + Firestore cloud sync, `react-native-google-mobile-ads` for ads.

**Path aliases** (must stay in sync across three configs — `tsconfig.json` paths, `babel.config.js` module-resolver alias, `jest.config.js` moduleNameMapper): `@/*` → `src/*`, `@db`, `@components`, `@stores`, `@hooks`, `@utils`, `@services`.

### Data flow: SQLite is the source of truth, Firestore is a mirror

The app is offline-first. Every domain store (`src/stores/*Store.ts`) talks directly to Drizzle/SQLite for reads and writes, then separately pushes the same write to Firestore via `src/services/firestore.ts` (`fsUpsert`/`fsDelete`). Nothing waits on the network — Firestore calls are fire-and-forget side effects of local writes. See `src/stores/vehicleStore.ts` for the canonical pattern any new store should follow: `fetchX` reads from `db.select()`, `addX`/`updateX`/`deleteX` mutate SQLite first and update Zustand state from the SQLite result, with the Firestore call layered on top.

`src/services/sync.ts` handles the two full-sync paths: `onLoginSync()` (push all local rows to Firestore, then pull/refresh all stores from local DB after Firestore has caught up) and is invoked on auth state changes. `src/services/realtime.ts` sets up Firestore listeners so a second device's changes propagate into the local stores live; it's started/stopped in `app/_layout.tsx` based on auth state (`startRealtimeSync`/`stopRealtimeSync`).

Firestore layout mirrors the local schema per-user: `users/{uid}/vehicles/{id}`, `users/{uid}/trips/{id}`, etc. — one collection per table in `src/db/schema.ts`.

### Auth gating happens in the root layout, not per-screen

`app/_layout.tsx` runs Drizzle migrations (`useMigrations`), starts the Firebase auth listener (`initAuthListener` from `authStore`), and redirects to `/auth` whenever `user` is null once `initialized` is true — individual tab/screen components don't guard themselves. When adding a new top-level route, register it as a `Stack.Screen` here.

### Database schema (`src/db/schema.ts`)

Five tables: `vehicles`, `trips`, `fuel_entries`, `expenses`, `income_entries`. `expenses` and `income_entries`/`trips` reference `vehicles.id`; `expenses` additionally has an optional `trip_id`. All money/measurement fields are `real`; all timestamps (`createdAt`, `updatedAt`, trip `startTime`/`endTime`, fuel/expense/income `date`) are integer unix seconds, not ms — respect this when formatting or diffing dates (see `src/utils/dateHelpers.ts` / `formatters.ts`). Migrations live in `src/db/migrations/` and are generated via drizzle-kit; `src/db/migrations.ts` is the generated journal consumed by `useMigrations` in the root layout.

### Backup/restore

`src/utils/backup.ts` exports/imports the entire dataset (all 5 tables) as a single JSON file via `expo-file-system` + `expo-sharing` + `expo-document-picker`. Import is destructive: it deletes all local rows for a table before inserting the backup's rows (order matters — children before parents on delete, e.g. `income_entries`/`expenses`/`fuel_entries`/`trips` before `vehicles`, to respect FK references).

### Ads

`react-native-google-mobile-ads` app IDs are configured in two places that must stay consistent: `app.config.js` plugin config (reads `EXPO_PUBLIC_ADMOB_ANDROID_APP_ID`/`EXPO_PUBLIC_ADMOB_IOS_APP_ID` env vars, falling back to Google's test IDs) and the `react-native-google-mobile-ads` key in `package.json`/`app.json` (also test IDs). `src/utils/ads.ts` / `src/components/AdBanner.tsx` request non-personalized ads only (`requestNonPersonalizedAdsOnly: true`).

### Config file duplication

`app.config.js` is the live Expo config (reads env vars); `app.json` is a legacy leftover containing only a stray `react-native-google-mobile-ads` key with no `expo` key — Expo ignores it for app config purposes since `app.config.js` is present, but don't add settings there expecting them to take effect.
