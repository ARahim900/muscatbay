/**
 * @fileoverview Pure computation layer for the Water → Daily section.
 *
 * Everything here derives from the month's `water_daily_consumption` rows that
 * the Daily report already fetches — no extra network calls. The daily data
 * has NO L1/NAMA main-bulk account, so all balances are distribution-level:
 * zone bulk (L2) vs the sum of its individual meters (ΣL3). That is where
 * physical leaks surface first, which makes the daily view the operational
 * leak-detection tool (the Monthly section remains the billing-grade A1→A2→A3
 * balance).
 *
 * Framework-free on purpose: unit-testable without React/jsdom.
 *
 * @module components/water/daily-report/daily-metrics
 */

import {
    ZONE_BULK_CONFIG, BUILDING_CONFIG, DC_METERS,
    type ZoneBulkConfig,
} from "@/lib/water-accounts";
import type { SupabaseDailyWaterConsumption } from "@/entities/water";

/** Round to 2 decimal places. */
const r2 = (v: number) => Math.round(v * 100) / 100;

/** Compact m³ formatter for exception values (pure — no locale surprises in CSV). */
const m3 = (v: number) => `${v.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} m³`;

// ─── Reading grid ─────────────────────────────────────────────────────────────

/** Day-indexed readings for one account; index 0 = day 1. Always length 31. */
export type DayValues = (number | null)[];

export interface DailyGrid {
    /** account_number → 31-slot readings array. */
    values: Map<string, DayValues>;
    /** account_number → meter_name (for display in exceptions/tables). */
    names: Map<string, string>;
    /** Last day-of-month (1-based) with any non-null reading; ≥ 1. */
    latestDay: number;
}

const EMPTY_DAYS: DayValues = Array.from({ length: 31 }, () => null);

/** Build an O(1) lookup grid from the raw month rows. */
export function buildDailyGrid(rows: SupabaseDailyWaterConsumption[]): DailyGrid {
    const values = new Map<string, DayValues>();
    const names = new Map<string, string>();
    let latest = 0;
    for (const row of rows) {
        const arr: DayValues = [];
        for (let d = 1; d <= 31; d++) {
            const raw = row[`day_${d}` as keyof SupabaseDailyWaterConsumption];
            const v = raw != null ? Number(raw) : null;
            arr.push(v);
            if (v !== null && d > latest) latest = d;
        }
        values.set(row.account_number, arr);
        if (row.meter_name) names.set(row.account_number, row.meter_name);
    }
    return { values, names, latestDay: Math.max(1, latest) };
}

/** Reading for an account on a 1-based day (null = missing). */
export function gridValue(grid: DailyGrid, account: string, day: number): number | null {
    return (grid.values.get(account) ?? EMPTY_DAYS)[day - 1] ?? null;
}

// ─── Severity ─────────────────────────────────────────────────────────────────

/**
 * Daily loss severity for one zone-day. Bands mirror the Monthly section's
 * `sev()` percentages (10 / 25 / 50) but add absolute-m³ guards, because daily
 * volumes are small and noisy: a 3 m³ loss on a 5 m³ supply is 60% but trivial,
 * while 100 m³ lost at 9% is not. `check` = negative balance (ΣL3 > L2 —
 * meter over-read or bulk under-read, needs validation, not a leak).
 *
 * `partial` is not a loss band at all: it means fewer meters reported than this
 * zone normally manages, so ΣL3 is understated and the loss overstated. The
 * owner acts on a gap only when the full set reported (ruling 2026-09-15), so
 * grading such a day as a leak sends him out after a silent meter. The loss
 * figure is still carried and shown — as a ceiling, not a measurement.
 */
export type DailySeverity = "nodata" | "partial" | "check" | "good" | "moderate" | "high" | "critical";

export const SEVERITY_LABEL: Record<DailySeverity, string> = {
    nodata: "No data",
    partial: "Partial data",
    check: "Check meters",
    good: "Good",
    moderate: "Moderate",
    high: "High",
    critical: "Critical",
};

export function dailySeverity(loss: number | null, lossPct: number | null): DailySeverity {
    if (loss === null) return "nodata";
    if (loss < -5) return "check";
    if (loss <= 5) return "good"; // absolute floor — small m³ never alarms
    const pct = lossPct ?? 0;
    if (pct >= 50 || loss >= 100) return "critical";
    if (pct >= 25 || loss >= 50) return "high";
    if (pct >= 10 || loss >= 20) return "moderate";
    return "good";
}

// ─── Zone day series ──────────────────────────────────────────────────────────

export interface ZoneDayPoint {
    /** 1-based day of month. */
    day: number;
    /** Zone bulk (L2) reading; null = missing. */
    l2: number | null;
    /** Σ of the zone's individual (L3) meters, nulls counted as 0. */
    l3Sum: number;
    /**
     * How many of the zone's configured L3 meters have a reading that day.
     * Below `meterCount`, `l3Sum` is understated and the loss overstated —
     * the reader needs this number to know whether a gap is real.
     */
    l3Reported: number;
    /** The zone's own recent norm — see `expectedReported`. */
    expectedReported: number;
    /** `l3Reported` is below that norm: the balance is provisional. */
    coverageShort: boolean;
    /** True when the day has any reading (L2 or any L3). */
    hasData: boolean;
    /** L2 − ΣL3; null when L2 is missing (balance not computable). */
    loss: number | null;
    /** loss / L2 × 100; null when L2 missing or 0. */
    lossPct: number | null;
    severity: DailySeverity;
}

/**
 * Days of history the coverage norm looks back over.
 *
 * The norm is the MOST meters seen reporting in that window, which is what
 * makes this work on a network with permanently dead meters. Zone FM has
 * reported 16 of 17 every day since 4300337 fell silent, so its norm is 16 and
 * its days read as complete — gating on `reported === meterCount` instead would
 * have switched off leak detection there for good. What the norm catches is a
 * DROP: Zone 3A ran at 30 and fell to 23 on 13 September, so that day is
 * provisional. When a meter dies the norm carries its old level for a week —
 * deliberately, so the loss is flagged as provisional while the death is fresh
 * — and then settles to the new level, which stops the register crying wolf.
 * The meter itself is still named every day by the "Meters not reporting" row.
 */
export const COVERAGE_WINDOW_DAYS = 7;

/**
 * How big a shortfall has to be, as a share of the norm, before it downgrades a
 * loss grade.
 *
 * Any shortfall at all would be too strict. When D-46's bulk died on 8
 * September, Zone 3A went from 31 meters to 30 — and that zone was running a
 * genuine 73% loss at the time. Downgrading on one meter in 31 would have
 * muted a real alarm for the week the norm took to settle. One meter in thirty
 * cannot explain a gap of that size, so it must not be allowed to excuse it.
 *
 * The missing meters are still named every day by the "Meters not reporting"
 * row whatever this threshold does, so nothing is hidden either way — the
 * threshold only decides whether the day still gets a leak GRADE.
 *
 * This uses the count of meters, not their volume: what a silent meter would
 * have read is unknowable, and estimating it to sharpen a threshold would be
 * inventing data.
 */
export const COVERAGE_SHORTFALL_RATIO = 0.1;

export function expectedReported(points: ZoneDayPoint[], day: number): number {
    let best = 0;
    for (let d = Math.max(1, day - COVERAGE_WINDOW_DAYS); d <= day; d++) {
        const p = points[d - 1];
        if (p?.hasData && p.l3Reported > best) best = p.l3Reported;
    }
    return best;
}

export interface ZoneDaySeries {
    zoneName: string;
    l2Account: string;
    meterCount: number;
    /** One point per day, 1 … grid.latestDay. */
    points: ZoneDayPoint[];
}

export function buildZoneDaySeries(grid: DailyGrid): ZoneDaySeries[] {
    return ZONE_BULK_CONFIG.map((z) => {
        const points: ZoneDayPoint[] = [];
        for (let d = 1; d <= grid.latestDay; d++) {
            const l2raw = gridValue(grid, z.l2Account, d);
            let l3 = 0;
            let reported = 0;
            for (const a of z.l3Accounts) {
                const v = gridValue(grid, a, d);
                if (v !== null) {
                    l3 += v;
                    reported++;
                }
            }
            const l2 = l2raw !== null ? r2(l2raw) : null;
            const l3Sum = r2(l3);
            const loss = l2 !== null ? r2(l2 - l3Sum) : null;
            const lossPct = l2 !== null && l2 > 0 && loss !== null ? r2((loss / l2) * 100) : null;
            points.push({
                day: d, l2, l3Sum, l3Reported: reported,
                expectedReported: 0, coverageShort: false,
                hasData: l2 !== null || reported > 0,
                loss, lossPct, severity: dailySeverity(loss, lossPct),
            });
        }

        // Second pass: the norm needs the whole series, so coverage can only be
        // judged once every day is built. A short day keeps its loss figure but
        // loses its loss GRADE — "check" survives, because meters reading more
        // than the bulk is if anything more certain when some did not report,
        // and "good" survives, because a small gap cannot be an artefact of
        // undercounting.
        for (const p of points) {
            p.expectedReported = expectedReported(points, p.day);
            p.coverageShort = p.hasData
                && p.expectedReported > 0
                && (p.expectedReported - p.l3Reported) / p.expectedReported > COVERAGE_SHORTFALL_RATIO;
            if (p.coverageShort && (p.severity === "moderate" || p.severity === "high" || p.severity === "critical")) {
                p.severity = "partial";
            }
        }

        return { zoneName: z.zoneName, l2Account: z.l2Account, meterCount: z.l3Accounts.length, points };
    });
}

// ─── Leak signatures & meter anomalies ────────────────────────────────────────

/**
 * Consecutive days of strictly increasing positive loss ending at `day`
 * (number of increases, so a streak of 3 spans 4 days). The classic signature
 * of a growing underground leak; days with a missing balance break the streak.
 *
 * So does a day of short coverage: its loss is inflated by the meters that did
 * not report, which manufactures exactly the rising shape this looks for.
 */
export function risingLossStreak(points: ZoneDayPoint[], day: number): number {
    let streak = 0;
    for (let d = day; d > 1; d--) {
        if (points[d - 1]?.coverageShort || points[d - 2]?.coverageShort) break;
        const cur = points[d - 1]?.loss;
        const prev = points[d - 2]?.loss;
        if (cur === null || cur === undefined || prev === null || prev === undefined) break;
        if (cur > prev && cur > 0) streak++;
        else break;
    }
    return streak;
}

export interface SpikeInfo {
    value: number;
    /** Trailing average of up to the 7 previous non-null days. */
    avg: number;
    /** value / avg (avg floored at 0.01 to stay finite). */
    ratio: number;
}

/**
 * Spike test for one meter on one day: reading ≥ 2× its trailing 7-day
 * average AND at least 5 m³ above it (so quiet meters don't false-alarm).
 * Needs ≥ 3 prior readings to have a baseline.
 */
export function detectSpike(values: DayValues, day: number): SpikeInfo | null {
    const v = values[day - 1];
    if (v === null || v === undefined) return null;
    const window: number[] = [];
    for (let d = day - 1; d >= 1 && window.length < 7; d--) {
        const p = values[d - 1];
        if (p !== null && p !== undefined) window.push(p);
    }
    if (window.length < 3) return null;
    const avg = window.reduce((s, x) => s + x, 0) / window.length;
    if (v >= 2 * Math.max(avg, 0.01) && v - avg >= 5) {
        return { value: r2(v), avg: r2(avg), ratio: r2(v / Math.max(avg, 0.01)) };
    }
    return null;
}

/**
 * Length of the trailing run of explicit zero readings ending at `day`
 * (nulls are "missing", not zero, and break the run).
 */
export function zeroStreak(values: DayValues, day: number): number {
    let streak = 0;
    for (let d = day; d >= 1; d--) {
        const v = values[d - 1];
        if (v !== null && v !== undefined && v === 0) streak++;
        else break;
    }
    return streak;
}

/** True if the meter recorded any positive value before the trailing streak. */
export function wasActiveBefore(values: DayValues, day: number, streak: number): boolean {
    for (let d = day - streak; d >= 1; d--) {
        const v = values[d - 1];
        if (v !== null && v !== undefined && v > 0) return true;
    }
    return false;
}

// ─── Zone Watch (fleet view) ──────────────────────────────────────────────────

export interface ZoneWatchRow {
    zoneName: string;
    meterCount: number;
    /** Configured L3 meters with a reading on the selected day (≤ meterCount). */
    l3Reported: number;
    /** Fewer than the zone's own recent norm reported: the balance is provisional. */
    coverageShort: boolean;
    l2: number | null;
    l3Sum: number;
    loss: number | null;
    lossPct: number | null;
    severity: DailySeverity;
    /** Loss (m³) for up to the 7 days ending at the selected day — sparkline. */
    spark: (number | null)[];
    /** Month-to-date cumulative supply/metered/loss up to the selected day. */
    mtdL2: number;
    mtdL3: number;
    mtdLoss: number;
    mtdLossPct: number | null;
    /** Consecutive rising-loss days ending at the selected day. */
    risingDays: number;
}

export function buildZoneWatch(series: ZoneDaySeries[], day: number): ZoneWatchRow[] {
    return series.map((s) => {
        const p = s.points[day - 1];
        let mtdL2 = 0;
        let mtdL3 = 0;
        for (let d = 1; d <= day; d++) {
            const q = s.points[d - 1];
            if (!q) continue;
            mtdL2 += q.l2 ?? 0;
            mtdL3 += q.l3Sum;
        }
        mtdL2 = r2(mtdL2);
        mtdL3 = r2(mtdL3);
        const mtdLoss = r2(mtdL2 - mtdL3);
        const spark = s.points
            .slice(Math.max(0, day - 7), day)
            .map((q) => q.loss);
        return {
            zoneName: s.zoneName,
            meterCount: s.meterCount,
            l3Reported: p?.l3Reported ?? 0,
            coverageShort: p?.coverageShort ?? false,
            l2: p?.l2 ?? null,
            l3Sum: p?.l3Sum ?? 0,
            loss: p?.loss ?? null,
            lossPct: p?.lossPct ?? null,
            severity: p?.severity ?? "nodata",
            spark,
            mtdL2, mtdL3, mtdLoss,
            mtdLossPct: mtdL2 > 0 ? r2((mtdLoss / mtdL2) * 100) : null,
            risingDays: risingLossStreak(s.points, day),
        };
    });
}

// ─── Where one day's zone supply went (composition) ──────────────────────────
//
// The daily trend answers "when"; this answers "who". The L2 bulk reading is
// split into the zone's largest individual (L3) meters, the remainder folded
// into one "Other" bar, and the unmetered balance (L2 − ΣL3) ranked alongside
// them — so when the loss outranks every meter, that is visible at a glance.

export type BreakdownKind = "meter" | "other" | "loss";

export interface BreakdownBar {
    /** Stable key: account number, "other" or "loss". */
    key: string;
    label: string;
    value: number;
    kind: BreakdownKind;
    /** value / L2 × 100; null when the bulk was not read or read 0. */
    shareOfSupply: number | null;
}

export interface ZoneDayBreakdown {
    /** Ranked largest first. Empty when nothing was read that day. */
    bars: BreakdownBar[];
    l2: number | null;
    /** Σ of the zone's L3 meters, nulls counted as 0 (same rule as the series). */
    l3Sum: number;
    /** L2 − ΣL3; null when L2 is missing. Negative = meters read more than the bulk. */
    loss: number | null;
    /** L3 meters with no reading on the day. */
    unread: number;
    /** Meters folded into the "Other" bar. */
    otherCount: number;
    /** True when the day has any reading (L2 or any L3). */
    hasData: boolean;
}

/** Curated building names for the L3 accounts that are building bulks. */
const BUILDING_NAME_BY_BULK = new Map(BUILDING_CONFIG.map((b) => [b.bulkAccount, b.buildingName]));

/** Display name for an L3 account: curated building name → stored meter name → account. */
function meterLabel(grid: DailyGrid, account: string): string {
    return BUILDING_NAME_BY_BULK.get(account) ?? grid.names.get(account) ?? account;
}

// ─── Meter coverage (how many of the zone's meters the day's ΣL3 rests on) ───
//
// ΣL3 counts an unread meter as 0, so a day where 23 of 31 meters reported
// shows a smaller ΣL3 and a larger apparent loss than the zone really had.
// The owner's rule (2026-09-15) is to act on a gap only when the full set
// reported; a partial day is a meter-feed problem to chase, not a leak.

export interface UnreadMeter {
    account: string;
    name: string;
}

export interface ZoneCoverage {
    /** L3 meters configured for the zone. */
    configured: number;
    /** Of those, how many have a reading on the day. */
    reported: number;
    /** The meters with no reading, in configuration order — the repair list. */
    unread: UnreadMeter[];
}

export function zoneMeterCoverage(grid: DailyGrid, zone: ZoneBulkConfig, day: number): ZoneCoverage {
    const unread: UnreadMeter[] = [];
    for (const account of zone.l3Accounts) {
        if (gridValue(grid, account, day) === null) {
            unread.push({ account, name: meterLabel(grid, account) });
        }
    }
    return {
        configured: zone.l3Accounts.length,
        reported: zone.l3Accounts.length - unread.length,
        unread,
    };
}

/**
 * @param topN  Named bars before the rest collapses into "Other". Only meters
 *              with a positive reading are named; zero and unread meters always
 *              fold into "Other" so a zone of idle meters does not list zeros.
 */
export function buildZoneDayBreakdown(
    grid: DailyGrid,
    zone: ZoneBulkConfig,
    day: number,
    topN = 6,
): ZoneDayBreakdown {
    const l2raw = gridValue(grid, zone.l2Account, day);
    const l2 = l2raw !== null ? r2(l2raw) : null;

    const meters = zone.l3Accounts.map((account) => ({
        account,
        label: meterLabel(grid, account),
        value: gridValue(grid, account, day),
    }));
    const unread = meters.filter((m) => m.value === null).length;
    const hasData = l2 !== null || unread < meters.length;
    const l3Sum = r2(meters.reduce((s, m) => s + (m.value ?? 0), 0));
    const loss = l2 !== null ? r2(l2 - l3Sum) : null;
    const share = (v: number): number | null => (l2 !== null && l2 > 0 ? r2((v / l2) * 100) : null);

    const named = meters
        .filter((m) => m.value !== null && m.value > 0)
        .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
        .slice(0, topN);
    const namedKeys = new Set(named.map((m) => m.account));
    const rest = meters.filter((m) => !namedKeys.has(m.account));

    const bars: BreakdownBar[] = named.map((m) => ({
        key: m.account,
        label: m.label,
        value: r2(m.value ?? 0),
        kind: "meter",
        shareOfSupply: share(m.value ?? 0),
    }));
    if (rest.length > 0) {
        const otherValue = r2(rest.reduce((s, m) => s + (m.value ?? 0), 0));
        bars.push({
            key: "other",
            label: `Other (${rest.length} meter${rest.length === 1 ? "" : "s"})`,
            value: otherValue,
            kind: "other",
            shareOfSupply: share(otherValue),
        });
    }
    if (loss !== null && loss > 0) {
        // ΣL3 follows the Daily module's convention (series, gauges, table,
        // Exceptions register): an unread L3 meter contributes 0, so its use
        // sits inside the unmetered figure. The bar says so when it applies.
        const label = unread > 0 ? `Unmetered (${unread} unread)` : "Unmetered loss";
        bars.push({ key: "loss", label, value: loss, kind: "loss", shareOfSupply: share(loss) });
    }
    bars.sort((a, b) => b.value - a.value);

    return { bars: hasData ? bars : [], l2, l3Sum, loss, unread, otherCount: rest.length, hasData };
}

// ─── Network daily trend (all zones combined) ────────────────────────────────

export interface NetworkDayPoint {
    day: number;
    label: string;
    supply: number;
    metered: number;
    loss: number;
    lossPct: number | null;
}

/** Σ across zones per day (nulls as 0), for the fleet trend chart. */
export function buildNetworkDaySeries(series: ZoneDaySeries[], latestDay: number): NetworkDayPoint[] {
    const out: NetworkDayPoint[] = [];
    for (let d = 1; d <= latestDay; d++) {
        let supply = 0;
        let metered = 0;
        let hasData = false;
        for (const s of series) {
            const p = s.points[d - 1];
            if (!p) continue;
            if (p.hasData) hasData = true;
            supply += p.l2 ?? 0;
            metered += p.l3Sum;
        }
        if (!hasData) continue;
        const loss = r2(supply - metered);
        out.push({
            day: d,
            label: `D${String(d).padStart(2, "0")}`,
            supply: r2(supply),
            metered: r2(metered),
            loss,
            lossPct: supply > 0 ? r2((loss / supply) * 100) : null,
        });
    }
    return out;
}

// ─── Exceptions register ──────────────────────────────────────────────────────
//
// Identification only. The former `Owner` and `Status` fields were hardcoded
// literals ("O&M / FM", "Open"/"Monitor") that looked like assignment and
// resolution tracking but were neither stored nor editable. Management asked for
// issues to be surfaced, not tracked, so they have been removed — deliberately
// without any assignment / acknowledge / close workflow replacing them.

export interface DailyExceptionRow {
    Category: string;
    Item: string;
    Severity: "Critical" | "Watch";
    Value: string;
    Action: string;
    /** String-only columns so rows feed the CSV exporter directly. */
    [key: string]: string;
}

/** Meter accounts eligible for spike / zero-streak scans. */
function scannableMeters(grid: DailyGrid): { account: string; name: string; context: string }[] {
    const out: { account: string; name: string; context: string }[] = [];
    const seen = new Set<string>();
    for (const z of ZONE_BULK_CONFIG) {
        for (const a of z.l3Accounts) {
            if (seen.has(a)) continue;
            seen.add(a);
            out.push({ account: a, name: grid.names.get(a) ?? a, context: z.zoneName });
        }
    }
    for (const dc of DC_METERS) {
        if (dc.isIrr || seen.has(dc.account)) continue;
        seen.add(dc.account);
        out.push({ account: dc.account, name: grid.names.get(dc.account) ?? dc.meterName, context: "Direct Connection" });
    }
    return out;
}

/**
 * Build the day's operational action queue. Ordering: Critical first, then by
 * category. Every rule needs only L2/L3/L4/DC data — no L1 required.
 */
export function buildDailyExceptions(grid: DailyGrid, series: ZoneDaySeries[], day: number): DailyExceptionRow[] {
    const rows: DailyExceptionRow[] = [];

    // 1 — zone balances
    for (const s of series) {
        const p = s.points[day - 1];
        if (!p) continue;

        if (p.l2 === null && p.l3Sum > 0) {
            rows.push({
                Category: "Missing L2 reading", Item: s.zoneName, Severity: "Critical",
                Value: `ΣL3 ${m3(p.l3Sum)} · L2 —`,
                Action: "Zone balance not computable — verify bulk meter / telemetry feed.",
            });
            continue;
        }
        if (p.loss !== null && p.loss < -5) {
            rows.push({
                Category: "Negative balance", Item: s.zoneName, Severity: "Critical",
                Value: `${m3(p.loss)} (ΣL3 > L2)`,
                Action: "Individual meters read more than the bulk — check meter over-read or bulk under-read.",
            });
        }
        // A short-coverage day is never a dispatch instruction: the loss is
        // inflated by the meters that did not report. The coverage row below
        // carries the figure instead, as the ceiling it is.
        if (p.loss !== null && p.loss > 20 && !p.coverageShort) {
            const critical = (p.lossPct ?? 0) > 25 || p.loss > 50;
            rows.push({
                Category: "High daily loss", Item: s.zoneName, Severity: critical ? "Critical" : "Watch",
                Value: `${m3(p.loss)}${p.lossPct !== null ? ` · ${p.lossPct.toFixed(1)}%` : ""}`,
                Action: critical
                    ? "Dispatch leak inspection; verify the L2 bulk meter reading."
                    : "Monitor the trend and validate abnormal individual meters.",
            });
        }
        const rising = risingLossStreak(s.points, day);
        if (rising >= 3 && (p.loss ?? 0) > 10 && !p.coverageShort) {
            rows.push({
                Category: "Rising-loss signature", Item: s.zoneName, Severity: "Critical",
                Value: `${rising + 1} days climbing → ${m3(p.loss ?? 0)}`,
                Action: "Loss has increased daily — pattern of a growing underground leak. Inspect the zone network.",
            });
        }
    }

    // 1b — meter coverage: a partial day is a feed/meter problem to chase, and
    // it also means every balance above is overstated. Named so the reader
    // knows which meters to go and look at. On a day whose coverage dropped
    // below the zone's norm this row also carries the day's loss, because the
    // dispatch rows above stood down for it — the figure is never lost, it is
    // just labelled as the ceiling it is.
    for (const z of ZONE_BULK_CONFIG) {
        const cov = zoneMeterCoverage(grid, z, day);
        const s = series.find((x) => x.zoneName === z.zoneName);
        const p = s?.points[day - 1];
        // A zone with nothing at all that day is "no data", not "n meters down".
        if (cov.unread.length === 0 || !p?.hasData) continue;
        const shown = cov.unread.slice(0, 6).map((m) => `${m.name} (${m.account})`);
        const more = cov.unread.length - shown.length;
        const chase = `Check: ${shown.join(", ")}${more > 0 ? ` and ${more} more` : ""}.`;
        rows.push({
            Category: "Meters not reporting",
            Item: z.zoneName,
            Severity: "Watch",
            Value: p.coverageShort
                ? `${cov.reported} / ${cov.configured} reported · normally ${p.expectedReported}`
                : `${cov.reported} / ${cov.configured} meters reported`,
            Action: p.coverageShort && p.loss !== null && p.loss > 20
                ? `Coverage dropped, so the day's ${m3(p.loss)} gap is an upper bound, not a measured loss — restore the readings before dispatching an inspection. ${chase}`
                : `ΣL3 understated and loss overstated until these report. ${chase}`,
        });
    }

    // 2 — building bulk vs ΣL4 (in-building leaks)
    for (const b of BUILDING_CONFIG) {
        const bulk = gridValue(grid, b.bulkAccount, day);
        let l4 = 0;
        let anyL4 = false;
        for (const a of b.l4Accounts) {
            const v = gridValue(grid, a, day);
            if (v !== null) {
                l4 += v;
                anyL4 = true;
            }
        }
        l4 = r2(l4);
        if (bulk === null) {
            if (anyL4 && l4 > 0) {
                rows.push({
                    Category: "Missing building bulk", Item: `${b.buildingName} (Zone ${b.zone})`, Severity: "Watch",
                    Value: `ΣL4 ${m3(l4)} · bulk —`,
                    Action: "Building balance not computable — validate the building bulk reading.",
                });
            }
            continue;
        }
        const diff = r2(bulk - l4);
        if (diff > 5) {
            const critical = diff > 15;
            rows.push({
                Category: "Building mismatch", Item: `${b.buildingName} (Zone ${b.zone})`, Severity: critical ? "Critical" : "Watch",
                Value: `bulk ${m3(bulk)} − ΣL4 ${m3(l4)} = ${m3(diff)}`,
                Action: "Bulk exceeds apartment total — inspect common-area lines and riser for leakage.",
            });
        } else if (diff < -2) {
            rows.push({
                Category: "Building mismatch", Item: `${b.buildingName} (Zone ${b.zone})`, Severity: "Watch",
                Value: `ΣL4 exceeds bulk by ${m3(Math.abs(diff))}`,
                Action: "Apartment meters read more than the building bulk — validate meter readings.",
            });
        }
    }

    // 3 — meter-level anomalies (spikes & stuck meters)
    for (const meter of scannableMeters(grid)) {
        const values = grid.values.get(meter.account);
        if (!values) continue;

        const spike = detectSpike(values, day);
        if (spike) {
            rows.push({
                Category: "Consumption spike", Item: `${meter.name} (${meter.account}) · ${meter.context}`, Severity: "Watch",
                Value: `${m3(spike.value)} vs ${m3(spike.avg)} avg (×${spike.ratio.toFixed(1)})`,
                Action: "Sudden jump vs trailing 7-day average — verify the reading and check for an open line or leak after the meter.",
            });
        }

        const streak = zeroStreak(values, day);
        if (streak >= 3 && wasActiveBefore(values, day, streak)) {
            rows.push({
                Category: "Zero-streak", Item: `${meter.name} (${meter.account}) · ${meter.context}`, Severity: "Watch",
                Value: `0.0 m³ for ${streak} days`,
                Action: "Previously active meter reads zero — check occupancy, valve status and meter operation.",
            });
        }
    }

    return rows.sort((a, b) => (a.Severity === "Critical" ? 0 : 1) - (b.Severity === "Critical" ? 0 : 1));
}
