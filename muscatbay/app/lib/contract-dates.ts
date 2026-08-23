/**
 * @fileoverview Contract date parsing — the app's ONE contract-date parser.
 *
 * Why this module exists
 * ----------------------
 * The app used to hold two parsers with opposite conventions. `parseTrackerDate`
 * (in `lib/operational-alerts.ts`, feeding the notification bell and the
 * monitoring register) read `6/2/2026` month-first as 2 June; `parseContractDate`
 * (in `components/contractors/contract-dates.tsx`, feeding the /contractors page)
 * read it day-first as 6 February. Worse than disagreeing, the day-first parser
 * *failed outright* on any value with a second component above 12 — `12/31/2027`
 * has no valid day-first reading — so the Contractors page rendered "Unreadable
 * date" for the majority of the register while the bell counted those same
 * contracts down correctly.
 *
 * The convention, settled from the data
 * -------------------------------------
 * MONTH-FIRST (US). Of the 34 all-numeric slash dates in `Contractor_Tracker`,
 * 18 have a second component above 12 — impossible as a day under day-first —
 * and *zero* have a first component above 12. Month-first also yields an exact
 * whole-year term for every contract, matches the free-text `Note` on five rows
 * ("AMC expired 2 Jun 2026" against a stored `6/2/2026`), and matches the
 * unambiguous `dd-MMM-yyyy` dates in `amc_contractor_summary` character for
 * character. An 18-to-0 split is not a mixed column; the register is a
 * US-format export, whatever the local convention.
 *
 * Parse order matters
 * -------------------
 *   1. ISO `yyyy-mm-dd` (optionally with a time part) — the Supabase shape.
 *   2. All-numeric `m/d/yyyy` or `m-d-yyyy` — month-first, per above.
 *   3. Named-month forms (`02-Jun-2028`, `2 Jun 2028`, `Jun 2, 2028`) — these
 *      carry no ordering ambiguity and are what `amc_contractor_summary` and
 *      `amc_contractor_expiry` actually hold.
 *
 * Deliberately NOT accepted: dotted `31.12.2027`. A dot separator is European
 * by convention and month-first by this register's, no value in any source
 * table uses one, and there is therefore nothing to disambiguate against.
 * Reporting it unreadable is the honest outcome; guessing is not (see the
 * "never fabricate data" rule — a wrong date is worse than a missing one).
 *
 * Everything here is pure, dependency-free and UTC. Pure because both the
 * browser bundle and the Expo app bundle it; UTC because a tablet in Muscat
 * (UTC+4) and the Vercel region must agree on which day a contract ends, and
 * because the alert feed and the monitoring calendar already do their day
 * arithmetic at UTC midnight. Parsing returns a UTC-midnight `Date`, so a
 * countdown computed here is the same integer everywhere.
 *
 * Scope note: this parses and reports dates the database already holds. It
 * never normalises a value back into the database — the register keeps its
 * strings, and anything unreadable is surfaced as unreadable.
 *
 * @module lib/contract-dates
 */

const MS_PER_DAY = 86_400_000;

/**
 * Month names, lowercase and full, for the named-month tier. Kept local rather
 * than imported from `lib/water-monthly-data` so this leaf parser pulls in no
 * water-domain module (the mobile bundle takes this file for the alert feed).
 */
const MONTH_NAMES = [
    "january", "february", "march", "april", "may", "june",
    "july", "august", "september", "october", "november", "december",
] as const;

/** Short month names for {@link formatContractDate}. */
const MONTH_ABBR = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

/** ISO `yyyy-mm-dd`, with or without a trailing time component. */
const ISO_DATE = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T ].*)?$/;
/** All-numeric `m/d/yyyy` or `m-d-yyyy`; the backreference forces one separator. */
const NUMERIC_DATE = /^(\d{1,2})([/-])(\d{1,2})\2(\d{4})$/;
/** `02-Jun-2028`, `2 Jun 2028`, `2 June 2028`. */
const DAY_MONTH_NAME = /^(\d{1,2})[-\s]([A-Za-z]{3,})[-\s](\d{4})$/;
/** `Jun 2, 2028`, `June 2 2028`. */
const MONTH_NAME_DAY = /^([A-Za-z]{3,})\s+(\d{1,2}),?\s+(\d{4})$/;

/**
 * Month number (1-12) for a written month name, or null.
 *
 * Accepts any prefix of three characters or more, so `Jun`, `June`, `Sept` and
 * `September` all resolve while `Junk` does not. Three characters is the
 * shortest unambiguous prefix across the twelve names.
 */
function monthFromName(name: string): number | null {
    const lower = name.toLowerCase();
    if (lower.length < 3) return null;
    const index = MONTH_NAMES.findIndex((month) => month.startsWith(lower));
    return index === -1 ? null : index + 1;
}

/**
 * A UTC-midnight Date, or null when the components do not describe a real day.
 *
 * The round-trip check is what rejects `2/30/2025` and `13/1/2026` instead of
 * letting `Date.UTC` roll them silently into the following month.
 */
function utcDate(year: number, month: number, day: number): Date | null {
    const date = new Date(Date.UTC(year, month - 1, day));
    if (
        date.getUTCFullYear() !== year
        || date.getUTCMonth() !== month - 1
        || date.getUTCDate() !== day
    ) {
        return null;
    }
    return date;
}

/**
 * Parse a contract date string to UTC midnight. Returns null — never a guess —
 * when the value is missing or cannot be read.
 */
export function parseContractDate(raw: string | null | undefined): Date | null {
    const value = (raw ?? "").trim();
    if (!value) return null;

    const iso = ISO_DATE.exec(value);
    if (iso) return utcDate(+iso[1], +iso[2], +iso[3]);

    const numeric = NUMERIC_DATE.exec(value);
    if (numeric) return utcDate(+numeric[4], +numeric[1], +numeric[3]);

    const dayFirst = DAY_MONTH_NAME.exec(value);
    if (dayFirst) {
        const month = monthFromName(dayFirst[2]);
        return month === null ? null : utcDate(+dayFirst[3], month, +dayFirst[1]);
    }

    const monthFirst = MONTH_NAME_DAY.exec(value);
    if (monthFirst) {
        const month = monthFromName(monthFirst[1]);
        return month === null ? null : utcDate(+monthFirst[3], month, +monthFirst[2]);
    }

    return null;
}

/**
 * Whole days from `from` to `date` (negative = already past), measured between
 * UTC midnights so the count matches the alert feed and the monitoring report
 * exactly rather than drifting by one with the viewer's timezone.
 */
export function daysUntil(date: Date, from: Date = new Date()): number {
    const to = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    const start = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate());
    return Math.round((to - start) / MS_PER_DAY);
}

/** `02 Jun 2028` — rendered in UTC, so it never shows the neighbouring day. */
export function formatContractDate(date: Date): string {
    const day = String(date.getUTCDate()).padStart(2, "0");
    return `${day} ${MONTH_ABBR[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

/**
 * Every unambiguous way this date could be written out in prose — named month
 * (short or long, padded or not, space- or dash-separated) and ISO.
 *
 * Deliberately excludes the all-numeric forms: `6/2/2026` appearing in a note
 * corroborates nothing, because it is the very string whose ordering is in
 * question.
 */
function unambiguousRenderings(date: Date): string[] {
    const year = date.getUTCFullYear();
    const monthIndex = date.getUTCMonth();
    const day = date.getUTCDate();
    const abbr = MONTH_ABBR[monthIndex];
    const full = MONTH_NAMES[monthIndex];
    const days = [String(day), String(day).padStart(2, "0")];
    const months = [abbr, full];

    const forms: string[] = [
        `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    ];
    for (const d of days) {
        for (const m of months) {
            forms.push(`${d} ${m} ${year}`);
            forms.push(`${d}-${m}-${year}`);
            forms.push(`${m} ${d}, ${year}`);
        }
    }
    return forms;
}

const REGEX_SPECIALS = /[.*+?^${}()|[\]\\]/g;

/**
 * True when `text` states `date` in a form that cannot be read two ways.
 *
 * Used to tell an ambiguous register value that a human has independently
 * written out (`6/2/2028` alongside a note reading "latest term … – 2 Jun 2028")
 * from one resting on the column convention alone. The boundary classes stop
 * `2 Jun 2028` matching inside `12 Jun 2028`.
 */
export function textConfirmsDate(text: string | null | undefined, date: Date): boolean {
    const haystack = (text ?? "").trim();
    if (!haystack) return false;
    return unambiguousRenderings(date).some((form) => {
        const escaped = form.replace(REGEX_SPECIALS, "\\$&");
        return new RegExp(`(^|[^0-9A-Za-z])${escaped}($|[^0-9A-Za-z])`, "i").test(haystack);
    });
}
