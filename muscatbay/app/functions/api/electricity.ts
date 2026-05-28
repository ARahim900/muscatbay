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
        } catch {
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

        // Fetch ALL readings via range pagination. Supabase/PostgREST enforces a
        // server-side max_rows cap (default 1000) that silently overrides client
        // .limit(N), so a single query was truncating the dataset. We also drop
        // the .order('month') call: `month` is a TEXT column ('Apr-26', 'Mar-26',
        // ...) so a SQL sort is lexicographic, not chronological — combined with
        // the row cap that meant the latest months (Apr, Aug, Dec) were the ones
        // being dropped. We sort properly in JS once everything is in memory.
        const PAGE_SIZE = 1000;
        const readings: ElectricityReading[] = [];
        let offset = 0;
        try {
            // Loop until the server returns fewer rows than the page size.
            // Hard ceiling at 50k rows to prevent runaway loops.
            while (offset < 50_000) {
                const { data: page, error: pageError } = await client
                    .from('electricity_readings')
                    .select('id, meter_id, month, consumption')
                    .range(offset, offset + PAGE_SIZE - 1);
                if (pageError) {
                    console.warn('Error fetching electricity readings page:', pageError.message);
                    return [];
                }
                if (!page || page.length === 0) break;
                readings.push(...(page as ElectricityReading[]));
                if (page.length < PAGE_SIZE) break;
                offset += PAGE_SIZE;
            }
        } catch {
            console.warn('Network error fetching electricity readings - using fallback data');
            return [];
        }

        // Group readings by meter_id
        const readingsByMeter: Record<string, Record<string, number>> = {};
        readings.forEach((reading: ElectricityReading) => {
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
