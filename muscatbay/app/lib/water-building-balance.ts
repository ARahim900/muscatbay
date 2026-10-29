/**
 * Building balance — each Zone 3A/3B building bulk meter against the sum of its
 * own individual meters (apartments + building common).
 *
 * A positive difference is water that passed the bulk meter but no apartment
 * or common meter recorded: a leak on the line between them, or a meter
 * fault. Owner ruling 2026-10-29: shown on both the Daily and Monthly pages
 * with the same rules, so this module is the single source of truth.
 *
 * A period (day or month) counts only when the bulk and EVERY individual meter
 * have a reading. Missing ≠ zero: summing an unread flat as 0 would show a
 * leak that is not there.
 *
 * Isomorphic and pure — `lib/` is also bundled by the Expo app in `mobile/`.
 */

import type { BuildingConfig } from "./water-accounts";

/** A difference within max(5 m³, 10% of the bulk) is treated as meter tolerance. */
export const BUILDING_DIFF_MIN_M3 = 5;
export const BUILDING_DIFF_PCT = 10;

export type BuildingBalanceStatus = "within" | "possible-leak" | "bulk-suspect" | "missing";

export const BUILDING_BALANCE_STATUS_LABEL: Record<BuildingBalanceStatus, string> = {
    "within": "Within tolerance",
    "possible-leak": "Possible leak",
    "bulk-suspect": "Bulk meter suspect",
    "missing": "Readings missing",
};

export interface BuildingBalance {
    buildingName: string;
    zone: BuildingConfig["zone"];
    bulkAccount: string;
    /** Totals over the compared periods only; `null` when no period could be compared. */
    bulk: number | null;
    individuals: number | null;
    /** Bulk − individuals. */
    difference: number | null;
    /** Difference as a % of the bulk; `null` when the bulk total is not positive. */
    differencePct: number | null;
    /** Periods where the bulk and every individual meter were read. */
    compared: number;
    /** Periods in the selected window. */
    periods: number;
    status: BuildingBalanceStatus;
}

/** Series for one account, aligned to the window; `undefined` = meter not in the data. */
export type SeriesReader = (account: string) => readonly (number | null)[] | undefined;

const r2 = (v: number) => Math.round(v * 100) / 100;

function seriesOf(read: SeriesReader, account: string, periods: number): (number | null)[] {
    const s = read(account);
    return Array.from({ length: periods }, (_, i) => s?.[i] ?? null);
}

/** Bulk − individuals for each period; `null` where any meter is unread. */
export function periodDifferences(building: BuildingConfig, read: SeriesReader, periods: number): (number | null)[] {
    const bulk = seriesOf(read, building.bulkAccount, periods);
    const children = building.l4Accounts.map((a) => seriesOf(read, a, periods));
    return bulk.map((b, i) => {
        if (b == null) return null;
        let sum = 0;
        for (const c of children) {
            const v = c[i];
            if (v == null) return null;
            sum += v;
        }
        return r2(b - sum);
    });
}

export function balanceBuilding(building: BuildingConfig, read: SeriesReader, periods: number): BuildingBalance {
    const bulkSeries = seriesOf(read, building.bulkAccount, periods);
    const diffs = periodDifferences(building, read, periods);
    let compared = 0, bulk = 0, difference = 0, negativeBulk = false;
    diffs.forEach((d, i) => {
        const b = bulkSeries[i];
        if (d == null || b == null) return;
        compared += 1;
        bulk += b;
        difference += d;
        if (b < 0) negativeBulk = true;
    });

    const base = { buildingName: building.buildingName, zone: building.zone, bulkAccount: building.bulkAccount, compared, periods };
    if (compared === 0) {
        return { ...base, bulk: null, individuals: null, difference: null, differencePct: null, status: "missing" };
    }

    bulk = r2(bulk);
    difference = r2(difference);
    const tolerance = Math.max(BUILDING_DIFF_MIN_M3, (Math.abs(bulk) * BUILDING_DIFF_PCT) / 100);
    const status: BuildingBalanceStatus =
        negativeBulk || difference < -tolerance ? "bulk-suspect"
            : difference > tolerance ? "possible-leak"
                : "within";
    return {
        ...base,
        bulk,
        individuals: r2(bulk - difference),
        difference,
        differencePct: bulk > 0 ? Math.round((difference / bulk) * 1000) / 10 : null,
        status,
    };
}

/** Rank for sorting: problems first, biggest gap first within a status. */
const STATUS_RANK: Record<BuildingBalanceStatus, number> = { "possible-leak": 0, "bulk-suspect": 1, "missing": 2, "within": 3 };

export function sortBuildingBalances(rows: readonly BuildingBalance[]): BuildingBalance[] {
    return [...rows].sort((a, b) =>
        STATUS_RANK[a.status] - STATUS_RANK[b.status]
        || Math.abs(b.difference ?? 0) - Math.abs(a.difference ?? 0)
        || a.buildingName.localeCompare(b.buildingName));
}
