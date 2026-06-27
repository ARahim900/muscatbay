# Daily Water Report — Management Briefing & Data-Path Health-Check

**Date:** 2026-06-27
**Status:** Draft — awaiting user review
**Author:** Claude (brainstormed with owner)

## Background

The monthly water subsection was recently reworked to be clearer and more
focused for top management (smarter latest-period defaults, the "Special"
Muscat Bay Community grouping). The owner asked for "a similar approach" on the
**daily** subsection, plus assurance that the backend/database connection is
fully optimised and functioning.

The daily report (`components/water/DailyWaterReport.tsx`) is currently an
**operator** view: a zone/DC selector leading to analytics gauges, a 31-day
trend, and full L3/DC meter tables (searchable, sortable, paginated). It is
technically solid already — it defaults to the latest month that has data,
defaults the day to "yesterday", and holds a live Supabase subscription.

What it lacks is a **top-management** layer: the single screen that answers
"is today normal, and if not, where?" without scanning meter tables.

## Goal

1. Add a **Daily Briefing** band at the top of the daily report — an
   executive summary a manager reads first. Operator detail stays unchanged
   below it.
2. Produce a **read-only health-check** of the daily data path and report
   findings before changing any data-layer code.

## Non-Goals (scope guardrails)

- No new tables, no schema changes, no migrations.
- No changes to the operator L3/DC tables, gauges, or 31-day trend.
- No porting of the monthly charts (KPI/loss/drill-down) into daily — daily is
  a single-day snapshot, a different mental model.
- No silent data-layer changes — health-check findings are reported; only
  owner-approved fixes are applied (each as its own follow-up).

## Key Finding That Shapes the Design

`processReport()` in `components/water/daily-report/inline-shared.tsx` already
returns everything the briefing needs, so **the summary requires zero new
queries** — it is a presentation layer over data already in memory
(`reportData` + `monthData`):

- `grandTotal` — total supply for the selected day (`l2Total + dcTotal`)
- `l2Total`, `l3Total` — zone bulk vs. sum of zone sub-meters
- `dcTotal` — direct-connection total
- `zoneRows[].diff` — per-zone loss (L2 − L3 sum)
- `zoneRows[].isHighLoss` — true when `|diff| > 20` m³

"vs. yesterday" reuses the already-cached `monthData` rows (the full month is
in memory) by recomputing the previous day with the existing
`computeReport(monthData, day - 1)` — still no network call.

## Design

### Component 1 — `DailyBriefing` band

**File:** `components/water/daily-report/inline-briefing.tsx` (new, sits beside
the existing `inline-*` live modules).

**Props:** `{ reportData: ReportData; monthData: SupabaseDailyWaterConsumption[];
selectedDay: number; month: string }` — all already available in
`DailyWaterReport`.

**Placement:** rendered inside the `reportData && (...)` block in
`DailyWaterReport.tsx`, **above** the Zone/DC selector card (around line 339),
so it appears for every zone/DC selection and only when data exists.

**Contents:**

Four KPI tiles, reusing the existing `HierarchyStatCard` (visual parity with
the monthly KPIs):

| Tile | Value | Derivation |
|------|-------|-----------|
| Total Supply Today | `grandTotal` m³ | `reportData.grandTotal` |
| Distribution Loss | `l2Total − l3Total` m³ + % of `l2Total` | derived from existing totals |
| Zones in Alarm | count of `zoneRows.filter(r => r.isHighLoss)` | existing flag |
| vs. Yesterday | Δ% of total supply day-over-day | `computeReport(monthData, day-1).grandTotal` |

A single **verdict line** below the tiles, status-coloured and always paired
with an icon + text label (per the project's color-is-never-alone token rule):

- Green / check: "All zones within tolerance."
- Amber-or-red / alert: "N zones above 20 m³ loss: ZoneA, ZoneB."
  (names come from `zoneRows.filter(isHighLoss).map(zoneName)`)

**Tokens:** status colours from `--status-*`; KPI accent strips reuse the
`HierarchyStatCard` `color` prop with existing chart/module tokens. No inline
hex.

**Edge cases:**
- `selectedDay === 1`: no previous day in the month → "vs. Yesterday" renders
  `—` (not a fabricated 0%). (Cross-month comparison is out of scope.)
- `l2Total === 0`: loss % renders `—` to avoid divide-by-zero.
- Day with partial/null readings: tiles use the same null-handling already in
  `processReport` (nulls coerced per existing rules); no new null policy.

### Component 2 — Daily data-path health-check (read-only)

A written audit delivered to the owner, covering the daily path only:

1. **Index** — the fetch filters `water_daily_consumption` by
   `.eq('month', month)` on every month change. Verify an index exists on
   `month`; flag if a sequential scan is happening.
2. **RLS** — confirm whether the anon-write hole recorded in
   `muscatbay/app/DATABASE_AUDIT.md` applies to `water_daily_consumption`;
   report severity. (Fix, if any, is a separate approved task.)
3. **Reconciliation** — compare daily `grandTotal` for a sample period against
   the monthly total for the same period. The audit notes the water tables do
   not reconcile; quantify the gap so management is not shown two different
   "totals".
4. **Realtime cost** — `useSupabaseRealtime` refetches the whole month on every
   changed row. Confirm acceptable or recommend a debounce.

Output: a findings section appended to (or referenced from) `DATABASE_AUDIT.md`.
No data-layer code changes land under this design without a follow-up approval.

## Data Flow

```
water_daily_consumption (month=eq) ──fetch──> monthData (cached, full month)
monthData + selectedDay ──computeReport──> reportData (ReportData)
                                              │
              ┌───────────────────────────────┼───────────────────────────┐
              ▼                                ▼                           ▼
        DailyBriefing (new)            Zone/DC selector            L3/DC tables
        (reportData + day-1 recompute) (unchanged)                 (unchanged)
```

No new data source; the briefing is a pure function of existing in-memory state.

## Testing

- Unit test the briefing's derived values (loss %, alarm count, day-over-day Δ,
  and the `selectedDay === 1` / `l2Total === 0` edge cases) against a fixture
  `ReportData` — pure-function, no Supabase needed.
- Verify the band renders only inside the `reportData` success branch (not in
  loading/empty/error states).
- Manual: load the daily report, confirm the band matches the totals shown in
  the L3/DC tables for the same day, in both light and dark themes.

## Risks

- **Reconciliation gap is real**: if daily and monthly totals genuinely differ,
  the briefing will make it visible. That is desirable (surfaces a data bug)
  but may prompt a larger data-integrity task — tracked separately, not solved
  here.
- **Token drift**: must use `--status-*` and existing KPI card; avoid inventing
  new colours.

## Out of Scope / Follow-ups

- Any data-integrity remediation surfaced by the health-check.
- Export of the briefing (PDF/print) — possible later.
- Cross-month "vs. yesterday" when day 1 is selected.
