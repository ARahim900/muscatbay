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
            .from('mb_assets')
            .select('*', { count: 'exact' });

        // Apply search filter if provided
        if (search) {
            query = query.or(`asset_name.ilike.%${search}%,location_name.ilike.%${search}%,asset_tag.ilike.%${search}%,category.ilike.%${search}%`);
        }

        const { data, error, count } = await query
            .order('asset_name', { ascending: true })
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
