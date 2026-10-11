/**
 * @fileoverview Electricity API Functions
 * Data fetching functions for electricity meters from Supabase
 * @module functions/api/electricity
 */

import { getSupabaseClient } from '../supabase-client';
import { ElectricityMeter, ElectricityReading } from '@/entities/electricity';
import type { MeterReading } from '@/lib/mock-data';

/**
 * Fetch electricity meters with readings from Supabase.
 *
 * Returns [] only when Supabase is not configured. A failed read THROWS, so
 * callers show an error state instead of an empty register that reads as
 * "no meters".
 */
export async function getElectricityMetersFromSupabase(): Promise<MeterReading[]> {
    const client = getSupabaseClient();
    if (!client) {
        return [];
    }

    const { data: meters, error: metersError } = await client
        .from('electricity_meters')
        .select('id, name, account_number, meter_type')
        .order('name');

    if (metersError) {
        throw new Error(`Unable to load electricity meters: ${metersError.message}`);
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
    // Loop until the server returns fewer rows than the page size.
    // Hard ceiling at 50k rows to prevent runaway loops. Ordered by `id`:
    // without a stable order Postgres may return rows in a different order
    // per query, so a reading could appear on two pages or on none.
    while (offset < 50_000) {
        const { data: page, error: pageError } = await client
            .from('electricity_readings')
            .select('id, meter_id, month, consumption')
            .order('id')
            .range(offset, offset + PAGE_SIZE - 1);
        if (pageError) {
            throw new Error(`Unable to load electricity readings: ${pageError.message}`);
        }
        if (!page || page.length === 0) break;
        readings.push(...(page as ElectricityReading[]));
        if (page.length < PAGE_SIZE) break;
        offset += PAGE_SIZE;
    }

    // Group readings by meter_id.
    // A NULL consumption means "closed / not in service" for that month and is
    // intentionally left ABSENT from the meter's map (not coerced to 0), so a
    // missing read stays distinguishable from a genuine 0 kWh. This preserves
    // the master spreadsheet's empty-vs-0 semantics and lets the Load Watch
    // anomaly engine flag it as "missing → schedule a manual read" rather than
    // "zero → check the breaker". Every consumer treats an absent month as 0
    // for summation via `?? 0` / `|| 0`, so totals are unaffected.
    const readingsByMeter: Record<string, Record<string, number>> = {};
    readings.forEach((reading: ElectricityReading) => {
        if (reading.consumption === null || reading.consumption === undefined) return;
        if (!readingsByMeter[reading.meter_id]) {
            readingsByMeter[reading.meter_id] = {};
        }
        readingsByMeter[reading.meter_id][reading.month] = Number(reading.consumption);
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
}
