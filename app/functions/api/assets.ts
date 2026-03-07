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
 * Uses the asset_database_master table (11,644 assets from BOQ)
 */
export async function getAssetsFromSupabase(
    page: number = 1,
    pageSize: number = 50,
    search: string = '',
    sortField: string = 'asset_id',
    sortDirection: 'asc' | 'desc' = 'asc',
    statusFilter?: string[]
): Promise<{ data: Asset[], count: number }> {
    const client = getSupabaseClient();

    if (!client) {
        return { data: [], count: 0 };
    }

    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;

    try {
        let query = client
            .from('asset_database_master')
            .select('*', { count: 'exact' });

        // Apply search filter
        if (search) {
            query = query.or(`description.ilike.%${search}%,asset_id.ilike.%${search}%,trade_section.ilike.%${search}%,component.ilike.%${search}%,contractor.ilike.%${search}%,rfs_category.ilike.%${search}%,asset_name.ilike.%${search}%,asset_tag.ilike.%${search}%,zone.ilike.%${search}%`);
        }

        // Apply status filter (maps to rfs_status: Covered / Non-Covered)
        if (statusFilter && statusFilter.length > 0) {
            // Map app status to rfs_status
            const rfsFilters: string[] = [];
            const conditionFilters: string[] = [];
            for (const f of statusFilter) {
                if (f === 'Active' || f === 'Covered') rfsFilters.push('Covered');
                if (f === 'Non-Covered' || f === 'Decommissioned') rfsFilters.push('Non-Covered');
                if (['Good', 'Fair', 'Poor', 'Critical'].includes(f)) conditionFilters.push(f);
            }
            if (rfsFilters.length > 0) {
                query = query.in('rfs_status', rfsFilters);
            }
            if (conditionFilters.length > 0) {
                query = query.in('condition', conditionFilters);
            }
        }

        const { data, error, count } = await query
            .order(sortField, { ascending: sortDirection === 'asc' })
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
