# Daily Water Report Management Briefing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an executive "Daily Briefing" summary band to the top of the daily water report, and produce a read-only health-check of the daily data path.

**Architecture:** A pure function (`computeBriefing`) derives management metrics from the already-computed `ReportData` (no new queries). A dumb presentation component (`DailyBriefing`) renders four KPI tiles via the existing `HierarchyStatCard` plus a status-coloured verdict line. `DailyWaterReport` wires them in above the zone/DC selector. A separate investigative task audits the data path.

**Tech Stack:** Next.js 16, React 19, TypeScript 5, Tailwind 4, Vitest + React Testing Library, Supabase.

## Global Constraints

- No `any` types — use proper TypeScript types.
- No `SELECT *` — this feature adds **zero** Supabase queries; reuse in-memory `reportData` / `monthData`.
- Colours from tokens only — status via `--status-*` (`--status-normal #22c55e`, `--status-warning #f59e0b`, `--status-danger #ef4444`); no inline hex.
- Status is never colour-only — always paired with a lucide icon + text label.
- Both light and dark themes must read correctly.
- Reuse existing primitives: `HierarchyStatCard` (from `daily-report/inline-shared.tsx`), `processReport`, `r2`.
- Tests live in `__tests__/`, run with `npm run test` from `muscatbay/app`.
- Brand: primary `#4E4456`, accent `#A1D1D5`.

---

### Task 1: Pure briefing-metrics function

**Files:**
- Create: `muscatbay/app/components/water/daily-report/briefing-metrics.ts`
- Test: `muscatbay/app/__tests__/components/water/briefing-metrics.test.ts`

**Interfaces:**
- Consumes: `ReportData`, `ZoneRow` (type-only, from `./inline-shared`).
- Produces:
  - `interface BriefingMetrics { totalSupply: number; lossM3: number; lossPct: number | null; alarmCount: number; alarmZones: string[]; vsYesterdayPct: number | null; status: 'normal' | 'warning' }`
  - `function computeBriefing(today: ReportData, yesterday: ReportData | null): BriefingMetrics`

- [ ] **Step 1: Write the failing test**

```ts
// muscatbay/app/__tests__/components/water/briefing-metrics.test.ts
import { describe, it, expect } from 'vitest';
import { computeBriefing } from '@/components/water/daily-report/briefing-metrics';
import type { ReportData, ZoneRow } from '@/components/water/daily-report/inline-shared';

function zone(zoneName: string, diff: number | null, isHighLoss: boolean): ZoneRow {
    return { zoneName, l2Account: 'x', l2Value: 100, l3Sum: 80, diff, isNullL2: false, isHighLoss };
}

function report(over: Partial<ReportData>): ReportData {
    return {
        zoneRows: [], buildingRows: [], dcRows: [],
        l2Total: 0, l3Total: 0, dcTotal: 0, grandTotal: 0,
        ...over,
    };
}

describe('computeBriefing', () => {
    it('derives total supply, loss m³ and loss %', () => {
        const today = report({ l2Total: 1000, l3Total: 850, dcTotal: 200, grandTotal: 1200 });
        const m = computeBriefing(today, null);
        expect(m.totalSupply).toBe(1200);
        expect(m.lossM3).toBe(150);
        expect(m.lossPct).toBe(15);
    });

    it('counts alarm zones and lists their names', () => {
        const today = report({
            l2Total: 1000, l3Total: 850, grandTotal: 1000,
            zoneRows: [zone('Zone_03A', 30, true), zone('Zone_01', 5, false), zone('Zone_05', 40, true)],
        });
        const m = computeBriefing(today, null);
        expect(m.alarmCount).toBe(2);
        expect(m.alarmZones).toEqual(['Zone_03A', 'Zone_05']);
        expect(m.status).toBe('warning');
    });

    it('reports status normal when no zone is in high loss', () => {
        const today = report({ zoneRows: [zone('Zone_01', 5, false)] });
        expect(computeBriefing(today, null).status).toBe('normal');
    });

    it('computes day-over-day percent change when yesterday exists', () => {
        const today = report({ grandTotal: 1100 });
        const yesterday = report({ grandTotal: 1000 });
        expect(computeBriefing(today, yesterday).vsYesterdayPct).toBe(10);
    });

    it('returns null vsYesterdayPct when there is no yesterday (day 1)', () => {
        expect(computeBriefing(report({ grandTotal: 1100 }), null).vsYesterdayPct).toBeNull();
    });

    it('returns null vsYesterdayPct when yesterday total is zero (no divide-by-zero)', () => {
        expect(computeBriefing(report({ grandTotal: 1100 }), report({ grandTotal: 0 })).vsYesterdayPct).toBeNull();
    });

    it('returns null lossPct when l2Total is zero (no divide-by-zero)', () => {
        expect(computeBriefing(report({ l2Total: 0, l3Total: 0 }), null).lossPct).toBeNull();
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd muscatbay/app && npm run test -- briefing-metrics`
Expected: FAIL — cannot resolve `@/components/water/daily-report/briefing-metrics`.

- [ ] **Step 3: Write minimal implementation**

```ts
// muscatbay/app/components/water/daily-report/briefing-metrics.ts
import type { ReportData } from './inline-shared';

/** Round to 2 decimals (local copy — keeps this module free of UI deps). */
const r2 = (v: number) => Math.round(v * 100) / 100;

export interface BriefingMetrics {
    /** Total supply for the selected day (m³). */
    totalSupply: number;
    /** Distribution loss = zone bulk (L2) minus sum of sub-meters (L3), in m³. */
    lossM3: number;
    /** Loss as a percentage of L2 total; null when L2 total is 0. */
    lossPct: number | null;
    /** Number of zones flagged isHighLoss. */
    alarmCount: number;
    /** Names of the zones in alarm, in zone order. */
    alarmZones: string[];
    /** Day-over-day change in total supply (%); null when no comparable yesterday. */
    vsYesterdayPct: number | null;
    /** Overall verdict: 'warning' when any zone is in alarm, else 'normal'. */
    status: 'normal' | 'warning';
}

export function computeBriefing(today: ReportData, yesterday: ReportData | null): BriefingMetrics {
    const lossM3 = r2(today.l2Total - today.l3Total);
    const lossPct = today.l2Total === 0 ? null : r2((lossM3 / today.l2Total) * 100);

    const alarmZones = today.zoneRows.filter(z => z.isHighLoss).map(z => z.zoneName);

    const vsYesterdayPct =
        yesterday && yesterday.grandTotal !== 0
            ? r2(((today.grandTotal - yesterday.grandTotal) / yesterday.grandTotal) * 100)
            : null;

    return {
        totalSupply: today.grandTotal,
        lossM3,
        lossPct,
        alarmCount: alarmZones.length,
        alarmZones,
        vsYesterdayPct,
        status: alarmZones.length > 0 ? 'warning' : 'normal',
    };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd muscatbay/app && npm run test -- briefing-metrics`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add muscatbay/app/components/water/daily-report/briefing-metrics.ts \
        muscatbay/app/__tests__/components/water/briefing-metrics.test.ts
git commit -m "feat(water): pure computeBriefing metrics for daily report"
```

---

### Task 2: DailyBriefing presentation component

**Files:**
- Create: `muscatbay/app/components/water/daily-report/inline-briefing.tsx`
- Test: `muscatbay/app/__tests__/components/water/inline-briefing.test.tsx`

**Interfaces:**
- Consumes: `BriefingMetrics`, `computeBriefing` (Task 1); `HierarchyStatCard` (from `./inline-shared`).
- Produces: `function DailyBriefing(props: { metrics: BriefingMetrics; month: string; day: number }): JSX.Element`

- [ ] **Step 1: Write the failing test**

```tsx
// muscatbay/app/__tests__/components/water/inline-briefing.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DailyBriefing } from '@/components/water/daily-report/inline-briefing';
import type { BriefingMetrics } from '@/components/water/daily-report/briefing-metrics';

const base: BriefingMetrics = {
    totalSupply: 1200, lossM3: 150, lossPct: 15,
    alarmCount: 0, alarmZones: [], vsYesterdayPct: 10, status: 'normal',
};

describe('DailyBriefing', () => {
    it('renders the four KPI labels', () => {
        render(<DailyBriefing metrics={base} month="Mar-26" day={15} />);
        expect(screen.getByText(/Total Supply/i)).toBeInTheDocument();
        expect(screen.getByText(/Distribution Loss/i)).toBeInTheDocument();
        expect(screen.getByText(/Zones in Alarm/i)).toBeInTheDocument();
        expect(screen.getByText(/vs\. Yesterday/i)).toBeInTheDocument();
    });

    it('shows the all-clear verdict when status is normal', () => {
        render(<DailyBriefing metrics={base} month="Mar-26" day={15} />);
        expect(screen.getByText(/within tolerance/i)).toBeInTheDocument();
    });

    it('names the alarm zones when status is warning', () => {
        const m: BriefingMetrics = { ...base, alarmCount: 2, alarmZones: ['Zone_03A', 'Zone_05'], status: 'warning' };
        render(<DailyBriefing metrics={m} month="Mar-26" day={15} />);
        expect(screen.getByText(/Zone_03A/)).toBeInTheDocument();
        expect(screen.getByText(/Zone_05/)).toBeInTheDocument();
    });

    it('renders an em dash for a null vs-yesterday value', () => {
        const m: BriefingMetrics = { ...base, vsYesterdayPct: null };
        render(<DailyBriefing metrics={m} month="Mar-26" day={1} />);
        expect(screen.getByText('—')).toBeInTheDocument();
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd muscatbay/app && npm run test -- inline-briefing`
Expected: FAIL — cannot resolve `inline-briefing`.

- [ ] **Step 3: Write minimal implementation**

```tsx
// muscatbay/app/components/water/daily-report/inline-briefing.tsx
"use client";

import { Droplets, TrendingDown, AlertTriangle, CheckCircle2, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { HierarchyStatCard, n } from "./inline-shared";
import type { BriefingMetrics } from "./briefing-metrics";

/** Format a signed percentage, or em dash when null. */
function pct(v: number | null): string {
    if (v === null) return "—";
    const sign = v > 0 ? "+" : "";
    return `${sign}${v.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

export function DailyBriefing({
    metrics, month, day,
}: {
    metrics: BriefingMetrics;
    month: string;
    day: number;
}) {
    const { totalSupply, lossM3, lossPct, alarmCount, alarmZones, vsYesterdayPct, status } = metrics;

    const isWarning = status === "warning";
    const verdictColor = isWarning ? "var(--status-warning)" : "var(--status-normal)";
    const VerdictIcon = isWarning ? AlertTriangle : CheckCircle2;
    const verdictText = isWarning
        ? `${alarmCount} zone${alarmCount === 1 ? "" : "s"} above tolerance: ${alarmZones.join(", ")}`
        : "All zones within tolerance.";

    const TrendIcon = vsYesterdayPct === null ? null : vsYesterdayPct >= 0 ? ArrowUp : ArrowDown;

    return (
        <section aria-label="Daily briefing" className="space-y-3">
            <div className="flex items-baseline justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Daily Briefing
                </h2>
                <span className="text-xs text-muted-foreground tabular-nums">
                    {month} · Day {day}
                </span>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <HierarchyStatCard
                    label="Total Supply"
                    value={`${n(totalSupply)} m³`}
                    icon={<Droplets className="h-5 w-5" />}
                    color="var(--module-water, #6B9AC4)"
                />
                <HierarchyStatCard
                    label="Distribution Loss"
                    value={lossPct === null ? `${n(lossM3)} m³` : `${n(lossM3)} m³ · ${lossPct.toFixed(1)}%`}
                    icon={<TrendingDown className="h-5 w-5" />}
                    color="var(--status-warning)"
                />
                <HierarchyStatCard
                    label="Zones in Alarm"
                    value={String(alarmCount)}
                    icon={<AlertTriangle className="h-5 w-5" />}
                    color={alarmCount > 0 ? "var(--status-danger)" : "var(--status-normal)"}
                    valueColor={alarmCount > 0 ? "var(--status-danger)" : undefined}
                />
                <HierarchyStatCard
                    label="vs. Yesterday"
                    value={
                        TrendIcon === null
                            ? "—"
                            : pct(vsYesterdayPct)
                    }
                    icon={TrendIcon ? <TrendIcon className="h-5 w-5" /> : <ArrowUp className="h-5 w-5 opacity-30" />}
                    color="var(--status-info)"
                />
            </div>

            <div
                className={cn(
                    "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium",
                )}
                style={{
                    color: verdictColor,
                    borderColor: verdictColor,
                    backgroundColor: isWarning ? "var(--status-warning-bg)" : "var(--status-normal-bg)",
                }}
                role="status"
            >
                <VerdictIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{verdictText}</span>
            </div>
        </section>
    );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd muscatbay/app && npm run test -- inline-briefing`
Expected: PASS (4 tests). Note: the day-1 test passes `vsYesterdayPct: null`, so the "—" appears in the vs-Yesterday tile.

- [ ] **Step 5: Commit**

```bash
git add muscatbay/app/components/water/daily-report/inline-briefing.tsx \
        muscatbay/app/__tests__/components/water/inline-briefing.test.tsx
git commit -m "feat(water): DailyBriefing summary band component"
```

---

### Task 3: Wire DailyBriefing into the daily report

**Files:**
- Modify: `muscatbay/app/components/water/DailyWaterReport.tsx`

**Interfaces:**
- Consumes: `computeBriefing` (Task 1), `DailyBriefing` (Task 2), existing `computeReport`, `reportData`, `monthData`, `selectedDay`, `selectedMonth`.
- Produces: nothing new (integration only).

- [ ] **Step 1: Add imports**

In the import block that pulls the inline modules (after the `inline-states` import, around line 29), add:

```tsx
import { DailyBriefing } from "./daily-report/inline-briefing";
import { computeBriefing } from "./daily-report/briefing-metrics";
```

Also add `useMemo` to the React import on line 3:

```tsx
import { useState, useCallback, useEffect, useMemo } from "react";
```

- [ ] **Step 2: Derive the briefing metrics**

Immediately after the recompute effect (after line 177, the `useEffect` that sets `reportData`), add:

```tsx
    // ── Management briefing: pure derivation from the current report, plus the
    //    previous day recomputed from already-cached month rows (no network). ──
    const briefing = useMemo(() => {
        if (!reportData) return null;
        const yesterday = selectedDay > 1 ? computeReport(monthData, selectedDay - 1) : null;
        return computeBriefing(reportData, yesterday);
    }, [reportData, monthData, selectedDay, computeReport]);
```

- [ ] **Step 3: Render the band above the zone/DC selector**

Inside the `{reportData && ( <> ... )}` block, immediately after the opening `<>` (before the `{/* ── Zone / DC Selector ... */}` Card, around line 341), insert:

```tsx
                    {briefing && (
                        <DailyBriefing metrics={briefing} month={selectedMonth} day={selectedDay} />
                    )}
```

- [ ] **Step 4: Verify build and existing tests still pass**

Run: `cd muscatbay/app && npm run test -- water && npm run build`
Expected: tests PASS; build succeeds with no type errors.

- [ ] **Step 5: Manual verification**

Run: `cd muscatbay/app && npm run dev`, open `/water`, switch to the Daily view.
Confirm:
- The Daily Briefing band appears above the zone selector.
- Total Supply matches the grand total in the L3/DC tables for the same day.
- Selecting Day 1 shows "—" for vs. Yesterday.
- The verdict line shows green "within tolerance" or amber with zone names.
- Both light and dark themes are legible.

- [ ] **Step 6: Commit**

```bash
git add muscatbay/app/components/water/DailyWaterReport.tsx
git commit -m "feat(water): show DailyBriefing band atop the daily report"
```

---

### Task 4: Daily data-path health-check (read-only audit)

**Files:**
- Modify: `muscatbay/app/DATABASE_AUDIT.md` (append a dated "Daily Report Data-Path Health-Check" section)

**Interfaces:** none — investigative deliverable only. No app code changes.

- [ ] **Step 1: Verify the `month` index**

Using the Supabase MCP (`mcp__plugin_supabase__execute_sql`, project `utnlgeuqajmwibqmdmgt`), run:

```sql
select indexname, indexdef from pg_indexes
where tablename = 'water_daily_consumption';
```

Record whether an index covers the `month` column (the daily fetch filters
`.eq('month', month)`). If absent, note the recommended index as a **proposed**
follow-up (do not create it under this task).

- [ ] **Step 2: Check RLS posture**

Run `mcp__plugin_supabase__get_advisors` (type `security`) and:

```sql
select relrowsecurity from pg_class where relname = 'water_daily_consumption';
```

Record whether RLS is enabled and whether the anon role can write (the
`DATABASE_AUDIT.md` note about an anon-write hole). Severity only — no fix here.

- [ ] **Step 3: Reconciliation spot-check**

For one sample month (e.g. the latest populated), compute the daily grand total
for the last populated day and compare against the monthly total shown in the
monthly view for that month. Quantify any gap. Record the numbers.

- [ ] **Step 4: Realtime cost note**

Document that `useSupabaseRealtime` (in `DailyWaterReport.tsx`) refetches the
entire month on every changed row, and recommend whether a debounce is
warranted (based on observed row-change frequency). Recommendation only.

- [ ] **Step 5: Append findings and commit**

Append a section titled `## Daily Report Data-Path Health-Check (2026-06-27)`
to `muscatbay/app/DATABASE_AUDIT.md` with the four findings above, each tagged
`OK` / `WARN` / `ACTION` and, for any `ACTION`, a one-line proposed follow-up.

```bash
git add muscatbay/app/DATABASE_AUDIT.md
git commit -m "docs(water): daily data-path health-check findings"
```

---

## Self-Review

**Spec coverage:**
- Briefing band (4 KPI tiles + verdict) → Tasks 1–3. ✓
- Reuse `processReport`/`HierarchyStatCard`, zero new queries → Task 1 (pure) + Task 2 (reuses card). ✓
- Edge cases `selectedDay === 1` and `l2Total === 0` → Task 1 tests + Task 2 day-1 render test. ✓
- Placement above zone/DC selector, only in success branch → Task 3 Step 3 (inside `reportData &&`). ✓
- Data-path health-check (index, RLS, reconciliation, realtime) → Task 4. ✓
- Non-goals (no schema change, no operator-table edits, no chart port) → respected; Task 4 is read-only. ✓

**Placeholder scan:** No TBD/TODO; all code blocks are complete. ✓

**Type consistency:** `BriefingMetrics` fields (`totalSupply`, `lossM3`, `lossPct`, `alarmCount`, `alarmZones`, `vsYesterdayPct`, `status`) are identical across Tasks 1, 2, 3. `computeBriefing(today, yesterday)` signature matches its call in Task 3. `HierarchyStatCard` props (`label`, `value`, `icon`, `color`, `valueColor`) match the definition in `inline-shared.tsx`. ✓
