/**
 * STP electricity — pure calculations behind the Electricity tab.
 *
 * Rules (non-negotiable #1): a missing report or bill is null, never 0; a
 * figure that cannot be computed from complete data is null and the UI says
 * why. Two kWh sources (OWATCO report, Nama bill) are never added together.
 */

import type { StpElectricityMonth } from "@/entities/stp-electricity";
import type { STPOperation } from "@/lib/mock-data";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_MS = 86_400_000;

/** "2026-08-01" → "Aug-26" (the app-wide month label). */
export function monthLabel(reportMonth: string): string {
    const [y, m] = reportMonth.split("-");
    return `${MONTHS[Number(m) - 1]}-${y.slice(2)}`;
}

/** "2026-07-26" → "26 Jul 2026". */
export function dayLabel(iso: string | null): string {
    if (!iso) return "—";
    const [y, m, d] = iso.slice(0, 10).split("-");
    return `${Number(d)} ${MONTHS[Number(m) - 1]} ${y}`;
}

/**
 * Indicative cost per kWh in baisa: Nama bill (before VAT) ÷ OWATCO kWh.
 * Indicative only — the bill's period may not match the OWATCO 26th–25th
 * cycle. Null unless both figures exist.
 */
export function indicativeRateBaisa(row: StpElectricityMonth): number | null {
    if (row.billedOmr === null || row.owatcoKwh === null || row.owatcoKwh <= 0) return null;
    return (row.billedOmr / row.owatcoKwh) * 1000;
}

export interface EnergyIntensity {
    /** kWh per m³ of sewage received; null when the inlet log is incomplete. */
    kwhPerM3: number | null;
    daysRecorded: number;
    daysInPeriod: number;
}

/**
 * Energy per m³ treated for one OWATCO period: report kWh ÷ the inlet sewage
 * logged for the SAME days. Computed only when every day of the period has an
 * inlet reading — a partial log would overstate kWh/m³.
 */
export function energyIntensity(row: StpElectricityMonth, operations: STPOperation[]): EnergyIntensity {
    const empty = { kwhPerM3: null, daysRecorded: 0, daysInPeriod: 0 };
    if (!row.periodStart || !row.periodEnd) return empty;
    const start = Date.parse(`${row.periodStart.slice(0, 10)}T00:00:00Z`);
    const end = Date.parse(`${row.periodEnd.slice(0, 10)}T00:00:00Z`);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return empty;
    const daysInPeriod = Math.round((end - start) / DAY_MS) + 1;

    const inletByDay = new Map<string, number>();
    for (const op of operations) {
        if (op.inlet_sewage === null) continue;
        const day = op.date.slice(0, 10);
        const t = Date.parse(`${day}T00:00:00Z`);
        if (t < start || t > end) continue;
        inletByDay.set(day, (inletByDay.get(day) ?? 0) + op.inlet_sewage);
    }
    const daysRecorded = inletByDay.size;
    let inlet = 0;
    inletByDay.forEach((v) => { inlet += v; });

    const complete = daysRecorded === daysInPeriod && inlet > 0;
    return {
        kwhPerM3: complete && row.owatcoKwh !== null ? row.owatcoKwh / inlet : null,
        daysRecorded,
        daysInPeriod,
    };
}

export interface YearSummary {
    year: string;
    /** Sum of OWATCO kWh over the months that have a report. */
    owatcoKwh: number;
    owatcoMonths: number;
    /** Sum of reliable bills (before VAT) over the months that have one. */
    billedOmr: number;
    billedMonths: number;
}

export function yearSummary(rows: StpElectricityMonth[], year: string): YearSummary {
    const inYear = rows.filter((r) => r.reportMonth.startsWith(`${year}-`));
    const reported = inYear.filter((r) => r.owatcoKwh !== null);
    const billed = inYear.filter((r) => r.billedStatus === "billed" && r.billedOmr !== null);
    return {
        year,
        owatcoKwh: reported.reduce((s, r) => s + (r.owatcoKwh ?? 0), 0),
        owatcoMonths: reported.length,
        billedOmr: billed.reduce((s, r) => s + (r.billedOmr ?? 0), 0),
        billedMonths: billed.length,
    };
}

/** The latest calendar year with all 12 OWATCO reports, or null. */
export function latestCompleteYear(rows: StpElectricityMonth[]): YearSummary | null {
    const years = [...new Set(rows.map((r) => r.reportMonth.slice(0, 4)))].sort().reverse();
    for (const y of years) {
        const s = yearSummary(rows, y);
        if (s.owatcoMonths === 12) return s;
    }
    return null;
}

/** The most recent month with an OWATCO kWh figure, or null. */
export function latestReported(rows: StpElectricityMonth[]): StpElectricityMonth | null {
    for (let i = rows.length - 1; i >= 0; i--) {
        if (rows[i].owatcoKwh !== null) return rows[i];
    }
    return null;
}

/** "26 Jul – 25 Aug" — the OWATCO cycle without years, for narrow table cells. */
export function periodLabel(row: StpElectricityMonth): string {
    if (!row.periodStart || !row.periodEnd) return "—";
    const short = (iso: string) => {
        const [, m, d] = iso.slice(0, 10).split("-");
        return `${Number(d)} ${MONTHS[Number(m) - 1]}`;
    };
    return `${short(row.periodStart)} – ${short(row.periodEnd)}`;
}

export type RowStatusTone = "good" | "watch" | "missing";

/**
 * One status per month for the record table: the first problem found, or
 * "Complete" when both the report and a reliable bill are on file.
 */
export function rowStatus(row: StpElectricityMonth): { label: string; tone: RowStatusTone } {
    switch (row.owatcoStatus) {
        case "not_received": return { label: "Report awaited", tone: "missing" };
        case "not_found": return { label: "No report", tone: "missing" };
        case "summary_only": return { label: "Summary only", tone: "watch" };
        case "reported_discrepancy": return { label: "Report differs", tone: "watch" };
        case "reported": break;
    }
    if (row.billedStatus === "unreliable") return { label: "Bill unreliable", tone: "watch" };
    if (row.billedStatus === "not_available") return { label: "No bill", tone: "missing" };
    return { label: "Complete", tone: "good" };
}

/** Plain-English status of the OWATCO figure, for tables and tooltips. */
export function owatcoStatusLabel(row: StpElectricityMonth): string {
    switch (row.owatcoStatus) {
        case "reported": return "Reported";
        case "reported_discrepancy": return "Reported · daily sum differs";
        case "summary_only": return "Summary only · not verifiable";
        case "not_found": return "No report found";
        case "not_received": return "Report not yet received";
    }
}

/** Plain-English status of the bill. */
export function billedStatusLabel(row: StpElectricityMonth): string {
    switch (row.billedStatus) {
        case "billed": return "Billed";
        case "unreliable": return "Bill record unreliable";
        case "not_available": return "No bill on file";
    }
}
