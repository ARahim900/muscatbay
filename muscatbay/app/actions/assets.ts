'use server'

import { getAssetsFromSupabase, getAssetSummaryFromSupabase } from '@/functions/api/assets';
import type { Asset } from '@/entities/asset';

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
    statusFilter?: string[],
    disciplineFilter?: string[]
): Promise<{ data: Asset[], count: number, error?: string }> {
    try {
        const result = await getAssetsFromSupabase(page, pageSize, search, sortField, sortDirection, statusFilter, disciplineFilter);
        return {
            data: result.data,
            count: result.count
        };
    } catch (err) {
        console.error('Server Action Error:', err);
        return {
            data: [],
            count: 0,
            error: err instanceof Error ? err.message : 'Server-side fetch failed'
        };
    }
}

export async function fetchAssetSummaryAction(): Promise<{
    total: number;
    activeFlagged: number;
    workingStatus: number;
    toVerify: number;
    criticalLifecycle: number;
    disciplines: number;
    boqCoverage: number;
    error?: string;
}> {
    try {
        const summary = await getAssetSummaryFromSupabase();
        return summary;
    } catch (err) {
        console.error('Asset Summary Action Error:', err);
        return {
            total: 0,
            activeFlagged: 0,
            workingStatus: 0,
            toVerify: 0,
            criticalLifecycle: 0,
            disciplines: 0,
            boqCoverage: 0,
            error: err instanceof Error ? err.message : 'Server-side summary fetch failed',
        };
    }
}
