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
        // Fetch all records ordered by date descending
        const { data, error } = await client
            .from('stp_operations')
            .select('*')
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
