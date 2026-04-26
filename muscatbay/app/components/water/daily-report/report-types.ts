// ─── Shared types, utilities, and constants for DailyWaterReport ─────────────
// Extracted to reduce DailyWaterReport.tsx from a 2000-line monolith.
// Import from here in zone-panel.tsx, dc-panel.tsx, and the main orchestrator.

import {
    ZONE_BULK_CONFIG, BUILDING_CONFIG, DC_METERS,
    NULL_AS_ZERO_ACCOUNTS, BUILDING_CHILD_METERS,
} from "@/lib/water-accounts";
import type { SupabaseDailyWaterConsumption } from "@/entities/water";
import { CHART_PALETTE } from "@/lib/tokens";

// ─── Chart palette ────────────────────────────────────────────────────────────

export const CHART_COLORS = {
    bulk:       '#1DA1F2',
    individual: '#7DD3FC',
    loss:       'var(--chart-loss)',
    success:    'var(--chart-success)',
    teal:       'var(--chart-teal)',
    brand:      'var(--chart-brand)',
    amber:      'var(--chart-amber)',
    gray:       'var(--chart-gray)',
} as const;

export const PALETTE = {
    primary: '#1DA1F2',
    neutral: CHART_PALETTE[1],
    mint:    CHART_PALETTE[5],
    blue:    '#7DD3FC',
    amber:   CHART_PALETTE[2],
    red:     CHART_PALETTE[3],
} as const;

// ─── Core types ───────────────────────────────────────────────────────────────

export type ReportStatus = 'loading' | 'success' | 'error';
export type SortDir = 'asc' | 'desc' | null;
export interface SortState { key: string; dir: SortDir }

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
    displayValue: number | null;
    isNullFlag: boolean;
}

export interface ReportData {
    zoneRows: ZoneRow[];
    buildingRows: BuildingRow[];
    dcRows: DCRow[];
    l2Total: number;
    dcTotal: number;
    grandTotal: number;
}

// ─── Panel prop types ─────────────────────────────────────────────────────────

export interface ZoneAnalyticsPanelProps {
    reportData: ReportData;
    monthData: SupabaseDailyWaterConsumption[];
    selectedDay: number;
    month: string;
    activeZoneName: string;
}

export interface DCAnalyticsPanelProps {
    reportData: ReportData;
    monthData: SupabaseDailyWaterConsumption[];
    selectedDay: number;
    month: string;
}

// ─── Utilities ────────────────────────────────────────────────────────────────

export const r2 = (v: number) => Math.round(v * 100) / 100;

export function n(v: number | null, fallback = '—'): string {
    if (v === null) return fallback;
    return v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function diffCell(diff: number | null): string {
    if (diff === null) return '—';
    if (diff === 0) return '0.00';
    const formatted = Math.abs(diff).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return (diff > 0 ? '+' : '-') + formatted;
}

// ─── Data processor ───────────────────────────────────────────────────────────

export function processReport(readings: Record<string, number | null>): ReportData {
    const get = (acc: string): number | null =>
        acc in readings ? readings[acc] : null;

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

    const buildingRows: BuildingRow[] = BUILDING_CONFIG.map(b => {
        const l3Bulk = get(b.bulkAccount);
        const l4Sum = b.l4Accounts.reduce((s, a) => s + (get(a) ?? 0), 0);
        const diff = l3Bulk !== null ? r2(l3Bulk - l4Sum) : null;
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

    const dcRows: DCRow[] = DC_METERS.map(dc => {
        const rawValue = get(dc.account);
        const isNullAsZero = dc.isIrr || NULL_AS_ZERO_ACCOUNTS.has(dc.account);
        const displayValue = rawValue !== null ? r2(rawValue) : isNullAsZero ? 0 : null;
        return {
            meterName: dc.meterName,
            account: dc.account,
            isIrr: dc.isIrr,
            rawValue,
            displayValue,
            isNullFlag: rawValue === null && !isNullAsZero,
        };
    });

    const l2Total = r2(zoneRows.reduce((s, r) => s + (r.l2Value ?? 0), 0));
    const dcTotal = r2(dcRows.reduce((s, r) => s + (r.displayValue ?? 0), 0));
    return { zoneRows, buildingRows, dcRows, l2Total, dcTotal, grandTotal: r2(l2Total + dcTotal) };
}
