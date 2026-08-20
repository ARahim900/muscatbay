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
 * The date-parsing trap
 * ---------------------
 * The app holds two contract-date parsers with **different conventions**:
 * `parseTrackerDate` in `lib/operational-alerts.ts` reads `3/4/2026` as
 * 4 March (US, month-first), while `parseContractDate` in
 * `components/contractors/contract-dates.tsx` reads it as 3 April (day-first,
 * "Oman convention"). For dates where both components are ≤ 12 the two
 * disagree by up to eleven months.
 *
 * This module reuses `parseTrackerDate` — the same parser the alert feed
 * already applies to this same table, so the monitor and the bell can never
 * contradict each other — and separately **reports every ambiguous string it
 * finds as a data-integrity finding**. That is a fact derived from the data,
 * not a guess about which parser is right; resolving the convention is an
 * owner decision, and until it is made the monitor names the affected rows
 * rather than silently picking a side.
 *
 * @module lib/monitoring/renewals
 */

import { parseTrackerDate } from "@/lib/operational-alerts";
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
    /** True when the raw string is `d/m/yyyy` with both parts ≤ 12 — see the module note. */
    ambiguousDate: boolean;
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
 * True when a slash date could be read two ways — `3/4/2026` is 4 March to one
 * of the app's parsers and 3 April to the other. `13/4/2026` is unambiguous
 * (13 cannot be a month) and so is `3/3/2026` (both readings agree).
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
        // live gap — the same rule the alert feed applies.
        const closed = statusRaw.toLowerCase().includes("expired");
        const endDateRaw = (contract["End Date"] ?? "").trim();
        const endDate = parseTrackerDate(endDateRaw);
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
            statusRaw,
        };
    });
}

const BAND_ORDER: RenewalBand[] = ["expired", "soon", "window", "active", "unreadable", "closed"];

const BAND_LABEL: Record<RenewalBand, string> = {
    expired: "Expired, still marked active",
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
            : `${items.length} contracts · ${expired.length} expired while still marked active · ${soon.length} within ${RENEWAL_SOON_DAYS} days${unreadable.length ? ` · ${unreadable.length} with an unreadable end date` : ""}`,
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

    // ── Integrity: dates that two parts of the app read differently ──────────
    const ambiguous = items.filter((i) => i.ambiguousDate);
    if (ambiguous.length > 0) {
        findings.push({
            id: `renewal-ambiguous-date:${ambiguous.map((i) => i.contractor).sort().join("|")}`,
            kind: "integrity",
            severity: "high",
            section: "Contractors — Expiry & renewals",
            period: "",
            confirmed: `${ambiguous.length} end date${ambiguous.length === 1 ? " is" : "s are"} written as d/m/yyyy with both parts 12 or under (${nameList(ambiguous.map((i) => `${i.contractor}: "${i.endDateRaw}"`))}). The alert feed reads these month-first and the Contractors page reads them day-first, so the same contract can be up to eleven months apart on two screens.`,
            affected: ambiguous.map(toRef),
            recommendation: "Re-enter these dates in ISO form (yyyy-mm-dd), which both readers agree on, and decide the register's convention so future entries cannot be ambiguous.",
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
