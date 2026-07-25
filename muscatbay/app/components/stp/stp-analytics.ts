/**
 * STP analytics — turns the raw daily operations log into the inspection
 * language the Plant Watch surface renders. A single plant has no "zones", so
 * the inspection units here are the PROCESS DIMENSIONS an operator actually
 * watches: treatment efficiency, hydraulic load, TSE reuse, tanker load and
 * data completeness. Severity is data-relative (each day judged against the
 * period's own baseline) plus the recovery bands published in
 * `lib/thresholds.ts`, which mirror `lib/operational-alerts.ts` — so the page,
 * the dashboard alert feed and this module can never tell different stories.
 */

import { format } from "date-fns";
import type { STPOperation } from "@/lib/mock-data";
import { STP_RATES } from "@/lib/config";
import {
    STP_THRESHOLDS, classifyRecovery, classifyHydraulicLoad, classifyTankerTrips, describeSTPGates,
} from "@/lib/thresholds";
import type { HealthMetric, HeatRow, HeatColumn, Severity } from "@/components/shared/inspection";
import { collapseConsecutive, type Finding } from "@/components/inspection/findings-register";

const { TANKER_FEE, TSE_SAVING_RATE } = STP_RATES;
const {
    RECOVERY_GOOD, RECOVERY_WATCH, RECOVERY_CRITICAL,
    LOAD_HIGH, LOAD_WATCH, EFFICIENCY_DROP_PP,
} = STP_THRESHOLDS;

export const STP_GATE_NOTE = describeSTPGates();

export interface STPDay {
    id: string;
    date: Date;
    iso: string;          // yyyy-MM-dd
    dayLabel: string;     // "dd MMM"
    ym: string;           // yyyy-MM
    dom: number;          // day of month
    inlet: number;
    tse: number;          // kept RAW — a negative value is preserved, never clamped
    trips: number;
    eff: number | null;   // tse/inlet %, null when no inlet
    /** True when the logged TSE is below zero — physically impossible, so a data fault. */
    tseNegative: boolean;
}

export interface STPModel {
    days: STPDay[];
    baselineInlet: number;   // median non-zero daily inlet
    baselineTrips: number;   // median daily trips
    summary: {
        periodLabel: string;
        totalInlet: number;
        totalTSE: number;
        totalTrips: number;
        avgEfficiency: number | null;
        income: number;
        savings: number;
        economicImpact: number;
        daysLogged: number;
        daysExpected: number;
        /** daysLogged ÷ daysExpected as a percentage; null when the span is unknown. */
        completenessPct: number | null;
        /** Days inside the first→last span with no record at all. */
        missingDays: number;
    };
}

const num = (x: number, frac = 0) => x.toLocaleString("en-US", { maximumFractionDigits: frac });

function median(values: number[]): number {
    if (values.length === 0) return 0;
    const s = [...values].sort((a, b) => a - b);
    const mid = Math.floor(s.length / 2);
    return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/** Build the normalized day series + baselines from a (page-filtered) operations set. */
export function buildSTPModel(operations: STPOperation[]): STPModel {
    const days: STPDay[] = operations
        .map((op) => ({ op, date: new Date(op.date) }))
        // Guard null/invalid dates: date-fns `format` THROWS on an Invalid Date,
        // which would otherwise crash the whole Plant Watch render on one bad row.
        .filter(({ date }) => !Number.isNaN(date.getTime()))
        .map(({ op, date }) => {
            // Coerce numerics defensively — a string/null from Supabase would
            // otherwise poison every downstream sum with NaN. `Number(x) || 0`
            // maps NaN/null to 0 but PRESERVES negatives, which is deliberate:
            // a negative TSE is a real, documented data fault and must stay
            // visible rather than being flattened into "reuse stopped".
            const inlet = Number(op.inlet_sewage) || 0;
            const tse = Number(op.tse_for_irrigation) || 0;
            const trips = Number(op.tanker_trips) || 0;
            return {
                id: op.id,
                date,
                iso: format(date, "yyyy-MM-dd"),
                dayLabel: format(date, "dd MMM"),
                ym: format(date, "yyyy-MM"),
                dom: date.getDate(),
                inlet,
                tse,
                trips,
                eff: inlet > 0 ? (tse / inlet) * 100 : null,
                tseNegative: tse < 0,
            };
        })
        .sort((a, b) => a.date.getTime() - b.date.getTime());

    const baselineInlet = median(days.filter((d) => d.inlet > 0).map((d) => d.inlet));
    const baselineTrips = median(days.map((d) => d.trips));

    const totalInlet = days.reduce((s, d) => s + d.inlet, 0);
    const totalTSE = days.reduce((s, d) => s + d.tse, 0);
    const totalTrips = days.reduce((s, d) => s + d.trips, 0);
    const income = totalTrips * TANKER_FEE;
    const savings = totalTSE * TSE_SAVING_RATE;

    // Expected days = calendar span first→last (so gaps count as missing).
    let daysExpected = days.length;
    if (days.length > 1) {
        const spanMs = days[days.length - 1].date.getTime() - days[0].date.getTime();
        daysExpected = Math.round(spanMs / 86_400_000) + 1;
    }

    const periodLabel = days.length
        ? days.length === 1
            ? days[0].dayLabel
            : `${days[0].dayLabel} – ${days[days.length - 1].dayLabel}`
        : "—";

    return {
        days,
        baselineInlet,
        baselineTrips,
        summary: {
            periodLabel,
            totalInlet,
            totalTSE,
            totalTrips,
            avgEfficiency: totalInlet > 0 ? (totalTSE / totalInlet) * 100 : null,
            income,
            savings,
            economicImpact: income + savings,
            daysLogged: days.length,
            daysExpected,
            completenessPct: daysExpected > 0 ? (days.length / daysExpected) * 100 : null,
            missingDays: Math.max(0, daysExpected - days.length),
        },
    };
}

// ─── Per-day severity for each process dimension ──────────────────────────────
// All four delegate to lib/thresholds so Plant Watch, the heatmap, the findings
// register and the dashboard alert feed share one set of gates.

export const effSeverity = classifyRecovery;
const loadSeverity = classifyHydraulicLoad;
const tripsSeverity = classifyTankerTrips;

function tseSeverity(tse: number, inlet: number): Severity {
    if (tse < 0) return "critical";                // impossible value — data fault
    if (inlet <= 0) return "nodata";
    if (tse === 0) return "critical";              // reuse stopped while sewage came in
    return classifyRecovery((tse / inlet) * 100);
}

// ─── Health cards ─────────────────────────────────────────────────────────────

function tail<T>(arr: T[], k: number): T[] {
    return arr.slice(Math.max(0, arr.length - k));
}

export function buildHealthMetrics(model: STPModel): HealthMetric[] {
    const { days, baselineInlet, baselineTrips, summary } = model;
    const last14 = tail(days, 14);

    // 1 — Treatment efficiency
    const effDays = days.filter((d) => d.eff !== null);
    const avgEff = summary.avgEfficiency;
    const effSev = classifyRecovery(avgEff);
    // trailing run below target (leak-signature analogue)
    let effRun = 0;
    for (let i = days.length - 1; i >= 0; i--) {
        if (days[i].eff === null) continue;
        if ((days[i].eff as number) < RECOVERY_WATCH) effRun++; else break;
    }

    // 2 — Hydraulic load
    const recentInlet = tail(effDays.length ? days.filter((d) => d.inlet > 0) : days, 7);
    const recentAvgInlet = recentInlet.length ? recentInlet.reduce((s, d) => s + d.inlet, 0) / recentInlet.length : 0;
    const loadSev = loadSeverity(recentAvgInlet, baselineInlet);
    const surgeDays = days.filter((d) => d.inlet > 0 && baselineInlet > 0 && d.inlet / baselineInlet >= LOAD_WATCH).length;
    const peakInlet = days.reduce((m, d) => Math.max(m, d.inlet), 0);

    // 3 — TSE reuse. Negative days are counted separately from zero days: a
    // negative is a metering/data fault, a zero is "reuse stopped".
    const negativeReuse = days.filter((d) => d.tseNegative).length;
    const zeroReuse = days.filter((d) => d.inlet > 0 && d.tse === 0).length;
    const recovery = summary.totalInlet > 0 ? (summary.totalTSE / summary.totalInlet) * 100 : null;
    const tseSev: Severity = negativeReuse > 0 || zeroReuse > 0
        ? "critical"
        : classifyRecovery(recovery);

    // 4 — Tanker load
    const highTankerDays = days.filter((d) => tripsSeverity(d.trips, baselineTrips) !== "good").length;
    const tankerSev = highTankerDays === 0 ? "good" : days.some((d) => tripsSeverity(d.trips, baselineTrips) === "high") ? "high" : "watch";
    const avgTrips = days.length ? summary.totalTrips / days.length : 0;

    // 5 — Data completeness. Previously computed and never rendered, which meant
    // a period missing a third of its days looked as trustworthy as a full one.
    const completeness = summary.completenessPct;
    const completenessSev: Severity = completeness === null
        ? "nodata"
        : completeness >= 98 ? "good"
            : completeness >= 90 ? "watch"
                : completeness >= 75 ? "high" : "critical";

    return [
        {
            key: "efficiency",
            title: "Treatment Efficiency",
            severity: effSev,
            headline: avgEff !== null ? `${avgEff.toFixed(1)}%` : "—",
            headlineNote: `target ≥ ${RECOVERY_GOOD}% · TSE ÷ inlet`,
            facts: [
                { label: "best", value: effDays.length ? `${Math.max(...effDays.map((d) => d.eff as number)).toFixed(0)}%` : "—" },
                { label: "worst", value: effDays.length ? `${Math.min(...effDays.map((d) => d.eff as number)).toFixed(0)}%` : "—" },
            ],
            spark: last14.map((d) => d.eff),
            sparkNote: `${effDays.length} days measured`,
            signal: effRun >= 2 ? { label: `${effRun}d below ${RECOVERY_WATCH}%`, tone: "danger" } : undefined,
        },
        {
            key: "load",
            title: "Hydraulic Load",
            severity: loadSev,
            headline: `${num(recentAvgInlet)} m³`,
            headlineNote: `recent daily inlet · typical ${num(baselineInlet)} m³ · surge ≥ ${LOAD_HIGH}×`,
            facts: [
                { label: "peak", value: `${num(peakInlet)}` },
                { label: "total", value: `${num(summary.totalInlet)}` },
            ],
            spark: last14.map((d) => d.inlet),
            sparkNote: "14-day inlet trend",
            signal: surgeDays >= 2 ? { label: `${surgeDays}d elevated`, tone: "warning" } : undefined,
        },
        {
            key: "reuse",
            title: "TSE Reuse",
            severity: tseSev,
            headline: `${num(summary.totalTSE)} m³`,
            headlineNote: recovery !== null ? `${recovery.toFixed(0)}% of inlet reused for irrigation` : "no inlet in range",
            facts: [
                { label: "savings", value: `${num(summary.savings, 0)} OMR` },
                negativeReuse > 0
                    ? { label: "negative", value: String(negativeReuse) }
                    : { label: "zero-days", value: String(zeroReuse) },
            ],
            spark: last14.map((d) => d.tse),
            sparkNote: "14-day reuse output",
            signal: negativeReuse > 0
                ? { label: `${negativeReuse} negative reading${negativeReuse === 1 ? "" : "s"}`, tone: "danger" }
                : zeroReuse > 0 ? { label: `${zeroReuse} zero-output`, tone: "danger" } : undefined,
        },
        {
            key: "tankers",
            title: "Tanker Load",
            severity: tankerSev,
            headline: `${num(summary.totalTrips)}`,
            headlineNote: `trips · ~${avgTrips.toFixed(1)}/day · typical ${num(baselineTrips)}/day`,
            facts: [
                { label: "income", value: `${num(summary.income, 0)} OMR` },
                { label: "busy-days", value: String(highTankerDays) },
            ],
            spark: last14.map((d) => d.trips),
            sparkNote: "14-day tanker trips",
            signal: highTankerDays >= 2 ? { label: `${highTankerDays}d busy`, tone: "warning" } : undefined,
        },
        {
            key: "completeness",
            title: "Data Completeness",
            severity: completenessSev,
            headline: completeness !== null ? `${completeness.toFixed(0)}%` : "—",
            headlineNote: `${summary.daysLogged} of ${summary.daysExpected} calendar days logged`,
            facts: [
                { label: "missing", value: String(summary.missingDays) },
                { label: "logged", value: String(summary.daysLogged) },
            ],
        },
    ];
}

// ─── Metric × day heatmap (latest calendar month in range) ────────────────────

export function buildHeatmap(
    model: STPModel,
    onCell?: (day: STPDay) => void,
): { columns: HeatColumn[]; rows: HeatRow[] } {
    const { days, baselineInlet, baselineTrips } = model;
    if (days.length === 0) return { columns: [], rows: [] };

    const latestYm = days[days.length - 1].ym;
    const monthDays = days.filter((d) => d.ym === latestYm);
    const latestDom = monthDays.length ? monthDays[monthDays.length - 1].dom : 1;
    const byDom = new Map(monthDays.map((d) => [d.dom, d]));

    const columns: HeatColumn[] = Array.from({ length: latestDom }, (_, i) => ({
        key: i + 1,
        label: String(i + 1),
        highlight: i + 1 === latestDom,
    }));

    const mk = (
        label: string,
        sev: (d: STPDay) => Severity,
        val: (d: STPDay) => string,
    ): HeatRow => ({
        key: label,
        label,
        cells: columns.map((c) => {
            const d = byDom.get(c.key as number);
            if (!d) return { severity: "nodata" as Severity, label: "·", title: `Day ${c.key}: no record` };
            return {
                severity: sev(d),
                label: val(d),
                title: `${d.dayLabel}: ${label} ${val(d)}${onCell ? " — open this day in the operations log" : ""}`,
                onClick: onCell ? () => onCell(d) : undefined,
            };
        }),
    });

    return {
        columns,
        rows: [
            mk("Efficiency", (d) => classifyRecovery(d.eff), (d) => (d.eff !== null ? String(Math.round(d.eff)) : "·")),
            mk("Inlet load", (d) => loadSeverity(d.inlet, baselineInlet), (d) => (d.inlet > 0 ? String(Math.round(d.inlet / 100) / 10) : "0")),
            mk("TSE reuse", (d) => tseSeverity(d.tse, d.inlet), (d) => (d.tse !== 0 ? String(Math.round(d.tse / 100) / 10) : "0")),
            mk("Tankers", (d) => tripsSeverity(d.trips, baselineTrips), (d) => String(d.trips)),
        ],
    };
}

// ─── Findings register ────────────────────────────────────────────────────────
// Identification only: severity, item, value, remarks, suggested action. No
// owner, no status, no due date — management explicitly does not want assignment
// or resolution tracking here.

export function buildSTPFindings(model: STPModel): Finding[] {
    const { days, baselineInlet, baselineTrips } = model;
    const efficiency: Finding[] = [];
    const reuse: Finding[] = [];
    const negatives: Finding[] = [];
    const load: Finding[] = [];
    const uptime: Finding[] = [];
    const tankers: Finding[] = [];
    const drops: Finding[] = [];

    for (let i = 0; i < days.length; i++) {
        const d = days[i];

        // Efficiency band
        if (d.eff !== null) {
            const sev = classifyRecovery(d.eff);
            if (sev === "critical" || sev === "high") {
                efficiency.push({
                    id: `eff-${d.iso}`, date: d.dayLabel, category: "Treatment Efficiency",
                    item: "Low TSE recovery",
                    severity: sev === "critical" ? "Critical" : "Watch",
                    value: `${d.eff.toFixed(1)}%`,
                    remarks: `gate: < ${sev === "critical" ? RECOVERY_CRITICAL : RECOVERY_WATCH}% recovery`,
                    action: "Inspect aeration/treatment train and verify TSE flow metering; recovery is below the operating target.",
                });
            }
        }

        // Negative TSE — physically impossible, so a metering/entry fault. Kept
        // strictly apart from "reuse stopped" so the two never mask each other.
        if (d.tseNegative) {
            negatives.push({
                id: `tse-neg-${d.iso}`, date: d.dayLabel, category: "Data Integrity",
                item: "Negative TSE reading",
                severity: "Critical",
                value: `${num(d.tse, 1)} m³`,
                remarks: "impossible value — treated effluent cannot be negative",
                action: "Negative irrigation output logged — correct the daily entry and check the TSE flow meter for a reset or reversed reading.",
            });
        }

        // Reuse stopped while sewage arrived
        if (d.inlet > 0 && d.tse === 0) {
            reuse.push({
                id: `reuse-${d.iso}`, date: d.dayLabel, category: "TSE Reuse",
                item: "No irrigation output",
                severity: "Critical",
                value: `${num(d.inlet)} m³ in / 0 out`,
                remarks: "inlet recorded but zero reuse",
                action: "Irrigation reuse stopped — check TSE pumps, valves and storage; treated effluent may be leaving unused.",
            });
        }

        // Hydraulic surge
        if (d.inlet > 0 && baselineInlet > 0 && d.inlet / baselineInlet >= LOAD_HIGH) {
            load.push({
                id: `surge-${d.iso}`, date: d.dayLabel, category: "Hydraulic Load",
                item: "Inlet surge",
                severity: "Watch",
                value: `${num(d.inlet)} m³`,
                remarks: `${(d.inlet / baselineInlet).toFixed(1)}× typical · gate: ≥ ${LOAD_HIGH}× the period median (${num(baselineInlet)} m³)`,
                action: "Inlet well above typical — check for stormwater infiltration/inflow and confirm capacity headroom.",
            });
        }

        // No inlet on a day that exists in the log
        if (d.inlet <= 0) {
            uptime.push({
                id: `noinlet-${d.iso}`, date: d.dayLabel, category: "Data / Uptime",
                item: "No inlet recorded",
                severity: "Watch",
                value: "0 m³",
                remarks: "day present in the log with a zero inlet reading",
                action: "Zero inlet logged — confirm the plant was running and the daily reading was captured.",
            });
        }

        // Elevated tanker discharge
        if (tripsSeverity(d.trips, baselineTrips) === "high") {
            tankers.push({
                id: `tanker-${d.iso}`, date: d.dayLabel, category: "Tanker Load",
                item: "High tanker discharge",
                severity: "Watch",
                value: `${d.trips} trips`,
                remarks: `typical ${num(baselineTrips)}/day`,
                action: "Elevated tanker discharge — reconcile contractor logs; sustained highs can signal a network bypass.",
            });
        }

        // Sharp efficiency drop vs trailing week
        if (d.eff !== null && i >= 3) {
            const prior = days.slice(Math.max(0, i - 7), i).filter((p) => p.eff !== null).map((p) => p.eff as number);
            if (prior.length >= 3) {
                const mean = prior.reduce((s, v) => s + v, 0) / prior.length;
                if (mean - d.eff >= EFFICIENCY_DROP_PP) {
                    drops.push({
                        id: `drop-${d.iso}`, date: d.dayLabel, category: "Treatment Efficiency",
                        item: "Efficiency drop",
                        severity: "Watch",
                        value: `−${(mean - d.eff).toFixed(1)} pp`,
                        remarks: `vs the trailing 7-day mean (${mean.toFixed(1)}%) · gate: ≥ ${EFFICIENCY_DROP_PP} pp`,
                        action: "Recovery fell sharply against the trailing week — inspect process before it trends into a low-recovery run.",
                    });
                }
            }
        }
    }

    // Collapse runs of the SAME finding on consecutive log days. A month-long
    // outage used to emit 30 near-identical "No inlet recorded" rows that buried
    // every Critical row beneath them; it now reads as one row with a span and a
    // count. Each list is already in chronological order, so a run is contiguous.
    const rows = [
        ...negatives,
        ...reuse,
        ...collapseConsecutive(efficiency),
        ...collapseConsecutive(drops),
        ...collapseConsecutive(load),
        ...collapseConsecutive(tankers),
        ...collapseConsecutive(uptime),
    ];

    // Worst first; within a severity keep the grouped order (chronological).
    const sevRank = { Critical: 1, Watch: 0 } as const;
    return rows.sort((a, b) => sevRank[b.severity] - sevRank[a.severity]);
}
