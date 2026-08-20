/**
 * Due-period arithmetic for the monitoring rules.
 *
 * Every function here takes `now` explicitly and works in **UTC**. Two reasons:
 * device-clock discipline stays in one place (the same choice
 * `lib/operational-alerts.ts` made), and a tablet in Muscat (UTC+4) must not
 * decide that "yesterday" is a different day from the one the sync wrote.
 *
 * The central idea is *due*, not *elapsed*. Readings for a day are uploaded
 * during the following day and the official monthly reads land a few days into
 * the next month, so a period that has merely passed is not yet late. Reporting
 * a not-yet-due period as missing would cry wolf every morning and every 1st of
 * the month — which is how a monitor gets ignored.
 *
 * @module lib/monitoring/calendar
 */

import { MONTHS } from "@/lib/water-monthly-data";
import { DAILY_DUE_AFTER_DAYS, MONTHLY_DUE_AFTER_DAYS } from "./config";

const MS_PER_DAY = 86_400_000;

/** UTC-midnight timestamp of a date — the unit all day maths uses. */
export function utcMidnight(d: Date): number {
    return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/** `yyyy-mm-dd` in UTC. */
export function isoDay(d: Date): string {
    return new Date(utcMidnight(d)).toISOString().slice(0, 10);
}

/** Whole days from `from` to `to` (negative when `to` is earlier). */
export function daysBetween(from: Date, to: Date): number {
    return Math.round((utcMidnight(to) - utcMidnight(from)) / MS_PER_DAY);
}

/** `d Mon yyyy`, UTC, no timezone drift. */
export function formatDay(d: Date): string {
    return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** The `Mon-YY` consumption key the water and electricity tables use. */
export function consumptionKey(year: number, monthIndex: number): string {
    return `${MONTHS[monthIndex]}-${String(year).slice(2)}`;
}

/** Inverse of {@link consumptionKey}. Returns null for an unparseable key. */
export function parseConsumptionKey(key: string): { year: number; monthIndex: number } | null {
    const [mon, yy] = key.split("-");
    const monthIndex = (MONTHS as readonly string[]).indexOf(mon);
    if (monthIndex === -1 || !/^\d{2}$/.test(yy ?? "")) return null;
    return { year: 2000 + Number(yy), monthIndex };
}

/** `July 2026` — the long label a monthly report is titled with. */
export function formatMonth(year: number, monthIndex: number): string {
    const long = new Date(Date.UTC(year, monthIndex, 1)).toLocaleDateString("en-GB", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
    });
    return long;
}

/** Days in a calendar month (UTC). */
export function daysInMonth(year: number, monthIndex: number): number {
    return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

// ─── Daily ────────────────────────────────────────────────────────────────────

/**
 * The newest day whose entries are due as of `now`.
 *
 * With `DAILY_DUE_AFTER_DAYS = 1` this is yesterday: today's readings are still
 * being uploaded and are not late.
 */
export function newestDueDay(now: Date): Date {
    return new Date(utcMidnight(now) - DAILY_DUE_AFTER_DAYS * MS_PER_DAY);
}

/** True when `day`'s entries should already have been recorded. */
export function isDayDue(day: Date, now: Date): boolean {
    return utcMidnight(day) <= utcMidnight(newestDueDay(now));
}

/**
 * The window of due days a daily report covers, **oldest first**, ending at
 * {@link newestDueDay}. `windowDays` is clamped to at least 1.
 */
export function dueDayWindow(now: Date, windowDays: number): Date[] {
    const end = utcMidnight(newestDueDay(now));
    const count = Math.max(1, Math.floor(windowDays));
    return Array.from({ length: count }, (_, i) =>
        new Date(end - (count - 1 - i) * MS_PER_DAY),
    );
}

// ─── Monthly ──────────────────────────────────────────────────────────────────

export interface DueMonth {
    /** `Jul-26` — the key the consumption tables use. */
    key: string;
    year: number;
    monthIndex: number;
    /** `July 2026`. */
    label: string;
    /** Calendar days in the month. */
    days: number;
}

function toDueMonth(year: number, monthIndex: number): DueMonth {
    return {
        key: consumptionKey(year, monthIndex),
        year,
        monthIndex,
        label: formatMonth(year, monthIndex),
        days: daysInMonth(year, monthIndex),
    };
}

/** True when month `year/monthIndex`'s entries should already have been imported. */
export function isMonthDue(year: number, monthIndex: number, now: Date): boolean {
    // First instant of the day the month becomes due: month end + grace.
    const dueFrom = Date.UTC(year, monthIndex + 1, 1) + MONTHLY_DUE_AFTER_DAYS * MS_PER_DAY;
    return utcMidnight(now) >= dueFrom;
}

/**
 * The newest month whose entries are due as of `now`.
 *
 * Walks back from the current calendar month, so it stays correct on the first
 * days of a month (when the month that just closed is still inside its import
 * grace window) and across a year boundary.
 */
export function newestDueMonth(now: Date): DueMonth {
    let year = now.getUTCFullYear();
    let monthIndex = now.getUTCMonth();
    // At most 24 steps — a guard, not a real bound.
    for (let i = 0; i < 24; i++) {
        if (isMonthDue(year, monthIndex, now)) return toDueMonth(year, monthIndex);
        monthIndex -= 1;
        if (monthIndex < 0) {
            monthIndex = 11;
            year -= 1;
        }
    }
    return toDueMonth(year, monthIndex);
}

/** The last `count` due months, **oldest first**, ending at {@link newestDueMonth}. */
export function dueMonthWindow(now: Date, count: number): DueMonth[] {
    const newest = newestDueMonth(now);
    const n = Math.max(1, Math.floor(count));
    const out: DueMonth[] = [];
    for (let i = n - 1; i >= 0; i--) {
        const total = newest.year * 12 + newest.monthIndex - i;
        out.push(toDueMonth(Math.floor(total / 12), ((total % 12) + 12) % 12));
    }
    return out;
}
