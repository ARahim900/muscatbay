'use server'

import { getAssetsFromSupabase } from '@/functions/api/assets';
import { Asset } from '@/lib/mock-data';

/**
 * Server Action to fetch assets
 * This runs on the server, bypassing browser CORS/Adblock issues
 */
export async function fetchAssetsAction(
    page: number = 1,
    pageSize: number = 50,
    search: string = '',
    sortField: string = 'Asset_Name',
    sortDirection: 'asc' | 'desc' = 'asc',
    statusFilter?: string[]
): Promise<{ data: Asset[], count: number, error?: string }> {
    try {
        const result = await getAssetsFromSupabase(page, pageSize, search, sortField, sortDirection, statusFilter);
        return {
            data: result.data,
            count: result.count
        };
    } catch (err: any) {
        console.error('Server Action Error:', err);
        return {
            data: [],
            count: 0,
            error: err.message || 'Server-side fetch failed'
        };
    }
}
