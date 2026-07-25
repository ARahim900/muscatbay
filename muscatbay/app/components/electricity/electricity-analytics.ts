/**
 * Electricity analytics — the inspection language for the Load Watch surface.
 * Electricity has no bulk→sub hierarchy and no reconciliation "loss", so the
 * inspection units are the meter CATEGORIES (meter_type), and severity comes
 * from per-meter anomaly detection against each meter's own baseline:
 * spikes, dips, zero-consumption, negative reads and missing reads. A category
 * is only as healthy as its worst meter — that is what turns a flat 57-meter
 * list into a "which system needs inspection today" answer.
 *
 * Every gate used here comes from `lib/thresholds.ts`. Nothing in this module
 * (or in the Meters table on the Data tab) may define its own multiplier — that
 * is exactly how the surfaces drifted apart before.
 */

import type { MeterReading } from "@/lib/mock-data";
import { ELECTRICITY_RATES } from "@/lib/config";
import {
    ELECTRICITY_THRESHOLDS, ELECTRICITY_GATE_LABELS, classifyLoadRatio,
} from "@/lib/thresholds";
import type { HealthMetric, HeatColumn, HeatRow, Severity } from "@/components/shared/inspection";
import type { Finding } from "@/components/shared/findings-register";

const RATE = ELECTRICITY_RATES.RATE_PER_KWH;
const { SPIKE_CRITICAL, SPIKE_HIGH, DIP, MIN_BASELINE_KWH } = ELECTRICITY_THRESHOLDS;

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

/**
 * The single per-meter anomaly gate. `classifyLoadRatio` decides the ratio
 * bands, so this and the category heatmap can never disagree; the special cases
 * (missing / negative / zero) are kinds of fault the ratio cannot express.
 */
export function meterFlag(current: number | null, baseline: number): FlagKind {
    if (current === null) return "missing";
    if (current < 0) return "negative";
    if (baseline >= MIN_BASELINE_KWH) {
        if (current === 0) return "zero";
        const sev = classifyLoadRatio(current / baseline);
        if (sev === "critical") return "spike-crit";
        if (sev === "high") return "spike-high";
        if (sev === "watch") return "dip";
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
            // Single fact keeps the card calm; the "N flagged" signal badge and the
            // severity chip already carry the attention cue.
            facts: [
                { label: "cost", value: `${num(c.total * RATE)} OMR` },
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

export function buildCategoryHeatmap(
    model: ElectricityModel,
    onCell?: (type: string, month: string) => void,
): { columns: HeatColumn[]; rows: HeatRow[] } {
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
            cells: windowTotals.map((total, i) => {
                const ratio = baseline > 0 ? total / baseline : NaN;
                const severity: Severity = total <= 0
                    ? "nodata"
                    : baseline <= 0
                        ? "good"
                        : classifyLoadRatio(ratio);
                const ratioNote = Number.isFinite(ratio) ? ` · ${ratio.toFixed(2)}× the category baseline (${num(baseline)} kWh)` : "";
                return {
                    severity,
                    label: total > 0 ? String(Math.round(total / 1000)) : "0",
                    title: `${c.label} · ${months[i]}: ${num(total)} kWh${ratioNote}${onCell ? " — open this month's meters" : ""}`,
                    onClick: onCell ? () => onCell(c.type, months[i]) : undefined,
                };
            }),
        };
    });

    return { columns, rows };
}

/** The live gate sentence for the heatmap note — never hardcode these numbers in JSX. */
export const CATEGORY_HEATMAP_NOTE =
    `Each cell is one month's total draw for that category (in MWh), judged against that category's own average month. `
    + `${ELECTRICITY_GATE_LABELS.spikeCritical} = Critical, ${ELECTRICITY_GATE_LABELS.spikeHigh} = High, ${ELECTRICITY_GATE_LABELS.dip} = Watch. `
    + `Select a cell to open that month's meters for the category.`;

// ─── Findings register (current month, identification only) ───────────────────

const FLAG_META: Record<Exclude<FlagKind, null>, { item: string; action: string; severity: "Critical" | "Watch"; gate: string }> = {
    negative: {
        item: "Negative reading", severity: "Critical",
        gate: "any reading below 0 kWh",
        action: "Negative kWh — meter fault or reset; verify CT wiring and recalibrate/replace the meter.",
    },
    "spike-crit": {
        item: "Consumption spike", severity: "Critical",
        gate: ELECTRICITY_GATE_LABELS.spikeCritical,
        action: `kWh is ${SPIKE_CRITICAL}×+ the meter's baseline — inspect the load for faults and rule out a metering error.`,
    },
    zero: {
        item: "Zero consumption", severity: "Watch",
        gate: `0 kWh where ${ELECTRICITY_GATE_LABELS.minBaseline}`,
        action: "Meter read 0 kWh but normally consumes — check the breaker/supply and confirm the reading.",
    },
    "spike-high": {
        item: "Consumption spike", severity: "Watch",
        gate: ELECTRICITY_GATE_LABELS.spikeHigh,
        action: `kWh is ${SPIKE_HIGH}×+ the meter's baseline — review the load profile and confirm the reading is genuine.`,
    },
    dip: {
        item: "Consumption dip", severity: "Watch",
        gate: ELECTRICITY_GATE_LABELS.dip,
        action: `kWh at or below ${DIP}× the meter's baseline — check for a partial outage or a mis-read.`,
    },
    missing: {
        item: "Missing reading", severity: "Watch",
        gate: "no reading captured for the month",
        action: "No reading captured this month — schedule a manual read for this meter.",
    },
};

export function buildElectricityFindings(model: ElectricityModel): Finding[] {
    const rows: Finding[] = [];
    for (const c of model.categories) {
        for (const m of c.meters) {
            if (!m.flag) continue;
            const meta = FLAG_META[m.flag];
            const value = m.current === null
                ? "no read"
                : `${num(m.current, 1)} kWh`;
            const ratio = m.current !== null && m.baseline > 0 ? m.current / m.baseline : null;
            rows.push({
                id: `${m.id}-${m.flag}`,
                category: c.label,
                item: `${m.name}${m.account ? ` · ${m.account}` : ""} — ${meta.item}`,
                severity: meta.severity,
                value,
                remarks: [
                    m.baseline > 0 ? `baseline ${num(m.baseline)} kWh` : "no baseline in range",
                    ratio !== null ? `${ratio.toFixed(2)}× baseline` : null,
                    `gate: ${meta.gate}`,
                ].filter(Boolean).join(" · "),
                action: meta.action,
            });
        }
    }
    const rank = { Critical: 1, Watch: 0 } as const;
    return rows.sort((a, b) => rank[b.severity] - rank[a.severity]);
}
