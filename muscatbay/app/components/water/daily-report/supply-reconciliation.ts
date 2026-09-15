/**
 * @fileoverview Supply-side reconciliation for Water → Daily → Direct Connections.
 *
 * The chain this tab reconciles, for one day of the loaded month:
 *
 *   Main Bulk (L1 — NAMA, C43659)
 *     ↓  trunk-main loss = L1 − (ΣL2 + ΣDC)
 *   Σ zone bulks (L2, one per zone including ZEN Project)
 *     + Σ direct connections (DC — fed straight off the main inlet)
 *
 * The middle gauge on the tab **is** `combined` below, so this module is what
 * makes that gauge auditable: every account feeding it gets a row in the table,
 * day by day, with its own subtotal.
 *
 * Two rules are load-bearing here:
 *
 * 1. **Missing ≠ zero.** A meter with no stored reading keeps `null` in its own
 *    cell and is counted in `unreadPerDay`. Group subtotals still sum nulls as
 *    0 — the convention the whole Daily module uses — but the unread count
 *    travels with the subtotal so the UI can say the total is partial instead
 *    of implying the network ran dry.
 * 2. **TSE is not NAMA.** The two irrigation controllers (4300340 / 4300341)
 *    run on treated effluent and are `N/A` in the meter registry, so they are
 *    not direct connections and must never enter this balance — see
 *    `TSE_IRRIGATION_METERS` in `lib/water-accounts.ts`.
 *
 * Framework-free on purpose: unit-testable without React/jsdom.
 *
 * @module components/water/daily-report/supply-reconciliation
 */

import { ZONE_BULK_CONFIG, DC_METERS, MAIN_BULK_ACCOUNT } from "@/lib/water-accounts";
import type { SupabaseDailyWaterConsumption } from "@/entities/water";

/** Round to 2 decimal places. */
const r2 = (v: number) => Math.round(v * 100) / 100;

/** Where a row sits in the supply chain. */
export type SupplyRowKind = "main" | "zone" | "dc";

export interface SupplyMeterRow {
    kind: SupplyRowKind;
    account: string;
    /** Display name — the zone name for L2, the DC meter name for DC. */
    label: string;
    /** Secondary classification shown as a badge ("Zone bulk", "Irrigation"…). */
    category: string;
    /** Irrigation service (potable feed to an irrigation tank), DC rows only. */
    isIrr: boolean;
    /** Readings for day 1…latestDay; `null` = nothing stored for that day. */
    dailyValues: (number | null)[];
    /** Σ of the readings; `null` when the meter has no reading in the range. */
    total: number | null;
    /** Days in the range with no stored reading. */
    unreadDays: number;
}

export interface SupplyGroupTotals {
    /** Σ per day. Nulls count as 0 — see `unreadPerDay` before trusting a day. */
    dailyValues: number[];
    total: number;
    /** Per day: how many meters of the group had no stored reading. */
    unreadPerDay: number[];
    /** Meters in the group. */
    meterCount: number;
}

export interface SupplyMatrix {
    /** Last day of the month with any supply-side reading; ≥ 1. */
    latestDay: number;
    /** `[1 … latestDay]`, ready to drive table columns. */
    days: number[];
    /** The NAMA main bulk row, or `null` when the month has no L1 rows at all. */
    main: SupplyMeterRow | null;
    zones: SupplyMeterRow[];
    dcs: SupplyMeterRow[];
    zoneTotals: SupplyGroupTotals;
    dcTotals: SupplyGroupTotals;
    /** ΣL2 + ΣDC — the middle gauge, day by day. */
    combined: SupplyGroupTotals;
    /** Main bulk − combined; `null` on days with no main-bulk reading. */
    trunkLoss: (number | null)[];
    /** Σ trunk loss over the days where it is computable; `null` if none are. */
    trunkLossTotal: number | null;
    /** Σ main bulk over those same days, so a % can be quoted like for like. */
    mainBulkComparableTotal: number | null;
}

/** One day's supply reconciliation — the figures behind the three gauges. */
export interface SupplyDaySnapshot {
    day: number;
    /** L1 reading; `null` = not read, which is not the same as no supply. */
    mainBulk: number | null;
    zoneTotal: number;
    dcTotal: number;
    /** ΣL2 + ΣDC — what the middle gauge shows. */
    combined: number;
    /** L1 − combined; `null` when L1 was not read. */
    trunkLoss: number | null;
    /** trunkLoss / mainBulk × 100; `null` when L1 is missing or 0. */
    trunkLossPct: number | null;
    zonesRead: number;
    zoneCount: number;
    dcRead: number;
    dcCount: number;
}

/** Pull an account's 31 day columns out of a month row. */
function readDays(row: SupabaseDailyWaterConsumption | undefined, latestDay: number): (number | null)[] {
    const out: (number | null)[] = [];
    for (let d = 1; d <= latestDay; d++) {
        const raw = row?.[`day_${d}` as keyof SupabaseDailyWaterConsumption];
        out.push(raw != null ? r2(Number(raw)) : null);
    }
    return out;
}

function buildRow(
    kind: SupplyRowKind,
    account: string,
    label: string,
    category: string,
    isIrr: boolean,
    row: SupabaseDailyWaterConsumption | undefined,
    latestDay: number,
): SupplyMeterRow {
    const dailyValues = readDays(row, latestDay);
    let sum = 0;
    let read = 0;
    for (const v of dailyValues) {
        if (v === null) continue;
        sum += v;
        read++;
    }
    return {
        kind, account, label, category, isIrr, dailyValues,
        total: read > 0 ? r2(sum) : null,
        unreadDays: dailyValues.length - read,
    };
}

function groupTotals(rows: SupplyMeterRow[], latestDay: number): SupplyGroupTotals {
    const dailyValues: number[] = [];
    const unreadPerDay: number[] = [];
    for (let i = 0; i < latestDay; i++) {
        let sum = 0;
        let unread = 0;
        for (const r of rows) {
            const v = r.dailyValues[i];
            if (v === null || v === undefined) unread++;
            else sum += v;
        }
        dailyValues.push(r2(sum));
        unreadPerDay.push(unread);
    }
    return {
        dailyValues,
        total: r2(dailyValues.reduce((s, v) => s + v, 0)),
        unreadPerDay,
        meterCount: rows.length,
    };
}

/**
 * Build the full supply matrix (L1, every zone bulk, every DC) for a month's
 * rows. `latestDay` is derived from the supply accounts only, so an unrelated
 * child meter carrying a late reading cannot stretch the table.
 */
export function buildSupplyMatrix(rows: SupabaseDailyWaterConsumption[]): SupplyMatrix {
    const byAccount = new Map<string, SupabaseDailyWaterConsumption>();
    for (const row of rows) byAccount.set(row.account_number, row);

    const supplyAccounts = [
        MAIN_BULK_ACCOUNT,
        ...ZONE_BULK_CONFIG.map((z) => z.l2Account),
        ...DC_METERS.map((dc) => dc.account),
    ];

    let latestDay = 0;
    for (const account of supplyAccounts) {
        const row = byAccount.get(account);
        if (!row) continue;
        for (let d = 31; d > latestDay; d--) {
            if (row[`day_${d}` as keyof SupabaseDailyWaterConsumption] != null) {
                latestDay = d;
                break;
            }
        }
    }
    latestDay = Math.max(1, latestDay);

    const mainRow = byAccount.get(MAIN_BULK_ACCOUNT);
    const main = mainRow
        ? buildRow("main", MAIN_BULK_ACCOUNT, mainRow.meter_name || "Main Bulk (NAMA)", "Main bulk", false, mainRow, latestDay)
        : null;

    const zones = ZONE_BULK_CONFIG.map((z) =>
        buildRow("zone", z.l2Account, z.zoneName, "Zone bulk", false, byAccount.get(z.l2Account), latestDay),
    );
    const dcs = DC_METERS.map((dc) =>
        buildRow("dc", dc.account, dc.meterName, dc.isIrr ? "Irrigation" : "Service", dc.isIrr, byAccount.get(dc.account), latestDay),
    );

    const zoneTotals = groupTotals(zones, latestDay);
    const dcTotals = groupTotals(dcs, latestDay);

    const combined: SupplyGroupTotals = {
        dailyValues: zoneTotals.dailyValues.map((v, i) => r2(v + dcTotals.dailyValues[i])),
        total: r2(zoneTotals.total + dcTotals.total),
        unreadPerDay: zoneTotals.unreadPerDay.map((v, i) => v + dcTotals.unreadPerDay[i]),
        meterCount: zoneTotals.meterCount + dcTotals.meterCount,
    };

    const trunkLoss: (number | null)[] = [];
    let lossSum = 0;
    let mainSum = 0;
    let comparableDays = 0;
    for (let i = 0; i < latestDay; i++) {
        const mainValue = main?.dailyValues[i] ?? null;
        if (mainValue === null) {
            trunkLoss.push(null);
            continue;
        }
        const loss = r2(mainValue - combined.dailyValues[i]);
        trunkLoss.push(loss);
        lossSum += loss;
        mainSum += mainValue;
        comparableDays++;
    }

    return {
        latestDay,
        days: Array.from({ length: latestDay }, (_, i) => i + 1),
        main, zones, dcs,
        zoneTotals, dcTotals, combined,
        trunkLoss,
        trunkLossTotal: comparableDays > 0 ? r2(lossSum) : null,
        mainBulkComparableTotal: comparableDays > 0 ? r2(mainSum) : null,
    };
}

/** The single-day reconciliation behind the three gauges. */
export function supplyDaySnapshot(matrix: SupplyMatrix, day: number): SupplyDaySnapshot {
    const i = day - 1;
    const inRange = i >= 0 && i < matrix.latestDay;
    const mainBulk = inRange ? matrix.main?.dailyValues[i] ?? null : null;
    const zoneTotal = inRange ? matrix.zoneTotals.dailyValues[i] : 0;
    const dcTotal = inRange ? matrix.dcTotals.dailyValues[i] : 0;
    const combined = r2(zoneTotal + dcTotal);
    const trunkLoss = mainBulk !== null ? r2(mainBulk - combined) : null;
    return {
        day,
        mainBulk,
        zoneTotal,
        dcTotal,
        combined,
        trunkLoss,
        trunkLossPct: mainBulk !== null && mainBulk > 0 && trunkLoss !== null ? r2((trunkLoss / mainBulk) * 100) : null,
        zonesRead: matrix.zones.length - (inRange ? matrix.zoneTotals.unreadPerDay[i] : matrix.zones.length),
        zoneCount: matrix.zones.length,
        dcRead: matrix.dcs.length - (inRange ? matrix.dcTotals.unreadPerDay[i] : matrix.dcs.length),
        dcCount: matrix.dcs.length,
    };
}
