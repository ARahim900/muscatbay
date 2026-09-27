/**
 * @fileoverview Deep links into module pages — builders and parsers.
 *
 * An alert has to open the exact view its message is about. A bare "/water"
 * opened whatever tab the operator used last (the page restores its saved
 * preference), so the same alert landed on a different screen from one tap to
 * the next. Every alert link is therefore built here, and every page that
 * honours a link parses it with the matching parser below — one module, so a
 * link and the page that reads it cannot drift apart.
 *
 * Two kinds of parameter:
 *  - `view` on /water is the page's own URL state: the view switch keeps it in
 *    the address bar, so back/forward walks between views.
 *  - `month` / `section` (water monthly), `tab` + `month` (STP) and `tab`
 *    (contractors) are one-shot deep links: the page applies them and then
 *    removes them from the URL (`consumeSearchParams`). Left in place they
 *    would go stale the moment the operator changed tab, and tapping the same
 *    alert again would target an identical URL — a navigation the page never
 *    sees. A `month` the page has no data for yet (it rendered from the
 *    session cache) stays in the URL until the fresh load brings it, or until
 *    the operator picks a period themselves.
 *
 * A one-shot link never overwrites the operator's saved preferences: the page
 * shows what the link asks for, but keeps persisting the operator's own choice
 * until they next change that control themselves.
 *
 * Known history quirk: a link to the page already on screen is opened with
 * `replace` (see `isSamePageHref`), otherwise consuming its parameters would
 * leave two identical entries and the first Back press would appear to do
 * nothing.
 *
 * All functions are pure except `consumeSearchParams`, which touches history.
 *
 * @module lib/deep-links
 */

import { MONTHS } from "@/lib/water-monthly-data";

/* ------------------------------------------------------------------ */
/*  Water                                                              */
/* ------------------------------------------------------------------ */

export const WATER_VIEWS = ["monthly", "daily", "satellite", "readings"] as const;
export type WaterView = (typeof WATER_VIEWS)[number];

/** Section tabs of the monthly water dashboard, in display order. */
export const WATER_MONTHLY_SECTIONS = ["overview", "zones", "assets", "meters", "exceptions"] as const;
export type WaterMonthlySection = (typeof WATER_MONTHLY_SECTIONS)[number];

/** `?view=` → a known water view, or null for anything else. */
export function parseWaterView(value: string | null | undefined): WaterView | null {
    return WATER_VIEWS.find((v) => v === value) ?? null;
}

/** Type guard for a monthly section key (also used for saved preferences). */
export function isWaterMonthlySection(value: unknown): value is WaterMonthlySection {
    return WATER_MONTHLY_SECTIONS.some((s) => s === value);
}

/**
 * "Mon-YY" exactly as the water monthly model keys its months (e.g. "Aug-26");
 * STP's month labels (date-fns "MMM-yy") use the same shape.
 */
const MONTH_KEY_RE = /^([A-Z][a-z]{2})-(\d{2})$/;

/** `?month=` → a well-formed "Mon-YY" key, or null. Availability is checked by the page. */
export function parseMonthKey(value: string | null | undefined): string | null {
    if (!value) return null;
    const match = MONTH_KEY_RE.exec(value);
    if (!match || !(MONTHS as readonly string[]).includes(match[1])) return null;
    return value;
}

export interface WaterMonthlyLink {
    month: string | null;
    section: WaterMonthlySection | null;
}

/** Reads the monthly dashboard's one-shot deep link; null when the URL carries none. */
export function parseWaterMonthlyLink(params: URLSearchParams): WaterMonthlyLink | null {
    const month = parseMonthKey(params.get("month"));
    const sectionRaw = params.get("section");
    const section = isWaterMonthlySection(sectionRaw) ? sectionRaw : null;
    return month || section ? { month, section } : null;
}

/** /water?view=<view> — a fixed view, whatever the operator last used. */
export function waterViewHref(view: WaterView): string {
    return `/water?${new URLSearchParams({ view }).toString()}`;
}

/** /water?view=monthly — optionally pinned to one month and one section. */
export function waterMonthlyHref(opts: { month?: string; section?: WaterMonthlySection } = {}): string {
    const params = new URLSearchParams({ view: "monthly" });
    const month = parseMonthKey(opts.month);
    if (month) params.set("month", month);
    if (opts.section) params.set("section", opts.section);
    return `/water?${params.toString()}`;
}

/* ------------------------------------------------------------------ */
/*  STP                                                                */
/* ------------------------------------------------------------------ */

export const STP_TABS = ["watch", "dashboard"] as const;
export type StpTab = (typeof STP_TABS)[number];

export function parseStpTab(value: string | null | undefined): StpTab | null {
    return STP_TABS.find((t) => t === value) ?? null;
}

export interface StpLink {
    tab: StpTab | null;
    /** "Mon-YY" — the month whose rows the link is about (opens the daily log on it). */
    month: string | null;
}

/** Reads the STP page's one-shot deep link; null when the URL carries none. */
export function parseStpLink(params: URLSearchParams): StpLink | null {
    const tab = parseStpTab(params.get("tab"));
    const month = parseMonthKey(params.get("month"));
    return tab || month ? { tab, month } : null;
}

/** /stp?tab=<tab> — optionally with the month the alert is about. */
export function stpHref(tab: StpTab, opts: { month?: string } = {}): string {
    const params = new URLSearchParams({ tab });
    const month = parseMonthKey(opts.month);
    if (month) params.set("month", month);
    return `/stp?${params.toString()}`;
}

/* ------------------------------------------------------------------ */
/*  Contractors                                                        */
/* ------------------------------------------------------------------ */

export const CONTRACTOR_TABS = ["tracker", "renewals", "contracts", "terms", "yearly"] as const;
export type ContractorTab = (typeof CONTRACTOR_TABS)[number];

export function parseContractorTab(value: string | null | undefined): ContractorTab | null {
    return CONTRACTOR_TABS.find((t) => t === value) ?? null;
}

export function contractorsHref(tab: ContractorTab): string {
    return `/contractors?tab=${tab}`;
}

/* ------------------------------------------------------------------ */
/*  Same-page links                                                    */
/* ------------------------------------------------------------------ */

/**
 * True when `href` points at the page already showing (same pathname, any
 * query). Such a link should navigate with `replace`: its one-shot parameters
 * are stripped straight after, so a pushed entry would be a duplicate of the
 * one beneath it.
 */
export function isSamePageHref(href: string, pathname: string | null | undefined): boolean {
    if (!pathname) return false;
    const target = href.split(/[?#]/, 1)[0];
    return target === pathname;
}

/* ------------------------------------------------------------------ */
/*  One-shot consumption                                               */
/* ------------------------------------------------------------------ */

/**
 * Remove one-shot deep-link parameters from the address bar once applied.
 *
 * `replaceState` (not push) so the history entry is rewritten rather than
 * duplicated — back still returns to the page the operator came from. Next's
 * App Router integrates native history calls, so `useSearchParams` sees the
 * cleaned URL and a later tap on the same alert is a real change again.
 */
export function consumeSearchParams(names: readonly string[]): void {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    let changed = false;
    for (const name of names) {
        if (url.searchParams.has(name)) {
            url.searchParams.delete(name);
            changed = true;
        }
    }
    if (changed) window.history.replaceState(null, "", url.pathname + url.search + url.hash);
}
