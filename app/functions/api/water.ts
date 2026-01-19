/**
 * @fileoverview Water API Functions
 * Data fetching functions for water meters from Supabase
 * @module functions/api/water
 */

import { getSupabaseClient } from '../supabase-client';
import {
    SupabaseWaterMeter,
    transformWaterMeter,
    SupabaseDailyWaterConsumption,
    transformDailyWaterConsumption,
    DailyWaterConsumption
} from '@/entities/water';
import type { WaterMeter } from '@/lib/water-data';

/**
 * Fetch water meters from Supabase
 */
export async function getWaterMetersFromSupabase(): Promise<WaterMeter[]> {
    const client = getSupabaseClient();
    if (!client) {
        return [];
    }

    try {
        const { data, error } = await client
            .from('Water System')
            .select('*');

        if (error) {
            console.error('Error fetching water meters:', error.message);
            return [];
        }

        if (!data || data.length === 0) {
            return [];
        }

        const result = data.map((record: SupabaseWaterMeter) => transformWaterMeter(record));
        return result;
    } catch (err) {
        console.error('Error in getWaterMetersFromSupabase:', err);
        return [];
    }
}

/**
 * Fetch daily water consumption data from Supabase
 * @param month - Optional month filter (e.g., "Jan-26")
 * @param year - Optional year filter (e.g., 2026)
 */
export async function getDailyWaterConsumptionFromSupabase(
    month?: string,
    year?: number
): Promise<DailyWaterConsumption[]> {
    const client = getSupabaseClient();
    if (!client) {
        return [];
    }

    try {
        let query = client
            .from('water_daily_consumption')
            .select('*');

        if (month) {
            query = query.eq('month', month);
        }
        if (year) {
            query = query.eq('year', year);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching daily water consumption:', error.message);
            return [];
        }

        if (!data || data.length === 0) {
            return [];
        }

        return data.map((record: SupabaseDailyWaterConsumption) => transformDailyWaterConsumption(record));
    } catch (err) {
        console.error('Error in getDailyWaterConsumptionFromSupabase:', err);
        return [];
    }
}
