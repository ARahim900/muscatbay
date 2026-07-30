/**
 * Satellite View data adapter.
 *
 * The Satellite View map engine (public/satellite/index.html) was built and
 * field-verified against the "Water 26-Master View" register. It expects two
 * payloads — `CONSUMPTION` and `DAILY_DATA` — whose shapes are documented
 * below. This module derives BOTH from the exact same `WaterMeter[]` the
 * Monthly dashboard renders, so the map and the Monthly tab can never show
 * different figures: one fetch, two projections.
 *
 * Everything here is a pure function of its inputs — no Supabase, no DOM —
 * so the whole contract is unit-testable (see
 * __tests__/components/water/satellite-model.test.ts).
 *
 * Missing readings stay `null` all the way through: the engine's `fmt()`
 * renders null as "—", and every aggregate in this file sums only recorded
 * values (the same convention the master-view compilation used). Nothing is
 * substituted or zero-filled for display.
 */
import type { WaterMeter } from "@/lib/water-data";
import type { DailyWaterConsumption } from "@/entities";
import type { DerivedMonth } from "@/functions/api/water";

// ── Contract types (mirror of what the engine reads) ───────────────────────

export interface SatMeterNode {
    name: string;
    acct: string;
    type: string;
    months: (number | null)[];
    h1: number;
    children?: SatMeterNode[];
    kids_m3?: number;
    sub_loss?: number;
}

export interface SatZone {
    id: string;
    name: string;
    acct: string;
    ml2: (number | null)[];
    ml3: (number | null)[];
    l2: number;
    l3: number;
    nL3: number;
    nL4: number;
    meters: SatMeterNode[];
}

export interface SatTopMeter {
    name: string;
    acct: string;
    type: string;
    monthly: (number | null)[];
    total: number;
}

export interface SatConsumption {
    months: string[];
    /** Human period label, e.g. "January–July 2026". Replaces the engine's old hardcoded "H1". */
    period_label: string;
    /** Short form for inline chips, e.g. "Jan–Jul". */
    period_short: string;
    /** Indexes into `months` whose figures are month-to-date daily sums, not final reads. */
    derived_idx: number[];
    l1: { name: string; acct: string; monthly: (number | null)[]; total: number };
    l2_monthly: (number | null)[];
    dc_monthly: (number | null)[];
    zones: SatZone[];
    dc: SatTopMeter[];
    na: SatTopMeter[];
    counts: Record<string, number>;
    total_meters: number;
    stage1_monthly: number[];
    stage1_spread: [number, number];
}

export interface SatDailyMonth {
    key: string;
    label: string;
    days: number;
    series: Record<string, (number | null)[]>;
    logged: number;
    total: number;
    mean: number;
    gaps: number[];
    partial: boolean;
}

export interface SatellitePayload {
    consumption: SatConsumption;
    daily: SatDailyMonth[];
    /** L4 meters whose parent string matched no L3 meter — should be empty; surfaced for tests/telemetry. */
    unparented: string[];
}

// ── Zone naming ─────────────────────────────────────────────────────────────
// WaterMeter.zone carries the legacy strings fetchWaterMeters emits. The map
// engine keys its camera anchors on the ids below and joins plot geometry on
// the display names, so both must match public/satellite/data/plots-geo.js.
const ZONE_DEFS: { legacy: string; id: string; name: string }[] = [
    { legacy: "Zone_03_(A)", id: "Zone_03A", name: "Zone 3A" },
    { legacy: "Zone_05", id: "Zone_05", name: "Zone 5" },
    { legacy: "Zone_03_(B)", id: "Zone_03B", name: "Zone 3B" },
    { legacy: "Zone_08", id: "Zone_08", name: "Zone 8" },
    { legacy: "Zone_01_(FM)", id: "Zone_FM", name: "Zone FM" },
    { legacy: "Zone_VS", id: "Zone_VS", name: "Village Square" },
];

const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH_FULL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** "Jul-26" → sortable "2026-07", or null when malformed. */
function keyToPeriod(key: string): string | null {
    const [mon, yy] = key.split("-");
    const idx = MONTH_ABBR.indexOf(mon);
    if (idx === -1 || !/^\d{2}$/.test(yy ?? "")) return null;
    return `20${yy}-${String(idx + 1).padStart(2, "0")}`;
}

function daysInMonth(year: number, month1: number): number {
    return new Date(year, month1, 0).getDate();
}

const sumRecorded = (vals: (number | null)[]): number =>
    Math.round(vals.reduce((s: number, v) => s + (v ?? 0), 0));

/** Element-wise sum where a slot is null only if NO series recorded it. */
function sumSeries(rows: (number | null)[][], n: number): (number | null)[] {
    return Array.from({ length: n }, (_, i) => {
        let any = false;
        let s = 0;
        for (const r of rows) {
            const v = r[i];
            if (v !== null && v !== undefined) {
                any = true;
                s += v;
            }
        }
        return any ? Math.round(s * 10) / 10 : null;
    });
}

// ── Monthly payload ─────────────────────────────────────────────────────────

export function buildSatelliteConsumption(
    meters: WaterMeter[],
    derivedMonths: DerivedMonth[],
): { consumption: SatConsumption; unparented: string[] } | null {
    // Months = every consumption key of the latest year present, in order.
    // One year at a time keeps the engine's month chips meaningful.
    const periods = new Map<string, string>(); // period → key
    for (const m of meters) {
        for (const key of Object.keys(m.consumption)) {
            const p = keyToPeriod(key);
            if (p) periods.set(p, key);
        }
    }
    if (periods.size === 0) return null;
    const latestYear = Array.from(periods.keys()).sort().at(-1)!.slice(0, 4);
    const orderedPeriods = Array.from(periods.keys())
        .filter((p) => p.startsWith(latestYear))
        .sort();
    const monthKeys = orderedPeriods.map((p) => periods.get(p)!);
    const months = orderedPeriods.map((p) => MONTH_ABBR[Number(p.slice(5)) - 1]);

    const seriesOf = (m: WaterMeter): (number | null)[] =>
        monthKeys.map((k) => (m.consumption[k] === undefined ? null : m.consumption[k]));

    const l1Meter = meters.find((m) => m.level === "L1");
    if (!l1Meter) return null;
    const l1Monthly = seriesOf(l1Meter);

    const derivedKeys = new Set(derivedMonths.map((d) => d.month));
    const derived_idx = monthKeys
        .map((k, i) => (derivedKeys.has(k) ? i : -1))
        .filter((i) => i >= 0);

    const node = (m: WaterMeter): SatMeterNode => {
        const s = seriesOf(m);
        return { name: m.label, acct: m.accountNumber, type: m.type, months: s, h1: sumRecorded(s) };
    };

    // L4 children grouped under their L3 parent by meter name.
    const l4ByParent = new Map<string, WaterMeter[]>();
    const unparented: string[] = [];
    const l3ByName = new Map<string, WaterMeter>();
    for (const m of meters) if (m.level === "L3") l3ByName.set(m.label, m);
    for (const m of meters) {
        if (m.level !== "L4") continue;
        if (l3ByName.has(m.parentMeter)) {
            const list = l4ByParent.get(m.parentMeter) ?? [];
            list.push(m);
            l4ByParent.set(m.parentMeter, list);
        } else {
            unparented.push(`${m.label} (${m.accountNumber}) → "${m.parentMeter}"`);
        }
    }

    const zones: SatZone[] = [];
    for (const def of ZONE_DEFS) {
        const bulk = meters.find((m) => m.level === "L2" && m.zone === def.legacy);
        if (!bulk) continue;
        const l3s = meters.filter((m) => m.level === "L3" && m.zone === def.legacy);
        const meterNodes = l3s
            .map((m) => {
                const n = node(m);
                const kids = (l4ByParent.get(m.label) ?? []).map(node);
                if (kids.length) {
                    kids.sort((a, b) => b.h1 - a.h1);
                    n.children = kids;
                    n.kids_m3 = kids.reduce((s, k) => s + k.h1, 0);
                    n.sub_loss = n.h1 - n.kids_m3;
                }
                return n;
            })
            .sort((a, b) => b.h1 - a.h1);
        const ml2 = seriesOf(bulk);
        const ml3 = sumSeries(l3s.map(seriesOf), monthKeys.length);
        zones.push({
            id: def.id,
            name: def.name,
            acct: bulk.accountNumber,
            ml2,
            ml3,
            l2: sumRecorded(ml2),
            l3: sumRecorded(ml3),
            nL3: l3s.length,
            nL4: l3s.reduce((s, m) => s + (l4ByParent.get(m.label)?.length ?? 0), 0),
            meters: meterNodes,
        });
    }

    const top = (m: WaterMeter): SatTopMeter => {
        const s = seriesOf(m);
        return { name: m.label, acct: m.accountNumber, type: m.type, monthly: s, total: sumRecorded(s) };
    };
    const dc = meters.filter((m) => m.level === "DC").map(top).sort((a, b) => b.total - a.total);
    const na = meters.filter((m) => m.level === "N/A").map(top).sort((a, b) => b.total - a.total);

    const l2_monthly = sumSeries(zones.map((z) => z.ml2), monthKeys.length);
    const dc_monthly = sumSeries(dc.map((d) => d.monthly), monthKeys.length);

    const stage1_monthly = monthKeys.map((_, i) =>
        Math.round((l1Monthly[i] ?? 0) - (l2_monthly[i] ?? 0) - (dc_monthly[i] ?? 0)),
    );
    const stage1_pct = monthKeys
        .map((_, i) => {
            const l1 = l1Monthly[i];
            return l1 ? Math.round((stage1_monthly[i] / l1) * 1000) / 10 : null;
        })
        .filter((v): v is number => v !== null);
    const stage1_spread: [number, number] = stage1_pct.length
        ? [Math.min(...stage1_pct), Math.max(...stage1_pct)]
        : [0, 0];

    const counts: Record<string, number> = {};
    for (const m of meters) counts[m.level] = (counts[m.level] ?? 0) + 1;

    const firstFull = MONTH_FULL[Number(orderedPeriods[0].slice(5)) - 1];
    const lastFull = MONTH_FULL[Number(orderedPeriods.at(-1)!.slice(5)) - 1];
    const period_label =
        orderedPeriods.length > 1 ? `${firstFull}–${lastFull} ${latestYear}` : `${firstFull} ${latestYear}`;
    const period_short =
        orderedPeriods.length > 1 ? `${months[0]}–${months.at(-1)!}` : months[0];

    return {
        consumption: {
            months,
            period_label,
            period_short,
            derived_idx,
            l1: { name: l1Meter.label, acct: l1Meter.accountNumber, monthly: l1Monthly, total: sumRecorded(l1Monthly) },
            l2_monthly,
            dc_monthly,
            zones,
            dc,
            na,
            counts,
            total_meters: meters.length,
            stage1_monthly,
            stage1_spread,
        },
        unparented,
    };
}

// ── Daily payload ────────────────────────────────────────────────────────────

/**
 * Daily series for the engine's timeline drawer. Only the L1 main-bulk series
 * is emitted: it is a single meter, so its daily line needs no aggregation
 * assumptions. (Summing partial L2/L3 coverage into a "level total" would
 * understate real flow on days when some meters weren't logged — the engine
 * simply draws the series that exist.)
 */
export function buildSatelliteDaily(rows: DailyWaterConsumption[]): SatDailyMonth[] {
    const l1 = rows.filter((r) => r.label === "L1");
    const byMonth = new Map<string, DailyWaterConsumption[]>();
    for (const r of l1) {
        const list = byMonth.get(r.month) ?? [];
        list.push(r);
        byMonth.set(r.month, list);
    }

    const out: SatDailyMonth[] = [];
    for (const [monthKey, monthRows] of byMonth) {
        const period = keyToPeriod(monthKey);
        if (!period) continue;
        const year = Number(period.slice(0, 4));
        const month1 = Number(period.slice(5));
        const days = daysInMonth(year, month1);
        const vals: (number | null)[] = Array.from({ length: days }, (_, i) => {
            // More than one L1 row for a month would be a data fault; sum
            // recorded values so nothing silently wins.
            let any = false;
            let s = 0;
            for (const r of monthRows) {
                const v = r.dailyReadings[i + 1];
                if (v !== null && v !== undefined) {
                    any = true;
                    s += v;
                }
            }
            return any ? s : null;
        });
        const logged = vals.filter((v) => v !== null).length;
        const total = Math.round(vals.reduce((s: number, v) => s + (v ?? 0), 0));
        const mean = logged ? Math.round(total / logged) : 0;
        const last: number = vals.reduce((acc: number, v, i) => (v !== null ? i : acc), -1);
        const gaps = vals
            .map((v, i) => (v === null && i < last ? i + 1 : -1))
            .filter((d) => d > 0);
        out.push({
            key: period,
            label: `${MONTH_FULL[month1 - 1]} ${year}`,
            days,
            series: { L1: vals },
            logged,
            total,
            mean,
            gaps,
            partial: logged < days && gaps.length === 0,
        });
    }
    return out.sort((a, b) => a.key.localeCompare(b.key));
}

export function buildSatellitePayload(
    meters: WaterMeter[],
    derivedMonths: DerivedMonth[],
    dailyRows: DailyWaterConsumption[],
): SatellitePayload | null {
    const monthly = buildSatelliteConsumption(meters, derivedMonths);
    if (!monthly) return null;
    return {
        consumption: monthly.consumption,
        daily: buildSatelliteDaily(dailyRows),
        unparented: monthly.unparented,
    };
}
