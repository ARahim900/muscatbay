/**
 * @fileoverview Water Monthly Dashboard — data model, compute logic and Supabase adapter.
 *
 * This module is the typed, backend-wired core for the Water → Monthly dashboard.
 * The view layer (`components/water/monthly/water-monthly-dashboard.tsx`) was
 * authored externally against a self-contained `DATA` constant; here we replace
 * that mock with {@link buildMonthlyData}, which derives the same shape from the
 * live Supabase `WaterMeter[]` (already fetched by the page via
 * `getWaterMetersFromSupabase`). All numbers therefore come from the database.
 *
 * Water balance semantics (identical to the rest of the app):
 *   A1 = Σ L1 (main bulk)               A2 = Σ L2 (zone bulk) + Σ DC
 *   A3 = Σ end-user (L3/L4, excl. building-bulk) + Σ DC
 *   Stage-1 loss = A1 − A2 (trunk)      Stage-2 loss = A2 − A3 (distribution/in-building)
 *
 * @module lib/water-monthly-data
 */

import { ZONE_CONFIG, type WaterMeter } from "@/lib/water-data";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

/** Short month labels, January-first (index 0 === January). */
export const MONTHS = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

/** Management target: total system loss should stay at or below this percentage. */
export const TARGET_LOSS_PCT = 15;

/** Estimated water cost (OMR / m³) used for the management loss-value view. */
export const LOSS_RATE_OMR = 1.32;

/**
 * Brand chart palette for the consumption-by-type series — the app's
 * `--chart-*` tokens (plus the warm orange and a neutral fallback), so the
 * series recolours with the theme instead of drifting on inline hex.
 */
export const TYPECOL = [
    "var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)",
    "var(--chart-5)", "var(--chart-gray)", "var(--chart-elec-secondary)", "var(--chart-axis)",
] as const;

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

/** Period selection: `null` = whole period, a month index, or an inclusive `[start, end]` range. */
export type Sel = number | [number, number] | null;

/** One meter's readings for a single calendar year. */
export interface YearCache {
    /** Hierarchy level — L1 / L2 / L3 / L4 / DC / N/A. */
    label: string;
    /** Zone code (e.g. `Zone_05`). */
    zone: string;
    /** Friendly zone name (e.g. `Zone 5`). */
    zoneName: string;
    /** Meter type (e.g. `Residential (Villa)`). */
    typ: string;
    /** Parent meter name (used to roll apartments up to a building bulk). */
    parent: string;
    /**
     * 12 monthly readings, January-first.
     *
     * `null` means **no reading was recorded** for that month; `0` means the
     * meter genuinely reported zero. These used to be collapsed onto `0`, which
     * made the "Missing reading" flag unreachable, mislabelled unread months as
     * "Zero consumption", and silently deflated the A1/A2/A3 balance.
     */
    vals: (number | null)[];
    /** Sum of the readings that exist (missing months contribute nothing). */
    total: number;
    /** How many of the 12 months actually have a reading. */
    readings: number;
}

/** A meter and all of its per-year reading caches. */
export interface MeterRecord {
    /** Display name. */
    name: string;
    /** Account number. */
    acct: string;
    /** Per-year caches keyed by year string (e.g. `"2025"`). */
    y: Record<string, YearCache>;
}

/** Dataset metadata. */
export interface WaterMeta {
    /** Years that have at least one reading, ascending. */
    years: number[];
    /** Month labels, January-first. */
    months: readonly string[];
    /** Number of months with data per year, keyed by year string. */
    monthsWithData: Record<string, number>;
    /** Every month that has data, as `"Mon-YY"` keys, ascending. */
    availableMonths: string[];
    /** Total meter count. */
    totalMeters: number;
    /** Main bulk (NAMA L1) account number. */
    mainAccount: string;
}

/** Adapter output consumed by the dashboard views. */
export interface WaterData {
    meta: WaterMeta;
    meters: MeterRecord[];
}

/** Per-zone aggregation for a period. */
export interface ZoneRow {
    zone: string;
    name: string;
    bulk: number;
    end: number;
    loss: number;
    lossPct: number;
    meters: number;
    /** End-user meters in this zone with no reading in the period. */
    missing: number;
    /** True when the zone-bulk (L2) meter itself has no reading in the period. */
    bulkMissing: boolean;
}

/** Per-type aggregation for a period. */
export interface TypeRow {
    type: string;
    total: number;
    pct: number;
}

/** Direct-connection meter for a period. */
export interface DcRow {
    name: string;
    typ: string;
    total: number;
}

/** Building bulk vs. apartment-sum aggregation for a period. */
export interface BuildingRow {
    name: string;
    zone: string;
    bulk: number;
    sub: number;
    loss: number;
    lossPct: number;
}

/** Full balance + breakdowns for a single period. */
export interface PeriodResult {
    A1: number;
    A2: number;
    A3: number;
    stage1: number;
    stage2: number;
    loss: number;
    lossPct: number;
    stage1Pct: number;
    stage2Pct: number;
    zones: ZoneRow[];
    types: TypeRow[];
    dcs: DcRow[];
    buildings: BuildingRow[];
    /**
     * Meters (excluding `N/A`) with no reading at all in this period. The
     * balance above treats them as contributing nothing, which is the only
     * option available — so the count is surfaced rather than hidden, because
     * a missing L2/L3 inflates apparent loss.
     */
    missingMeters: number;
    /** Meters whose reading for this period is negative (physically impossible). */
    negativeMeters: number;
}

/** Loss-severity descriptor (text colour + background + chart fill + label). */
export interface Severity {
    /** Text colour — WCAG-AA `--mb-*-text` token. */
    c: string;
    /** Tinted background — `--mb-*-light` token (or a color-mix of the base). */
    bg: string;
    /** Chart/bar fill — the mid-tone `--mb-*` base token. */
    chart: string;
    label: string;
}

/* ------------------------------------------------------------------ */
/*  Formatting & small helpers                                         */
/* ------------------------------------------------------------------ */

/** Format a number with no decimals (en-GB grouping); `–` for nullish. */
export const fmt = (n: number | null | undefined): string =>
    n == null ? "–" : Math.round(n).toLocaleString("en-GB");

/** Format a number with up to one decimal (en-GB grouping); `–` for nullish. */
export const fmt1 = (n: number | null | undefined): string =>
    n == null ? "–" : Number(n).toLocaleString("en-GB", { maximumFractionDigits: 1 });

/** Percentage of `a` within `b`, to one decimal; `0` when `b` is falsy. */
export const pct = (a: number, b: number): number => (b ? +((a / b) * 100).toFixed(1) : 0);

/** Type guard: is the selection an inclusive `[start, end]` range? */
export const isRangeSel = (sel: Sel): sel is [number, number] => Array.isArray(sel);

/**
 * Sum `vals[start..end]` inclusive over the readings that exist.
 *
 * Missing months are skipped, not counted as zero — use {@link hasReading} to
 * tell "nothing consumed" apart from "nothing recorded".
 */
export const sumRange = (
    vals: ReadonlyArray<number | null> = [],
    start = 0,
    end = vals.length - 1,
): number => vals.slice(start, end + 1).reduce<number>((a, b) => a + (b ?? 0), 0);

/** Does any month in `vals[start..end]` have a reading? */
export const hasReading = (
    vals: ReadonlyArray<number | null> = [],
    start = 0,
    end = vals.length - 1,
): boolean => vals.slice(start, end + 1).some((v) => v != null);

/** Mean of the readings that exist; `0` when there are none. */
export const meanReading = (vals: ReadonlyArray<number | null> = []): number => {
    const present = vals.filter((v): v is number => v != null);
    return present.length ? present.reduce((a, b) => a + b, 0) / present.length : 0;
};

/**
 * Resolve a year-cache value for the current selection.
 *
 * Returns `null` when the selection contains **no reading at all**, so callers
 * can render "no reading" instead of a confident `0`.
 */
export const periodValue = (c: YearCache, sel: Sel): number | null => {
    if (sel == null) return c.readings > 0 ? c.total : null;
    if (isRangeSel(sel)) return hasReading(c.vals, sel[0], sel[1]) ? sumRange(c.vals, sel[0], sel[1]) : null;
    return c.vals[sel] ?? null;
};

/** Is month index `i` part of the current selection? */
export const monthInSelection = (sel: Sel, i: number): boolean =>
    isRangeSel(sel) ? i >= sel[0] && i <= sel[1] : i === sel;

/**
 * Map a loss percentage to a severity descriptor.
 *
 * Token-only — resolves the same `--mb-*` status variables the shared
 * inspection toolkit uses (see `components/shared/inspection.tsx`), so the
 * Water Monthly severity colours match STP Plant Watch / Electricity Load
 * Watch and flip correctly in light and dark. Inline hex here was the one
 * remaining rogue palette in the app.
 */
export function sev(p: number | null | undefined): Severity {
    if (p == null || isNaN(p)) return { c: "var(--muted-foreground)", bg: "var(--muted)", chart: "var(--status-missing)", label: "–" };
    if (p < 0) return { c: "var(--muted-foreground)", bg: "var(--muted)", chart: "var(--status-missing)", label: "Check" };
    if (p < 10) return { c: "var(--mb-success-text)", bg: "var(--mb-success-light)", chart: "var(--mb-success)", label: "Good" };
    if (p < 25) return { c: "var(--mb-warning-text)", bg: "var(--mb-warning-light)", chart: "var(--mb-warning)", label: "Moderate" };
    if (p < 50) return { c: "var(--mb-danger-text)", bg: "color-mix(in srgb, var(--mb-danger) 15%, transparent)", chart: "var(--mb-danger)", label: "High" };
    return { c: "var(--mb-danger-text)", bg: "color-mix(in srgb, var(--mb-danger) 30%, transparent)", chart: "var(--mb-danger)", label: "Critical" };
}

/** Status label/colour for a zone or building loss percentage vs. target (token-only). */
export const statusFromLoss = (p: number): { label: string; c: string; bg: string } =>
    p <= TARGET_LOSS_PCT
        ? { label: "Normal", c: "var(--mb-success-text)", bg: "var(--mb-success-light)" }
        : p <= 25
            ? { label: "Watch", c: "var(--mb-warning-text)", bg: "var(--mb-warning-light)" }
            : { label: "Critical", c: "var(--mb-danger-text)", bg: "var(--mb-danger-light)" };

/** Suggested operator action for a given loss percentage. */
export const actionFromLoss = (p: number, missing = 0): string =>
    missing > 0
        ? "Validate missing/zero readings, then re-run balance"
        : p > 25
            ? "Dispatch leak inspection and verify bulk meter"
            : p > TARGET_LOSS_PCT
                ? "Monitor trend and check abnormal meters"
                : "Continue routine monitoring";

/** Human-readable label for the last reading covered by the selection. */
export const lastReadingLabel = (
    year: string,
    nMonths: number,
    vals: ReadonlyArray<number | null> = [],
    sel: Sel = null,
): string => {
    if (isRangeSel(sel)) return `${MONTHS[sel[0]]} ${year} – ${MONTHS[sel[1]]} ${year}`;
    const idx = sel == null ? Math.min(nMonths - 1, vals.length - 1) : sel;
    if (idx < 0) return "No reading";
    if (vals.length && vals[idx] == null) return `${MONTHS[idx]} ${year} · not read`;
    return `${MONTHS[idx]} ${year}`;
};

/* ------------------------------------------------------------------ */
/*  CSV export                                                         */
/* ------------------------------------------------------------------ */

type CsvValue = string | number | null | undefined;
type CsvRow = Record<string, CsvValue>;

const csvCell = (v: CsvValue): string => `"${String(v ?? "").replace(/"/g, '""')}"`;

/** Build a CSV from row objects and trigger a client-side download. */
export function downloadRows(rows: CsvRow[], filename: string): void {
    if (!rows.length) return;
    const cols = Object.keys(rows[0]);
    const csv = [cols.join(","), ...rows.map((r) => cols.map((c) => csvCell(r[c])).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

/* ------------------------------------------------------------------ */
/*  Anomaly flags                                                      */
/* ------------------------------------------------------------------ */

/**
 * Compute data-quality flags for a meter reading; `["Normal"]` when clean.
 *
 * `value == null` means the meter was not read — a different problem from a
 * meter that reported `0`. Both branches are live now that the adapter keeps
 * missing readings as `null` instead of coercing them to `0`.
 */
export function meterFlags(
    m: Pick<YearCache, "label">,
    value: number | null,
    avg: number,
): string[] {
    const flags: string[] = [];
    if (value == null) flags.push("Missing reading");
    if (value === 0 && !["L1", "L2"].includes(m.label)) flags.push("Zero consumption");
    if (value != null && value < 0) flags.push("Negative reading");
    if (value != null && avg > 0 && value > avg * 2.5 && value > 50) flags.push("Sudden spike");
    if (value != null && avg > 0 && value > 0 && value < avg * 0.2) flags.push("Low consumption");
    return flags.length ? flags : ["Normal"];
}

/* ------------------------------------------------------------------ */
/*  Core compute                                                       */
/* ------------------------------------------------------------------ */

/** Is this an end-user meter (counts toward A3)? */
const isEnd = (c: YearCache): boolean =>
    (c.label === "L3" || c.label === "L4") && c.typ !== "D_Building_Bulk";

/**
 * Compute the full water balance and breakdowns for a year and selection.
 *
 * @param data  Adapter output ({@link buildMonthlyData}).
 * @param year  Year string (e.g. `"2025"`).
 * @param sel   `null` (whole period), month index, or `[start, end]` range.
 */
export function computePeriod(data: WaterData, year: string, sel: Sel): PeriodResult {
    let A1 = 0, L2 = 0, DC = 0, END = 0;
    let missingMeters = 0, negativeMeters = 0;
    const zb: Record<string, number> = {};
    const ze: Record<string, number> = {};
    const zc: Record<string, number> = {};
    const zmiss: Record<string, number> = {};
    const zbulkMiss: Record<string, boolean> = {};
    const zname: Record<string, string> = {};
    const tt: Record<string, number> = {};
    const dcs: DcRow[] = [];
    const bulks: Record<string, { v: number; zone: string }> = {};
    const childSum: Record<string, number> = {};

    for (const m of data.meters) {
        const c = m.y[year];
        if (!c) continue;
        if (c.label === "N/A") continue;
        const raw = periodValue(c, sel);
        // The balance can only aggregate readings that exist. Unread meters are
        // counted separately (`missingMeters`) so the UI can say the totals are
        // incomplete rather than presenting a deflated figure as complete.
        const missing = raw == null;
        const v = raw ?? 0;
        if (missing) missingMeters += 1;
        if (v < 0) negativeMeters += 1;

        if (c.label === "L1") A1 += v;
        else if (c.label === "L2") {
            L2 += v;
            zb[c.zone] = (zb[c.zone] || 0) + v;
            zname[c.zone] = c.zoneName;
            if (missing) zbulkMiss[c.zone] = true;
        }
        else if (c.label === "DC") { DC += v; if (v) dcs.push({ name: m.name.replace("DC |", "").trim(), typ: c.typ, total: v }); }
        else if (isEnd(c)) {
            END += v;
            ze[c.zone] = (ze[c.zone] || 0) + v;
            zc[c.zone] = (zc[c.zone] || 0) + 1;
            if (missing) zmiss[c.zone] = (zmiss[c.zone] || 0) + 1;
            zname[c.zone] = c.zoneName;
            tt[c.typ] = (tt[c.typ] || 0) + v;
        }
        if (c.typ === "D_Building_Bulk") bulks[m.name] = { v, zone: c.zoneName };
        if (c.label === "L4") childSum[c.parent] = (childSum[c.parent] || 0) + v;
    }

    const A2 = L2 + DC, A3 = END + DC;

    const zones: ZoneRow[] = Object.keys(zb)
        .map((z) => {
            const b = zb[z], e = ze[z] || 0;
            return {
                zone: z, name: zname[z] || z, bulk: b, end: e, loss: b - e,
                lossPct: pct(b - e, b), meters: zc[z] || 0,
                missing: zmiss[z] || 0, bulkMissing: Boolean(zbulkMiss[z]),
            };
        })
        .filter((z) => z.bulk > 0)
        .sort((a, b) => b.loss - a.loss);

    const tot = END || 1;
    const types: TypeRow[] = Object.keys(tt)
        .map((k) => ({ type: k, total: tt[k], pct: pct(tt[k], tot) }))
        .sort((a, b) => b.total - a.total);

    const buildings: BuildingRow[] = Object.keys(bulks)
        .map((n) => {
            const b = bulks[n].v, s = childSum[n] || 0;
            return { name: n, zone: bulks[n].zone, bulk: b, sub: s, loss: b - s, lossPct: pct(b - s, b) };
        })
        .filter((b) => b.bulk > 0)
        .sort((a, b) => b.loss - a.loss);

    return {
        A1, A2, A3,
        stage1: A1 - A2, stage2: A2 - A3, loss: A1 - A3,
        lossPct: pct(A1 - A3, A1), stage1Pct: pct(A1 - A2, A1), stage2Pct: pct(A2 - A3, A1),
        zones,
        types,
        dcs: dcs.sort((a, b) => b.total - a.total),
        buildings,
        missingMeters,
        negativeMeters,
    };
}

/* ------------------------------------------------------------------ */
/*  Supabase adapter                                                   */
/* ------------------------------------------------------------------ */

/** Code → friendly name lookup, seeded from the app's canonical zone config. */
const ZONE_NAME_BY_CODE: Record<string, string> = Object.fromEntries(
    ZONE_CONFIG.map((z) => [z.code, z.name]),
);

/** Friendly zone name for a code, falling back to a prettified code. */
function zoneNameFor(code: string): string {
    if (!code) return "Unzoned";
    if (ZONE_NAME_BY_CODE[code]) return ZONE_NAME_BY_CODE[code];
    return code.replace(/_/g, " ").replace(/\s*\(([^)]*)\)\s*/g, " $1").trim();
}

/** Parse a `"Mon-YY"` consumption key into `{ year, monthIndex }`, or `null`. */
function parseMonthKey(key: string): { year: string; monthIndex: number } | null {
    const [mon, yy] = key.split("-");
    const monthIndex = (MONTHS as readonly string[]).indexOf(mon);
    if (monthIndex === -1 || !yy) return null;
    return { year: `20${yy}`, monthIndex };
}

/**
 * Transform the live Supabase `WaterMeter[]` into the {@link WaterData} shape the
 * dashboard consumes. Pure and synchronous — the network fetch already happened
 * upstream (`getWaterMetersFromSupabase`).
 *
 * Notes:
 *  - The app's `WaterMeter.label` is the meter *name* and `WaterMeter.level` is
 *    the hierarchy level; the dashboard's `name`/`label` mirror that mapping.
 *  - `monthsWithData[year]` counts months with at least one non-null reading,
 *    so partial years (e.g. a current year mid-way through) report honestly.
 *  - A month with no reading stays `null` in `vals` (it is **not** coerced to
 *    `0`), and a negative reading keeps its sign. Both are then visible to
 *    {@link meterFlags} and to the missing/negative counters in
 *    {@link computePeriod}.
 */
export function buildMonthlyData(meters: WaterMeter[]): WaterData {
    const yearsWithData = new Set<string>();
    const monthsPresent: Record<string, Set<number>> = {};

    const records: MeterRecord[] = meters.map((m) => {
        const y: Record<string, YearCache> = {};

        for (const [key, raw] of Object.entries(m.consumption)) {
            const parsed = parseMonthKey(key);
            if (!parsed) continue;
            const { year, monthIndex } = parsed;
            const cache =
                y[year] ??
                (y[year] = {
                    label: m.level,
                    zone: m.zone,
                    zoneName: zoneNameFor(m.zone),
                    typ: m.type,
                    parent: m.parentMeter,
                    vals: new Array<number | null>(12).fill(null),
                    total: 0,
                    readings: 0,
                });
            // `null` (no reading) and a non-finite value both stay `null`; a
            // real number — including a negative one — is kept verbatim.
            const num = raw == null ? null : Number(raw);
            const value = num == null || !Number.isFinite(num) ? null : num;
            cache.vals[monthIndex] = value;
            if (value != null) {
                cache.total += value;
                cache.readings += 1;
                yearsWithData.add(year);
                (monthsPresent[year] ??= new Set<number>()).add(monthIndex);
            }
        }

        return { name: m.label || "Unknown Meter", acct: m.accountNumber, y };
    });

    const years = Array.from(yearsWithData)
        .map(Number)
        .sort((a, b) => a - b);

    const monthsWithData: Record<string, number> = {};
    const availableMonths: string[] = [];
    for (const year of years) {
        const yy = String(year).slice(2);
        const idxs = Array.from(monthsPresent[String(year)] ?? []).sort((a, b) => a - b);
        monthsWithData[String(year)] = idxs.length;
        for (const i of idxs) availableMonths.push(`${MONTHS[i]}-${yy}`);
    }

    const mainMeter = meters.find((m) => m.level === "L1");

    return {
        meta: {
            years,
            months: MONTHS,
            monthsWithData,
            availableMonths,
            totalMeters: meters.length,
            mainAccount: mainMeter?.accountNumber ?? "—",
        },
        meters: records,
    };
}
