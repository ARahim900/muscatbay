/**
 * Report composition — turning rule output into the two documents an operator
 * reads: a daily completeness report and a monthly one.
 *
 * A report is a plain object. It knows nothing about React, Supabase or the
 * DOM, which is what lets the same value drive the dashboard, the CSV export
 * and (later, if the owner wants it) an emailed digest, without any of the
 * three re-deriving the figures and drifting apart.
 *
 * Three honesty properties every report holds
 * -------------------------------------------
 *  1. **Partial is labelled partial.** A source that failed to read produces a
 *     `nodata` section and sets `partial`; it never contributes a clean zero.
 *  2. **Unmonitored is named.** `unmonitored` lists the modules that have no
 *     periodic-entry contract at all. Silence about a module would read as
 *     "that one is fine" — which is a lie by omission in a completeness report.
 *  3. **Completeness excludes what could not be assessed.** The headline
 *     percentage is computed only over sections that actually returned a
 *     result, and is `null` when none did.
 *
 * @module lib/monitoring/report
 */

import { bySeverity, formatPct, sumCoverage, worstSeverity } from "./coverage";
import {
    DAILY_WINDOW_DAYS,
    MONTHLY_TREND_MONTHS,
    describeDailyCadence,
    describeMonthlyCadence,
} from "./config";
import { dueDayWindow, dueMonthWindow, formatDay, newestDueMonth } from "./calendar";
import { evaluateDailyRules, type DailyMeterMonth, type StpDayRecord } from "./daily";
import {
    evaluateMonthlyRules,
    type ElectricityMeterRef,
    type ElectricityReadingRef,
    type WaterMeterRef,
} from "./monthly";
import { evaluateRenewals, type RenewalItem } from "./renewals";
import type { ContractorTracker } from "@/entities/contractor";
import type {
    MonitoringFinding,
    MonitoringReport,
    ReportSection,
    Severity,
    SourceStatus,
} from "./types";

/**
 * Modules with no periodic-entry contract, listed in every report so their
 * absence is stated rather than implied.
 *
 * These are not unmonitored *systems* — each has its own page and its own
 * anomaly rules. They simply have no "an entry is expected every day/month"
 * obligation for this monitor to check. Give one such an obligation and it
 * moves out of this list and into a rule module.
 */
export const UNMONITORED_SECTIONS = [
    "Assets — register (no periodic-entry obligation defined)",
    "HVAC — findings (event-driven, not periodic)",
    "Fire Safety — PPM (cycle-driven, not periodic)",
    "Pest Control — service log (held in AITable, not readable from here)",
] as const;

/* ------------------------------------------------------------------ */
/*  Shared                                                             */
/* ------------------------------------------------------------------ */

/**
 * Roll the entry-completeness sections up into one figure.
 *
 * Sections that could not be read are excluded rather than counted as zero —
 * an unread source drags a percentage down exactly as dishonestly as it would
 * prop one up. So is a section measuring something other than entries per
 * period (see `excludeFromCompleteness`). `null` when nothing qualifies.
 */
function overallCompleteness(sections: ReportSection[]): number | null {
    const assessable = sections.filter(
        (s) => !s.unavailable && !s.excludeFromCompleteness && s.coverage.expected > 0,
    );
    if (assessable.length === 0) return null;
    return sumCoverage(assessable.map((s) => s.coverage)).pct;
}

function orderFindings(findings: MonitoringFinding[]): MonitoringFinding[] {
    return [...findings].sort((a, b) => {
        const severity = bySeverity(a, b);
        if (severity !== 0) return severity;
        // Newest period first within a severity — today's gap before last week's.
        return b.period.localeCompare(a.period);
    });
}

/* ------------------------------------------------------------------ */
/*  Daily report                                                       */
/* ------------------------------------------------------------------ */

export interface DailyReportInputs {
    /** Wide daily rows covering the window's months; `null` when the read failed. */
    waterRows: DailyMeterMonth[] | null;
    /** STP daily log; `null` when the read failed. */
    stpRows: StpDayRecord[] | null;
    /** Contractor register; `null` when the read failed. Renewals ride the daily report. */
    contractors: ContractorTracker[] | null;
    sources: SourceStatus[];
    now: Date;
    /** Override the window length; defaults to `DAILY_WINDOW_DAYS`. */
    windowDays?: number;
}

export interface DailyMonitoringReport extends MonitoringReport {
    kind: "daily";
    /** Due days covered, oldest first — the heatmap's columns. */
    days: Date[];
    /** Renewal ladder rows, so the daily surface can list them without re-deriving. */
    renewals: RenewalItem[];
    cadenceNote: string;
}

export function composeDailyReport(inputs: DailyReportInputs): DailyMonitoringReport {
    const days = dueDayWindow(inputs.now, inputs.windowDays ?? DAILY_WINDOW_DAYS);

    const daily = evaluateDailyRules({
        days,
        waterRows: inputs.waterRows,
        stpRows: inputs.stpRows,
        now: inputs.now,
    });
    const renewals = evaluateRenewals(inputs.contractors, inputs.now);

    const sections = [daily.waterSection, daily.stpSection, renewals.section];
    const findings = orderFindings([...daily.findings, ...renewals.findings]);

    return {
        kind: "daily",
        periodLabel: days.length === 1
            ? formatDay(days[0])
            : `${formatDay(days[0])} – ${formatDay(days[days.length - 1])}`,
        generatedAt: inputs.now.toISOString(),
        sections,
        findings,
        sources: inputs.sources,
        unmonitored: [...UNMONITORED_SECTIONS],
        completeness: overallCompleteness(sections),
        partial: inputs.sources.some((s) => s.state === "error" || s.state === "not-configured"),
        days,
        renewals: renewals.items,
        cadenceNote: describeDailyCadence(),
    };
}

/* ------------------------------------------------------------------ */
/*  Monthly report                                                     */
/* ------------------------------------------------------------------ */

export interface MonthlyReportInputs {
    electricityMeters: ElectricityMeterRef[] | null;
    electricityReadings: ElectricityReadingRef[] | null;
    waterMeters: WaterMeterRef[] | null;
    derivedMonths: string[];
    contractors: ContractorTracker[] | null;
    sources: SourceStatus[];
    now: Date;
    /** Override the trend length; defaults to `MONTHLY_TREND_MONTHS`. */
    trendMonths?: number;
}

export interface MonthlyMonitoringReport extends MonitoringReport {
    kind: "monthly";
    /** The month reported on — the newest month whose entries are due. */
    monthKey: string;
    /** Trend months, oldest first. */
    trend: { key: string; label: string }[];
    renewals: RenewalItem[];
    cadenceNote: string;
}

export function composeMonthlyReport(inputs: MonthlyReportInputs): MonthlyMonitoringReport {
    const months = dueMonthWindow(inputs.now, inputs.trendMonths ?? MONTHLY_TREND_MONTHS);
    const reported = newestDueMonth(inputs.now);

    const monthly = evaluateMonthlyRules({
        months,
        electricityMeters: inputs.electricityMeters,
        electricityReadings: inputs.electricityReadings,
        waterMeters: inputs.waterMeters,
        derivedMonths: inputs.derivedMonths,
        now: inputs.now,
    });
    const renewals = evaluateRenewals(inputs.contractors, inputs.now);

    const sections = [monthly.electricitySection, monthly.waterSection, renewals.section];
    const findings = orderFindings([...monthly.findings, ...renewals.findings]);

    return {
        kind: "monthly",
        periodLabel: reported.label,
        monthKey: reported.key,
        generatedAt: inputs.now.toISOString(),
        sections,
        findings,
        sources: inputs.sources,
        unmonitored: [...UNMONITORED_SECTIONS],
        completeness: overallCompleteness(sections),
        partial: inputs.sources.some((s) => s.state === "error" || s.state === "not-configured"),
        trend: months.map((m) => ({ key: m.key, label: m.label })),
        renewals: renewals.items,
        cadenceNote: describeMonthlyCadence(),
    };
}

/* ------------------------------------------------------------------ */
/*  Summary + export                                                   */
/* ------------------------------------------------------------------ */

export interface ReportSummary {
    completenessLabel: string;
    severity: Severity;
    confirmedIssues: number;
    critical: number;
    /** Sections that could not be assessed at all. */
    blindSections: string[];
}

/** The three numbers a reader needs before deciding whether to read further. */
export function summarise(report: MonitoringReport): ReportSummary {
    return {
        completenessLabel: formatPct(report.completeness),
        severity: worstSeverity(report.sections.map((s) => s.severity)),
        confirmedIssues: report.findings.length,
        critical: report.findings.filter((f) => f.severity === "critical").length,
        blindSections: report.sections.filter((s) => s.unavailable).map((s) => s.title),
    };
}

/** One flat row per finding — the CSV an operator takes off the page. */
export interface ReportCsvRow extends Record<string, unknown> {
    Period: string;
    Section: string;
    Severity: string;
    Type: string;
    "Confirmed issue": string;
    "Affected data points": string;
    "Recommended check": string;
}

export function reportToCsvRows(report: MonitoringReport): ReportCsvRow[] {
    return report.findings.map((finding) => ({
        Period: finding.period,
        Section: finding.section,
        Severity: finding.severity,
        Type: finding.kind,
        "Confirmed issue": finding.confirmed,
        "Affected data points": finding.affected.map((a) => `${a.label} [${a.id}]`).join(" | "),
        "Recommended check": finding.recommendation,
    }));
}
