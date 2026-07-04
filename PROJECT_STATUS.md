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

**Last curated review:** 2026-07-03

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
| Tests / checks | Vitest (108 tests), ESLint, `tsc --noEmit`, `next build` — all green as of 2026-07-03 |

Users are operations staff on control-room tablets (dark mode primary) and
executives (dashboard KPIs). Live data — there is no demo mode.

## 2. Module status

| Module | Route | State | Data source | Notes |
|---|---|---|---|---|
| Dashboard (command deck) | `/` | ✅ Live | aggregated from module tables | KPI deck, live ops strip, module status rail; animated hero brand mark since 2026-07-04 — exact-geometry SVG (`components/brand/brand-mark.tsx`, measured from the flat brand master) with GSAP ScrollTrigger choreography (assembly on load, scroll-scrubbed teal light sweep + layer drift, reduced-motion safe); flat mark render at `public/brand/mark-frame.png` doubles as the Higgsfield video start frame |
| Water — Monthly | `/water` (Monthly tab) | ✅ Live, fully dynamic | `water_meters` + `water_monthly_consumption` | Balance A1/A2/A3, zones, buildings, DC, exceptions; months appear automatically (see §3) |
| Water — Daily | `/water` (Daily tab) | ✅ Live, rebuilt 2026-07-04 | `water_daily_consumption`, `water_loss_daily/summary` | Zone-first leak-detection dashboard, 5 sections mirroring Monthly: Zone Watch (looping briefing ticker, severity zone cards, zone×day loss heatmap), Zone Analysis (drill-down + MTD cumulative balance), Direct Connections, Daily Database (meter×day ledger, flags, CSV), Exceptions & Actions (auto register: high loss, negative balance, missing L2, rising-loss signature, spikes, zero-streaks). No daily L1/NAMA account exists, so all daily balances are distribution-level (L2 vs ΣL3) by design; fed by CSV upload / Grafana sync |
| Electricity | `/electricity` | ✅ Live | `electricity_meters` / `electricity_readings` | Monthly readings through Mar-26 loads (see sql/migrations) |
| STP Plant | `/stp` | ✅ Live | `stp_operations` | Daily ops through May-26 loads; 3D plant twin exists only on unmerged PR #21 |
| Assets | `/assets` | ✅ Live | `master_assets_register` | 6-card KPI grid; register table with toolbar (PR #25) |
| Contractors | `/contractors` | ✅ Live | `Contractor_Tracker`, contracts tables | AMC tracking, yearly costs |
| HVAC | `/hvac` | ✅ Live | Gulf Expert tables | Findings/maintenance model — the layout template other modules align to |
| Fire Safety | `/firefighting` | ✅ Live (redesigned 2026-06-30) | `fire_safety_equipment`, `fire_ppm_activities`, `fire_issues_register`, `fire_ppm_contacts` | BEC AMC: 3 PPM cycles × 4 zones; aligned with HVAC layout (PRs #26/#27) |
| Pest Control | `/pest-control` | ✅ Live | pest tables | |
| Firefighting quotes, settings, auth pages | various | ✅ Live | | |

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
