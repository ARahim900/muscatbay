/**
 * Expiry & renewal tracking — the contract ladder.
 *
 * Scope note, because this sits close to a line the project draws hard: this is
 * **reporting a date that already exists in the database**. There is no owner,
 * no renewal task, no status transition and no close-out here — only "this
 * contract's recorded end date is N days away, and here is the horizon it has
 * just crossed". Adding assignment or resolution tracking to this module would
 * cross that line; do not.
 *
 * One ladder, four horizons
 * -------------------------
 * `RENEWAL_HORIZON_DAYS` (90 / 60 / 30 / 7) are *notification* points: a
 * contract fires once as it crosses **into** each one, so a three-year AMC
 * produces four heads-ups rather than ninety consecutive nags. The severity
 * bands (expired → critical, ≤ 30 → high, ≤ 90 → watch) deliberately mirror
 * `components/contractors/contract-dates.tsx`, so the register, the report and
 * the notification bell colour a contract identically.
 *
 * Dates
 * -----
 * Every surface now reads contract dates through `lib/contract-dates`, whose
 * month-first convention is established from the register itself (18 values
 * are impossible day-first, none month-first). The monitor still **reports the
 * end dates that a human could not have read from the string alone** — both
 * slash components 12 or under — because the convention being settled at the
 * column level does not prove any individual value was typed under it. Where
 * the row's own note writes the date out unambiguously, that value is
 * corroborated and needs no attention; where it does not, the string rests on
 * the convention alone and is worth one check against the signed contract.
 * The register keeps its strings either way: this module parses on read and
 * never writes a normalised value back.
 *
 * @module lib/monitoring/renewals
 */

import { parseContractDate, textConfirmsDate } from "@/lib/contract-dates";
import type { ContractorTracker } from "@/entities/contractor";
import { daysBetween, formatDay } from "./calendar";
import { coverage } from "./coverage";
import {
    RENEWAL_HORIZON_DAYS,
    RENEWAL_HORIZON_MAX_DAYS,
    RENEWAL_SOON_DAYS,
    describeRenewalCadence,
} from "./config";
import type {
    AffectedRef,
    CoverageBreakdownRow,
    MonitoringFinding,
    ReportSection,
    Severity,
} from "./types";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type RenewalBand = "expired" | "soon" | "window" | "active" | "unreadable" | "closed";

export interface RenewalItem {
    contractor: string;
    service: string;
    /** The end date exactly as the register holds it. */
    endDateRaw: string;
    endDate: Date | null;
    /** Days from today to the end date; negative = already past. Null = unreadable. */
    days: number | null;
    band: RenewalBand;
    severity: Severity;
    /** The horizon this contract has just crossed into, if any. */
    horizon: number | null;
    /**
     * True when both slash components are ≤ 12, so the string alone does not
     * show which is the month — see the module note.
     */
    ambiguousDate: boolean;
    /**
     * True when the row's own note writes this end date out unambiguously
     * (`2 Jun 2028` beside a stored `6/2/2028`), which pins the value
     * independently of the column convention. Only meaningful when
     * {@link ambiguousDate} is true.
     */
    dateConfirmedByNote: boolean;
    /** Status as recorded, verbatim. */
    statusRaw: string;
}

export interface RenewalResult {
    items: RenewalItem[];
    section: ReportSection;
    findings: MonitoringFinding[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const AMBIGUOUS_SLASH_DATE = /^(\d{1,2})\/(\d{1,2})\/\d{4}$/;

/**
 * True when a slash date could be read two ways *from the string alone* —
 * `3/4/2026` is 4 March month-first and 3 April day-first. `13/4/2026` is
 * unambiguous (13 cannot be a month) and so is `3/3/2026` (both readings
 * agree). The app reads every such value month-first; this flags the values
 * whose typing a human cannot verify by eye.
 */
export function isAmbiguousSlashDate(raw: string | null | undefined): boolean {
    const match = AMBIGUOUS_SLASH_DATE.exec((raw ?? "").trim());
    if (!match) return false;
    const first = Number(match[1]);
    const second = Number(match[2]);
    return first >= 1 && first <= 12 && second >= 1 && second <= 12 && first !== second;
}

/**
 * The notification horizon a contract has crossed into.
 *
 * Returns the *tightest* horizon that still contains `days`, so a contract at
 * 45 days sits in the 60-day horizon and moves to the 30-day one two weeks
 * later — one notification per crossing, not one per day.
 */
export function horizonFor(days: number): number | null {
    if (days < 0) return null;
    const inside = RENEWAL_HORIZON_DAYS.filter((h) => days <= h);
    return inside.length > 0 ? Math.min(...inside) : null;
}

function bandFor(days: number | null, closed: boolean): { band: RenewalBand; severity: Severity } {
    if (closed) return { band: "closed", severity: "good" };
    if (days === null) return { band: "unreadable", severity: "nodata" };
    if (days < 0) return { band: "expired", severity: "critical" };
    if (days <= RENEWAL_SOON_DAYS) return { band: "soon", severity: "high" };
    if (days <= RENEWAL_HORIZON_MAX_DAYS) return { band: "window", severity: "watch" };
    return { band: "active", severity: "good" };
}

function nameList(items: string[], cap = 4): string {
    if (items.length <= cap) return items.join(", ");
    return `${items.slice(0, cap).join(", ")} and ${items.length - cap} more`;
}

/** `in 12 days` / `12 days ago` / `today`. */
function relativeDays(days: number): string {
    if (days === 0) return "today";
    if (days > 0) return `in ${days} day${days === 1 ? "" : "s"}`;
    return `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} ago`;
}

/* ------------------------------------------------------------------ */
/*  Evaluation                                                         */
/* ------------------------------------------------------------------ */

/** Turn the contractor register into ladder items. Pure; `now` is injected. */
export function buildRenewalItems(contractors: ContractorTracker[], now: Date): RenewalItem[] {
    return contractors.map((contract) => {
        const statusRaw = (contract.Status ?? "").trim();
        // A row the register has already closed is documented history, not a
        // live gap — the same rule the alert feed applies. Anything else is
        // "not closed", which is not the same as "marked Active": Status is
        // free text and the register also holds e.g. "Retaining".
        const closed = statusRaw.toLowerCase().includes("expired");
        const endDateRaw = (contract["End Date"] ?? "").trim();
        const endDate = parseContractDate(endDateRaw);
        const days = endDate ? daysBetween(now, endDate) : null;
        const { band, severity } = bandFor(days, closed);

        return {
            contractor: contract.Contractor ?? "Unknown contractor",
            service: contract["Service Provided"] ?? "",
            endDateRaw,
            endDate,
            days,
            band,
            severity,
            horizon: days === null || closed ? null : horizonFor(days),
            ambiguousDate: isAmbiguousSlashDate(endDateRaw),
            dateConfirmedByNote: endDate !== null && textConfirmsDate(contract.Note, endDate),
            statusRaw,
        };
    });
}

const BAND_ORDER: RenewalBand[] = ["expired", "soon", "window", "active", "unreadable", "closed"];

const BAND_LABEL: Record<RenewalBand, string> = {
    expired: "Past end date, not closed in the register",
    soon: `Expiring within ${RENEWAL_SOON_DAYS} days`,
    window: `Renewal window (${RENEWAL_SOON_DAYS + 1}–${RENEWAL_HORIZON_MAX_DAYS} days)`,
    active: `Beyond ${RENEWAL_HORIZON_MAX_DAYS} days`,
    unreadable: "No readable end date",
    closed: "Closed in the register",
};

function renewalSection(items: RenewalItem[]): ReportSection {
    const counts = new Map<RenewalBand, RenewalItem[]>();
    for (const band of BAND_ORDER) counts.set(band, []);
    for (const item of items) counts.get(item.band)?.push(item);

    const breakdown: CoverageBreakdownRow[] = BAND_ORDER.map((band) => {
        const list = counts.get(band) ?? [];
        // "Coverage" for a renewal band is a count, not a completeness ratio;
        // it is expressed as N of the total so the shared row shape still reads
        // correctly wherever it is rendered.
        return {
            key: band,
            label: BAND_LABEL[band],
            severity: list.length === 0 ? "good" : (list[0]?.severity ?? "nodata"),
            coverage: coverage(items.length, list.length),
            note: list.length ? nameList(list.map((i) => i.contractor)) : undefined,
        };
    }).filter((row) => row.coverage.recorded > 0);

    const expired = counts.get("expired") ?? [];
    const soon = counts.get("soon") ?? [];
    const unreadable = counts.get("unreadable") ?? [];

    // The tracked share: contracts whose end date the app can actually read.
    const readable = items.filter((i) => i.endDate !== null).length;
    const stat = coverage(items.length, readable);

    const severity: Severity = expired.length
        ? "critical"
        : soon.length
            ? "high"
            : (counts.get("window") ?? []).length
                ? "watch"
                : unreadable.length
                    ? "watch"
                    : items.length === 0
                        ? "nodata"
                        : "good";

    return {
        key: "contractor-renewals",
        title: "Contractors — Expiry & renewals",
        href: "/contractors",
        severity,
        coverage: stat,
        excludeFromCompleteness: true,
        headline: items.length === 0
            ? "No contracts in the register"
            : `${items.length} contracts · ${expired.length} past their end date and not closed · ${soon.length} within ${RENEWAL_SOON_DAYS} days${unreadable.length ? ` · ${unreadable.length} with an unreadable end date` : ""}`,
        breakdown,
        gateNote: describeRenewalCadence(),
    };
}

function renewalFindings(items: RenewalItem[]): MonitoringFinding[] {
    const findings: MonitoringFinding[] = [];

    const toRef = (item: RenewalItem): AffectedRef => ({
        label: `${item.contractor}${item.service ? ` — ${item.service}` : ""}`,
        id: item.endDateRaw || item.contractor,
        kind: "contract",
    });

    // ── Expired while the register still believes the service is running ─────
    const expired = items
        .filter((i) => i.band === "expired")
        .sort((a, b) => (a.days ?? 0) - (b.days ?? 0));
    for (const item of expired) {
        findings.push({
            id: `renewal-expired:${item.contractor}:${item.endDateRaw}`,
            kind: "renewal",
            severity: "critical",
            section: "Contractors — Expiry & renewals",
            period: item.endDate ? formatDay(item.endDate) : item.endDateRaw,
            confirmed: `${item.contractor}${item.service ? ` (${item.service})` : ""} has an end date of ${item.endDate ? formatDay(item.endDate) : item.endDateRaw} — ${relativeDays(item.days ?? 0)} — while the register still records the status as "${item.statusRaw || "(blank)"}". The service is either running uncovered or the register is out of date.`,
            affected: [toRef(item)],
            recommendation: "Confirm which of the two is true: if the contract was renewed, record the new end date; if it lapsed, mark it expired so it stops reading as live cover.",
            href: "/contractors",
        });
    }

    // ── Inside a notification horizon ────────────────────────────────────────
    const byHorizon = new Map<number, RenewalItem[]>();
    for (const item of items) {
        if (item.horizon === null) continue;
        const list = byHorizon.get(item.horizon);
        if (list) list.push(item);
        else byHorizon.set(item.horizon, [item]);
    }
    for (const horizon of [...byHorizon.keys()].sort((a, b) => a - b)) {
        const list = (byHorizon.get(horizon) ?? []).sort((a, b) => (a.days ?? 0) - (b.days ?? 0));
        findings.push({
            id: `renewal-horizon-${horizon}:${list.map((i) => i.contractor).sort().join("|")}`,
            kind: "renewal",
            severity: horizon <= RENEWAL_SOON_DAYS ? "high" : "watch",
            section: "Contractors — Expiry & renewals",
            period: `${horizon}-day horizon`,
            confirmed: `${list.length} contract${list.length === 1 ? "" : "s"} ${list.length === 1 ? "is" : "are"} inside the ${horizon}-day renewal horizon: ${nameList(list.map((i) => `${i.contractor} ${relativeDays(i.days ?? 0)}`))}.`,
            affected: list.map(toRef),
            recommendation: horizon <= RENEWAL_SOON_DAYS
                ? "Confirm the renewal position now — inside a month there is no room left for a tender or a mobilisation period."
                : "Start the renewal or re-tender decision while there is still time to run it.",
            href: "/contractors",
        });
    }

    // ── Integrity: end dates the app cannot read at all ──────────────────────
    const unreadable = items.filter((i) => i.band === "unreadable" && i.endDateRaw !== "");
    const undated = items.filter((i) => i.band === "unreadable" && i.endDateRaw === "");
    if (unreadable.length > 0) {
        findings.push({
            id: `renewal-unreadable:${unreadable.map((i) => i.contractor).sort().join("|")}`,
            kind: "integrity",
            severity: "high",
            section: "Contractors — Expiry & renewals",
            period: "",
            confirmed: `${unreadable.length} contract${unreadable.length === 1 ? " has" : "s have"} an end date the app cannot parse (${nameList(unreadable.map((i) => `${i.contractor}: "${i.endDateRaw}"`))}), so ${unreadable.length === 1 ? "it never appears" : "they never appear"} in any expiry countdown or alert.`,
            affected: unreadable.map(toRef),
            recommendation: "Re-enter these end dates in ISO form (yyyy-mm-dd); an unparseable date is invisible rather than late.",
            href: "/contractors",
        });
    }
    if (undated.length > 0) {
        findings.push({
            id: `renewal-undated:${undated.map((i) => i.contractor).sort().join("|")}`,
            kind: "missing",
            severity: "watch",
            section: "Contractors — Expiry & renewals",
            period: "",
            confirmed: `${undated.length} contract${undated.length === 1 ? " has" : "s have"} no end date recorded (${nameList(undated.map((i) => i.contractor))}), so ${undated.length === 1 ? "it can" : "they can"} never raise a renewal warning.`,
            affected: undated.map(toRef),
            recommendation: "Record the end date from the signed contract, or mark the row closed if the engagement has finished.",
            href: "/contractors",
        });
    }

    // ── Integrity: end dates the string alone does not pin down ──────────────
    // The column convention is settled — month-first, evidenced in
    // lib/contract-dates — so this is no longer "two screens disagree". What
    // remains is narrower and still worth saying: a value with both slash
    // components 12 or under cannot be checked by eye, so a row typed under the
    // other convention would read wrong everywhere, consistently. Rows whose own
    // note writes the date out are already pinned by it; only the rest are worth
    // a human's time, and only those raise a finding.
    const ambiguous = items.filter((i) => i.ambiguousDate);
    const unconfirmed = ambiguous.filter((i) => !i.dateConfirmedByNote);
    if (unconfirmed.length > 0) {
        const scope = `${ambiguous.length} of the register's ${items.length} end date${items.length === 1 ? "" : "s"} ${ambiguous.length === 1 ? "has" : "have"} both slash components 12 or under (${nameList(ambiguous.map((i) => `${i.contractor}: "${i.endDateRaw}"`))}), so the string alone does not show which part is the month.`;
        const settled = "The register's convention is established as month-first and the app reads every date that way, so these are not read one way here and another way on the Contractors page.";
        const check = `${unconfirmed.length === 1 ? "One of them is" : `${unconfirmed.length} of them are`} not written out anywhere else in the row, so ${unconfirmed.length === 1 ? "it rests" : "they rest"} on that convention alone: ${nameList(unconfirmed.map((i) => `${i.contractor} "${i.endDateRaw}" read as ${i.endDate ? formatDay(i.endDate) : "unreadable"}`))}.`;
        findings.push({
            id: `renewal-ambiguous-date:${unconfirmed.map((i) => i.contractor).sort().join("|")}`,
            kind: "integrity",
            // Watch, not high: every surface reads these identically now, so the
            // residual risk is one mistyped row, not a live contradiction.
            severity: "watch",
            section: "Contractors — Expiry & renewals",
            period: "",
            confirmed: `${scope} ${settled} ${check}`,
            affected: unconfirmed.map(toRef),
            recommendation: "Confirm these end dates against the signed contract, then re-enter them in ISO form (yyyy-mm-dd) so no future reader has to rely on the column convention.",
            href: "/contractors",
        });
    }

    return findings;
}

/** Evaluate the whole renewal ladder. */
export function evaluateRenewals(
    contractors: ContractorTracker[] | null,
    now: Date,
): RenewalResult {
    if (!contractors) {
        const reason = "The contractor register could not be read — expiry status is unknown, not confirmed clear.";
        return {
            items: [],
            section: {
                key: "contractor-renewals",
                title: "Contractors — Expiry & renewals",
                href: "/contractors",
                severity: "nodata",
                coverage: coverage(0, 0),
                headline: reason,
                breakdown: [],
                unavailable: reason,
            },
            findings: [],
        };
    }

    const items = buildRenewalItems(contractors, now).sort((a, b) => {
        const order = BAND_ORDER.indexOf(a.band) - BAND_ORDER.indexOf(b.band);
        if (order !== 0) return order;
        return (a.days ?? Number.MAX_SAFE_INTEGER) - (b.days ?? Number.MAX_SAFE_INTEGER);
    });

    return { items, section: renewalSection(items), findings: renewalFindings(items) };
}
