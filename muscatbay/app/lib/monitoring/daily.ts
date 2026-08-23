/**
 * Daily monitoring rules — did the entries a day was supposed to receive
 * actually arrive?
 *
 * Two sections and one cross-check:
 *  1. **Water — Daily**: every meter in the daily reading register
 *     (`./expectations`) for every due day.
 *  2. **STP — Daily log**: one `stp_operations` row carrying at least one plant
 *     figure per due day.
 *  3. **Cross-check**: the case the owner named explicitly — the STP report was
 *     submitted for a day but some water meters were not recorded for that same
 *     day. Either source alone looks fine; only comparing them shows the gap.
 *
 * Honesty rules that shape the code:
 *  - Only **due** days are assessed. Today's readings are still being uploaded
 *    and are not missing (see `./calendar`).
 *  - A `null` day cell is "not recorded", never 0 m³.
 *  - A negative reading keeps its sign and is reported as impossible, not
 *    quietly clamped.
 *  - A month with no rows at all for a meter is reported differently from a
 *    month whose row exists with a blank day — the first is an upload that
 *    never happened, the second is a meter that was not read. The STP log makes
 *    the same distinction: a row carrying a date and nothing else records
 *    nothing, so it counts as not logged and is reported on its own.
 *
 * @module lib/monitoring/daily
 */

import { classifyCoverage, coverage, formatCoverage, sumCoverage, worstSeverity } from "./coverage";
import { consumptionKey, formatDay, isDayDue, isoDay, utcMidnight } from "./calendar";
import { describeCoverageGates, STP_STALE_DAYS } from "./config";
import { waterDailyExpectations, type WaterDailyExpectation } from "./expectations";
import type {
    AffectedRef,
    CoverageBreakdownRow,
    MonitoringFinding,
    ReportSection,
    Severity,
} from "./types";

/* ------------------------------------------------------------------ */
/*  Inputs                                                             */
/* ------------------------------------------------------------------ */

/**
 * One meter's month of daily readings, **exactly as stored**.
 *
 * `days` is 31 slots, index 0 = day 1. `null` means no reading was recorded;
 * negative values are passed through untouched so the rules can report them.
 */
export interface DailyMeterMonth {
    account: string;
    meterName: string;
    /** `Aug-26`. */
    month: string;
    days: (number | null)[];
}

/** One STP daily log row, reduced to what the completeness rules need. */
export interface StpDayRecord {
    /** Whatever the table holds — parsed defensively, never assumed valid. */
    date: string;
    inlet: number | null;
    tse: number | null;
    tankers: number | null;
}

export interface DailyRuleInput {
    /** Due days, oldest first. */
    days: Date[];
    waterRows: DailyMeterMonth[] | null;
    stpRows: StpDayRecord[] | null;
    now: Date;
}

export interface DailyRuleResult {
    waterSection: ReportSection;
    stpSection: ReportSection;
    findings: MonitoringFinding[];
}

/* ------------------------------------------------------------------ */
/*  Shared helpers                                                     */
/* ------------------------------------------------------------------ */

/** "A, B, C and 4 more" — keeps a confirmed statement readable at 40 meters. */
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
/*  1. Water — Daily                                                   */
/* ------------------------------------------------------------------ */

/** Why one expected reading is absent — the two cases mean different things. */
type MissReason = "no-row" | "blank-day";

interface DayMiss {
    expectation: WaterDailyExpectation;
    reason: MissReason;
}

export interface WaterDayCoverage {
    day: Date;
    iso: string;
    misses: DayMiss[];
    blockingMisses: DayMiss[];
    expected: number;
    recorded: number;
    severity: Severity;
}

/** Reading for one account on one day, or `undefined` when the month row is absent. */
function readingFor(
    rowsByAccountMonth: Map<string, DailyMeterMonth>,
    account: string,
    monthKey: string,
    dayOfMonth: number,
): number | null | undefined {
    const row = rowsByAccountMonth.get(`${account}|${monthKey}`);
    if (!row) return undefined;
    return row.days[dayOfMonth - 1] ?? null;
}

/**
 * Evaluate water daily coverage over the due-day window.
 *
 * Exported separately from {@link evaluateDailyRules} because the cross-check
 * needs the per-day misses, and the UI renders the same per-day rows as a
 * heatmap.
 */
export function evaluateWaterDailyCoverage(
    rows: DailyMeterMonth[],
    days: Date[],
): { perDay: WaterDayCoverage[]; expectations: WaterDailyExpectation[] } {
    const expectations = waterDailyExpectations();
    const byAccountMonth = new Map<string, DailyMeterMonth>();
    for (const row of rows) byAccountMonth.set(`${row.account}|${row.month}`, row);

    const perDay = days.map<WaterDayCoverage>((day) => {
        const monthKey = consumptionKey(day.getUTCFullYear(), day.getUTCMonth());
        const dayOfMonth = day.getUTCDate();
        const misses: DayMiss[] = [];

        for (const expectation of expectations) {
            const value = readingFor(byAccountMonth, expectation.account, monthKey, dayOfMonth);
            if (value === undefined) misses.push({ expectation, reason: "no-row" });
            else if (value === null) misses.push({ expectation, reason: "blank-day" });
        }

        const blockingMisses = misses.filter((m) => m.expectation.blocking);
        const recorded = expectations.length - misses.length;
        const stat = coverage(expectations.length, recorded);
        return {
            day,
            iso: isoDay(day),
            misses,
            blockingMisses,
            expected: expectations.length,
            recorded,
            severity: classifyCoverage(stat, blockingMisses.length),
        };
    });

    return { perDay, expectations };
}

/** Display name for a meter: the name the data carries beats the config label. */
function meterLabel(
    rows: DailyMeterMonth[],
    account: string,
    fallback: string,
): string {
    const named = rows.find((r) => r.account === account && r.meterName.trim() !== "");
    return named ? named.meterName : fallback;
}

function waterDailySection(
    perDay: WaterDayCoverage[],
    expectations: WaterDailyExpectation[],
): ReportSection {
    const breakdown: CoverageBreakdownRow[] = perDay.map((d) => ({
        key: d.iso,
        label: formatDay(d.day),
        severity: d.severity,
        coverage: coverage(d.expected, d.recorded),
        note: d.blockingMisses.length
            ? `${d.blockingMisses.length} bulk meter${d.blockingMisses.length === 1 ? "" : "s"} not read — balance not computable`
            : undefined,
    }));

    const total = sumCoverage(breakdown.map((b) => b.coverage));
    const blockingTotal = perDay.reduce((sum, d) => sum + d.blockingMisses.length, 0);

    return {
        key: "water-daily",
        title: "Water — Daily readings",
        href: "/water",
        severity: worstSeverity(breakdown.map((b) => b.severity)),
        coverage: total,
        headline: `${expectations.length} meters expected each day · ${formatCoverage(total)} across the window${blockingTotal ? ` · ${blockingTotal} bulk-meter reading${blockingTotal === 1 ? "" : "s"} missing` : ""}`,
        breakdown,
        gateNote: describeCoverageGates(),
    };
}

function waterDailyFindings(
    perDay: WaterDayCoverage[],
    rows: DailyMeterMonth[],
    expectedAccounts: Set<string>,
): MonitoringFinding[] {
    const findings: MonitoringFinding[] = [];

    for (const day of perDay) {
        if (day.misses.length === 0) continue;

        const affected: AffectedRef[] = day.misses.map((m) => ({
            label: meterLabel(rows, m.expectation.account, m.expectation.label),
            id: m.expectation.account,
            kind: "meter",
        }));
        const noRow = day.misses.filter((m) => m.reason === "no-row").length;
        const blockingNames = day.blockingMisses.map((m) =>
            meterLabel(rows, m.expectation.account, m.expectation.label),
        );

        const lead = blockingNames.length
            ? `${formatDay(day.day)}: ${nameList(blockingNames)} not read — the day's water balance cannot be computed. `
            : `${formatDay(day.day)}: `;

        findings.push({
            id: `water-daily-missing:${day.iso}`,
            kind: "missing",
            severity: day.severity,
            section: "Water — Daily readings",
            period: day.iso,
            confirmed:
                `${lead}${day.recorded} of ${day.expected} expected meter readings recorded` +
                (noRow > 0
                    ? `. ${noRow} meter${noRow === 1 ? " has" : "s have"} no row at all for ${consumptionKey(day.day.getUTCFullYear(), day.day.getUTCMonth())} — the upload for ${noRow === 1 ? "it" : "them"} never landed.`
                    : "."),
            affected,
            recommendation: blockingNames.length
                ? `Recover the bulk reading(s) first — ${nameList(blockingNames)} — then the ${day.misses.length - day.blockingMisses.length} outstanding meter(s). Check the Grafana sync and the daily CSV upload for this date.`
                : `Check the Grafana sync and the daily CSV upload for this date, then re-read the ${day.misses.length} outstanding meter(s).`,
            href: "/water",
        });
    }

    // ── Integrity: readings that cannot be true ──────────────────────────────
    // Scanned over the report window only. The fetch spans whole months, so an
    // unscoped scan would attach a reading from three weeks ago to a finding
    // labelled with this window's dates — a period the reader would rightly
    // trust. Anything outside the window belongs to the report for its own
    // period, or to the monthly report.
    const windowByMonth = new Map<string, Set<number>>();
    for (const day of perDay) {
        const key = consumptionKey(day.day.getUTCFullYear(), day.day.getUTCMonth());
        const set = windowByMonth.get(key);
        if (set) set.add(day.day.getUTCDate());
        else windowByMonth.set(key, new Set([day.day.getUTCDate()]));
    }
    const lastDayIso = perDay.length > 0 ? perDay[perDay.length - 1].iso : "";
    const negatives: AffectedRef[] = [];
    for (const row of rows) {
        const daysInWindow = windowByMonth.get(row.month);
        if (!daysInWindow) continue;
        for (const dayOfMonth of [...daysInWindow].sort((a, b) => a - b)) {
            const value = row.days[dayOfMonth - 1];
            if (value === null || value === undefined || value >= 0) continue;
            negatives.push({
                label: `${row.meterName || row.account} · ${dayOfMonth} ${row.month} = ${value} m³`,
                id: row.account,
                kind: "meter",
            });
        }
    }
    if (negatives.length > 0) {
        findings.push({
            id: `water-daily-negative:${lastDayIso || "window"}`,
            kind: "integrity",
            severity: "high",
            section: "Water — Daily readings",
            period: lastDayIso,
            confirmed: `${negatives.length} daily reading${negatives.length === 1 ? " is" : "s are"} negative, which is physically impossible for a cumulative meter.`,
            affected: negatives,
            recommendation:
                "Verify the meter reads at source: a negative daily volume is normally a meter replacement, a rollover, or a reversed reading pair in the upload.",
            href: "/water",
        });
    }

    // ── Integrity: meters reporting data that the register does not expect ───
    const unregistered = [...new Set(rows.map((r) => r.account))].filter((a) => !expectedAccounts.has(a));
    if (unregistered.length > 0) {
        findings.push({
            id: `water-daily-unregistered:${unregistered.slice().sort().join("|")}`,
            kind: "integrity",
            severity: "watch",
            section: "Water — Daily readings",
            period: "",
            confirmed: `${unregistered.length} account${unregistered.length === 1 ? "" : "s"} report daily readings but ${unregistered.length === 1 ? "is" : "are"} not in the daily reading register, so ${unregistered.length === 1 ? "its reading is" : "their readings are"} never checked for completeness or included in any zone balance.`,
            affected: unregistered.map((account) => ({
                label: meterLabel(rows, account, account),
                id: account,
                kind: "meter",
            })),
            recommendation:
                "Either add the account to the zone/DC configuration in lib/water-accounts.ts so it is balanced and monitored, or confirm it is intentionally out of scope.",
            href: "/water",
        });
    }

    return findings;
}

/* ------------------------------------------------------------------ */
/*  2. STP — Daily log                                                 */
/* ------------------------------------------------------------------ */

interface StpParsed {
    iso: string;
    date: Date;
    record: StpDayRecord;
}

/** Parse defensively: the sync has historically written unparseable and future dates. */
function parseStpRows(rows: StpDayRecord[]): { parsed: StpParsed[]; invalid: StpDayRecord[] } {
    const parsed: StpParsed[] = [];
    const invalid: StpDayRecord[] = [];
    for (const record of rows) {
        const date = new Date(record.date);
        if (Number.isNaN(date.getTime())) {
            invalid.push(record);
            continue;
        }
        parsed.push({ iso: isoDay(date), date, record });
    }
    return { parsed, invalid };
}

/** How many of the day's three plant figures actually arrived. */
function figureCount(record: StpDayRecord): number {
    return [record.inlet, record.tse, record.tankers].filter((v) => v !== null).length;
}

export interface StpDayCoverage {
    day: Date;
    iso: string;
    logged: boolean;
    /** A row exists for the date but every plant figure in it is blank. */
    blankRow: boolean;
    severity: Severity;
}

export function evaluateStpDailyCoverage(rows: StpDayRecord[], days: Date[]): StpDayCoverage[] {
    const { parsed } = parseStpRows(rows);
    // A row that carries a date but no inlet, no TSE and no tanker figure
    // records nothing about the day it names, so it cannot count as logged:
    // otherwise a week in which not one plant figure was written reads as fully
    // complete, while `transformSTPOperation` renders those same blanks as 0 m³
    // on /stp. Same call `waterMonthlyFindings` makes — a row that arrived
    // empty is a delivery failure, not an answer.
    const withFigures = new Set(parsed.filter((p) => figureCount(p.record) > 0).map((p) => p.iso));
    const blankOnly = new Set(parsed.filter((p) => figureCount(p.record) === 0).map((p) => p.iso));
    return days.map((day) => {
        const iso = isoDay(day);
        const isLogged = withFigures.has(iso);
        return {
            day,
            iso,
            logged: isLogged,
            blankRow: !isLogged && blankOnly.has(iso),
            severity: isLogged ? "good" : "critical",
        };
    });
}

function stpSection(perDay: StpDayCoverage[]): ReportSection {
    const recorded = perDay.filter((d) => d.logged).length;
    const stat = coverage(perDay.length, recorded);
    return {
        key: "stp-daily",
        title: "STP — Daily log",
        href: "/stp",
        // The worst day, not the window average — the same way the water
        // section derives its severity. A day of plant log lost is not a thing
        // that averages away across a good week, which is why the per-day row
        // and `stp-daily-missing` both hardcode critical.
        severity: worstSeverity(perDay.map((d) => d.severity)),
        coverage: stat,
        headline: `${formatCoverage(stat)} operating days logged across the window`,
        breakdown: perDay.map((d) => ({
            key: d.iso,
            label: formatDay(d.day),
            severity: d.severity,
            coverage: coverage(1, d.logged ? 1 : 0),
            note: d.logged
                ? undefined
                : d.blankRow
                    ? "row present for this date, but no inlet, TSE or tanker figure in it"
                    : "no operations row for this date",
        })),
        gateNote: `One operations row carrying at least one plant figure is expected per operating day — a row that arrives with inlet, TSE and tanker trips all blank records nothing and counts as not logged. A log more than ${STP_STALE_DAYS} days behind is reported as stale — at that point plant monitoring is blind, not merely behind.`,
    };
}

function stpFindings(
    rows: StpDayRecord[],
    perDay: StpDayCoverage[],
    now: Date,
): MonitoringFinding[] {
    const findings: MonitoringFinding[] = [];
    const { parsed, invalid } = parseStpRows(rows);

    const missing = perDay.filter((d) => !d.logged && !d.blankRow);
    if (missing.length > 0) {
        findings.push({
            id: `stp-daily-missing:${missing.map((m) => m.iso).join("|")}`,
            kind: "missing",
            severity: "critical",
            section: "STP — Daily log",
            period: `${missing[0].iso} – ${missing[missing.length - 1].iso}`,
            confirmed: `${missing.length} of the last ${perDay.length} due day${perDay.length === 1 ? "" : "s"} ${missing.length === 1 ? "has" : "have"} no STP operations row: ${nameList(missing.map((m) => formatDay(m.day)))}.`,
            affected: missing.map((m) => ({ label: formatDay(m.day), id: m.iso, kind: "day" })),
            recommendation:
                "Confirm the OWATCO daily sheet was filed for those dates and re-run the AITable → Supabase sync; inlet, TSE and tanker figures for a day the plant ran cannot be reconstructed later.",
            href: "/stp",
        });
    }

    // A row landed for the day but carried no figures — reported separately from
    // "no row at all" because the two point at different halves of the pipeline:
    // the sync ran, the readings did not come through.
    const blankDays = perDay.filter((d) => d.blankRow);
    if (blankDays.length > 0) {
        findings.push({
            id: `stp-daily-blank:${blankDays.map((b) => b.iso).join("|")}`,
            kind: "integrity",
            severity: "high",
            section: "STP — Daily log",
            period: `${blankDays[0].iso} – ${blankDays[blankDays.length - 1].iso}`,
            confirmed: `${blankDays.length} due day${blankDays.length === 1 ? " has" : "s have"} an STP operations row that arrived with inlet, TSE and tanker trips all blank (${nameList(blankDays.map((b) => formatDay(b.day)))}), so nothing about ${blankDays.length === 1 ? "that day" : "those days"} was actually recorded — and the STP page renders each blank as 0 m³.`,
            affected: blankDays.map((b) => ({ label: formatDay(b.day), id: b.iso, kind: "day" })),
            recommendation:
                "Re-run the AITable → Supabase sync for those dates and check the OWATCO sheet was filled in; a blank figure is a delivery failure, not a day the plant treated nothing.",
            href: "/stp",
        });
    }

    // Rows that landed with some figures but not all. The day counts as logged —
    // something was recorded — but a blank figure still reads as 0 m³ downstream.
    // Scoped to the window: the fetch spans the whole log, so an unscoped scan
    // would attach a row from months ago to a finding labelled with these dates.
    const windowIso = new Set(perDay.map((d) => d.iso));
    const partial = parsed.filter(
        (p) => windowIso.has(p.iso) && figureCount(p.record) > 0 && figureCount(p.record) < 3,
    );
    if (partial.length > 0) {
        const describe = (p: StpParsed) => {
            const blanks = [
                p.record.inlet === null ? "inlet" : null,
                p.record.tse === null ? "TSE" : null,
                p.record.tankers === null ? "tanker trips" : null,
            ].filter((f): f is string => f !== null);
            return `${formatDay(p.date)} · no ${blanks.join(", ")}`;
        };
        findings.push({
            id: `stp-daily-partial:${partial.map((p) => p.iso).sort().join("|")}`,
            kind: "integrity",
            severity: "watch",
            section: "STP — Daily log",
            period: partial.map((p) => p.iso).sort().slice(-1)[0],
            confirmed: `${partial.length} STP row${partial.length === 1 ? " is" : "s are"} missing part of the day's figures (${nameList(partial.map(describe))}). A blank figure is rendered as 0 m³ on the STP page, so the day reads lower than the plant actually ran.`,
            affected: partial.map((p) => ({ label: describe(p), id: p.iso, kind: "day" })),
            recommendation:
                "Recover the missing figure(s) from the OWATCO daily sheet and re-run the sync — a blank is not a zero.",
            href: "/stp",
        });
    }

    // Asia/Muscat is UTC+4 year-round. This is the calendar the write-side
    // trigger `stp_reject_future_dates` uses, so a row the database
    // deliberately accepted can never be reported here as impossible.
    const MUSCAT_UTC_OFFSET_MS = 4 * 60 * 60 * 1000;
    const plantToday = utcMidnight(new Date(now.getTime() + MUSCAT_UTC_OFFSET_MS));

    // Stale log — the plant may be fine, but nobody can tell.
    const newest = parsed
        .filter((p) => utcMidnight(p.date) <= plantToday)
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .slice(-1)[0];
    if (newest) {
        const behind = Math.round((plantToday - utcMidnight(newest.date)) / 86_400_000);
        if (behind > STP_STALE_DAYS) {
            findings.push({
                id: `stp-daily-stale:${newest.iso}`,
                kind: "missing",
                severity: "critical",
                section: "STP — Daily log",
                period: newest.iso,
                confirmed: `The STP daily log has not advanced since ${formatDay(newest.date)} — ${behind} days behind, past the ${STP_STALE_DAYS}-day staleness gate.`,
                affected: [{ label: formatDay(newest.date), id: newest.iso, kind: "day" }],
                recommendation: "Check the AITable → Supabase sync job; every day it stays down is a day of plant performance nobody can review.",
                href: "/stp",
            });
        }
    }

    // Integrity — the sync's known failure modes, reported rather than filtered.
    const future = parsed.filter((p) => utcMidnight(p.date) > plantToday);
    if (future.length > 0) {
        findings.push({
            id: `stp-future-dated:${future.map((f) => f.iso).sort().join("|")}`,
            kind: "integrity",
            severity: "high",
            section: "STP — Daily log",
            period: future.map((f) => f.iso).sort().slice(-1)[0],
            confirmed: `${future.length} STP row${future.length === 1 ? " is" : "s are"} dated in the future (${nameList(future.map((f) => formatDay(f.date)))}). An operating reading cannot come from a date that has not happened.`,
            affected: future.map((f) => ({ label: formatDay(f.date), id: f.iso, kind: "row" })),
            recommendation:
                "Delete or correct the row at source in AITable — a future-dated row becomes the newest month and hijacks every date-range default that reads from this table.",
            href: "/stp",
        });
    }

    const seen = new Map<string, number>();
    for (const p of parsed) seen.set(p.iso, (seen.get(p.iso) ?? 0) + 1);
    const duplicates = [...seen.entries()].filter(([, count]) => count > 1);
    if (duplicates.length > 0) {
        findings.push({
            id: `stp-duplicate-days:${duplicates.map(([iso]) => iso).sort().join("|")}`,
            kind: "integrity",
            severity: "high",
            section: "STP — Daily log",
            period: duplicates.map(([iso]) => iso).sort().slice(-1)[0],
            confirmed: `${duplicates.length} date${duplicates.length === 1 ? " has" : "s have"} more than one STP operations row (${nameList(duplicates.map(([iso, count]) => `${iso} ×${count}`))}), so that day is counted twice in every total.`,
            affected: duplicates.map(([iso, count]) => ({ label: `${iso} ×${count}`, id: iso, kind: "row" })),
            recommendation: "De-duplicate at source; the daily log has one reading per plant per day.",
            href: "/stp",
        });
    }

    if (invalid.length > 0) {
        findings.push({
            id: `stp-unparseable-dates:${invalid.map((r) => r.date).sort().join("|")}`,
            kind: "integrity",
            severity: "high",
            section: "STP — Daily log",
            period: "",
            confirmed: `${invalid.length} STP row${invalid.length === 1 ? " has" : "s have"} a date that cannot be read, so ${invalid.length === 1 ? "it is" : "they are"} absent from every chart, total and completeness figure on the STP page.`,
            affected: invalid.slice(0, 20).map((r, i) => ({ label: `row with date "${r.date}"`, id: `${i}`, kind: "row" })),
            recommendation: "Correct the date at source; rows the app cannot date are silently invisible rather than wrong-but-visible.",
            href: "/stp",
        });
    }

    return findings;
}

/* ------------------------------------------------------------------ */
/*  3. Cross-check: STP filed, water meters not                        */
/* ------------------------------------------------------------------ */

/**
 * The owner's worked example: the STP report was submitted for a day, but some
 * water meters were not recorded for that same day.
 *
 * Each source looks healthy on its own page — this is only visible by
 * comparing them, which is the whole reason the monitor exists.
 */
export function evaluateDailyCrossChecks(
    water: WaterDayCoverage[],
    stp: StpDayCoverage[],
    rows: DailyMeterMonth[],
): MonitoringFinding[] {
    const stpByIso = new Map(stp.map((d) => [d.iso, d]));
    const findings: MonitoringFinding[] = [];

    for (const day of water) {
        const stpDay = stpByIso.get(day.iso);
        if (!stpDay?.logged) continue;
        if (day.misses.length === 0) continue;

        const names = day.misses.map((m) => meterLabel(rows, m.expectation.account, m.expectation.label));
        findings.push({
            id: `cross-stp-water:${day.iso}`,
            kind: "cross-check",
            severity: day.blockingMisses.length > 0 ? "critical" : "high",
            section: "Cross-check — STP vs Water",
            period: day.iso,
            confirmed: `${formatDay(day.day)}: the STP daily report was submitted, but ${day.misses.length} of ${day.expected} water meters have no reading for the same day (${nameList(names)}).`,
            affected: day.misses.map((m) => ({
                label: meterLabel(rows, m.expectation.account, m.expectation.label),
                id: m.expectation.account,
                kind: "meter",
            })),
            recommendation:
                "The plant was staffed and reporting that day, so the gap is on the water side: check the Grafana sync window and the daily CSV upload for this date before the readings age out.",
            href: "/water",
        });
    }

    return findings;
}

/* ------------------------------------------------------------------ */
/*  Combined                                                           */
/* ------------------------------------------------------------------ */

export function evaluateDailyRules(input: DailyRuleInput): DailyRuleResult {
    const findings: MonitoringFinding[] = [];

    // Defensive: a day whose entries are not yet due cannot be missing, and
    // reporting one as missing would be the monitor inventing a problem. The
    // composer already passes a due-day window; this guarantees the rule holds
    // for any caller.
    const days = input.days.filter((day) => isDayDue(day, input.now));

    let waterSection: ReportSection;
    let waterPerDay: WaterDayCoverage[] = [];
    let waterRows: DailyMeterMonth[] = [];

    if (!input.waterRows) {
        waterSection = UNAVAILABLE_SECTION(
            "water-daily",
            "Water — Daily readings",
            "/water",
            "Daily water readings could not be read — completeness is unknown for this window, not confirmed healthy.",
        );
    } else {
        waterRows = input.waterRows;
        const evaluated = evaluateWaterDailyCoverage(waterRows, days);
        waterPerDay = evaluated.perDay;
        waterSection = waterDailySection(waterPerDay, evaluated.expectations);
        findings.push(
            ...waterDailyFindings(
                waterPerDay,
                waterRows,
                new Set(evaluated.expectations.map((e) => e.account)),
            ),
        );
    }

    let stpSectionResult: ReportSection;
    let stpPerDay: StpDayCoverage[] = [];

    if (!input.stpRows) {
        stpSectionResult = UNAVAILABLE_SECTION(
            "stp-daily",
            "STP — Daily log",
            "/stp",
            "The STP daily log could not be read — completeness is unknown for this window, not confirmed healthy.",
        );
    } else {
        stpPerDay = evaluateStpDailyCoverage(input.stpRows, days);
        stpSectionResult = stpSection(stpPerDay);
        findings.push(...stpFindings(input.stpRows, stpPerDay, input.now));
    }

    if (input.waterRows && input.stpRows) {
        findings.push(...evaluateDailyCrossChecks(waterPerDay, stpPerDay, waterRows));
    }

    return { waterSection, stpSection: stpSectionResult, findings };
}
