/**
 * Electricity analytics — the inspection language for the Load Watch surface.
 * Electricity has no bulk→sub hierarchy and no reconciliation "loss", so the
 * inspection units are the meter CATEGORIES (meter_type), and severity comes
 * from per-meter anomaly detection against each meter's own baseline:
 * spikes, dips, zero-consumption, negative reads and missing reads. A category
 * is only as healthy as its worst meter — that is what turns a flat 57-meter
 * list into a "which system needs inspection today" answer.
 */

import type { MeterReading } from "@/lib/mock-data";
import { ELECTRICITY_RATES } from "@/lib/config";
import type { HealthMetric, HeatColumn, HeatRow, ExceptionRow, Severity } from "@/components/shared/inspection";

const RATE = ELECTRICITY_RATES.RATE_PER_KWH;

// Anomaly gates, expressed against each meter's own baseline (mean of its
// positive reads in range). Named so they read as policy, not magic numbers.
const SPIKE_CRIT = 3;    // ≥3× baseline = critical spike
const SPIKE_HIGH = 2;    // ≥2× baseline = high spike
const DIP = 0.3;         // ≤30% of baseline (but non-zero) = dip
const MIN_BASE_KWH = 5;  // ignore anomalies on trivially small meters (noise)

export type FlagKind = "negative" | "zero" | "spike-crit" | "spike-high" | "missing" | "dip" | null;

export interface MeterState {
    id: string;
    name: string;
    account: string;
    type: string;
    current: number | null;   // reading for the current month (null = missing)
    baseline: number;         // mean of positive reads across the range
    severity: Severity;
    flag: FlagKind;
}

export interface CategoryRow {
    type: string;
    label: string;
    meters: MeterState[];
    monthTotals: number[];    // total kWh per month, aligned to model.rangeMonths
    total: number;            // current-month total kWh
    prevTotal: number;        // previous-month total kWh
    share: number;            // % of grand total
    trendPct: number | null;  // vs previous month
    flaggedCount: number;
    severity: Severity;
}

export interface ElectricityModel {
    rangeMonths: string[];
    currentMonth: string | null;
    prevMonth: string | null;
    categories: CategoryRow[];
    summary: {
        grandTotal: number;
        cost: number;
        meterCount: number;
        flaggedCount: number;
        trendPct: number | null;
    };
}

const num = (x: number, frac = 0) => x.toLocaleString("en-US", { maximumFractionDigits: frac });
const prettyType = (t: string) => t.replace(/_/g, " ").replace(/\s+/g, " ").trim();

/** Months in [start, end] preserving the app's chronological ordering. */
function sliceRange(allMonths: string[], startMonth: string, endMonth: string): string[] {
    const s = allMonths.indexOf(startMonth);
    const e = allMonths.indexOf(endMonth);
    if (s < 0 || e < 0 || s > e) return allMonths;
    return allMonths.slice(s, e + 1);
}

function flagToSeverity(flag: FlagKind): Severity {
    switch (flag) {
        case "negative": return "critical";
        case "spike-crit": return "critical";
        case "zero": return "high";
        case "spike-high": return "high";
        case "missing": return "watch";
        case "dip": return "watch";
        default: return "good";
    }
}

function meterFlag(current: number | null, baseline: number): FlagKind {
    if (current === null) return "missing";
    if (current < 0) return "negative";
    if (baseline >= MIN_BASE_KWH) {
        if (current === 0) return "zero";
        if (current >= baseline * SPIKE_CRIT) return "spike-crit";
        if (current >= baseline * SPIKE_HIGH) return "spike-high";
        if (current <= baseline * DIP) return "dip";
    }
    return null;
}

const SEV_RANK: Record<Severity, number> = { good: 0, nodata: 1, watch: 2, high: 3, critical: 4 };
function worstOf(severities: Severity[]): Severity {
    return severities.reduce<Severity>((w, s) => (SEV_RANK[s] > SEV_RANK[w] ? s : w), "good");
}

export function buildElectricityModel(
    meters: MeterReading[],
    allMonths: string[],
    startMonth: string,
    endMonth: string,
): ElectricityModel {
    const rangeMonths = allMonths.length ? sliceRange(allMonths, startMonth, endMonth) : [];
    const currentMonth = rangeMonths.length ? rangeMonths[rangeMonths.length - 1] : null;
    const prevMonth = rangeMonths.length > 1 ? rangeMonths[rangeMonths.length - 2] : null;

    // Group meters by category.
    const byType = new Map<string, MeterReading[]>();
    for (const m of meters) {
        const arr = byType.get(m.type) ?? [];
        arr.push(m);
        byType.set(m.type, arr);
    }

    const grandTotal = currentMonth ? meters.reduce((s, m) => s + (m.readings[currentMonth] ?? 0), 0) : 0;

    const categories: CategoryRow[] = [];
    for (const [type, group] of byType) {
        const meterStates: MeterState[] = group.map((m) => {
            const positives = rangeMonths.map((mo) => m.readings[mo]).filter((v): v is number => typeof v === "number" && v > 0);
            const baseline = positives.length ? positives.reduce((s, v) => s + v, 0) / positives.length : 0;
            const current = currentMonth ? (m.readings[currentMonth] ?? null) : null;
            const flag = meterFlag(current, baseline);
            return {
                id: m.id, name: m.name, account: m.account_number, type: m.type,
                current, baseline, flag, severity: flagToSeverity(flag),
            };
        });

        const monthTotals = rangeMonths.map((mo) => group.reduce((s, m) => s + (m.readings[mo] ?? 0), 0));
        const total = currentMonth ? group.reduce((s, m) => s + (m.readings[currentMonth] ?? 0), 0) : 0;
        const prevTotal = prevMonth ? group.reduce((s, m) => s + (m.readings[prevMonth] ?? 0), 0) : 0;

        categories.push({
            type,
            label: prettyType(type),
            meters: meterStates,
            monthTotals,
            total,
            prevTotal,
            share: grandTotal > 0 ? (total / grandTotal) * 100 : 0,
            trendPct: prevTotal > 0 ? ((total - prevTotal) / prevTotal) * 100 : null,
            flaggedCount: meterStates.filter((s) => s.flag !== null).length,
            severity: worstOf(meterStates.map((s) => s.severity)),
        });
    }

    const flaggedCount = categories.reduce((s, c) => s + c.flaggedCount, 0);
    const prevGrand = prevMonth ? meters.reduce((s, m) => s + (m.readings[prevMonth] ?? 0), 0) : 0;

    return {
        rangeMonths,
        currentMonth,
        prevMonth,
        categories: categories.sort((a, b) => b.total - a.total),
        summary: {
            grandTotal,
            cost: grandTotal * RATE,
            meterCount: meters.length,
            flaggedCount,
            trendPct: prevGrand > 0 ? ((grandTotal - prevGrand) / prevGrand) * 100 : null,
        },
    };
}

// ─── Category health cards ────────────────────────────────────────────────────

export function buildCategoryMetrics(model: ElectricityModel): HealthMetric[] {
    return model.categories.map((c): HealthMetric => {
        const trend = c.trendPct;
        const trendStr = trend === null ? "—" : `${trend > 0 ? "+" : ""}${trend.toFixed(0)}% vs prev month`;
        return {
            key: c.type,
            title: c.label,
            severity: c.severity,
            headline: `${num(c.total)} kWh`,
            headlineNote: `${c.share.toFixed(0)}% of load · ${trendStr}`,
            subtitle: `${c.meters.length} meter${c.meters.length !== 1 ? "s" : ""} · tap to inspect`,
            facts: [
                { label: "cost", value: `${num(c.total * RATE)} OMR` },
                { label: "flagged", value: String(c.flaggedCount) },
            ],
            spark: c.monthTotals.slice(-14),
            sparkNote: `${Math.min(14, c.monthTotals.length)}-month trend`,
            signal: c.flaggedCount > 0
                ? { label: `${c.flaggedCount} flagged`, tone: c.severity === "critical" || c.severity === "high" ? "danger" : "warning" }
                : undefined,
        };
    });
}

// ─── Category × month heatmap (category-level spike detection) ─────────────────

function catMonthSeverity(total: number, baseline: number): Severity {
    if (total <= 0) return "nodata";
    if (baseline <= 0) return "good";
    const r = total / baseline;
    if (r >= 2) return "critical";
    if (r >= 1.5) return "high";
    if (r <= 0.5) return "watch";
    return "good";
}

export function buildCategoryHeatmap(model: ElectricityModel): { columns: HeatColumn[]; rows: HeatRow[] } {
    const window = 12;
    const start = Math.max(0, model.rangeMonths.length - window);
    const months = model.rangeMonths.slice(start);
    if (months.length === 0 || model.categories.length === 0) return { columns: [], rows: [] };

    const columns: HeatColumn[] = months.map((m) => ({
        key: m,
        label: m.split("-")[0],
        highlight: m === model.currentMonth,
    }));

    const rows: HeatRow[] = model.categories.map((c) => {
        const windowTotals = c.monthTotals.slice(start);
        const positives = c.monthTotals.filter((v) => v > 0);
        const baseline = positives.length ? positives.reduce((s, v) => s + v, 0) / positives.length : 0;
        return {
            key: c.type,
            label: c.label,
            cells: windowTotals.map((total, i) => ({
                severity: catMonthSeverity(total, baseline),
                label: total > 0 ? String(Math.round(total / 1000)) : "0",
                title: `${c.label} · ${months[i]}: ${num(total)} kWh`,
            })),
        };
    });

    return { columns, rows };
}

// ─── Exceptions & Actions (current month work queue) ──────────────────────────

const OWNER = "Electrical / Facilities";

const FLAG_META: Record<Exclude<FlagKind, null>, { item: string; action: string; severity: "Critical" | "Watch" }> = {
    negative: { item: "Negative reading", severity: "Critical", action: "Negative kWh — meter fault or reset; verify CT wiring and recalibrate/replace the meter." },
    "spike-crit": { item: "Consumption spike", severity: "Critical", action: "kWh is 3×+ the meter's baseline — inspect the load for faults and rule out a metering error." },
    zero: { item: "Zero consumption", severity: "Watch", action: "Meter read 0 kWh but normally consumes — check the breaker/supply and confirm the reading." },
    "spike-high": { item: "Consumption spike", severity: "Watch", action: "kWh is 2×+ the meter's baseline — review the load profile and confirm the reading is genuine." },
    dip: { item: "Consumption dip", severity: "Watch", action: "kWh well below baseline — check for a partial outage or a mis-read." },
    missing: { item: "Missing reading", severity: "Watch", action: "No reading captured this month — schedule a manual read for this meter." },
};

export function buildElectricityExceptions(model: ElectricityModel): ExceptionRow[] {
    const rows: ExceptionRow[] = [];
    for (const c of model.categories) {
        for (const m of c.meters) {
            if (!m.flag) continue;
            const meta = FLAG_META[m.flag];
            const value = m.current === null
                ? "no read"
                : `${num(m.current)} kWh${m.baseline > 0 ? ` (base ${num(m.baseline)})` : ""}`;
            rows.push({
                Category: c.label,
                Item: `${m.name}${m.account ? ` · ${m.account}` : ""} — ${meta.item}`,
                Severity: meta.severity,
                Value: value,
                Owner: OWNER,
                Status: "Open",
                Action: meta.action,
            });
        }
    }
    const rank = { Critical: 1, Watch: 0 } as const;
    return rows.sort((a, b) => rank[b.Severity] - rank[a.Severity]);
}
