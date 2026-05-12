/**
 * @fileoverview Water System Entity
 * Database model and transform function for Water System table
 * @module entities/water
 */

import type { WaterMeter } from '@/lib/water-data';

export const DAILY_WATER_CONSUMPTION_SELECT_COLUMNS = [
    'id', 'meter_name', 'account_number', 'label', 'zone', 'parent_meter', 'type', 'month', 'year',
    'day_1', 'day_2', 'day_3', 'day_4', 'day_5', 'day_6', 'day_7', 'day_8',
    'day_9', 'day_10', 'day_11', 'day_12', 'day_13', 'day_14', 'day_15', 'day_16',
    'day_17', 'day_18', 'day_19', 'day_20', 'day_21', 'day_22', 'day_23', 'day_24',
    'day_25', 'day_26', 'day_27', 'day_28', 'day_29', 'day_30', 'day_31',
].join(', ');

export const WATER_METER_SELECT_COLUMNS = [
    'id', 'label', 'account_number', 'level', 'zone', 'parent_meter', 'type',
    'jan_24', 'feb_24', 'mar_24', 'apr_24', 'may_24', 'jun_24',
    'jul_24', 'aug_24', 'sep_24', 'oct_24', 'nov_24', 'dec_24',
    'jan_25', 'feb_25', 'mar_25', 'apr_25', 'may_25', 'jun_25',
    'jul_25', 'aug_25', 'sep_25', 'oct_25', 'nov_25', 'dec_25',
    'jan_26', 'feb_26', 'mar_26', 'apr_26', 'may_26', 'jun_26',
    'jul_26', 'aug_26', 'sep_26', 'oct_26', 'nov_26', 'dec_26',
].join(', ');

/**
 * Daily water consumption record from "water_daily_consumption" table in Supabase
 */
export interface SupabaseDailyWaterConsumption {
    id: number;
    meter_name: string;
    account_number: string;
    label: string | null;
    zone: string | null;
    parent_meter: string | null;
    type: string | null;
    month: string;
    year: number;
    day_1: number | null;
    day_2: number | null;
    day_3: number | null;
    day_4: number | null;
    day_5: number | null;
    day_6: number | null;
    day_7: number | null;
    day_8: number | null;
    day_9: number | null;
    day_10: number | null;
    day_11: number | null;
    day_12: number | null;
    day_13: number | null;
    day_14: number | null;
    day_15: number | null;
    day_16: number | null;
    day_17: number | null;
    day_18: number | null;
    day_19: number | null;
    day_20: number | null;
    day_21: number | null;
    day_22: number | null;
    day_23: number | null;
    day_24: number | null;
    day_25: number | null;
    day_26: number | null;
    day_27: number | null;
    day_28: number | null;
    day_29: number | null;
    day_30: number | null;
    day_31: number | null;
    created_at?: string;
    updated_at?: string;
}

/**
 * Transformed daily water consumption for frontend use
 */
export interface DailyWaterConsumption {
    id: number;
    meterName: string;
    accountNumber: string;
    label: string;
    zone: string;
    parentMeter: string;
    type: string;
    month: string;
    year: number;
    dailyReadings: Record<number, number | null>;
}

/**
 * Sanitize daily reading value - convert negative values to 0
 */
function sanitizeDailyReading(value: number | null): number | null {
    if (value === null || value === undefined) return null;
    return value < 0 ? 0 : value;
}

/**
 * Transform Supabase daily water consumption to frontend format
 */
export function transformDailyWaterConsumption(record: SupabaseDailyWaterConsumption): DailyWaterConsumption {
    const dailyReadings: Record<number, number | null> = {};
    for (let i = 1; i <= 31; i++) {
        const key = `day_${i}` as keyof SupabaseDailyWaterConsumption;
        dailyReadings[i] = sanitizeDailyReading(record[key] as number | null);
    }

    return {
        id: record.id,
        meterName: record.meter_name || '',
        accountNumber: record.account_number || '',
        label: record.label || '',
        zone: record.zone || '',
        parentMeter: record.parent_meter || '',
        type: record.type || '',
        month: record.month,
        year: record.year,
        dailyReadings,
    };
}

/**
 * Water meter from "Water System" table in Supabase
 */
export interface SupabaseWaterMeter {
    id: number;
    label: string;
    account_number: string;
    level: string;
    zone: string;
    parent_meter: string;
    type: string;
    // 2024 Monthly consumption columns
    jan_24: number | null;
    feb_24: number | null;
    mar_24: number | null;
    apr_24: number | null;
    may_24: number | null;
    jun_24: number | null;
    jul_24: number | null;
    aug_24: number | null;
    sep_24: number | null;
    oct_24: number | null;
    nov_24: number | null;
    dec_24: number | null;
    // 2025 Monthly consumption columns
    jan_25: number | null;
    feb_25: number | null;
    mar_25: number | null;
    apr_25: number | null;
    may_25: number | null;
    jun_25: number | null;
    jul_25: number | null;
    aug_25: number | null;
    sep_25: number | null;
    oct_25: number | null;
    nov_25: number | null;
    dec_25: number | null;
    jan_26: number | null;
    feb_26: number | null;
    mar_26: number | null;
    apr_26: number | null;
    [key: string]: unknown; // allows future month columns (may_26, jun_26, etc.)
    created_at?: string;
    updated_at?: string;
}

/**
 * Sanitize consumption value - convert negative values to 0
 * Negative consumption values indicate meter reading errors in the source data
 */
function sanitizeConsumption(value: number | null): number | null {
    if (value === null || value === undefined) return null;
    return value < 0 ? 0 : value;
}

/**
 * Transform Supabase water meter to match the app's WaterMeter interface.
 * Automatically detects all month columns (format: mmm_yy) from the DB row,
 * so no code change is needed when new month columns are added to Supabase.
 */
export function transformWaterMeter(dbMeter: SupabaseWaterMeter): WaterMeter {
    const consumption: Record<string, number | null> = {};
    const monthRegex = /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)_(\d{2})$/i;

    for (const key of Object.keys(dbMeter)) {
        const match = key.match(monthRegex);
        if (match) {
            const monthName = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
            const year = match[2];
            const label = `${monthName}-${year}`;
            const rawVal = dbMeter[key];
            const numVal = typeof rawVal === 'number' ? rawVal : null;
            consumption[label] = sanitizeConsumption(numVal);
        }
    }

    return {
        id: dbMeter.id,
        label: dbMeter.label || 'Unknown Meter',
        accountNumber: dbMeter.account_number || '',
        level: (dbMeter.level as WaterMeter['level']) || 'N/A',
        zone: dbMeter.zone || '',
        parentMeter: dbMeter.parent_meter || '',
        type: dbMeter.type || '',
        consumption,
    };
}

// =============================================================================
// WATER LOSS ENTITIES
// =============================================================================

/**
 * Water loss summary from "water_loss_summary" table in Supabase
 */
export interface SupabaseWaterLossSummary {
    id: number;
    zone: string;
    l2_bulk_account: string | null;
    l3_meters_count: number | null;
    l2_total_m3: number | null;
    l3_total_m3: number | null;
    loss_m3: number | null;
    loss_percent: number | null;
    status: string | null;
    month: string;
    year: number;
    generated_at: string | null;
    created_at?: string;
    updated_at?: string;
}

/**
 * Transformed water loss summary for frontend use
 */
export interface WaterLossSummary {
    id: number;
    zone: string;
    l2BulkAccount: string;
    l3MetersCount: number;
    l2TotalM3: number;
    l3TotalM3: number;
    lossM3: number;
    lossPercent: number;
    status: string;
    month: string;
    year: number;
    generatedAt: string | null;
}

/**
 * Transform Supabase water loss summary to frontend format
 */
export function transformWaterLossSummary(record: SupabaseWaterLossSummary): WaterLossSummary {
    return {
        id: record.id,
        zone: record.zone,
        l2BulkAccount: record.l2_bulk_account || '',
        l3MetersCount: record.l3_meters_count || 0,
        l2TotalM3: record.l2_total_m3 || 0,
        l3TotalM3: record.l3_total_m3 || 0,
        lossM3: record.loss_m3 || 0,
        lossPercent: record.loss_percent || 0,
        status: record.status || '',
        month: record.month,
        year: record.year,
        generatedAt: record.generated_at,
    };
}

/**
 * Water loss daily from "water_loss_daily" table in Supabase
 */
export interface SupabaseWaterLossDaily {
    id: number;
    zone: string;
    day: number;
    date: string;
    l2_total_m3: number | null;
    l3_total_m3: number | null;
    loss_m3: number | null;
    loss_percent: number | null;
    month: string;
    year: number;
    created_at?: string;
    updated_at?: string;
}

/**
 * Transformed water loss daily for frontend use
 */
export interface WaterLossDaily {
    id: number;
    zone: string;
    day: number;
    date: string;
    l2TotalM3: number;
    l3TotalM3: number;
    lossM3: number;
    lossPercent: number;
    month: string;
    year: number;
}

/**
 * Transform Supabase water loss daily to frontend format
 */
export function transformWaterLossDaily(record: SupabaseWaterLossDaily): WaterLossDaily {
    return {
        id: record.id,
        zone: record.zone,
        day: record.day,
        date: record.date,
        l2TotalM3: record.l2_total_m3 || 0,
        l3TotalM3: record.l3_total_m3 || 0,
        lossM3: record.loss_m3 || 0,
        lossPercent: record.loss_percent || 0,
        month: record.month,
        year: record.year,
    };
}
