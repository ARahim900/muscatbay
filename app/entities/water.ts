/**
 * @fileoverview Water System Entity
 * Database model and transform function for Water System table
 * @module entities/water
 */

import type { WaterMeter } from '@/lib/water-data';

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
 * Transform Supabase daily water consumption to frontend format
 */
export function transformDailyWaterConsumption(record: SupabaseDailyWaterConsumption): DailyWaterConsumption {
    const dailyReadings: Record<number, number | null> = {};
    for (let i = 1; i <= 31; i++) {
        const key = `day_${i}` as keyof SupabaseDailyWaterConsumption;
        dailyReadings[i] = record[key] as number | null;
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
    // Monthly consumption columns
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
    created_at?: string;
    updated_at?: string;
}

/**
 * Transform Supabase water meter to match the app's WaterMeter interface
 */
export function transformWaterMeter(dbMeter: SupabaseWaterMeter): WaterMeter {
    const consumption: Record<string, number | null> = {
        'Jan-25': dbMeter.jan_25,
        'Feb-25': dbMeter.feb_25,
        'Mar-25': dbMeter.mar_25,
        'Apr-25': dbMeter.apr_25,
        'May-25': dbMeter.may_25,
        'Jun-25': dbMeter.jun_25,
        'Jul-25': dbMeter.jul_25,
        'Aug-25': dbMeter.aug_25,
        'Sep-25': dbMeter.sep_25,
        'Oct-25': dbMeter.oct_25,
        'Nov-25': dbMeter.nov_25,
        'Dec-25': dbMeter.dec_25,
      'Jan-26': dbMeter.jan_26,
    };

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
