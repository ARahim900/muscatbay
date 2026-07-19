/**
 * @fileoverview Water 3D Map — data adapter (pure, framework-free).
 *
 * Converts the app's EXISTING water data + calc engines into a single
 * renderer-agnostic {@link MapSnapshot} that the 3D scene, the panels and the
 * accessible table fallback all consume. Nothing here re-derives a balance or
 * invents a threshold:
 *   • Monthly reuses `buildMonthlyData` → `computePeriod` (A1→A2→A3 model).
 *   • Daily reuses `buildDailyGrid` → `buildZoneDaySeries` → `buildZoneWatch`
 *     (distribution-level L2 vs ΣL3 — the daily view has no L1/NAMA).
 *   • Severity reuses `sev()`; anomaly flags reuse `meterFlags` / `detectSpike`
 *     / `zeroStreak`.
 * Positions come from the provisional layout in `water-map-config`; every
 * numeric value comes from Supabase.
 *
 * @module lib/water-map-data
 */

import type { WaterMeter } from "@/lib/water-data";
import type { SupabaseDailyWaterConsumption } from "@/entities/water";
import {
    buildMonthlyData,
    computePeriod,
    meterFlags,
    sev,
    MONTHS,
    type WaterData,
    type PeriodResult,
} from "@/lib/water-monthly-data";
import {
    buildDailyGrid,
    buildZoneDaySeries,
    buildZoneWatch,
    detectSpike,
    zeroStreak,
    wasActiveBefore,
    gridValue,
    type DailyGrid,
    type ZoneWatchRow,
    type DailySeverity,
} from "@/components/water/daily-report/daily-metrics";
import {
    MAP_ZONES,
    MAIN_BULK_NODE,
    DIRECT_CONNECTION_NODE,
    layoutPointsInFootprint,
    knownLocalForAccount,
    zoneByMonthlyCode,
    zoneByDailyCode,
    POSITIONS_ARE_PROVISIONAL,
    type MapZoneConfig,
    type MapZoneId,
    type LocalXZ,
} from "@/lib/water-map-config";

/* ------------------------------------------------------------------ */
/*  Public types                                                       */
/* ------------------------------------------------------------------ */

export type MapMode = "monthly" | "daily";

/** Unified 5-level status shared with the inspection toolkit. */
export type MapSeverity = "nodata" | "good" | "watch" | "high" | "critical";

/** Node role — drives glyph/size/height in the renderer. */
export type MapNodeRole = "main" | "zoneBulk" | "building" | "meter" | "dc";

export interface MapZoneDatum {
    id: MapZoneId;
    name: string;
    short: string;
    seriesToken: string;
    local: LocalXZ;
    footprint: { w: number; d: number };
    /** L2 zone-bulk supply for the period (m³). */
    bulk: number;
    /** Σ end-user consumption for the period (m³). */
    downstream: number;
    /** bulk − downstream (m³). */
    loss: number;
    lossPct: number;
    efficiency: number;
    /** Active end-user meters assigned to the zone. */
    meterCount: number;
    /** End-user meters with a missing reading this period. */
    missingCount: number;
    /** End-user meters flagged abnormal (spike / zero / negative / low). */
    abnormalCount: number;
    severity: MapSeverity;
    hasData: boolean;
}

export interface MapMeterDatum {
    /** Stable unique key (account + role). */
    key: string;
    account: string;
    name: string;
    /** Hierarchy level — L1 / L2 / L3 / L4 / DC / N/A. */
    level: string;
    type: string;
    zoneId: MapZoneId | null;
    zoneName: string;
    parent: string;
    /** Consumption for the selected period (m³); null = missing reading. */
    value: number | null;
    /** Previous period reading (prev month / prev day). */
    prevValue: number | null;
    /** Change vs previous period (%). */
    changePct: number | null;
    /** Trailing average context (m³). */
    avg: number | null;
    /** Share of the zone's downstream total (%). */
    contributionPct: number | null;
    flags: string[];
    severity: MapSeverity;
    local: LocalXZ;
    role: MapNodeRole;
}

export interface MapNetworkTotals {
    /** Top-of-network supply — NAMA (monthly) or Σ zone bulk (daily). */
    bulk: number;
    downstream: number;
    loss: number;
    lossPct: number;
    efficiency: number;
    /** True when the supply figure is distribution-level (Σ L2), i.e. daily. */
    distributionLevel: boolean;
}

export interface MapSnapshot {
    mode: MapMode;
    /** Human label, e.g. "Jun 2026" or "Jun 12, 2026". */
    periodLabel: string;
    /** Machine key, e.g. "2026-06" or "2026-06-12". */
    periodKey: string;
    zones: MapZoneDatum[];
    meters: MapMeterDatum[];
    totals: MapNetworkTotals;
    mainBulk: { account: string; name: string; value: number | null; local: LocalXZ } | null;
    /** True — the map positions are provisional (see water-map-config). */
    provisionalPositions: boolean;
    hasData: boolean;
}

/* ------------------------------------------------------------------ */
/*  Small helpers                                                      */
/* ------------------------------------------------------------------ */

const clampPct = (v: number): number => Math.max(0, Math.min(100, v));

const efficiencyFrom = (bulk: number, downstream: number): number =>
    bulk > 0 ? clampPct((downstream / bulk) * 100) : 0;

const changePctFrom = (value: number | null, prev: number | null): number | null =>
    value !== null && prev !== null && prev !== 0 ? +(((value - prev) / prev) * 100).toFixed(1) : null;

const contributionFrom = (value: number | null, total: number): number | null =>
    value !== null && total > 0 ? +((value / total) * 100).toFixed(1) : null;

/** Map a loss % to the unified status using the Monthly engine's exact bands. */
export function severityFromLossPct(lossPct: number | null, hasData: boolean): MapSeverity {
    if (!hasData || lossPct === null || Number.isNaN(lossPct)) return "nodata";
    switch (sev(lossPct).label) {
        case "Good":
            return "good";
        case "Moderate":
            return "watch";
        case "High":
            return "high";
        case "Critical":
            return "critical";
        default:
            return "nodata"; // "Check" (negative) / "–"
    }
}

/** Map the daily engine's severity enum onto the unified status. */
function severityFromDaily(s: DailySeverity): MapSeverity {
    switch (s) {
        case "good":
            return "good";
        case "moderate":
            return "watch";
        case "high":
            return "high";
        case "critical":
            return "critical";
        default:
            return "nodata"; // "nodata" | "check"
    }
}

/** A meter is "abnormal" when flagged for anything other than normal/missing. */
const ABNORMAL_FLAGS = new Set(["Zero consumption", "Negative reading", "Sudden spike", "Low consumption"]);
const isAbnormalFlags = (flags: string[]): boolean => flags.some((f) => ABNORMAL_FLAGS.has(f));

/** Deterministic grid of `count` points centred on `center`, spanning `span` metres. */
function gridAround(center: LocalXZ, count: number, span: number): LocalXZ[] {
    if (count <= 0) return [];
    const cols = Math.max(1, Math.ceil(Math.sqrt(count)));
    const rows = Math.max(1, Math.ceil(count / cols));
    const stepX = cols > 1 ? span / (cols - 1) : 0;
    const stepZ = rows > 1 ? span / (rows - 1) : 0;
    const x0 = center.x - span / 2;
    const z0 = center.z - span / 2;
    const pts: LocalXZ[] = [];
    for (let i = 0; i < count; i++) {
        pts.push({ x: x0 + (i % cols) * stepX, z: z0 + Math.floor(i / cols) * stepZ });
    }
    return pts;
}

const isEndUser = (level: string, type: string): boolean =>
    (level === "L3" || level === "L4") && type !== "D_Building_Bulk";

/* ------------------------------------------------------------------ */
/*  Monthly snapshot                                                   */
/* ------------------------------------------------------------------ */

/** One available monthly period, derived from the live meter set. */
export interface MonthlyPeriodOption {
    year: string;
    monthIndex: number;
    /** "Mon-YY" consumption key. */
    key: string;
    label: string;
    /** "YYYY-MM". */
    periodKey: string;
}

/** Enumerate the months that actually have readings, ascending. */
export function monthlyPeriodsFromMeters(meters: WaterMeter[]): MonthlyPeriodOption[] {
    const data = buildMonthlyData(meters);
    return data.meta.availableMonths
        .map((key) => {
            const [mon, yy] = key.split("-");
            const monthIndex = (MONTHS as readonly string[]).indexOf(mon);
            if (monthIndex === -1 || !yy) return null;
            const year = `20${yy}`;
            return {
                year,
                monthIndex,
                key,
                label: `${mon} ${year}`,
                periodKey: `${year}-${String(monthIndex + 1).padStart(2, "0")}`,
            } satisfies MonthlyPeriodOption;
        })
        .filter((p): p is MonthlyPeriodOption => p !== null);
}

/** Mean of a meter's non-null readings (trailing context for anomaly flags). */
function meterAverage(consumption: Record<string, number | null>): number {
    let sum = 0;
    let n = 0;
    for (const v of Object.values(consumption)) {
        if (v !== null && !Number.isNaN(v)) {
            sum += v;
            n += 1;
        }
    }
    return n > 0 ? sum / n : 0;
}

/**
 * Build the monthly snapshot for a specific month (year + 0-based month index).
 * Pure — `meters` is the already-fetched `getWaterMetersFromSupabase()` output.
 */
export function buildMonthlyMapSnapshot(
    meters: WaterMeter[],
    year: string,
    monthIndex: number,
): MapSnapshot {
    const data: WaterData = buildMonthlyData(meters);
    const pr: PeriodResult = computePeriod(data, year, monthIndex);
    const yy = year.slice(2);
    const monthKey = `${MONTHS[monthIndex]}-${yy}`;
    const prevKey = monthIndex > 0 ? `${MONTHS[monthIndex - 1]}-${yy}` : null;

    // Index the period's zone rows (authoritative bulk/loss) by zone code.
    const zoneRowByCode = new Map(pr.zones.map((z) => [z.zone, z]));

    // ── Partition meters ─────────────────────────────────────────────────
    const zoneMeters = new Map<MapZoneId, WaterMeter[]>();
    const dcMeters: WaterMeter[] = [];
    let mainMeter: WaterMeter | null = null;
    for (const m of meters) {
        if (m.level === "L1") {
            mainMeter = m;
            continue;
        }
        if (m.level === "DC" || m.zone === "Direct Connection") {
            dcMeters.push(m);
            continue;
        }
        const zone = zoneByMonthlyCode(m.zone);
        if (!zone) continue; // N/A / unmapped — omitted from the scene
        const list = zoneMeters.get(zone.id);
        if (list) list.push(m);
        else zoneMeters.set(zone.id, [m]);
    }

    const outMeters: MapMeterDatum[] = [];

    const meterDatum = (
        m: WaterMeter,
        local: LocalXZ,
        role: MapNodeRole,
        zone: MapZoneConfig | null,
        zoneDownstream: number,
    ): MapMeterDatum => {
        const value = m.consumption[monthKey] ?? null;
        const prevValue = prevKey ? m.consumption[prevKey] ?? null : null;
        const avg = meterAverage(m.consumption);
        const flags = meterFlags({ label: m.level }, value, avg);
        const severity: MapSeverity =
            value === null ? "nodata" : isAbnormalFlags(flags) ? "watch" : "good";
        return {
            key: `${m.accountNumber}:${role}`,
            account: m.accountNumber,
            name: m.label,
            level: m.level,
            type: m.type,
            zoneId: zone?.id ?? null,
            zoneName: zone?.name ?? (m.zone || "—"),
            parent: m.parentMeter,
            value,
            prevValue,
            changePct: changePctFrom(value, prevValue),
            avg: +avg.toFixed(1),
            contributionPct: contributionFrom(value, zoneDownstream),
            flags,
            severity,
            local: knownLocalForAccount(m.accountNumber) ?? local,
            role,
        };
    };

    // ── Zones ────────────────────────────────────────────────────────────
    const zones: MapZoneDatum[] = MAP_ZONES.map((cfg) => {
        const row = zoneRowByCode.get(cfg.monthlyCode);
        const list = zoneMeters.get(cfg.id) ?? [];
        const endUsers = list.filter((m) => isEndUser(m.level, m.type));
        const downstream = row?.end ?? endUsers.reduce((s, m) => s + (m.consumption[monthKey] ?? 0), 0);

        // Place nodes: L2 bulk at centre, everything else on the footprint grid.
        const bulkMeter = list.find((m) => m.level === "L2");
        const placed = list.filter((m) => m.level !== "L2");
        const pts = layoutPointsInFootprint(cfg, placed.length);
        if (bulkMeter) {
            outMeters.push(meterDatum(bulkMeter, cfg.local, "zoneBulk", cfg, downstream));
        }
        placed.forEach((m, i) => {
            const role: MapNodeRole = m.type === "D_Building_Bulk" ? "building" : "meter";
            outMeters.push(meterDatum(m, pts[i] ?? cfg.local, role, cfg, downstream));
        });

        let missingCount = 0;
        let abnormalCount = 0;
        for (const m of endUsers) {
            const v = m.consumption[monthKey] ?? null;
            if (v === null) missingCount += 1;
            else if (isAbnormalFlags(meterFlags({ label: m.level }, v, meterAverage(m.consumption)))) abnormalCount += 1;
        }

        const bulk = row?.bulk ?? 0;
        const loss = row?.loss ?? bulk - downstream;
        const lossPct = row?.lossPct ?? (bulk > 0 ? +(((bulk - downstream) / bulk) * 100).toFixed(1) : 0);
        const hasData = bulk > 0 || downstream > 0;

        return {
            id: cfg.id,
            name: cfg.name,
            short: cfg.short,
            seriesToken: cfg.seriesToken,
            local: cfg.local,
            footprint: cfg.footprint,
            bulk,
            downstream,
            loss,
            lossPct,
            efficiency: efficiencyFrom(bulk, downstream),
            meterCount: row?.meters ?? endUsers.length,
            missingCount,
            abnormalCount,
            severity: severityFromLossPct(lossPct, hasData),
            hasData,
        } satisfies MapZoneDatum;
    });

    // ── Direct connections ───────────────────────────────────────────────
    const dcPts = gridAround(DIRECT_CONNECTION_NODE.local, dcMeters.length, 90);
    dcMeters.forEach((m, i) => {
        outMeters.push(meterDatum(m, dcPts[i] ?? DIRECT_CONNECTION_NODE.local, "dc", null, 0));
    });

    // ── Main bulk (NAMA L1) ──────────────────────────────────────────────
    let mainBulk: MapSnapshot["mainBulk"] = null;
    if (mainMeter) {
        const value = mainMeter.consumption[monthKey] ?? null;
        mainBulk = { account: mainMeter.accountNumber, name: mainMeter.label, value, local: MAIN_BULK_NODE.local };
        outMeters.push(meterDatum(mainMeter, MAIN_BULK_NODE.local, "main", null, 0));
    }

    const totals: MapNetworkTotals = {
        bulk: pr.A1,
        downstream: pr.A3,
        loss: pr.loss,
        lossPct: pr.lossPct,
        efficiency: efficiencyFrom(pr.A1, pr.A3),
        distributionLevel: false,
    };

    return {
        mode: "monthly",
        periodLabel: `${MONTHS[monthIndex]} ${year}`,
        periodKey: `${year}-${String(monthIndex + 1).padStart(2, "0")}`,
        zones,
        meters: outMeters,
        totals,
        mainBulk,
        provisionalPositions: POSITIONS_ARE_PROVISIONAL,
        hasData: pr.A1 > 0 || zones.some((z) => z.hasData),
    };
}

/* ------------------------------------------------------------------ */
/*  Daily snapshot                                                     */
/* ------------------------------------------------------------------ */

/** Trailing average of up to 7 prior non-null readings for spike context. */
function trailingAvg(grid: DailyGrid, account: string, day: number): number | null {
    const window: number[] = [];
    for (let d = day - 1; d >= 1 && window.length < 7; d--) {
        const v = gridValue(grid, account, d);
        if (v !== null) window.push(v);
    }
    if (window.length === 0) return null;
    return +(window.reduce((s, x) => s + x, 0) / window.length).toFixed(1);
}

/**
 * Build the daily snapshot for a specific day. Pure — `rows` are the RAW
 * `water_daily_consumption` rows for the month (the daily engine needs the wide
 * `day_1..day_31` shape, so pass the raw rows, not the transformed ones).
 */
export function buildDailyMapSnapshot(
    rows: SupabaseDailyWaterConsumption[],
    month: string,
    year: number,
    day: number,
): MapSnapshot {
    const grid: DailyGrid = buildDailyGrid(rows);
    const series = buildZoneDaySeries(grid);
    const watch: ZoneWatchRow[] = buildZoneWatch(series, day);
    const watchByName = new Map(watch.map((w) => [w.zoneName, w]));

    // ── Partition rows ───────────────────────────────────────────────────
    const zoneRows = new Map<MapZoneId, SupabaseDailyWaterConsumption[]>();
    const dcRows: SupabaseDailyWaterConsumption[] = [];
    let mainRow: SupabaseDailyWaterConsumption | null = null;
    for (const r of rows) {
        const level = (r.label ?? "").toUpperCase();
        if (level === "L1") {
            mainRow = r;
            continue;
        }
        if (level === "DC" || r.zone === "Direct_Connection") {
            dcRows.push(r);
            continue;
        }
        const zone = zoneByDailyCode(r.zone ?? "");
        if (!zone) continue;
        const list = zoneRows.get(zone.id);
        if (list) list.push(r);
        else zoneRows.set(zone.id, [r]);
    }

    const outMeters: MapMeterDatum[] = [];

    const meterDatum = (
        r: SupabaseDailyWaterConsumption,
        local: LocalXZ,
        role: MapNodeRole,
        zone: MapZoneConfig | null,
        zoneDownstream: number,
    ): MapMeterDatum => {
        const account = r.account_number;
        const value = gridValue(grid, account, day);
        const prevValue = day > 1 ? gridValue(grid, account, day - 1) : null;
        const avg = trailingAvg(grid, account, day);
        const values = grid.values.get(account) ?? [];
        const flags: string[] = [];
        if (value === null) flags.push("Missing reading");
        if (value !== null && value < 0) flags.push("Negative reading");
        if (detectSpike(values, day)) flags.push("Sudden spike");
        const zStreak = zeroStreak(values, day);
        if (zStreak >= 3 && wasActiveBefore(values, day, zStreak)) flags.push("Zero consumption");
        if (flags.length === 0) flags.push("Normal");
        const severity: MapSeverity = value === null ? "nodata" : isAbnormalFlags(flags) ? "watch" : "good";
        return {
            key: `${account}:${role}`,
            account,
            name: r.meter_name || account,
            level: r.label ?? "",
            type: r.type ?? "",
            zoneId: zone?.id ?? null,
            zoneName: zone?.name ?? (r.zone || "—"),
            parent: r.parent_meter ?? "",
            value,
            prevValue,
            changePct: changePctFrom(value, prevValue),
            avg,
            contributionPct: contributionFrom(value, zoneDownstream),
            flags,
            severity,
            local: knownLocalForAccount(account) ?? local,
            role,
        };
    };

    // ── Zones ────────────────────────────────────────────────────────────
    const zones: MapZoneDatum[] = MAP_ZONES.map((cfg) => {
        const w = watchByName.get(cfg.name);
        const list = zoneRows.get(cfg.id) ?? [];
        const bulk = w?.l2 ?? 0;
        const downstream = w?.l3Sum ?? 0;

        const bulkRow = list.find((r) => (r.label ?? "").toUpperCase() === "L2");
        const placed = list.filter((r) => (r.label ?? "").toUpperCase() !== "L2");
        const pts = layoutPointsInFootprint(cfg, placed.length);
        if (bulkRow) outMeters.push(meterDatum(bulkRow, cfg.local, "zoneBulk", cfg, downstream));
        placed.forEach((r, i) => {
            const role: MapNodeRole = (r.type ?? "").includes("Bulk") ? "building" : "meter";
            outMeters.push(meterDatum(r, pts[i] ?? cfg.local, role, cfg, downstream));
        });

        // Missing/abnormal over end-user meters in the zone.
        let missingCount = 0;
        let abnormalCount = 0;
        for (const r of list) {
            const level = (r.label ?? "").toUpperCase();
            if (level !== "L3" && level !== "L4") continue;
            const account = r.account_number;
            const v = gridValue(grid, account, day);
            if (v === null) {
                missingCount += 1;
                continue;
            }
            const values = grid.values.get(account) ?? [];
            const zStreak = zeroStreak(values, day);
            if (detectSpike(values, day) || (zStreak >= 3 && wasActiveBefore(values, day, zStreak)) || v < 0) {
                abnormalCount += 1;
            }
        }

        const loss = w?.loss ?? bulk - downstream;
        const lossPct = w?.lossPct ?? (bulk > 0 ? +(((bulk - downstream) / bulk) * 100).toFixed(1) : 0);
        const hasData = w ? w.l2 !== null || w.l3Sum > 0 : false;

        return {
            id: cfg.id,
            name: cfg.name,
            short: cfg.short,
            seriesToken: cfg.seriesToken,
            local: cfg.local,
            footprint: cfg.footprint,
            bulk,
            downstream,
            loss,
            lossPct,
            efficiency: efficiencyFrom(bulk, downstream),
            meterCount: w?.meterCount ?? 0,
            missingCount,
            abnormalCount,
            severity: w ? severityFromDaily(w.severity) : "nodata",
            hasData,
        } satisfies MapZoneDatum;
    });

    // ── Direct connections ───────────────────────────────────────────────
    const dcPts = gridAround(DIRECT_CONNECTION_NODE.local, dcRows.length, 90);
    dcRows.forEach((r, i) => {
        outMeters.push(meterDatum(r, dcPts[i] ?? DIRECT_CONNECTION_NODE.local, "dc", null, 0));
    });

    // ── Main bulk (present in daily rows but not part of the distribution balance) ──
    let mainBulk: MapSnapshot["mainBulk"] = null;
    if (mainRow) {
        const value = gridValue(grid, mainRow.account_number, day);
        mainBulk = { account: mainRow.account_number, name: mainRow.meter_name || "Main Bulk", value, local: MAIN_BULK_NODE.local };
        outMeters.push(meterDatum(mainRow, MAIN_BULK_NODE.local, "main", null, 0));
    }

    // Network daily balance is distribution-level: Σ zone bulk (L2) vs Σ ΣL3.
    const bulk = watch.reduce((s, w) => s + (w.l2 ?? 0), 0);
    const downstream = watch.reduce((s, w) => s + w.l3Sum, 0);
    const loss = +(bulk - downstream).toFixed(1);
    const totals: MapNetworkTotals = {
        bulk,
        downstream,
        loss,
        lossPct: bulk > 0 ? +((loss / bulk) * 100).toFixed(1) : 0,
        efficiency: efficiencyFrom(bulk, downstream),
        distributionLevel: true,
    };

    const monthAbbr = month.split("-")[0] || month;

    return {
        mode: "daily",
        periodLabel: `${monthAbbr} ${day}, ${year}`,
        periodKey: `${year}-${month}-${String(day).padStart(2, "0")}`,
        zones,
        meters: outMeters,
        totals,
        mainBulk,
        provisionalPositions: POSITIONS_ARE_PROVISIONAL,
        hasData: bulk > 0 || downstream > 0,
    };
}
