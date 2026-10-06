/**
 * @fileoverview The Home Screen widget's water figures, built from one month
 * of `water_daily_consumption` rows.
 *
 * Every figure comes from the Daily page's own functions (`processReport`,
 * `computeBriefing`, `dailySeverity`), and the day is the page's own default —
 * the latest day with any reading — so the widget and the page cannot show
 * different numbers for the same day. Missing readings are never filled: a day
 * with any zone meter unread is reported as partial.
 *
 * Framework-free: used by the server feed (app/api/widget/water) and by tests.
 *
 * @module lib/widget/water-summary
 */

import { processReport, type ZoneRow } from "@/components/water/daily-report/report-data";
import { computeBriefing } from "@/components/water/daily-report/briefing-metrics";
import { dailySeverity, type DailySeverity } from "@/components/water/daily-report/daily-metrics";
import { ZONE_BULK_CONFIG } from "@/lib/water-accounts";

/** One `water_daily_consumption` row as the feed reads it. */
export interface WidgetWaterRow {
    account_number: string;
    [day: `day_${number}`]: number | string | null | undefined;
}

export interface WidgetZoneLoss {
    name: string;
    /** Zone bulk (L2) minus the sum of its meters (L3), m³. */
    lossM3: number;
    /** Loss as a share of the zone bulk; null when the bulk read 0. */
    lossPct: number | null;
    severity: DailySeverity;
}

/** One zone's balance for the day, as the Daily page computes it. */
export interface WidgetZoneBalance {
    name: string;
    /** Zone bulk meter (L2) reading, m³; null when the bulk was not read. */
    bulkM3: number | null;
    /** Sum of the zone's meters (L3) that were read, m³. Unread meters add nothing. */
    metersM3: number;
    /** Bulk minus meters, m³; null when the bulk was not read. */
    lossM3: number | null;
    /** Loss as a share of the bulk; null when the bulk was not read or read 0. */
    lossPct: number | null;
    severity: DailySeverity;
    metersRead: number;
    metersTotal: number;
}

export interface WidgetWaterSummary {
    /** ISO date of the day shown, e.g. "2026-10-05". */
    date: string;
    /** Σ zone bulk meters (L2), m³ — distribution level; the daily data has no L1. */
    supplyM3: number;
    lossM3: number;
    lossPct: number | null;
    severity: DailySeverity;
    /** The zone losing the most water that day; null when no zone bulk was read. */
    worstZone: WidgetZoneLoss | null;
    metersRead: number;
    metersTotal: number;
    /** True when any zone meter has no reading for the day. */
    partial: boolean;
    /** Every zone, in the Daily page's order. */
    zones: WidgetZoneBalance[];
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Every zone bulk (L2) and zone meter (L3) account, once each. */
const ZONE_ACCOUNTS = [
    ...new Set(ZONE_BULK_CONFIG.flatMap((zone) => [zone.l2Account, ...zone.l3Accounts])),
];

function reading(row: WidgetWaterRow, day: number): number | null {
    const raw = row[`day_${day}`];
    if (raw === null || raw === undefined || raw === "") return null;
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
}

/** "Oct-26" + 2026 + 5 → "2026-10-05", or null when the month is not recognised. */
function isoDate(month: string, year: number, day: number): string | null {
    const index = MONTHS.indexOf(month.split("-")[0] ?? "");
    if (index === -1 || !Number.isInteger(year)) return null;
    return `${year}-${String(index + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function lossShare(zone: ZoneRow): number | null {
    if (zone.diff === null || zone.l2Value === null || zone.l2Value === 0) return null;
    return Math.round((zone.diff / zone.l2Value) * 1000) / 10;
}

function worstZoneOf(zoneRows: ZoneRow[]): WidgetZoneLoss | null {
    let worst: ZoneRow | null = null;
    for (const zone of zoneRows) {
        if (zone.diff === null) continue;
        if (!worst || zone.diff > (worst.diff ?? -Infinity)) worst = zone;
    }
    if (!worst || worst.diff === null) return null;
    const lossPct = lossShare(worst);
    return {
        name: worst.zoneName,
        lossM3: worst.diff,
        lossPct,
        severity: dailySeverity(worst.diff, lossPct),
    };
}

function zoneBalances(
    zoneRows: ZoneRow[],
    readings: Record<string, number | null>,
): WidgetZoneBalance[] {
    return zoneRows.map((zone) => {
        const accounts =
            ZONE_BULK_CONFIG.find((config) => config.l2Account === zone.l2Account)?.l3Accounts ?? [];
        const lossPct = lossShare(zone);
        return {
            name: zone.zoneName,
            bulkM3: zone.l2Value,
            metersM3: zone.l3Sum,
            lossM3: zone.diff,
            lossPct,
            severity: dailySeverity(zone.diff, lossPct),
            metersRead: accounts.filter((account) => readings[account] != null).length,
            metersTotal: accounts.length,
        };
    });
}

/**
 * The widget summary for the latest day with any reading, or null when the
 * month holds no reading at all.
 */
export function summariseWidgetWater(
    rows: readonly WidgetWaterRow[],
    month: string,
    year: number,
): WidgetWaterSummary | null {
    const monthIndex = MONTHS.indexOf(month.split("-")[0] ?? "");
    if (monthIndex === -1 || !Number.isInteger(year)) return null;
    // Only the month's real days: a stray day_31 in a 30-day month is not a date.
    const lastDay = new Date(year, monthIndex + 1, 0).getDate();
    let day = 0;
    for (const row of rows) {
        for (let d = lastDay; d > day; d--) {
            if (reading(row, d) !== null) {
                day = d;
                break;
            }
        }
    }
    if (day === 0) return null;
    const date = isoDate(month, year, day);
    if (!date) return null;

    const readings: Record<string, number | null> = {};
    for (const row of rows) readings[row.account_number] = reading(row, day);
    const report = processReport(readings);
    const briefing = computeBriefing(report, null);

    const metersRead = ZONE_ACCOUNTS.filter((account) => readings[account] != null).length;
    return {
        date,
        supplyM3: briefing.l2Total,
        lossM3: briefing.lossM3,
        lossPct: briefing.lossPct,
        severity: dailySeverity(briefing.lossM3, briefing.lossPct),
        worstZone: worstZoneOf(report.zoneRows),
        metersRead,
        metersTotal: ZONE_ACCOUNTS.length,
        partial: metersRead < ZONE_ACCOUNTS.length,
        zones: zoneBalances(report.zoneRows, readings),
    };
}
