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
import { collapseConsecutive, type Finding } from "@/components/shared/findings-register";

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
    inlet: number | null; // null = not recorded that day (never read as 0)
    tse: number | null;   // kept RAW — a negative value is preserved, never clamped; null = not recorded
    trips: number | null; // null = not recorded
    eff: number | null;   // tse/inlet %, null when no inlet or either figure is missing
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

/**
 * TSE recovery % for one day, or null when inlet is zero/missing or TSE was
 * not recorded — a missing figure gives no verdict rather than a false 0%.
 */
export function stpEfficiency(inlet: number | null, tse: number | null): number | null {
    return inlet !== null && inlet > 0 && tse !== null ? (tse / inlet) * 100 : null;
}

/** Add a reading to a running total; a missing reading adds nothing. Stays null until something is recorded. */
export function addReading(total: number | null, value: number | null): number | null {
    return value === null ? total : (total ?? 0) + value;
}

/** A reading for display: "—" when not recorded. */
export function fmtReading(value: number | null, digits = 1): string {
    return value === null ? "—" : value.toLocaleString("en-US", { maximumFractionDigits: digits });
}

/** A numeric reading, or null when missing or not a number. Negatives are kept. */
function reading(x: number | string | null | undefined): number | null {
    if (x === null || x === undefined || x === "") return null;
    const n = Number(x);
    return Number.isFinite(n) ? n : null;
}

/** The recorded (non-null) values of one field. */
function recorded(days: STPDay[], pick: (d: STPDay) => number | null): number[] {
    const out: number[] = [];
    for (const d of days) {
        const v = pick(d);
        if (v !== null) out.push(v);
    }
    return out;
}

const sum = (values: number[]) => values.reduce((s, v) => s + v, 0);

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
            // Coerce numerics defensively — a string from Supabase would
            // otherwise poison every downstream sum with NaN. A missing reading
            // stays null: it is "not recorded", never zero flow, so it cannot
            // raise a false "reuse stopped" finding. Negatives are PRESERVED,
            // deliberately: a negative TSE is a real, documented data fault and
            // must stay visible rather than being flattened.
            const inlet = reading(op.inlet_sewage);
            const tse = reading(op.tse_for_irrigation);
            const trips = reading(op.tanker_trips);
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
                eff: inlet !== null && inlet > 0 && tse !== null ? (tse / inlet) * 100 : null,
                tseNegative: tse !== null && tse < 0,
            };
        })
        .sort((a, b) => a.date.getTime() - b.date.getTime());

    const baselineInlet = median(recorded(days, (d) => d.inlet).filter((v) => v > 0));
    const baselineTrips = median(recorded(days, (d) => d.trips));

    // Totals sum what was recorded; a missing day adds nothing (it is not 0).
    const totalInlet = sum(recorded(days, (d) => d.inlet));
    const totalTSE = sum(recorded(days, (d) => d.tse));
    const totalTrips = sum(recorded(days, (d) => d.trips));
    // Efficiency only from days where BOTH figures were recorded — otherwise a
    // half-entered day would pull recovery down (or up).
    const paired = days.filter((d) => d.inlet !== null && d.tse !== null);
    const pairedInlet = sum(recorded(paired, (d) => d.inlet));
    const pairedTSE = sum(recorded(paired, (d) => d.tse));
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
            avgEfficiency: pairedInlet > 0 ? (pairedTSE / pairedInlet) * 100 : null,
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

function tseSeverity(tse: number | null, inlet: number | null): Severity {
    if (tse === null) return "nodata";             // not recorded — no verdict
    if (tse < 0) return "critical";                // impossible value — data fault
    if (inlet === null || inlet <= 0) return "nodata";
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
    const inlets = recorded(days, (d) => d.inlet);
    const recentInlet = tail(effDays.length ? inlets.filter((v) => v > 0) : inlets, 7);
    const recentAvgInlet = recentInlet.length ? sum(recentInlet) / recentInlet.length : 0;
    const loadSev = loadSeverity(recentAvgInlet, baselineInlet);
    const surgeDays = inlets.filter((v) => v > 0 && baselineInlet > 0 && v / baselineInlet >= LOAD_WATCH).length;
    const peakInlet = inlets.reduce((m, v) => Math.max(m, v), 0);

    // 3 — TSE reuse. Negative days are counted separately from zero days: a
    // negative is a metering/data fault, a zero is "reuse stopped".
    const negativeReuse = days.filter((d) => d.tseNegative).length;
    // Only a RECORDED zero counts; an unentered TSE figure is not "reuse stopped".
    const zeroReuse = days.filter((d) => d.inlet !== null && d.inlet > 0 && d.tse === 0).length;
    const recovery = summary.avgEfficiency;
    const tseSev: Severity = negativeReuse > 0 || zeroReuse > 0
        ? "critical"
        : classifyRecovery(recovery);

    // 4 — Tanker load
    const trips = recorded(days, (d) => d.trips);
    const highTankerDays = trips.filter((t) => tripsSeverity(t, baselineTrips) !== "good").length;
    const tankerSev = highTankerDays === 0 ? "good" : trips.some((t) => tripsSeverity(t, baselineTrips) === "high") ? "high" : "watch";
    const avgTrips = trips.length ? summary.totalTrips / trips.length : 0;

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
            mk("Inlet load", (d) => (d.inlet === null ? "nodata" : loadSeverity(d.inlet, baselineInlet)), (d) => (d.inlet === null ? "—" : d.inlet > 0 ? String(Math.round(d.inlet / 100) / 10) : "0")),
            mk("TSE reuse", (d) => tseSeverity(d.tse, d.inlet), (d) => (d.tse === null ? "—" : d.tse !== 0 ? String(Math.round(d.tse / 100) / 10) : "0")),
            mk("Tankers", (d) => (d.trips === null ? "nodata" : tripsSeverity(d.trips, baselineTrips)), (d) => (d.trips === null ? "—" : String(d.trips))),
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
                value: `${num(d.tse ?? 0, 1)} m³`,
                remarks: "impossible value — treated effluent cannot be negative",
                action: "Negative irrigation output logged — correct the daily entry and check the TSE flow meter for a reset or reversed reading.",
            });
        }

        // Reuse stopped while sewage arrived
        if (d.inlet !== null && d.inlet > 0 && d.tse === 0) {
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
        if (d.inlet !== null && d.inlet > 0 && baselineInlet > 0 && d.inlet / baselineInlet >= LOAD_HIGH) {
            load.push({
                id: `surge-${d.iso}`, date: d.dayLabel, category: "Hydraulic Load",
                item: "Inlet surge",
                severity: "Watch",
                value: `${num(d.inlet)} m³`,
                remarks: `${(d.inlet / baselineInlet).toFixed(1)}× typical · gate: ≥ ${LOAD_HIGH}× the period median (${num(baselineInlet)} m³)`,
                action: "Inlet well above typical — check for stormwater infiltration/inflow and confirm capacity headroom.",
            });
        }

        // A day in the log with no inlet figure at all — a missing entry, kept
        // apart from a recorded zero so the two never read as the same thing.
        if (d.inlet === null) {
            uptime.push({
                id: `noinlet-${d.iso}`, date: d.dayLabel, category: "Data / Uptime",
                item: "Inlet reading missing",
                severity: "Watch",
                value: "—",
                remarks: "day present in the log with no inlet figure",
                action: "Inlet not entered for this day — complete the daily log so totals and recovery include it.",
            });
        } else if (d.inlet <= 0) {
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
        if (d.trips !== null && tripsSeverity(d.trips, baselineTrips) === "high") {
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
