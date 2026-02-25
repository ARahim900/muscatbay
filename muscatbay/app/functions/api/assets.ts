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
    search: string = '',
    sortField: string = 'Asset_Name',
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
            .from('Assets_Register_Database')
            .select('*', { count: 'exact' });

        // Apply search filter if provided - using new column names
        if (search) {
            query = query.or(`Asset_Name.ilike.%${search}%,Location_Name.ilike.%${search}%,Asset_Tag.ilike.%${search}%,Category.ilike.%${search}%,Discipline.ilike.%${search}%`);
        }

        // Apply status filter
        if (statusFilter && statusFilter.length > 0) {
            query = query.in('Status', statusFilter);
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

