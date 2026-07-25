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
    ZONE_BULK_CONFIG, BUILDING_CONFIG, DC_METERS, NULL_AS_ZERO_ACCOUNTS,
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
 */
export type DailySeverity = "nodata" | "check" | "good" | "moderate" | "high" | "critical";

export const SEVERITY_LABEL: Record<DailySeverity, string> = {
    nodata: "No data",
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
    /** True when the day has any reading (L2 or any L3). */
    hasData: boolean;
    /** L2 − ΣL3; null when L2 is missing (balance not computable). */
    loss: number | null;
    /** loss / L2 × 100; null when L2 missing or 0. */
    lossPct: number | null;
    severity: DailySeverity;
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
            let anyL3 = false;
            for (const a of z.l3Accounts) {
                const v = gridValue(grid, a, d);
                if (v !== null) {
                    l3 += v;
                    anyL3 = true;
                }
            }
            const l2 = l2raw !== null ? r2(l2raw) : null;
            const l3Sum = r2(l3);
            const loss = l2 !== null ? r2(l2 - l3Sum) : null;
            const lossPct = l2 !== null && l2 > 0 && loss !== null ? r2((loss / l2) * 100) : null;
            points.push({
                day: d, l2, l3Sum, hasData: l2 !== null || anyL3,
                loss, lossPct, severity: dailySeverity(loss, lossPct),
            });
        }
        return { zoneName: z.zoneName, l2Account: z.l2Account, meterCount: z.l3Accounts.length, points };
    });
}

// ─── Leak signatures & meter anomalies ────────────────────────────────────────

/**
 * Consecutive days of strictly increasing positive loss ending at `day`
 * (number of increases, so a streak of 3 spans 4 days). The classic signature
 * of a growing underground leak; days with a missing balance break the streak.
 */
export function risingLossStreak(points: ZoneDayPoint[], day: number): number {
    let streak = 0;
    for (let d = day; d > 1; d--) {
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

// ─── Month-to-date cumulative series (per zone) ───────────────────────────────

export interface MtdPoint {
    day: number;
    /** Axis label, e.g. "D07". */
    label: string;
    cumSupply: number;
    cumMetered: number;
    cumLoss: number;
}

export function buildZoneMtd(series: ZoneDaySeries): MtdPoint[] {
    let cs = 0;
    let cm = 0;
    return series.points.map((p) => {
        cs += p.l2 ?? 0;
        cm += p.l3Sum;
        return {
            day: p.day,
            label: `D${String(p.day).padStart(2, "0")}`,
            cumSupply: r2(cs),
            cumMetered: r2(cm),
            cumLoss: r2(cs - cm),
        };
    });
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

/** Meter accounts eligible for spike / zero-streak scans (irrigation + null-as-zero excluded). */
function scannableMeters(grid: DailyGrid): { account: string; name: string; context: string }[] {
    const out: { account: string; name: string; context: string }[] = [];
    const seen = new Set<string>();
    for (const z of ZONE_BULK_CONFIG) {
        for (const a of z.l3Accounts) {
            if (NULL_AS_ZERO_ACCOUNTS.has(a) || seen.has(a)) continue;
            seen.add(a);
            out.push({ account: a, name: grid.names.get(a) ?? a, context: z.zoneName });
        }
    }
    for (const dc of DC_METERS) {
        if (dc.isIrr || NULL_AS_ZERO_ACCOUNTS.has(dc.account) || seen.has(dc.account)) continue;
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
        if (p.loss !== null && p.loss > 20) {
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
        if (rising >= 3 && (p.loss ?? 0) > 10) {
            rows.push({
                Category: "Rising-loss signature", Item: s.zoneName, Severity: "Critical",
                Value: `${rising + 1} days climbing → ${m3(p.loss ?? 0)}`,
                Action: "Loss has increased daily — pattern of a growing underground leak. Inspect the zone network.",
            });
        }
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
