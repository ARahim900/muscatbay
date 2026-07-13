# Muscat Bay — Project Status

> **This is the living, single source of truth for the application's current state.**
> An AI session (or a new developer) should read this file FIRST — before exploring
> the codebase — to understand what exists, what state it is in, how data flows,
> and what is in flight.
>
> **How this file stays current**
> - The **Development log** section is appended **automatically** by
>   `.github/workflows/project-status-log.yml` on every push to `main` — every
>   merged change lands there with no human action.
> - The **curated sections** (everything else) are updated by whoever completes a
>   task that changes them: AI sessions are instructed via `CLAUDE.md` to update
>   the relevant section in the same PR as the change itself.
> - Deep reference detail lives in the linked docs at the bottom — this file
>   holds the *current state*, not the full manuals.

**Last curated review:** 2026-07-13

---

## 1. The application at a glance

Utility & facility operations dashboard for **Muscat Bay** (Oman): water,
electricity, STP plant, assets, contractors, HVAC, pest control and fire safety
in one Next.js app backed by Supabase.

| Item | Value |
|---|---|
| Production | **https://muscatbay.work** (aliases: www.muscatbay.work, muscatbay.vercel.app) |
| Deploys | Vercel project `muscatbay`, auto-deploy on push to `main` (root: `muscatbay/app`) |
| Repo | `ARahim900/muscatbay`, default branch `main` |
| Backend | Supabase project `utnlgeuqajmwibqmdmgt` (ap-northeast-1) — Postgres 17, Auth, Realtime |
| Stack | Next.js 16 · React 19 · TypeScript 5 · Tailwind 4 · Recharts 3 · GSAP 3 (+ ScrollTrigger) · shadcn/ui · PWA (service worker `public/sw.js`, cache `muscatbay-v6`) |
| Auth | Supabase email/password; client-side route protection (`components/auth/auth-provider.tsx`); RBAC role column (2026-05-13 migration) |
| Tests / checks | Vitest (156 tests), ESLint, `tsc --noEmit`, `next build` — all green as of 2026-07-10 |

Users are operations staff on control-room tablets (dark mode primary) and
executives (dashboard KPIs). Live data — there is no demo mode.

## 2. Module status

| Module | Route | State | Data source | Notes |
|---|---|---|---|---|
| Dashboard (command deck) | `/` | ✅ Live | aggregated from module tables | KPI deck, live ops strip, module status rail; animated hero brand mark since 2026-07-04 — exact-geometry SVG (`components/brand/brand-mark.tsx`, measured from the flat brand master) with GSAP ScrollTrigger choreography (assembly on load, scroll-scrubbed teal light sweep + layer drift, reduced-motion safe); flat mark render at `public/brand/mark-frame.png` doubles as the Higgsfield video start frame. **2026-07-06:** STP "Treatment Overview" chart now live-syncs from `stp_operations` (table added to the realtime publication — see §3), matching the water chart's auto-update behaviour. The chart mirrors the main STP Plant page — every month plotted as-is (last 8), no dashboard-only completeness filter — so it reflects the same reality as the module page. The standalone asset-count KPI card + "Total Assets" activity item were removed (the deck is water/electricity/STP performance). A sixth hero KPI — **Electricity Cost** (OMR, at the flat 0.025 OMR/kWh tariff) — sits beside Electricity Usage so electricity has a cost figure to match STP's economic-impact card and the deck tiles cleanly again (2×3 / 6-across) instead of a 5-card grid with one empty slot |
| Water — Monthly | `/water` (Monthly tab) | ✅ Live, fully dynamic | `water_meters` + `water_monthly_consumption` | Balance A1/A2/A3, zones, buildings, DC, exceptions; months appear automatically (see §3). **2026-07-06:** Zone Analysis now surfaces the **primary/trunk network (A1→A2)** as a first-class item — the loss *above* every zone that the per-zone drill-downs structurally can't show. It has a top-of-section banner, its own dropdown option + drill-down (KPIs, main-bulk-vs-reached bar, monthly A1-vs-A2 trend, and an A1 reconciliation table of Σ zone-bulk + Σ direct vs main bulk), plus an Exceptions-register row when the A1→A2 gap breaches target or goes negative (A2>A1 → main-meter/timing issue). Live A1→A2 gap has run 0–41% month-to-month (even negative in Jan/Feb-26), so it is material and reading-sensitive. The long tables (A1 reconciliation, individual meters, exceptions register, main database) now carry a **10/20/50/All rows selector** so operators cap what shows instead of scrolling a fixed box (drill-down tables default to 20; the database defaults to All) |
| Water — Daily | `/water` (Daily tab) | ✅ Live, rebuilt 2026-07-04 | `water_daily_consumption`, `water_loss_daily/summary` | Zone-first leak-detection dashboard, 5 sections mirroring Monthly: Zone Watch (looping briefing ticker, severity zone cards, zone×day loss heatmap), Zone Analysis (drill-down + MTD cumulative balance), Direct Connections, Daily Database (meter×day ledger, flags, CSV), Exceptions & Actions (auto register: high loss, negative balance, missing L2, rising-loss signature, spikes, zero-streaks). No daily L1/NAMA account exists, so all daily balances are distribution-level (L2 vs ΣL3) by design; fed by CSV upload / Grafana sync. **2026-07-10:** Zone Analysis L3 meters table now shows the meter **name** (from `meter_name`, e.g. "Building FM", "Irrigation Tank (Z01_FM)") in the Meter column, with the account number kept in the Account column — previously both columns repeated the account number |
| Electricity | `/electricity` | ✅ Live, inspection-first redesign 2026-07-05 | `electricity_meters` / `electricity_readings` | Two tabs (down from three): **Load Watch** (default) — category (meter_type) severity cards worst-first, category×month load heatmap, auto Exceptions & Actions register (per-meter spike/dip/zero/negative/missing vs each meter's own baseline), with KPIs + trend charts kept below; **Meters & Data** (Analysis + Database in one tab). **2026-07-06:** de-duplicated after review — the two near-identical horizontal bar charts (top-10 consumers + meter-vs-average) collapsed into one **Meters by Consumption** chart (ranked high→low, each bar colored above/below the group average with an "Avg" reference line, the filter-selected meter outlined); the two overlapping consumption tables (Monthly Breakdown + the separate anomaly grid) collapsed into one **Meter Consumption & Anomalies** table that follows the shared date range and keeps search + type filter + rows pagination + CSV, now with a Cost column, a Total row and the anomaly tinting on each cell. Monthly readings through Mar-26 |
| STP Plant | `/stp` | ✅ Live, inspection-first redesign 2026-07-05 | `stp_operations` | Two tabs: **Plant Watch** (default) — process-health cards worst-first (efficiency, hydraulic load, TSE reuse, tankers, data completeness), load-vs-recovery chart, metric×day heatmap, auto Exceptions & Actions register (data-relative severity + efficiency bands); **Operations & Trends** keeps the KPIs, charts, daily log/CSV and folds the Airtable DB into a collapsible. Daily ops through May-26; 3D plant twin exists only on unmerged PR #21. `stp_operations` added to the `supabase_realtime` publication 2026-07-06, so both this page and the dashboard now refresh live on data changes (the page already subscribed but the table was unpublished) |
| Assets | `/assets` | ✅ Live | `master_assets_register` | 6-card KPI grid; register table with toolbar (PR #25). **2026-07-10:** first load no longer flashes a false "Demo Data / OFFLINE / all-zero KPIs" state — the status bar shows a neutral "Connecting…" chip and the KPI grid stays skeletoned until the first fetch resolves (`PageStatusBar` gained a `loading` prop); realtime changes refresh the table silently instead of blanking it |
| Contractors | `/contractors` | ✅ Live | `Contractor_Tracker`, contracts tables | AMC tracking, yearly costs. **2026-07-10:** contractor names wrap to two lines with the full name on hover instead of truncating with no affordance (mobile cards wrap fully — touch has no hover) |
| HVAC | `/hvac` | ✅ Live | Gulf Expert tables | Findings/maintenance model — the layout template other modules align to |
| Fire Safety | `/firefighting` | ✅ Live (redesigned 2026-06-30) | `fire_safety_equipment`, `fire_ppm_activities`, `fire_issues_register`, `fire_ppm_contacts` | BEC AMC: 3 PPM cycles × 4 zones; aligned with HVAC layout (PRs #26/#27) |
| Pest Control | `/pest-control` | ✅ Live | pest tables | **2026-07-10:** the AITable embed (cross-origin iframe — internals can't be restyled) now follows the app's light/dark theme via its `theme` param, sits behind a card-surface loading cover until it finishes loading, and gains an "Open full view" header action |
| Firefighting quotes, settings, auth pages | various | ✅ Live | | |

**2026-07-10 — cross-module UX/perf pass** (applies to Dashboard, Water,
Electricity, STP, Contractors, HVAC, Fire Safety, Assets):

- **Instant module switching.** All module pages fetch client-side on mount;
  previously nothing was cached, so every sidebar navigation — including
  returning to a module visited seconds earlier — replaced the page with its
  full skeleton until the fetch resolved (felt like a full reload; links were
  already `next/link`). New `lib/page-cache.ts` (session-scoped
  stale-while-revalidate Map) seeds each page's state on revisit and the mount
  fetch refreshes silently in place. First-ever visits keep the one-time
  skeleton; the brand splash remains initial-app-load only. Sidebar + bottom-nav
  icons swap to a spinner while their navigation is in flight (`useLinkStatus`).
- **Toasts moved top-right** (below the topbar, aria-live, click-through
  wrapper) — they previously sat bottom-right where they covered the last KPI
  card (seen on `/stp` with "STP: High Tanker Activity").
- **KPI labels wrap instead of truncating mid-word** on narrow viewports
  ("WATER PRODUCTI…") — command deck + shared `StatsGrid`.

**2026-07-13 — alert reliability + interface consistency pass** (cross-module):

- **Data-driven operational alerts.** New pure rules engine
  `lib/operational-alerts.ts` (unit-tested) evaluates live data for the three
  operational risk classes and is the single source of truth for "is anything
  wrong": water system loss vs the 15% target (critical zones >25% listed;
  months without an A1/NAMA reading are skipped, never reported as fake loss),
  contract expiry from `Contractor_Tracker` (past End Date while still marked
  Active = critical; within 60 days = warning; rows already marked Expired are
  treated as closed history), and STP critical failures (zero TSE output while
  sewage arrived, recovery under the 90/80% bands, daily log stale >3 days).
  `hooks/useOperationalAlerts.ts` fetches sources, re-evaluates on realtime
  changes + a 30-min clock tick, persists acknowledgements per condition
  fingerprint (localStorage; a new month/day/set re-raises), and fires ONE
  browser push per new warning/critical fingerprint. **Mock data is never
  evaluated** — when live sources are unreachable the feed says monitoring is
  offline/partial instead of pretending health. This closes the core alert
  bug: the app could show "all caught up" while the Water page flagged losses
  28.8 pp above target in red.
- **Alert surfaces.** Shared feed component (`components/alerts/alerts-feed.tsx`)
  renders active alerts (severity icon + module chip + Review link +
  Acknowledge/Reopen) above session notifications, with honest empty/degraded
  states. The mobile Alerts sheet now uses it, and a **new topbar bell**
  (`components/layout/notification-bell.tsx`) gives desktop its first alert
  surface (badge = unacked alerts + unseen session notifications; opening the
  feed marks session items read). Dashboard "Latest Updates" now leads with
  live alerts, so its previously-dead **critical** filter works.
- **Monthly-change calculation standardised.** One shared `lib/trends.ts`
  (`calcTrend`/`describeTrend`) replaced three divergent copies (dashboard
  hook, Electricity page, STP page) that disagreed on neutral labels
  ('0%' vs '—' vs '~0%'); no-baseline (`—`) is now distinguished from
  stable (`~0%`) everywhere, including the dashboard chart insight lines.
- **Dashboard chart time axes aligned.** Both hero charts plot one shared,
  calendar-contiguous last-8-months window (ending at the newest month across
  water + STP); months without a reading render as gaps instead of being
  silently dropped (the missing Jun-26 NAMA month now shows as a gap), and the
  water running-average ignores gap months. KPI subtitles standardised to the
  app-wide `Mon-YY` month format (STP previously showed "Mon YY").
- **Colour usage unified.** `lib/water-monthly-data.ts` was the last rogue
  hex palette: `sev()`/`statusFromLoss()` now resolve the same `--mb-*` status
  tokens as the shared inspection toolkit (plus a `chart` mid-tone for
  bar/border fills), and `TYPECOL` maps to `--chart-*` tokens — Water Monthly
  severity visuals now match STP Plant Watch / Electricity Load Watch and
  theme correctly in light/dark.
- **Settings corrected.** Profile card no longer claims information is
  "public"; the Account tab's stray Save button (it saved *profile* fields) was
  removed; the Notifications tab dropped the fictional email-digest and SMS
  toggles and now shows the real monitored conditions plus a working,
  persisted browser-push preference (`lib/alert-preferences.ts`) and the
  actual browser permission state with an Enable action.

**2026-07-11 — mobile bottom navigation redesign.** The mobile dock
(`components/layout/bottom-nav.tsx`) was rebuilt from the 5-modules-plus-"More"
bar into a floating, rounded **pill** with four tabs — **Overview** (dashboard
link), **Modules**, **Alerts** and **Profile**. Modules/Alerts/Profile open
slide-up sheets rather than navigating: Modules is a 2-column grid of every
operations module (RBAC-filtered, module-accent icons); Alerts renders the
in-app notification feed from `useAppNotifications` with a red unread-count
badge on the bell (plus push-enable prompt + "all caught up" empty state);
Profile carries the account card, a light/dark appearance toggle, Settings and
Sign Out. Because the sidebar is unreachable on phones, these sheets deliberately
expose everything the desktop sidebar does. Theme-aware and token-only (dark
elevated pill / light card pill, teal `--secondary` active state) with
focus-trap + Escape + background-scroll-lock on the sheets. Page bottom padding
(`client-layout.tsx`) was raised to clear the taller floating dock, and the
print stylesheet's stale `nav[aria-label="Primary navigation"]` selector was
corrected to `"Mobile navigation"` so the dock is hidden when printing.

## 3. Water monthly data — how it works now (important)

Rebuilt 2026-07-03 (PRs #29/#30) so that **any monthly value present in the
backend appears in the frontend automatically** — the recurring "dashboard
stops at last month" problem is structurally closed:

- The app reads long-format tables: `water_meters` (registry, 350 meters,
  `meter_id` like `MB-L2-001`) + `water_monthly_consumption`
  (`meter_id, period 'YYYY-MM', consumption`). No month list is hardcoded
  anywhere in the app; no fetch ceiling (device-clock independent).
- The legacy wide sheet **"Water System" is a writable VIEW**: INSERT/UPDATE
  against it (Supabase Studio edits, old Airtable sync scripts,
  `scripts/update-water-data.ts`) fire an INSTEAD OF trigger
  (`water_system_view_write`) that upserts the base tables — auto-registering
  brand-new meters and translating legacy zone/type spellings to clean codes.
- The view **rebuilds itself monthly** (pg_cron job `water-system-view-rebuild`,
  00:10 UTC on the 1st) via `rebuild_water_system_view()`, extending its month
  columns one year past the newest data — new years need no schema work.
- `water_meters` + `water_monthly_consumption` are in the `supabase_realtime`
  publication; the Water page and dashboard hook subscribe to them, so open
  dashboards refresh live when data lands.
- Migration source of truth: `muscatbay/app/sql/migrations/20260703_water_monthly_auto_sync.sql`
  (applied to the live DB as `water_monthly_auto_sync` + `_hardening`).
- Daily data path (unchanged): CSV/Grafana → `water_daily_consumption`
  (GitHub-Actions Grafana sync exists on unmerged PR #6 only).

## 4. Known gaps & data debt

- **June 2026 NAMA main-bulk reading missing** (`C43659`, period `2026-06`) —
  supply shows 0 m³ for June until the bill value is entered; it will appear
  automatically once entered (any surface: view `jun_26` column or base table).
- `Water_System` (underscore) table is an abandoned pre-v2 orphan (columns end
  Feb-26) — not read by anything; candidate for cleanup.
- Supabase security advisors carry pre-existing findings on other tables
  (e.g. RLS disabled on some legacy tables) — water auto-sync objects are clean.
- Monthly loads for electricity/STP still arrive via hand-run SQL in
  `sql/migrations/` — same class of manual step water had before 2026-07-03.
- **STP future-dated row cleared (2026-07-06):** the stray `2027-05-06` row
  (single day, created 2026-06-14) — the only future-dated row, which had made
  the STP charts span to "May-27" — was deleted from `stp_operations`. Because
  the table is fed by an automated Airtable→Supabase daily sync, if that
  erroneous record still exists in the Airtable source it may re-appear; remove
  or correct it there to prevent recurrence. The in-progress current month
  (Jul-26) is legitimate live daily data and is kept as-is — both the dashboard
  and STP Plant charts mirror it (it fills out as more July days are logged).

## 5. In-flight work (open PRs)

- **#28 Senior-management water dashboard** — new default "Management" tab on
  `/water` (YTD KPIs + latest daily snapshot). Active, awaiting review/merge.
- **#21 3D app logo + STP plant twin** — draft; new logo assets + Three.js twin.
- **#6 Grafana → Supabase daily water sync workflow** — draft; needs 7 repo
  secrets before merge (see PR body).
- **#5 / #4** — stale (May-26 daily backfill already applied differently; codex
  lint fixes) — review for close-or-rebase.

## 6. Development log (auto-updated — newest first)

Entries below the marker are appended automatically on every push to `main`.
Do not hand-edit existing entries; curate meaning in the sections above.

<!-- STATUS:LOG:BEGIN -->
- 2026-07-11 — feat(mobile-nav): redesign bottom nav as a floating pill dock
- 2026-07-10 — feat(pest-control): frame AITable embed as a labelled, bounded external panel
- 2026-07-10 — fix(stp): date-range Start/End dropdowns no longer render empty
- 2026-07-10 — feat(perf): instant module switching — session data cache + link pending indicator
- 2026-07-10 — fix(assets): hold loading state until first fetch resolves — no false OFFLINE/zero flash
- 2026-07-10 — feat(pest-control): theme-synced, brand-framed AITable embed
- 2026-07-10 — fix(ui): stop mid-word truncation on contractor names and KPI labels
- 2026-07-10 — fix(ui): anchor toasts top-right below topbar so they never cover KPI cards
- 2026-07-10 — fix(water): show meter name in Zone Analysis L3 table Meter column
- 2026-07-06 — feat(dashboard, electricity): balance hero KPI deck + de-duplicate Meters & Data (#37)
- 2026-07-06 — feat(water): rows-per-page selector for the Monthly tables (#36)
- 2026-07-06 — Dashboard STP live-sync + asset KPI removal + Water A1→A2 trunk-loss view (#35)
- 2026-07-05 — fix(stability): guard sidebar localStorage parse against corrupt values
- 2026-07-05 — fix(stability): add error boundaries + harden STP date parsing
- 2026-07-05 — fix(inspection): make watch card grids fill with no trailing gaps
- 2026-07-05 — refine(inspection): elegant compact health cards + unified briefing ticker
- 2026-07-05 — feat(electricity): inspection-first Load Watch, consolidate to two tabs
- 2026-07-05 — feat(stp): inspection-first Plant Watch with exceptions register
- 2026-07-04 — feat(dashboard): animated brand-mark hero with scroll-driven choreography
- 2026-07-04 — chore(brand): add flat vector-accurate brand mark frame asset
- 2026-07-04 — feat(water): animate the daily briefing strip as a looping news ticker
- 2026-07-04 — refactor(water): collapse daily briefing tiles into one compact strip
- 2026-07-04 — feat(water): rebuild Daily section as zone-first leak-detection dashboard
- 2026-07-03 — Add living PROJECT_STATUS.md + auto-updating development log (#31)
- 2026-07-03 — Water Monthly: clock-proof the fetch window, flush stale client caches (#30)
- 2026-07-03 — Water Monthly: auto-sync any backend data to the dashboard, live (#29)
- 2026-06-30 — Align Fire Safety section with HVAC: 3 subsections, unified styling (#27)
- 2026-06-30 — Fire Safety: rename PPM Tracker to Maintenance, align with HVAC layout (#26)
- 2026-06-30 — Redesign Fire Safety Management around BEC PPM cycles, zones & live data
- 2026-06-30 — Remove DISCIPLINES KPI card from Assets Register (7 → 6 cards)
- 2026-06-30 — Reorganize Assets Register layout: KPI cards up top, search above table (#25)
- 2026-06-27 — feat(ui): unify KPI cards, tables & daily water section app-wide to the monthly standard
- 2026-06-27 — revert(water): restore monthly dashboard to original
- 2026-06-27 — fix(ui,water): review fixes — selected-row hover, STP axis precision, date-picker gaps & cross-year sync
- 2026-06-27 — Fix audit findings + stuck-splash service-worker bug (#24)
- 2026-06-26 — feat(water): rebuild Monthly section with Supabase-wired loss dashboard (#23)
<!-- STATUS:LOG:END -->

## 7. Where the deep detail lives

| Doc | Content | Freshness |
|---|---|---|
| `CLAUDE.md` (root) | Build/run commands, conventions, structure — auto-loaded by AI sessions | maintained |
| `BRAND_DESIGN.md` / `PRODUCT.md` / `muscatbay/app/DESIGN_SYSTEM.md` | Brand, tokens, design principles (BRAND_DESIGN wins conflicts) | stable |
| `muscatbay/app/ARCHITECTURE.md`, `FOLDER_STRUCTURE.md`, `README.md` | Architecture & layout snapshots | 2026-05 snapshot |
| `muscatbay/app/DATABASE_AUDIT.md`, `AUTHENTICATION_AUDIT_REPORT.md` | Point-in-time audits | 2026-06 / earlier |
| `muscatbay/app/sql/migrations/` | Schema & data-load history (files are the DB change log) | append-only |
