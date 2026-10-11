# Muscat Bay web app — application review (QA, UI/UX, security, dependencies)

**Date:** 2026-10-11 · **Scope:** `muscatbay/app` (routes, components, hooks, lib, functions, actions, `sql/`, `public/sw.js`, satellite engine), plus dependency checks on `mobile/` and `mobile-shell/` · **Method:** clean `npm ci`; `tsc`, ESLint, Vitest and `next build` run; `npm outdated` and `npm audit` on all three packages; static code review in four streams (functional, UI/UX and accessibility, security, dependencies). Every finding below was traced in source; High items were re-verified by hand. Nothing was fixed in this review.

**Not covered:** live data, the logged-in app in a browser, real iPhone/iPad testing, and git history for secrets (the clone is shallow).

Findings marked **(open since 3 Sep)** were already raised in `2026-09-03-technical-audit.md` and have not been closed.

---

## 1. Summary

| Area | Verdict | Headline |
|---|---|---|
| Build health | Good | `tsc` clean · ESLint 0 errors (1 warning) · **555/555 tests pass** · `next build` succeeds (22 routes) |
| Security — dependencies | **Action now** | Next.js 16.2.6 carries **1 critical + several high advisories**; fixed in 16.4.0 |
| Security — application | Good | Database access rules (RLS) are sound; 2 medium, 6 low findings |
| Functional correctness | Needs work | 3 high issues, two of which breach the "never fabricate data" rule |
| UI / UX | Needs work | Failed reads shown as zeros on 4 pages; design-system migration stalled after Water |
| Accessibility | Needs work | Focus rings missing on Water filters; teal text fails contrast in light mode |
| Engineering process | **Gap** | No CI: nothing runs tests, lint or build on a pull request; no dependency alerts |

## 2. Priority action plan

| Priority | Action | Effort |
|---|---|---|
| **P0 — this week** | Upgrade `next` + `eslint-config-next` to 16.4.0 and run `npm audit fix` (§7.1) | 1 hour + regression check |
| **P0** | Clear the page cache and alert state on sign-out (§3, F2) — shared control-room tablets | Small |
| **P1** | Stop turning failed / missing readings into 0: STP entity, readers that return `[]`, KPI tiles after a failed read (§3 F1, F3; §5 U1) | Medium |
| **P1** | Add a CI workflow: `tsc`, ESLint, Vitest, `next build` on every PR; enable Dependabot security alerts (§8) | Small |
| **P1** | Escape the asset search text (§3 F9 / §4 S5) — commas and brackets break the register today | Small |
| **P2** | Debounce realtime refetches and ignore out-of-order responses (§3 F4, F5, F12) | Medium |
| **P2** | Focus rings on Water filters; light-mode teal text contrast (§5 U3, U4) | Small |
| **P2** | Rate-limit / size-limit the public professional-application form; nonce-based CSP (§4 S1, S2) | Medium |
| **P3** | Resume design-system migration (Dashboard next), widen the design lint, delete duplicate primitives | Ongoing |
| **P3** | Routine minor dependency batch (§7.2) | Small |

---

## 3. Functional bugs and performance

| # | Severity | Finding | Where | Failure scenario | Fix |
|---|---|---|---|---|---|
| F1 | **High** | STP readings that were never recorded become 0 | `entities/stp.ts:37-39` (`Number(x) \|\| 0`) | TSE not yet entered for a day with 600 m³ inlet → `lib/operational-alerts.ts` raises a push alert "STP irrigation output stopped"; dashboard totals understated while the day still counts toward the 25-day "complete month" rule | Keep `number \| null`; consumers skip nulls |
| F2 | **High** | One user's data can be shown to the next user on the same browser | `components/auth/auth-provider.tsx:76-82` (client-side `router.push`); `clearPageCache()` is never called outside tests; `hooks/useOperationalAlerts.ts:106,155-157` | Admin signs out on a shared tablet; a water-only contractor signs in and opens /electricity → admin's cached meters shown; silent refresh returns `[]` (RLS) and the empty branch keeps the old data on screen as "live". Alerts likewise keep the previous user's set | Call `clearPageCache()` and reset alert state on sign-out; treat an empty silent refresh as authoritative |
| F3 | **High** | Several readers turn a failed read into `[]` / 0, so no error is shown and the gap is cached | `functions/api/electricity.ts:36-38,63-66,72-75`; `functions/api/stp.ts:27-39`; `functions/api/contractors.ts:444-451`; consumed by `hooks/useDashboardData.ts:323-331,668` and `hooks/useModuleCoverage.ts:121-136` | STP read fails → tiles show "—" with no banner, the incomplete deck is cached; Contractors says "0 service providers registered" with state `ok` | Throw on error (or return `{data, error}`) like the contractors/fire/HVAC readers |
| F4 | Medium | Every realtime row change triggers a full refetch, no debounce **(open since 3 Sep)** | `app/water/page.tsx:191-195` and every module page | A Grafana sync of 300 rows → 300 events × ~14 requests ≈ 4,000 requests per open tablet; responses may land out of order | Trailing debounce (~500 ms) + latest-request guard inside `useSupabaseRealtime` |
| F5 | Medium | Daily water report can show one month's data under another month's label | `components/water/daily-water-report.tsx:260-298,332-336` | Slow Sep response lands after Oct; or Oct fails and the slider redraws Sep figures labelled Oct | Request id; clear `monthData` on error |
| F6 | Medium | Alert engine treats a month-to-date water month as final | `hooks/useOperationalAlerts.ts:129`; `lib/water-monthly-data.ts:384` (`raw ?? 0`) | Early October, meters with no daily row count as 0 → inflated loss → false "critically above target" push | Use `fetchWaterMeters`; skip derived months or incomplete coverage |
| F7 | Medium | Paged reads without a stable sort order | `functions/api/electricity.ts:59-62`; `functions/api/assets.ts:215-218` | Past 1,000 rows a reading can appear twice or not at all | Add `.order('id')` |
| F8 | Medium | STP read capped at 1,000 rows **(open since 3 Sep)** | `functions/api/stp.ts:21-25` (`.limit(1500)` is overridden by the server cap) | After ~1,000 logged days, oldest days drop out of all-time / YTD totals | Page with `.range()` as `functions/api/water.ts` does |
| F9 | Medium | Asset search breaks on commas and brackets | `functions/api/assets.ts:44-50` | Searching `Pump, Zone 3` or `AHU (Main)` → PostgREST rejects the filter → register replaced by an error banner | Escape/quote search values |
| F10 | Medium | Dashboard YTD projection and system loss include a part month | `hooks/useDashboardData.ts:228-244,255-275,603-604` | Nine months + Oct to day 10 counted as ten full months → full-year projection ~6–7% low; unread L3 meters count as 0 → loss inflated | Exclude derived months; flag incomplete L3 coverage |
| F11 | Medium | Re-subscribing a realtime channel of the same name can leave live updates dead | `hooks/useSupabaseRealtime.ts:107,129-136` | Hand-readings toggles `enabled` per month change; reattaching to a leaving channel → `isLive` stays false (timing-dependent) | Unique suffix per subscription, or await `removeChannel` |
| F12 | Low | Dashboard loads can finish out of order | `hooks/useDashboardData.ts:291,688-690` | Older load overwrites newer deck on a slow tablet | Latest-request guard |
| F13 | Low | Electricity page never refreshes on new readings | `app/electricity/page.tsx:195-200` | Only `electricity_meters` is subscribed | Also subscribe `electricity_readings` |
| F14 | Low | Service-worker general cache grows without limit | `public/sw.js:267-271` | Every `?_rsc=` navigation URL is stored; nothing trimmed or purged on sign-out | Network-only for `_rsc`; trim `STATIC_CACHE` |
| F15 | Low | Export filenames can carry yesterday's date | `lib/export-utils.ts:84-87` (`toISOString()` is UTC) | Export between 00:00 and 03:59 Oman time | Use `muscatToday()` |

**Checked and clean:** no `select('*')`; server actions validate input and write with the user's own session; `fetchWaterMeters` and the daily water reader page correctly past 1,000 rows; hand-readings already guards out-of-order responses; Three.js is loaded on demand only on `/login`.

---

## 4. Security

The database access rules (`sql/migrations/20260901_invitation_only_security_and_rls.sql` and later migrations) are the real gate and hold up: role-gated tables, closed defaults, pinned `search_path` on privileged functions, a trigger that blocks self-promotion of `role`. The OAuth `next` redirect, satellite `postMessage` origin checks, the widget bearer key (SHA-256, 256-bit) and the iOS shell's domain allow-list are all sound. No secrets in the current tree.

| # | Severity | Finding | Where | Fix |
|---|---|---|---|---|
| S1 | Medium | Content-Security-Policy allows `'unsafe-inline'` and `'unsafe-eval'` scripts in production; the satellite frame may connect to any HTTPS host | `proxy.ts:21`, `:48`, `:53` | Nonce + `'strict-dynamic'` (supported by Next 16 proxy); drop `unsafe-eval` in production; restrict satellite `connect-src` to its tile hosts |
| S2 | Medium | Public professional-application form can be flooded (anonymous insert, unlimited `TEXT`) | `sql/migrations/20260901_…sql:472,480`; `app/signup/professional/page.tsx:129` | `char_length` limits; route through a server handler with CAPTCHA + rate limit; revoke anon insert |
| S3 | Low | Widget keys never expire and are not revoked on sign-out | `20261006_widget_tokens.sql:11-19`; `widget-pairing.tsx:56-58` | `expires_at`; `revoke_widget_token()`; store key in Keychain on iOS |
| S4 | Low | Callback page accepts tokens from the URL fragment (login CSRF) | `app/auth/callback/page.tsx:313-348` | Remove the implicit-flow branch (PKCE is already used) |
| S5 | Low | Asset search spliced raw into the PostgREST filter; any column sortable; `pageSize` unbounded; raw DB errors returned | `functions/api/assets.ts:45-62`; `actions/assets.ts:17-38` | Escape search; allow-list sort fields; cap page size at 200; generic error text |
| S6 | Low | Satellite tile rewrite is an open relay to Esri for anyone | `next.config.ts:24-29` | Route handler validating z/x/y, session/referer check, rate limit |
| S7 | Low | `/login?error=…` displays attacker-written text in the login card | `app/login/page.tsx:146-152` | Use message codes mapped to fixed text |
| S8 | Low | A user can un-revoke their own widget key | `20261006_widget_tokens.sql:38-39` | Allow `revoked_at` only null → timestamp |

**To confirm outside the code:** step 1 of `SECURITY_REMEDIATION.md` (rotate the leaked `service_role` key) is still marked "cannot be verified" — check in the Supabase dashboard.

---

## 5. UI / UX and accessibility

### 5.1 Migration state

| Module | On v2.0 / linted | Arbitrary `x-[…]` | Raw `text-*` sizes | Raw shadow/radius | A failed read looks like |
|---|---|---|---|---|---|
| Water | Yes / yes | 0 | 0 | 0 | Alert with Retry (good) |
| Dashboard | No / no | 31 | 29 | 19 | Full-page alert; "Try again" reloads |
| STP | No / no | 51 | 39 | 20 | Caption; **KPIs show 0** |
| Electricity | No / no | 48 | 41 | 29 | Caption; empty state blames the filters |
| Contractors | No / no | 39 | 74 | 32 | Banner, no Retry; **KPIs show 0** |
| Fire Safety | No / no | 53 | 58 | 29 | Caption; **"Open issues 0" in green** |
| HVAC | No / no | 36 | 47 | 28 | Empty state with Retry (good) |
| Assets | No / no | 25 | 33 | 7 | Caption; **KPIs show 0** |
| Pest Control | No / no | 4 | 5 | 6 | Own timeout + Retry (good) |
| Settings | No / no | 0 | 23 | 15 | n/a |
| `components/shared` + `layout` (every page) | not linted | 129 | 109 | 118 | — |

Raw hex and `blue-500`-style palette classes: effectively zero app-wide. The design lint (`eslint.config.mjs:15-18`) still covers only Water, so nothing stops the other pages drifting further.

### 5.2 Findings

| # | Impact | Finding | Where | Recommendation |
|---|---|---|---|---|
| U1 | **High** | Failed reads render as zeros (breach of non-negotiable #1) | `app/stp/page.tsx:497-571,900`; `app/firefighting/page.tsx:129-131,205`; `app/assets/page.tsx:317-323,418-423`; `app/contractors/page.tsx:628`; Electricity empty states `components/electricity/load-watch.tsx:345-351`, `app/electricity/page.tsx:1028-1031` | Use the HVAC pattern (`app/hvac/page.tsx:162-178`): `role="alert"` empty state with Retry, KPI tiles show "—" |
| U2 | **High** | Demo data unlabelled — `StatusChip` has no "demo" state, so mock STP/Electricity figures appear under "Offline" | `app/stp/page.tsx:216-224`; `app/electricity/page.tsx:149-156`; `components/ui/status-chip.tsx:7` | Add a `demo` state (only reachable when Supabase is not configured) |
| U3 | **High** | Teal `#A1D1D5` text on white is 1.67:1 (WCAG AA needs 4.5:1), ~60 uses in 26 files — incl. the phone bottom-nav active label **(open since 3 Sep)** | `components/layout/bottom-nav.tsx:403-453`; `app/firefighting/page.tsx:394,665`; `app/contractors/page.tsx:742,1067,1137`; `components/shared/findings-register.tsx:368,420` | Light mode: `text-primary` or a dark-teal text token (`--ring` #4A8E93 exists); keep teal for dark mode |
| U4 | **High** | No visible keyboard focus on Water filters and the `DateRangePicker` primitive (WCAG 2.4.7) **(open since 3 Sep)** | `components/ui/date-range-picker.tsx:45`; `components/water/monthly/water-monthly-dashboard.tsx:204,582,1216`; `daily-report/daily-database.tsx:57`; `daily-report/inline-shared.tsx:150,203` | Add `focus-visible:ring-2`; lint against bare `outline-none` |
| U5 | Medium | Migration stalled: Water is the only migrated page since 2 Sep; five card treatments still in use | §5.1 | Migrate Dashboard next; extend lint scope to `components/shared` and `layout` |
| U6 | Medium | Banned patterns still live: tickers on Dashboard and STP (auto-scroll, cannot be paused by touch — WCAG 2.2.2) **(open since 3 Sep)**; "Live" shown twice on Dashboard; "Authenticated" pill in Settings | `app/page.tsx:282-291`; `components/stp/plant-watch.tsx:337`; `app/settings/page.tsx:165-169` | Remove as part of each page's migration |
| U7 | Medium | Duplicate primitives: `hierarchy-stat-card.tsx` (unreferenced); `ui/button` vs `ui/mb-button`; `ui/badge` vs `ui/mb-badge`; `ui/page-header` vs `shared/page-header`; `ui/breadcrumb` vs `shared/breadcrumbs`; three period pickers — one a Water component imported by STP and Electricity | `components/…` | Delete the dead tile; consolidate pairs during migration; move the shared picker out of `components/water/` |
| U8 | Medium | Charts have no text alternative | `components/ui/chart-frame.tsx:44-70`; Water Monthly (9 charts), HVAC, Fire, Zone Watch | Required `summary` prop on `ChartFrame`, rendered as `aria-label` with key figures |
| U9 | Medium | Text below the 11 px floor (62 uses of 8–10 px); deck captions on purple at 3.65–4.07:1 | Fire, HVAC, STP; `components/dashboard/command-deck.tsx:235,249,319` | Use the `text-caption` step; raise opacity to ≥ 0.7 |
| U10 | Medium | Confusing labels: same kWh × tariff figure is "Estimated cost" on one tab and "TOTAL COST" on another; Electricity chip goes "stale" two days into every month because monthly data is dated the 1st | `components/electricity/load-watch.tsx:377`; `app/electricity/page.tsx:669,727-732` | One label ("Estimated cost"); a monthly stale threshold for monthly data |
| U11 | Medium | Fire Safety PPM schedule hard-coded and now stale: "Cycle 3 · ~Aug 2026 · upcoming" still shows on 11 Oct; KPI subtitle "Year 1 · Dec & Apr done" is a literal | `components/firefighting/ppm-programme.ts:75-77`; `app/firefighting/page.tsx:204` | Derive status from today's date or move the schedule to the database (reporting a fact, not task tracking) |
| U12 | Low | Mixed date formats (`dd/MM/yyyy` on STP, `dd MMM yyyy`, `MMM-yy`) and number locales (en-US 52, en-GB 9); CSV headers `m3` vs UI `m³` | `app/stp/page.tsx:1099,1186` and others | One `formatDate` / `formatNumber` in `lib/` |
| U13 | Low | Heading skips (Electricity h1 → h3); unlabelled STP month select; Contractors PDF icon button relies on `title`, ~28 px | `app/electricity/page.tsx:916`; `app/stp/page.tsx:1061`; `app/contractors/page.tsx:1132-1142` | Fix in each page's migration |
| U14 | Low | Hand-readings entry inputs are 36 px on a screen used daily on tablets; the 44 px coarse-pointer rule skips `input`/`textarea` | `components/water/manual-readings/manual-readings-entry.tsx:31`; `app/globals.css:1427-1445` | Extend the rule to inputs |
| U15 | Low | 7 PascalCase files in `components/water/satellite/` break the kebab-case rule | e.g. `SatelliteMap.tsx` | Rename (check `mobile/` imports first) |

**Working well:** skip link, `lang="en"`, global reduced-motion handling (GSAP and Three.js both honour it), 44 px touch floor on touch devices, status cells pair colour with icon and text, consistent table toolbar / sort / pagination / CSV export across modules, breadcrumbs and page titles consistent with the sidebar.

---

## 6. Build and test results

| Check | Result |
|---|---|
| `npx tsc --noEmit` | Pass |
| `npx eslint .` | Pass — 0 errors, 1 warning (`public/satellite/consumption-fallback.js:62`, unused `volume`) |
| `npx vitest run` | **555 / 555 pass** (68 files) |
| `npm run build` | Pass — 22 routes, compiled in ~17 s |
| `npm audit --omit=dev` (web) | **6 vulnerabilities: 1 critical, 4 high, 1 moderate** — all fixable without breaking changes |

---

## 7. Libraries and dependencies

### 7.1 Security — update now

| Package | Installed | Target | Why |
|---|---|---|---|
| `next` | 16.2.6 | **16.4.0** | Critical + high advisories in the 16.2 line, including Server Action denial of service, proxy (middleware) bypass, cache confusion, and SSRF/DoS in image optimisation. The app uses the proxy and Server Actions |
| `eslint-config-next` | 16.2.1 | 16.4.0 | Keep in step with `next` |
| `postcss`, `sharp`, `nanoid`, `source-map-js`, `baseline-browser-mapping` (transitive) | various | via `npm audit fix` | High: PostCSS XSS / file read, libvips/libheif CVEs in `sharp`, DoS issues |

### 7.2 Routine minor/patch updates — low risk, one batch

| Package | Installed → latest | Note |
|---|---|---|
| `react`, `react-dom`, `react-is`, `@types/react*` | 19.2.4 → 19.3.0 | Minor |
| `@supabase/supabase-js` | 2.100.0 → 2.117.3 | Realtime fixes are relevant to F11; keep `mobile/` on the same version |
| `recharts` | 3.8.0 → 3.10.1 | Minor |
| `@base-ui/react` | 1.3.0 → 1.9.0 | Minor; re-check `components/ui/` primitives visually |
| `tailwindcss`, `@tailwindcss/postcss` | 4.2.2 → 4.3.3 | Minor |
| `lucide-react` | 1.0.1 → 1.55.0 | Same major; icon additions |
| `date-fns`, `tailwind-merge`, `@tanstack/react-virtual`, `@radix-ui/react-slider`, `@testing-library/*`, `playwright`, `tsx`, `shadcn` | minor/patch | Routine |
| `vitest` | 4.1.1 → 4.1.11 | Stay on 4.x (5.0 needs `@vitejs/plugin-react` 6, which is pinned) |

### 7.3 Needs a planned upgrade (test first)

| Package | Installed → latest | Risk |
|---|---|---|
| `@supabase/ssr` | 0.9.0 → 0.12.7 | Pre-1.0: minor versions can change the cookie API. Test sign-in, refresh in `proxy.ts`, sign-out and OAuth callback on a preview before merging. Update the CLAUDE.md reference if adopted |
| `dotenv` | 17 → 18 | Used only in `scripts/`; low value |

### 7.4 Hold — pinned by project policy (no change)

| Package | Installed | Latest | Reason held |
|---|---|---|---|
| `typescript` | 5.9.3 | 7.0.2 | CLAUDE.md pin |
| `eslint` | 9.39 | 10.12 | CLAUDE.md pin (plugins) |
| `jsdom` | 27.4 | 29.1 | CLAUDE.md pin (Vitest) |
| `@vitejs/plugin-react` | 5.2 | 6.1 | CLAUDE.md pin |
| `@types/node` | 22 | 26 | Match the Node runtime (22) |

### 7.5 Housekeeping

- `@types/three` and `dotenv` sit in `dependencies`; they belong in `devDependencies`.
- Two primitive libraries (`@base-ui/react` and `@radix-ui/react-slider`, used by one `components/ui/slider.tsx`). Base UI has a slider; consolidate when that component is next touched.

### 7.6 Mobile apps

- `mobile/` and `mobile-shell/` are on Expo SDK 57 and only patch releases behind (e.g. `expo` 57.0.27). Run `npx expo install --fix` in each. **Do not** move `react-native` to 0.87 or `react-native-gesture-handler` to 3.x outside an Expo SDK upgrade.
- `mobile-shell` uses `react-native-webview` 13.16.1 while `mobile/` uses 14.0.1; `npx expo install --check` will say which the SDK expects.
- `mobile/` loads the Inter font; the web app moved to DM Sans on 2026-09-02. Align if the mobile app is meant to match.

---

## 8. Engineering process

- **No CI quality gate.** The only workflow is `project-status-log.yml`. Vercel runs `next build` on deploy, but nothing runs `tsc`, ESLint or Vitest on a pull request, so a red test can reach `main`. Recommendation: one GitHub Actions workflow running `npm ci`, `tsc --noEmit`, `eslint .`, `vitest run`, `next build` (and `mobile` `tsc` when `entities/`, `lib/` or `functions/api/` change).
- **No dependency alerts.** The critical Next.js advisory went unnoticed. Enable Dependabot security alerts (security-only, so it does not create noise).
- **Repository tidiness.** Root holds `water_update_batch_1.sql`, `water_update_batch_2.sql` and `testsprite_tests/`; move to `muscatbay/app/sql/data/` and `docs/` or delete if obsolete.
