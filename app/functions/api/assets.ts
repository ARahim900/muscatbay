/**
 * @fileoverview Assets API Functions
 * Data fetching functions for assets from Supabase
 * @module functions/api/assets
 */

import { getSupabaseClient } from '../supabase-client';
import { SupabaseAsset, transformAsset } from '@/entities/asset';
import type { Asset } from '@/lib/mock-data';

/**
 * Fetch assets from Supabase with pagination and search
 * Uses the Assets_Register_Database table
 */
export async function getAssetsFromSupabase(
    page: number = 1,
    pageSize: number = 50,
    search: string = ''
): Promise<{ data: Asset[], count: number }> {
    const client = getSupabaseClient();

    if (!client) {
        return { data: [], count: 0 };
    }

    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;

    try {
        let query = client
            .from('Assets_Register_Database')
            .select('*', { count: 'exact' });

        // Apply search filter if provided - using new column names
        if (search) {
            // Sanitize search input: remove characters that could manipulate PostgREST filters
            const sanitized = search
                .trim()
                .slice(0, 200)
                .replace(/[%_\\,.()"']/g, '');

            if (sanitized.length > 0) {
                query = query.or(`Asset_Name.ilike.%${sanitized}%,Location_Name.ilike.%${sanitized}%,Asset_Tag.ilike.%${sanitized}%,Category.ilike.%${sanitized}%,Discipline.ilike.%${sanitized}%`);
            }
        }

        const { data, error, count } = await query
            .order('Asset_Name', { ascending: true })
            .range(start, end);

        if (error) {
            throw new Error(`Supabase error: ${error.message || error.code || 'Unknown error'}`);
        }

        const transformedData = (data || []).map((item: SupabaseAsset) => transformAsset(item));

        return {
            data: transformedData,
            count: count || 0
        };
    } catch (err) {
        throw err;
    }
}

