/**
 * Daily report data model — the zone, building and direct-connection balance
 * for one day of `water_daily_consumption` readings.
 *
 * Framework-free so the server can use it too: the Home Screen widget feed
 * (app/api/widget/water) computes its figures with the same function the Daily
 * page uses, so the two can never disagree. `inline-shared.tsx` re-exports
 * everything here for the page's components.
 *
 * @module components/water/daily-report/report-data
 */

import {
    ZONE_BULK_CONFIG, BUILDING_CONFIG, DC_METERS,
    BUILDING_CHILD_METERS,
} from "@/lib/water-accounts";

// ─── Computed row types ───────────────────────────────────────────────────────

export interface ZoneRow {
    zoneName: string;
    l2Account: string;
    l2Value: number | null;
    l3Sum: number;
    diff: number | null;
    isNullL2: boolean;
    isHighLoss: boolean;
}

export interface ChildMeterReading {
    label: string;
    account: string;
    type: 'Apartment' | 'Common';
    value: number | null;
}

export interface BuildingRow {
    buildingName: string;
    zone: '3A' | '3B';
    bulkAccount: string;
    l3Bulk: number | null;
    l4Sum: number;
    diff: number | null;
    hasNonZeroDiff: boolean;
    childMeters: ChildMeterReading[];
}

export interface DCRow {
    meterName: string;
    account: string;
    isIrr: boolean;
    rawValue: number | null;
    /** The source value rounded for display; null remains missing. */
    displayValue: number | null;
    isNullFlag: boolean;
}

export interface ReportData {
    zoneRows: ZoneRow[];
    buildingRows: BuildingRow[];
    dcRows: DCRow[];
    l2Total: number;
    l3Total: number;
    dcTotal: number;
    grandTotal: number;
}

export type ReportStatus = 'loading' | 'success' | 'error' | 'empty';

// ─── Data processing ──────────────────────────────────────────────────────────

/** Round to 2 decimal places */
export const r2 = (v: number) => Math.round(v * 100) / 100;

export function processReport(readings: Record<string, number | null>): ReportData {
    const get = (acc: string): number | null =>
        acc in readings ? readings[acc] : null;

    // TABLE 1 — Zone rows
    const zoneRows: ZoneRow[] = ZONE_BULK_CONFIG.map(z => {
        const l2Value = get(z.l2Account);
        const l3Sum = z.l3Accounts.reduce((s, a) => s + (get(a) ?? 0), 0);
        const diff = l2Value !== null ? r2(l2Value - l3Sum) : null;
        return {
            zoneName: z.zoneName,
            l2Account: z.l2Account,
            l2Value: l2Value !== null ? r2(l2Value) : null,
            l3Sum: r2(l3Sum),
            diff,
            isNullL2: l2Value === null,
            isHighLoss: diff !== null && Math.abs(diff) > 20,
        };
    });

    // TABLE 2 — Building rows (with child meter details)
    const buildingRows: BuildingRow[] = BUILDING_CONFIG.map(b => {
        const l3Bulk = get(b.bulkAccount);
        const l4Sum = b.l4Accounts.reduce((s, a) => s + (get(a) ?? 0), 0);
        const diff = l3Bulk !== null ? r2(l3Bulk - l4Sum) : null;

        // Map child meter details from BUILDING_CHILD_METERS
        const childInfo = BUILDING_CHILD_METERS[b.buildingName] ?? [];
        const childMeters: ChildMeterReading[] = childInfo.map(cm => ({
            label: cm.label,
            account: cm.account,
            type: cm.type,
            value: get(cm.account),
        }));

        return {
            buildingName: b.buildingName,
            zone: b.zone,
            bulkAccount: b.bulkAccount,
            l3Bulk: l3Bulk !== null ? r2(l3Bulk) : null,
            l4Sum: r2(l4Sum),
            diff,
            hasNonZeroDiff: diff !== null && Math.abs(diff) >= 0.01,
            childMeters,
        };
    });

    // TABLE 3 — DC rows
    const dcRows: DCRow[] = DC_METERS.map(dc => {
        const rawValue = get(dc.account);
        const displayValue = rawValue !== null ? r2(rawValue) : null;
        return {
            meterName: dc.meterName,
            account: dc.account,
            isIrr: dc.isIrr,
            rawValue,
            displayValue,
            isNullFlag: rawValue === null,
        };
    });

    // SUMMARY
    const l2Total = r2(zoneRows.reduce((s, r) => s + (r.l2Value ?? 0), 0));
    const l3Total = r2(zoneRows.reduce((s, r) => s + r.l3Sum, 0));
    const dcTotal = r2(dcRows.reduce((s, r) => s + (r.displayValue ?? 0), 0));

    return { zoneRows, buildingRows, dcRows, l2Total, l3Total, dcTotal, grandTotal: r2(l2Total + dcTotal) };
}
