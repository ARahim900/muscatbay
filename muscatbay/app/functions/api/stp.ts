/**
 * @fileoverview STP API Functions
 * Data fetching functions for STP operations from Supabase
 * @module functions/api/stp
 */

import { getSupabaseClient } from '../supabase-client';
import { SupabaseSTPOperation, transformSTPOperation } from '@/entities/stp';
import type { STPOperation } from '@/lib/mock-data';

/**
 * Fetch STP operations from Supabase
 */
export async function getSTPOperationsFromSupabase(): Promise<STPOperation[]> {
    const client = getSupabaseClient();
    if (!client) {
        return [];
    }

    try {
        const { data, error } = await client
            .from('stp_operations')
            .select('id, date, inlet_sewage, tse_for_irrigation, tanker_trips, generated_income, water_savings, total_impact, monthly_volume_input, monthly_volume_output, monthly_income, monthly_savings, original_id')
            .order('date', { ascending: false })
            .limit(1500);

        if (error) {
            console.warn('STP operations fetch error:', error.message);
            return [];
        }

        if (!data || data.length === 0) {
            return [];
        }

        const result = data.map((record: SupabaseSTPOperation) => transformSTPOperation(record));
        return result;
    } catch (err) {
        return [];
    }
}
