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
                .select('*')
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

        // Fetch all readings using pagination to ensure we get ALL records
        // Supabase has a default limit, so we need to fetch in batches
        let allReadings: ElectricityReading[] = [];
        let offset = 0;
        const batchSize = 1000;
        let hasMore = true;

        while (hasMore) {
            let readingsResult;
            try {
                readingsResult = await client
                    .from('electricity_readings')
                    .select('*')
                    .range(offset, offset + batchSize - 1);
            } catch (networkError) {
                // Network error - break out of loop and use what we have
                console.warn('Network error fetching electricity readings batch - using partial data');
                break;
            }

            const { data: batchReadings, error: readingsError } = readingsResult;

            if (readingsError) {
                console.warn('Error fetching electricity readings:', readingsError.message);
                break;
            }

            if (batchReadings && batchReadings.length > 0) {
                allReadings = [...allReadings, ...batchReadings];
                offset += batchSize;
                // If we got fewer than batchSize, we've reached the end
                hasMore = batchReadings.length === batchSize;
            } else {
                hasMore = false;
            }
        }

        const readings = allReadings;

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
