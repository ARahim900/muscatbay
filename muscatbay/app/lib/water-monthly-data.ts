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
 * Brand chart palette for the consumption-by-type series. Mirrors the app's
 * `--chart-1..5` tokens plus a warm orange and a neutral fallback.
 */
export const TYPECOL = [
    "#6B9AC4", "#A1D1D5", "#E8C064", "#84B59F",
    "#4D445D", "#9B86A8", "#DF9A5B", "#6B7280",
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
    /** 12 monthly readings, January-first; `0` where there is no reading. */
    vals: number[];
    /** Sum of `vals`. */
    total: number;
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
}

/** Loss-severity descriptor (colour + background + label). */
export interface Severity {
    c: string;
    bg: string;
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

/** Sum `vals[start..end]` inclusive, coercing nullish entries to `0`. */
export const sumRange = (vals: number[] = [], start = 0, end = vals.length - 1): number =>
    vals.slice(start, end + 1).reduce((a, b) => a + (Number(b) || 0), 0);

/** Resolve a year-cache value for the current selection. */
export const periodValue = (c: YearCache, sel: Sel): number => {
    if (sel == null) return c.total;
    if (isRangeSel(sel)) return sumRange(c.vals, sel[0], sel[1]);
    return c.vals[sel] ?? 0;
};

/** Is month index `i` part of the current selection? */
export const monthInSelection = (sel: Sel, i: number): boolean =>
    isRangeSel(sel) ? i >= sel[0] && i <= sel[1] : i === sel;

/** Map a loss percentage to a severity descriptor (WCAG-AA text variants). */
export function sev(p: number | null | undefined): Severity {
    if (p == null || isNaN(p)) return { c: "#7A6F82", bg: "#F1F0F3", label: "–" };
    if (p < 0) return { c: "#7A6F82", bg: "#F1F0F3", label: "Check" };
    if (p < 10) return { c: "#5E8C77", bg: "#EAF3EE", label: "Good" };
    if (p < 25) return { c: "#9A7B1F", bg: "#FBF3DD", label: "Moderate" };
    if (p < 50) return { c: "#B5703A", bg: "#FBEDE0", label: "High" };
    return { c: "#B85C5C", bg: "#F7E4E4", label: "Critical" };
}

/** Status label/colour for a zone or building loss percentage vs. target. */
export const statusFromLoss = (p: number): { label: string; c: string; bg: string } =>
    p <= TARGET_LOSS_PCT
        ? { label: "Normal", c: "#5E8C77", bg: "#EAF3EE" }
        : p <= 25
            ? { label: "Watch", c: "#9A7B1F", bg: "#FBF3DD" }
            : { label: "Critical", c: "#B85C5C", bg: "#F7E4E4" };

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
    vals: number[] = [],
    sel: Sel = null,
): string => {
    if (isRangeSel(sel)) return `${MONTHS[sel[0]]} ${year} – ${MONTHS[sel[1]]} ${year}`;
    const idx = sel == null ? Math.min(nMonths - 1, vals.length - 1) : sel;
    if (idx < 0) return "No reading";
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

/** Compute data-quality flags for a meter reading; `["Normal"]` when clean. */
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
    const zb: Record<string, number> = {};
    const ze: Record<string, number> = {};
    const zc: Record<string, number> = {};
    const zname: Record<string, string> = {};
    const tt: Record<string, number> = {};
    const dcs: DcRow[] = [];
    const bulks: Record<string, { v: number; zone: string }> = {};
    const childSum: Record<string, number> = {};

    for (const m of data.meters) {
        const c = m.y[year];
        if (!c) continue;
        const v = periodValue(c, sel);
        if (c.label === "N/A") continue;
        if (c.label === "L1") A1 += v;
        else if (c.label === "L2") { L2 += v; zb[c.zone] = (zb[c.zone] || 0) + v; zname[c.zone] = c.zoneName; }
        else if (c.label === "DC") { DC += v; if (v) dcs.push({ name: m.name.replace("DC |", "").trim(), typ: c.typ, total: v }); }
        else if (isEnd(c)) {
            END += v;
            ze[c.zone] = (ze[c.zone] || 0) + v;
            zc[c.zone] = (zc[c.zone] || 0) + 1;
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
            return { zone: z, name: zname[z] || z, bulk: b, end: e, loss: b - e, lossPct: pct(b - e, b), meters: zc[z] || 0 };
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
                    vals: new Array<number>(12).fill(0),
                    total: 0,
                });
            const value = raw == null ? 0 : Number(raw) || 0;
            cache.vals[monthIndex] = value;
            cache.total += value;
            if (raw != null) {
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
