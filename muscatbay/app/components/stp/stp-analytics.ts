/**
 * STP analytics — turns the raw daily operations log into the inspection
 * language the Plant Watch surface renders. A single plant has no "zones", so
 * the inspection units here are the PROCESS DIMENSIONS an operator actually
 * watches: treatment efficiency, hydraulic load, TSE reuse, tanker load and
 * data completeness. Severity is data-relative (each day judged against the
 * period's own baseline) plus the efficiency bands the section already uses,
 * so it stays honest without a hard-coded plant nameplate.
 */

import { format } from "date-fns";
import type { STPOperation } from "@/lib/mock-data";
import { STP_RATES } from "@/lib/config";
import type { HealthMetric, HeatRow, HeatColumn, ExceptionRow, Severity } from "@/components/shared/inspection";

const { TANKER_FEE, TSE_SAVING_RATE } = STP_RATES;

// ─── Thresholds (named so they read as plant policy, not magic numbers) ───────
const EFF_GOOD = 95;    // ≥95% TSE recovery = healthy (matches the section's badge)
const EFF_WATCH = 90;   // 90–95% = keep an eye on it
const EFF_HIGH = 80;    // 80–90% = investigate; <80% = critical
const LOAD_HIGH = 1.4;  // inlet ≥ 1.4× the period baseline = hydraulic surge
const LOAD_WATCH = 1.2; // inlet ≥ 1.2× baseline = elevated
const LOAD_LOW = 0.4;   // inlet ≤ 0.4× baseline (but non-zero) = possible plant issue

export interface STPDay {
    id: string;
    date: Date;
    iso: string;          // yyyy-MM-dd
    dayLabel: string;     // "dd MMM"
    ym: string;           // yyyy-MM
    dom: number;          // day of month
    inlet: number;
    tse: number;
    trips: number;
    eff: number | null;   // tse/inlet %, null when no inlet
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
        .map((op) => {
            const date = new Date(op.date);
            return {
                id: op.id,
                date,
                iso: format(date, "yyyy-MM-dd"),
                dayLabel: format(date, "dd MMM"),
                ym: format(date, "yyyy-MM"),
                dom: date.getDate(),
                inlet: op.inlet_sewage,
                tse: op.tse_for_irrigation,
                trips: op.tanker_trips,
                eff: op.inlet_sewage > 0 ? (op.tse_for_irrigation / op.inlet_sewage) * 100 : null,
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
        },
    };
}

// ─── Per-day severity for each process dimension ──────────────────────────────

export function effSeverity(eff: number | null): Severity {
    if (eff === null) return "nodata";
    if (eff >= EFF_GOOD) return "good";
    if (eff >= EFF_WATCH) return "watch";
    if (eff >= EFF_HIGH) return "high";
    return "critical";
}

function loadSeverity(inlet: number, baseline: number): Severity {
    if (inlet <= 0) return "nodata";
    if (baseline <= 0) return "good";
    const r = inlet / baseline;
    if (r >= LOAD_HIGH) return "high";
    if (r >= LOAD_WATCH || r <= LOAD_LOW) return "watch";
    return "good";
}

function tseSeverity(tse: number, inlet: number): Severity {
    if (inlet <= 0) return "nodata";
    if (tse <= 0) return "critical";              // reuse stopped while sewage came in
    const recovery = tse / inlet;
    if (recovery < 0.8) return "high";
    if (recovery < 0.9) return "watch";
    return "good";
}

function tripsSeverity(trips: number, baseline: number): Severity {
    const highGate = Math.max(4, Math.ceil(baseline * 2));
    const watchGate = Math.max(3, Math.ceil(baseline) + 2);
    if (trips >= highGate) return "high";
    if (trips >= watchGate) return "watch";
    return "good";
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
    const effSev = effSeverity(avgEff);
    // trailing run below target (leak-signature analogue)
    let effRun = 0;
    for (let i = days.length - 1; i >= 0; i--) {
        if (days[i].eff === null) continue;
        if ((days[i].eff as number) < EFF_WATCH) effRun++; else break;
    }

    // 2 — Hydraulic load
    const recentInlet = tail(effDays.length ? days.filter((d) => d.inlet > 0) : days, 7);
    const recentAvgInlet = recentInlet.length ? recentInlet.reduce((s, d) => s + d.inlet, 0) / recentInlet.length : 0;
    const loadSev = loadSeverity(recentAvgInlet, baselineInlet);
    const surgeDays = days.filter((d) => d.inlet > 0 && baselineInlet > 0 && d.inlet / baselineInlet >= LOAD_WATCH).length;
    const peakInlet = days.reduce((m, d) => Math.max(m, d.inlet), 0);

    // 3 — TSE reuse
    const zeroReuse = days.filter((d) => d.inlet > 0 && d.tse <= 0).length;
    const recovery = summary.totalInlet > 0 ? (summary.totalTSE / summary.totalInlet) * 100 : null;
    const tseSev: Severity = zeroReuse > 0 ? "critical" : recovery === null ? "nodata" : recovery < 80 ? "high" : recovery < 90 ? "watch" : "good";

    // 4 — Tanker load
    const highTankerDays = days.filter((d) => tripsSeverity(d.trips, baselineTrips) !== "good").length;
    const tankerSev = highTankerDays === 0 ? "good" : days.some((d) => tripsSeverity(d.trips, baselineTrips) === "high") ? "high" : "watch";
    const avgTrips = days.length ? summary.totalTrips / days.length : 0;

    return [
        {
            key: "efficiency",
            title: "Treatment Efficiency",
            severity: effSev,
            headline: avgEff !== null ? `${avgEff.toFixed(1)}%` : "—",
            headlineNote: `target ≥ ${EFF_GOOD}% · TSE ÷ inlet`,
            facts: [
                { label: "best", value: effDays.length ? `${Math.max(...effDays.map((d) => d.eff as number)).toFixed(0)}%` : "—" },
                { label: "worst", value: effDays.length ? `${Math.min(...effDays.map((d) => d.eff as number)).toFixed(0)}%` : "—" },
            ],
            spark: last14.map((d) => d.eff),
            sparkNote: `${effDays.length} days measured`,
            signal: effRun >= 2 ? { label: `${effRun}d below target`, tone: "danger" } : undefined,
        },
        {
            key: "load",
            title: "Hydraulic Load",
            severity: loadSev,
            headline: `${num(recentAvgInlet)} m³`,
            headlineNote: `recent daily inlet · typical ${num(baselineInlet)} m³`,
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
                { label: "zero-days", value: String(zeroReuse) },
            ],
            spark: last14.map((d) => d.tse),
            sparkNote: "14-day reuse output",
            signal: zeroReuse > 0 ? { label: `${zeroReuse} zero-output`, tone: "danger" } : undefined,
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
    ];
}

// ─── Metric × day heatmap (latest calendar month in range) ────────────────────

export function buildHeatmap(model: STPModel): { columns: HeatColumn[]; rows: HeatRow[] } {
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
            return { severity: sev(d), label: val(d), title: `${d.dayLabel}: ${label} ${val(d)}` };
        }),
    });

    return {
        columns,
        rows: [
            mk("Efficiency", (d) => effSeverity(d.eff), (d) => (d.eff !== null ? String(Math.round(d.eff)) : "·")),
            mk("Inlet load", (d) => loadSeverity(d.inlet, baselineInlet), (d) => (d.inlet > 0 ? String(Math.round(d.inlet / 100) / 10) : "0")),
            mk("TSE reuse", (d) => tseSeverity(d.tse, d.inlet), (d) => (d.tse > 0 ? String(Math.round(d.tse / 100) / 10) : "0")),
            mk("Tankers", (d) => tripsSeverity(d.trips, baselineTrips), (d) => String(d.trips)),
        ],
    };
}

// ─── Exceptions & Actions register ────────────────────────────────────────────

const OWNER = "STP Operations";

export function buildSTPExceptions(model: STPModel): ExceptionRow[] {
    const { days, baselineInlet, baselineTrips } = model;
    const rows: ExceptionRow[] = [];

    // Trailing 7-day efficiency mean, recomputed as we walk forward, for drop detection.
    for (let i = 0; i < days.length; i++) {
        const d = days[i];

        // Efficiency band
        if (d.eff !== null) {
            const sev = effSeverity(d.eff);
            if (sev === "critical" || sev === "high") {
                rows.push({
                    Date: d.dayLabel, Category: "Treatment Efficiency", Item: "Low TSE recovery",
                    Severity: sev === "critical" ? "Critical" : "Watch",
                    Value: `${d.eff.toFixed(1)}%`, Owner: OWNER, Status: "Open",
                    Action: "Inspect aeration/treatment train and verify TSE flow metering; recovery is below the operating target.",
                });
            }
        }

        // Reuse stopped while sewage arrived
        if (d.inlet > 0 && d.tse <= 0) {
            rows.push({
                Date: d.dayLabel, Category: "TSE Reuse", Item: "No irrigation output",
                Severity: "Critical", Value: `${num(d.inlet)} m³ in / 0 out`, Owner: OWNER, Status: "Open",
                Action: "Irrigation reuse stopped — check TSE pumps, valves and storage; treated effluent may be leaving unused.",
            });
        }

        // Hydraulic surge
        if (d.inlet > 0 && baselineInlet > 0 && d.inlet / baselineInlet >= LOAD_HIGH) {
            rows.push({
                Date: d.dayLabel, Category: "Hydraulic Load", Item: "Inlet surge",
                Severity: "Watch", Value: `${num(d.inlet)} m³ (${(d.inlet / baselineInlet).toFixed(1)}× typical)`, Owner: OWNER, Status: "Open",
                Action: "Inlet well above typical — check for stormwater infiltration/inflow and confirm capacity headroom.",
            });
        }

        // No inlet on a day that exists in the log
        if (d.inlet <= 0) {
            rows.push({
                Date: d.dayLabel, Category: "Data / Uptime", Item: "No inlet recorded",
                Severity: "Watch", Value: "0 m³", Owner: OWNER, Status: "Open",
                Action: "Zero inlet logged — confirm the plant was running and the daily reading was captured.",
            });
        }

        // Elevated tanker discharge
        if (tripsSeverity(d.trips, baselineTrips) === "high") {
            rows.push({
                Date: d.dayLabel, Category: "Tanker Load", Item: "High tanker discharge",
                Severity: "Watch", Value: `${d.trips} trips`, Owner: OWNER, Status: "Open",
                Action: "Elevated tanker discharge — reconcile contractor logs; sustained highs can signal a network bypass.",
            });
        }

        // Sharp efficiency drop vs trailing week
        if (d.eff !== null && i >= 3) {
            const prior = days.slice(Math.max(0, i - 7), i).filter((p) => p.eff !== null).map((p) => p.eff as number);
            if (prior.length >= 3) {
                const mean = prior.reduce((s, v) => s + v, 0) / prior.length;
                if (mean - d.eff >= 10) {
                    rows.push({
                        Date: d.dayLabel, Category: "Treatment Efficiency", Item: "Efficiency drop",
                        Severity: "Watch", Value: `−${(mean - d.eff).toFixed(1)} pp vs 7-day`, Owner: OWNER, Status: "Open",
                        Action: "Recovery fell sharply against the trailing week — inspect process before it trends into a low-recovery run.",
                    });
                }
            }
        }
    }

    // Worst first, then most recent first within a severity.
    const sevRank = { Critical: 1, Watch: 0 } as const;
    return rows.sort((a, b) => sevRank[b.Severity] - sevRank[a.Severity]);
}
