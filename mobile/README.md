# Muscat Bay Operations — mobile

Native (Expo / React Native) client for the Muscat Bay operations dashboard. It
reads the **same Supabase project** as [muscatbay.work](https://muscatbay.work)
and shares that web app's data layer file-for-file.

It is **read-only**. It identifies and displays operational conditions; it does
not create, assign, schedule or close work.

---

## Run it on your phone

This is the only flow that matters right now. Three commands and a QR code.

### 1. Install dependencies

```bash
cd mobile
npm install
```

### 2. Create your `.env`

```bash
cp .env.example .env
```

Then open `mobile/.env` and fill in the two values. **They already exist** — you
are copying them, not creating them:

| Put in `mobile/.env`            | Copy the value from                                                                                              |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `EXPO_PUBLIC_SUPABASE_URL`      | `muscatbay/app/.env.local` → `NEXT_PUBLIC_SUPABASE_URL`, or Vercel → muscatbay → Settings → Environment Variables |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | `muscatbay/app/.env.local` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`, same place on Vercel                                |

Only the prefix differs — Expo only inlines variables that start with
`EXPO_PUBLIC_`. Both are the same project URL and the same public anon key the
website already ships to every browser; the anon key is RLS-scoped and safe on a
device. **Never put the service-role key here.**

These are inlined at bundle time, so **restart `npx expo start` after editing
`.env`**. `.env` is git-ignored.

### 3. Start it and scan

```bash
npx expo start
```

Install **Expo Go** from the App Store / Play Store, then:

- **iOS** — open the Camera app, point it at the QR code in your terminal, tap the banner.
- **Android** — open Expo Go and use "Scan QR code".

Your phone and your computer must be on the same Wi-Fi. If they are not (or the
network blocks it), use `npx expo start --tunnel`.

Sign in with your normal Muscat Bay account. Your role is read from the same
`profiles` table the website uses, so you see the same modules you see on the web.

---

## What works in Expo Go, and what does not

| Capability                                            | Expo Go | Notes                                                                       |
| ----------------------------------------------------- | :-----: | --------------------------------------------------------------------------- |
| Sign in / forgot password / sign out                   |   Yes   | Same Supabase project as the website                                         |
| Dashboard, Alerts, Modules, Lookup, Settings           |   Yes   | Live data, native rendering                                                  |
| Embedded web views (water balance, meter table, …)     |   Yes   | `react-native-webview` is bundled in Expo Go                                 |
| Charts (`react-native-svg`)                            |   Yes   |                                                                              |
| Pull-to-refresh, haptics, safe areas                   |   Yes   |                                                                              |
| Offline/connectivity banner                            |   Yes   | `expo-network`                                                               |
| Face ID / fingerprint app lock                         |   Yes   | Needs biometrics enrolled on the device; falls back to the device passcode   |
| Dark / light theme                                     |   Yes   |                                                                              |
| **Push notifications**                                 | **No**  | Expo Go cannot receive remote notifications from SDK 53+. Needs a dev build. |

The Settings screen states the push limitation on-screen rather than failing
silently, and the toggle is disabled there. Nothing else degrades.

### Forgot-password deep link

For the reset email to come back into the app, add this to the Supabase
dashboard → **Authentication → URL Configuration → Redirect URLs**:

```
muscatbay://auth/reset-password
exp://*/--/auth/reset-password
```

The second entry is what Expo Go uses. Until they are added, the email still
sends but its link opens the website instead of the app.

---

## What is native and what is still the web page

**Native** (real React Native, live Supabase data):

- **Dashboard** — KPI deck across water, electricity, STP and the registers, plus the alert summary.
- **Alerts** — runs `muscatbay/app/lib/operational-alerts.ts` unchanged: water-loss exceedance, contract expiry, STP failures. Severity is always colour **and** icon **and** text.
- **Modules** — all eight domain modules (water, electricity, STP, contractors, HVAC, assets, pest control, fire safety), filtered by your role.
- **Per-module KPI summary** — one screen per module with real figures and charts.
- **Lookup** — search water meters, electricity meters and the asset register.
- **Settings** — theme, biometric lock, notification preference, sign out.

**Still the web page, inside a WebView** — the dense cross-tab pages that have no
honest phone-native form yet:

| View                     | Web path        |
| ------------------------ | --------------- |
| Water monthly balance    | `/water`        |
| Water daily consumption  | `/water?tab=daily` |
| Electricity meter table  | `/electricity`  |
| STP operations log       | `/stp`          |
| Contractor register      | `/contractors`  |
| HVAC PPM findings        | `/hvac`         |
| Asset register           | `/assets`       |
| Pest control (AITable)   | `/pest-control` |

Each one is labelled as a web view on screen. They sign you in automatically by
handing your existing session to the web app's own `/auth/callback` route, so
there is no second login.

---

## How the web app's code is reused

The mobile app **consumes** the web app's TypeScript directly from
`../muscatbay/app` instead of copying it. Nothing under `muscatbay/app` is
modified.

Reused **unchanged** (21 files):

| Path                                       | What it gives the app                          |
| ------------------------------------------ | ---------------------------------------------- |
| `functions/api/{water,electricity,stp,contractors,assets,fire-safety,gulf-expert}.ts` | Every Supabase read |
| `lib/operational-alerts.ts`                | The alert rules engine                         |
| `lib/water-monthly-data.ts`, `lib/water-data.ts` | Water balance maths (A1/A2/A3, zone loss) |
| `lib/rbac.ts`                              | Roles, module visibility                       |
| `lib/validation.ts`                        | Email / password validation                    |
| `entities/*.ts`                            | Row types and transforms                       |

Wiring:

- `tsconfig.json` — `@/*` → `../muscatbay/app/*` (mirrors the web app's own alias so shared modules resolve their internal imports unchanged), `~/*` → `./src/*` for mobile code.
- `metro.config.js` — the same two aliases, plus `watchFolders`, plus a blockList for the web app's `node_modules` and build output.
- `app.config.ts` — `experiments.onDemandFilesystem: false`. **Load-bearing.** SDK 57's on-demand filesystem is scoped to the project root and discards `watchFolders` during `expo export`; with it enabled, every `@/…` import fails as "none of these files exist".

Needed an **adapter** (in `src/adapters/`):

| Web module                     | Why                                                                   | Mobile replacement            |
| ------------------------------ | --------------------------------------------------------------------- | ----------------------------- |
| `functions/supabase-client.ts` | `@supabase/ssr` browser client on `document.cookie` + `NEXT_PUBLIC_*`  | `adapters/supabase-client.ts` — Metro swaps this one leaf module, so the whole API layer above it is untouched |
| `lib/auth.ts`                  | `resetPassword()` uses `window.location.origin`; `uploadAvatar()` takes a DOM `File` | `adapters/auth.ts` |
| `lib/alert-preferences.ts`, `lib/filter-preferences.ts` | Synchronous `localStorage`                    | `lib/settings-store.ts` (AsyncStorage) |
| `lib/status-colors.ts`, `sev()`/`statusFromLoss()` | Return `lucide-react` icons and CSS `var(--…)` strings | `components/ui/status.tsx` — same thresholds, RN colours + `lucide-react-native` icons |
| `lib/utils.ts` (`cn`)          | Also exports web-only helpers                                          | `lib/cn.ts` — same clsx + tailwind-merge |
| `lib/export-utils.ts`, `lib/motion.ts`, `lib/supabase-server.ts` | CSV download, GSAP, `next/headers` | Not used |

Design tokens are transcribed from `muscatbay/app/app/globals.css` into
`src/global.css` (NativeWind CSS variables) and `src/theme/tokens.ts` (JS values
for SVG and navigation). Two tokens differ deliberately: dark `--border` /
`--input` are `rgba(255,255,255,0.1)` on the web and are pre-composited over
`--card` here, because React Native has no equivalent token-level alpha
compositing.

**Fonts:** real Geist and Geist Mono, via `@expo-google-fonts/geist` — the same
faces as the web app. Because Geist ships to React Native as one file per weight,
weight is selected by font family (`font-sans-medium`, `font-sans-semibold`,
`font-sans-bold`) rather than by `fontWeight`.

---

## Verify

```bash
cd mobile
npx tsc --noEmit          # type-checks the mobile app AND the shared web modules
npx expo-doctor           # 2 checks need network access and will fail offline
npx expo export --platform ios   # proves the bundle builds
```

`npx tsc --noEmit` resolves types through `../muscatbay/app`, so
`muscatbay/app/node_modules` must be installed for it to run.

---

# Later

Not needed for Expo Go. Everything below waits on the paid Apple Developer
Program membership.

### Development build (unlocks push notifications)

```bash
npm install -g eas-cli
eas login
eas init                       # writes the EAS project id
eas build --profile development --platform ios
```

Then create the token table in Supabase — `src/lib/push.ts` writes to it and
reports honestly if it is missing:

```sql
create table if not exists public.user_push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  expo_push_token text not null unique,
  platform text not null,
  updated_at timestamptz not null default now()
);
alter table public.user_push_tokens enable row level security;
create policy "own tokens" on public.user_push_tokens
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

### Internal distribution

`eas.json` has `development`, `preview` and `production` profiles, all set to
`distribution: internal` — the app is for one operations team, not the public
App Store. Real internal distribution runs through Apple Business Manager
custom apps or ad-hoc/enterprise provisioning, and none of it is reachable until
the membership is active.

### Icons — what a human must supply

`assets/images/*` are generated from the existing brand assets by
`npm run icons` (needs `python3` + Pillow). Source of truth:
`muscatbay/app/public/mb-logo.png`.

**That master is only 512 × 512.** The 1024 × 1024 store icon is therefore a
Lanczos upscale and is slightly soft. Before any store or enterprise submission,
someone should supply a true 1024 × 1024 export (or re-render the mark from
vector) and drop it in as `assets/images/icon.png`.

Everything else — adaptive icon foreground, splash mark, Android notification
silhouette, favicon — is generated at or below the source resolution and needs
nothing.

### Still to do for 100% native

1. Replace each WebView in the table above with a native screen. The water monthly balance is the hardest (a wide zone × month cross-tab) and should probably become a zone-first drill-down rather than a table.
2. Pest control has no Supabase table at all — records live in AITable. It cannot go native until they are migrated.
3. Realtime subscriptions (the web app has `useSupabaseRealtime`; mobile currently refreshes on pull).
4. `lib/water-data.ts` is imported for `ZONE_CONFIG` and drags its unused hardcoded meter array into the bundle. Harmless (never called) but worth splitting upstream.
