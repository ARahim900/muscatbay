/**
 * @fileoverview STP API Functions
 * Data fetching functions for STP operations from Supabase
 * @module functions/api/stp
 */

import { getSupabaseClient } from '../supabase-client';
import { SupabaseSTPOperation, transformSTPOperation } from '@/entities/stp';
import type { STPOperation } from '@/lib/mock-data';

const STP_COLUMNS = 'id, date, inlet_sewage, tse_for_irrigation, tanker_trips, generated_income, water_savings, total_impact, monthly_volume_input, monthly_volume_output, monthly_income, monthly_savings, original_id';
const PAGE_SIZE = 1000;
/** Hard ceiling against a runaway loop (~137 years of daily rows). */
const MAX_ROWS = 50_000;

/**
 * Fetch every STP operation from Supabase, newest first.
 *
 * Returns [] only when Supabase is not configured. A failed read THROWS, so
 * callers show an error state instead of an empty log that reads as "no
 * operations". Rows are paged: PostgREST caps a single response at 1,000
 * rows whatever `.limit()` asks for, which would silently drop the oldest
 * days once the log passes that size.
 */
export async function getSTPOperationsFromSupabase(): Promise<STPOperation[]> {
    const client = getSupabaseClient();
    if (!client) {
        return [];
    }

    const rows: SupabaseSTPOperation[] = [];
    for (let offset = 0; offset < MAX_ROWS; offset += PAGE_SIZE) {
        const { data, error } = await client
            .from('stp_operations')
            .select(STP_COLUMNS)
            // `id` breaks ties so pages never repeat or skip a row.
            .order('date', { ascending: false })
            .order('id', { ascending: false })
            .range(offset, offset + PAGE_SIZE - 1);

        if (error) {
            throw new Error(`Unable to load STP operations: ${error.message}`);
        }
        if (!data || data.length === 0) break;
        rows.push(...(data as SupabaseSTPOperation[]));
        if (data.length < PAGE_SIZE) break;
    }

    return rows.map((record) => transformSTPOperation(record));
}
