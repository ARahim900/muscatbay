/**
 * Monthly monitoring rules — did the month that has closed actually get its
 * entries?
 *
 * Two sections today:
 *  1. **Electricity — Monthly readings** (`electricity_meters` ×
 *     `electricity_readings`), the section the owner named.
 *  2. **Water — Monthly billing reads** (`water_meters` ×
 *     `water_monthly_consumption`).
 *
 * Adding a third is a matter of writing one `evaluate*` here and listing it in
 * `./report`; the report already names every module it does *not* monitor, so
 * an unmonitored section can never be mistaken for a healthy one.
 *
 * Two semantics this file is careful about
 * ----------------------------------------
 *  - **Electricity blanks are an answer.** A reading row whose `consumption` is
 *    NULL means "closed / not in service" that month — the electricity master
 *    spreadsheet's documented rule, preserved end-to-end by
 *    `functions/api/electricity.ts`. That is *not* a missing entry, and it is
 *    counted separately rather than being folded into either side.
 *  - **Water month-to-date is not a billing read.** When the official monthly
 *    import has not landed, `fetchWaterMeters` fills the month from sums of the
 *    real daily readings and names it in `derivedMonths`. Those figures are
 *    aggregation, not estimation — but they are not the official record, so the
 *    month is reported as provenance-flagged rather than complete.
 *
 * @module lib/monitoring/monthly
 */

import { classifyCoverage, coverage, formatCoverage, worstSeverity } from "./coverage";
import { describeCoverageGates } from "./config";
import type { DueMonth } from "./calendar";
import type {
    AffectedRef,
    CoverageBreakdownRow,
    MonitoringFinding,
    ReportSection,
} from "./types";

/* ------------------------------------------------------------------ */
/*  Inputs                                                             */
/* ------------------------------------------------------------------ */

export interface ElectricityMeterRef {
    id: string;
    name: string;
    accountNumber: string;
    /** `meter_type` — the category Load Watch groups by. */
    type: string;
}

/** One `electricity_readings` row, with NULL preserved (it carries meaning). */
export interface ElectricityReadingRef {
    meterId: string;
    /** `Jul-26`. */
    month: string;
    consumption: number | null;
}

export interface WaterMeterRef {
    account: string;
    label: string;
    /** L1 / L2 / L3 / L4 / DC — used to group the breakdown. */
    level: string;
    /** `Mon-YY` → reading. Key absent = no row; value null = row with a blank read. */
    consumption: Record<string, number | null>;
}

export interface MonthlyRuleInput {
    /** Months to trend over, oldest first; the last one is the month reported on. */
    months: DueMonth[];
    electricityMeters: ElectricityMeterRef[] | null;
    electricityReadings: ElectricityReadingRef[] | null;
    waterMeters: WaterMeterRef[] | null;
    /** Month keys whose water figures are month-to-date daily sums, not billing reads. */
    derivedMonths: string[];
    now: Date;
}

export interface MonthlyRuleResult {
    electricitySection: ReportSection;
    waterSection: ReportSection;
    findings: MonitoringFinding[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function nameList(items: string[], cap = 4): string {
    if (items.length <= cap) return items.join(", ");
    return `${items.slice(0, cap).join(", ")} and ${items.length - cap} more`;
}

const UNAVAILABLE_SECTION = (key: string, title: string, href: string, reason: string): ReportSection => ({
    key,
    title,
    href,
    severity: "nodata",
    coverage: coverage(0, 0),
    headline: reason,
    breakdown: [],
    unavailable: reason,
});

/* ------------------------------------------------------------------ */
/*  1. Electricity — Monthly readings                                  */
/* ------------------------------------------------------------------ */

interface ElectricityMonthResult {
    month: DueMonth;
    missing: ElectricityMeterRef[];
    /** Meters whose row exists with a NULL reading — recorded as not in service. */
    notInService: ElectricityMeterRef[];
    recorded: number;
    duplicates: { meter: ElectricityMeterRef; count: number }[];
    negatives: { meter: ElectricityMeterRef; value: number }[];
}

export function evaluateElectricityMonth(
    meters: ElectricityMeterRef[],
    readings: ElectricityReadingRef[],
    month: DueMonth,
): ElectricityMonthResult {
    const byMeter = new Map<string, ElectricityReadingRef[]>();
    for (const reading of readings) {
        if (reading.month !== month.key) continue;
        const list = byMeter.get(reading.meterId);
        if (list) list.push(reading);
        else byMeter.set(reading.meterId, [reading]);
    }

    const missing: ElectricityMeterRef[] = [];
    const notInService: ElectricityMeterRef[] = [];
    const duplicates: { meter: ElectricityMeterRef; count: number }[] = [];
    const negatives: { meter: ElectricityMeterRef; value: number }[] = [];
    let recorded = 0;

    for (const meter of meters) {
        const rows = byMeter.get(meter.id) ?? [];
        if (rows.length === 0) {
            missing.push(meter);
            continue;
        }
        if (rows.length > 1) duplicates.push({ meter, count: rows.length });

        const values = rows.map((r) => r.consumption).filter((v): v is number => v !== null);
        if (values.length === 0) {
            // Row present, consumption NULL — "closed / not in service" this month.
            notInService.push(meter);
            continue;
        }
        recorded += 1;
        for (const value of values) {
            if (value < 0) negatives.push({ meter, value });
        }
    }

    return { month, missing, notInService, recorded, duplicates, negatives };
}

function electricitySection(results: ElectricityMonthResult[], meterCount: number): ReportSection {
    const breakdown: CoverageBreakdownRow[] = results.map((r) => {
        const stat = coverage(meterCount, r.recorded, r.notInService.length);
        return {
            key: r.month.key,
            label: r.month.label,
            severity: classifyCoverage(stat),
            coverage: stat,
            note: r.notInService.length
                ? `${r.notInService.length} recorded as not in service`
                : undefined,
        };
    });

    const latest = results[results.length - 1];
    const latestStat = breakdown[breakdown.length - 1]?.coverage ?? coverage(0, 0);

    return {
        key: "electricity-monthly",
        title: "Electricity — Monthly readings",
        href: "/electricity",
        severity: classifyCoverage(latestStat),
        coverage: latestStat,
        headline: latest
            ? `${latest.month.label}: ${formatCoverage(latestStat)}`
            : "No due month to assess",
        breakdown,
        gateNote: `${describeCoverageGates()} A reading row with a blank consumption means the meter was closed or out of service that month — that is an answer, not a gap, and is counted separately.`,
    };
}

function electricityFindings(results: ElectricityMonthResult[]): MonitoringFinding[] {
    const findings: MonitoringFinding[] = [];
    const latest = results[results.length - 1];
    if (!latest) return findings;

    if (latest.missing.length > 0) {
        const byType = new Map<string, number>();
        for (const meter of latest.missing) byType.set(meter.type, (byType.get(meter.type) ?? 0) + 1);
        findings.push({
            id: `electricity-monthly-missing:${latest.month.key}`,
            kind: "missing",
            severity: classifyCoverage(
                coverage(latest.missing.length + latest.recorded + latest.notInService.length, latest.recorded, latest.notInService.length),
            ),
            section: "Electricity — Monthly readings",
            period: latest.month.key,
            confirmed: `${latest.month.label}: ${latest.missing.length} meter${latest.missing.length === 1 ? "" : "s"} have no reading row at all — ${nameList([...byType.entries()].map(([type, count]) => `${count} × ${type}`))}. The Electricity page computes every total and cost figure for the month without them.`,
            affected: latest.missing.map<AffectedRef>((meter) => ({
                label: meter.name,
                id: meter.accountNumber || meter.id,
                kind: "meter",
            })),
            recommendation: `Load ${latest.month.label}'s readings from the electricity master sheet (sql/migrations/update_electricity_*.sql). If a meter is genuinely out of service, record the row with a blank consumption so it reads as "not in service" instead of missing.`,
            href: "/electricity",
        });
    }

    if (latest.negatives.length > 0) {
        findings.push({
            id: `electricity-monthly-negative:${latest.month.key}`,
            kind: "integrity",
            severity: "high",
            section: "Electricity — Monthly readings",
            period: latest.month.key,
            confirmed: `${latest.month.label}: ${latest.negatives.length} meter${latest.negatives.length === 1 ? " has" : "s have"} a negative consumption (${nameList(latest.negatives.map((n) => `${n.meter.name} ${n.value} kWh`))}), which a cumulative kWh meter cannot produce.`,
            affected: latest.negatives.map<AffectedRef>((n) => ({
                label: `${n.meter.name} = ${n.value} kWh`,
                id: n.meter.accountNumber || n.meter.id,
                kind: "meter",
            })),
            recommendation: "Check for a swapped reading pair or a meter change during the month; the figure deflates every total it is summed into.",
            href: "/electricity",
        });
    }

    if (latest.duplicates.length > 0) {
        findings.push({
            id: `electricity-monthly-duplicate:${latest.month.key}`,
            kind: "integrity",
            severity: "high",
            section: "Electricity — Monthly readings",
            period: latest.month.key,
            confirmed: `${latest.month.label}: ${latest.duplicates.length} meter${latest.duplicates.length === 1 ? " has" : "s have"} more than one reading row for the month (${nameList(latest.duplicates.map((d) => `${d.meter.name} ×${d.count}`))}), so ${latest.duplicates.length === 1 ? "it is" : "they are"} double-counted in the monthly total.`,
            affected: latest.duplicates.map<AffectedRef>((d) => ({
                label: `${d.meter.name} ×${d.count}`,
                id: d.meter.accountNumber || d.meter.id,
                kind: "meter",
            })),
            recommendation: "De-duplicate the readings table for this month — one row per meter per month.",
            href: "/electricity",
        });
    }

    return findings;
}

/* ------------------------------------------------------------------ */
/*  2. Water — Monthly billing reads                                   */
/* ------------------------------------------------------------------ */

interface WaterMonthResult {
    month: DueMonth;
    /** No key for the month at all. */
    missing: WaterMeterRef[];
    /** Key present but the reading is blank — a row that arrived empty. */
    blank: WaterMeterRef[];
    recorded: number;
    /** True when the month's figures are month-to-date daily sums, not billing reads. */
    derived: boolean;
}

export function evaluateWaterMonth(
    meters: WaterMeterRef[],
    month: DueMonth,
    derivedMonths: string[],
): WaterMonthResult {
    const missing: WaterMeterRef[] = [];
    const blank: WaterMeterRef[] = [];
    let recorded = 0;

    for (const meter of meters) {
        if (!(month.key in meter.consumption)) {
            missing.push(meter);
            continue;
        }
        if (meter.consumption[month.key] === null) {
            blank.push(meter);
            continue;
        }
        recorded += 1;
    }

    return { month, missing, blank, recorded, derived: derivedMonths.includes(month.key) };
}

function waterMonthlySection(results: WaterMonthResult[], meterCount: number): ReportSection {
    const breakdown: CoverageBreakdownRow[] = results.map((r) => {
        // A blank read is not an answer for water — there is no documented
        // "closed" semantics on this table — so it counts as missing, with its
        // own note so the two causes stay distinguishable.
        const stat = coverage(meterCount, r.recorded);
        return {
            key: r.month.key,
            label: r.month.label,
            severity: classifyCoverage(stat),
            coverage: stat,
            note: [
                r.derived ? "month-to-date daily sums — official reads not imported" : null,
                r.blank.length ? `${r.blank.length} row${r.blank.length === 1 ? "" : "s"} present but blank` : null,
            ].filter(Boolean).join(" · ") || undefined,
        };
    });

    const latest = results[results.length - 1];
    const latestStat = breakdown[breakdown.length - 1]?.coverage ?? coverage(0, 0);

    return {
        key: "water-monthly",
        title: "Water — Monthly billing reads",
        href: "/water",
        // `worstSeverity` ranks nodata above good, so a month with nothing to
        // assess reports as unknown rather than being averaged into "healthy".
        severity: worstSeverity(
            latest ? [classifyCoverage(latestStat), latest.derived ? "watch" : "good"] : ["nodata"],
        ),
        coverage: latestStat,
        headline: latest
            ? `${latest.month.label}: ${formatCoverage(latestStat)}${latest.derived ? " · shown as month-to-date, official reads not yet imported" : ""}`
            : "No due month to assess",
        breakdown,
        gateNote: `${describeCoverageGates()} A month whose official import has not landed is filled from sums of the real daily readings and labelled month-to-date — real data, but not the billing record.`,
    };
}

function waterMonthlyFindings(results: WaterMonthResult[]): MonitoringFinding[] {
    const findings: MonitoringFinding[] = [];
    const latest = results[results.length - 1];
    if (!latest) return findings;

    if (latest.derived) {
        findings.push({
            id: `water-monthly-derived:${latest.month.key}`,
            kind: "provenance",
            severity: "watch",
            section: "Water — Monthly billing reads",
            period: latest.month.key,
            confirmed: `${latest.month.label} is past its import window but has no rows in the monthly consumption table. The Monthly view is showing sums of that month's real daily readings instead — accurate as far as the daily meters read, but not the official billing figures.`,
            affected: [{ label: latest.month.label, id: latest.month.key, kind: "month" }],
            recommendation: "Import the official monthly reads for this month; until then, treat every monthly figure and loss percentage for it as provisional.",
            href: "/water",
        });
    }

    if (latest.missing.length > 0) {
        const byLevel = new Map<string, number>();
        for (const meter of latest.missing) byLevel.set(meter.level, (byLevel.get(meter.level) ?? 0) + 1);
        findings.push({
            id: `water-monthly-missing:${latest.month.key}`,
            kind: "missing",
            severity: classifyCoverage(coverage(latest.missing.length + latest.recorded + latest.blank.length, latest.recorded)),
            section: "Water — Monthly billing reads",
            period: latest.month.key,
            confirmed: `${latest.month.label}: ${latest.missing.length} meter${latest.missing.length === 1 ? "" : "s"} have no monthly reading (${nameList([...byLevel.entries()].map(([level, count]) => `${count} × ${level}`))}). Every missing L2 or L3 read inflates the apparent loss at the level above it.`,
            affected: latest.missing.slice(0, 60).map<AffectedRef>((meter) => ({
                label: `${meter.label} (${meter.level})`,
                id: meter.account,
                kind: "meter",
            })),
            recommendation: "Complete the monthly import for these accounts before reading any loss figure for the month — an unread child meter is indistinguishable from water that went missing.",
            href: "/water",
        });
    }

    if (latest.blank.length > 0) {
        findings.push({
            id: `water-monthly-blank:${latest.month.key}`,
            kind: "integrity",
            severity: "watch",
            section: "Water — Monthly billing reads",
            period: latest.month.key,
            confirmed: `${latest.month.label}: ${latest.blank.length} meter${latest.blank.length === 1 ? " has" : "s have"} a monthly row that arrived with no reading in it, so the import ran but the value did not come through.`,
            affected: latest.blank.slice(0, 60).map<AffectedRef>((meter) => ({
                label: `${meter.label} (${meter.level})`,
                id: meter.account,
                kind: "meter",
            })),
            recommendation: "Re-run the import for these accounts; a blank row is a delivery failure, not a zero-consumption month.",
            href: "/water",
        });
    }

    return findings;
}

/* ------------------------------------------------------------------ */
/*  Combined                                                           */
/* ------------------------------------------------------------------ */

export function evaluateMonthlyRules(input: MonthlyRuleInput): MonthlyRuleResult {
    const findings: MonitoringFinding[] = [];

    let electricity: ReportSection;
    if (!input.electricityMeters || !input.electricityReadings) {
        electricity = UNAVAILABLE_SECTION(
            "electricity-monthly",
            "Electricity — Monthly readings",
            "/electricity",
            "Electricity meters or readings could not be read — completeness is unknown for this month, not confirmed healthy.",
        );
    } else {
        const meters = input.electricityMeters;
        const readings = input.electricityReadings;
        const results = input.months.map((month) => evaluateElectricityMonth(meters, readings, month));
        electricity = electricitySection(results, meters.length);
        findings.push(...electricityFindings(results));
    }

    let water: ReportSection;
    if (!input.waterMeters) {
        water = UNAVAILABLE_SECTION(
            "water-monthly",
            "Water — Monthly billing reads",
            "/water",
            "Water meters could not be read — completeness is unknown for this month, not confirmed healthy.",
        );
    } else {
        const meters = input.waterMeters;
        const results = input.months.map((month) => evaluateWaterMonth(meters, month, input.derivedMonths));
        water = waterMonthlySection(results, meters.length);
        findings.push(...waterMonthlyFindings(results));
    }

    return { electricitySection: electricity, waterSection: water, findings };
}
