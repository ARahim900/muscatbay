/**
 * @fileoverview Electricity API Functions
 * Data fetching functions for electricity meters from Supabase
 * @module functions/api/electricity
 */

import { getSupabaseClient } from '../supabase-client';
import { ElectricityMeter, ElectricityReading } from '@/entities/electricity';
import type { MeterReading } from '@/lib/mock-data';

/**
 * Fetch electricity meters with readings from Supabase
 */
export async function getElectricityMetersFromSupabase(): Promise<MeterReading[]> {
    const client = getSupabaseClient();
    if (!client) {
        return [];
    }

    try {
        // Fetch all meters with network error handling
        let metersResult;
        try {
            metersResult = await client
                .from('electricity_meters')
                .select('id, name, account_number, meter_type')
                .order('name');
        } catch (networkError) {
            // Network error (e.g., Failed to fetch, proxy errors) - silently return empty
            console.warn('Network error fetching electricity meters - using fallback data');
            return [];
        }

        const { data: meters, error: metersError } = metersResult;

        if (metersError) {
            console.warn('Error fetching electricity meters:', metersError.message);
            return [];
        }

        if (!meters || meters.length === 0) {
            return [];
        }

        // Fetch all readings in a single query (limit 5000 to accommodate growth)
        let readingsResult;
        try {
            readingsResult = await client
                .from('electricity_readings')
                .select('id, meter_id, month, consumption')
                .order('month', { ascending: false })
                .limit(5000);
        } catch (networkError) {
            console.warn('Network error fetching electricity readings - using fallback data');
            return [];
        }

        const { data: readings, error: readingsError } = readingsResult;

        if (readingsError) {
            console.warn('Error fetching electricity readings:', readingsError.message);
            return [];
        }

        // Group readings by meter_id
        const readingsByMeter: Record<string, Record<string, number>> = {};
        (readings || []).forEach((reading: ElectricityReading) => {
            if (!readingsByMeter[reading.meter_id]) {
                readingsByMeter[reading.meter_id] = {};
            }
            readingsByMeter[reading.meter_id][reading.month] = Number(reading.consumption) || 0;
        });

        // Transform to MeterReading interface
        const result: MeterReading[] = meters.map((meter: ElectricityMeter) => ({
            id: meter.id,
            name: meter.name,
            account_number: meter.account_number || '',
            type: meter.meter_type,
            readings: readingsByMeter[meter.id] || {}
        }));

        return result;
    } catch (err) {
        console.error('Error in getElectricityMetersFromSupabase:', err);
        return [];
    }
}
