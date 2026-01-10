/**
 * @fileoverview Water System Entity
 * Database model and transform function for Water System table
 * @module entities/water
 */

import type { WaterMeter } from '@/lib/water-data';

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
    };

    return {
        label: dbMeter.label || 'Unknown Meter',
        accountNumber: dbMeter.account_number || '',
        level: (dbMeter.level as WaterMeter['level']) || 'N/A',
        zone: dbMeter.zone || '',
        parentMeter: dbMeter.parent_meter || '',
        type: dbMeter.type || '',
        consumption,
    };
}
