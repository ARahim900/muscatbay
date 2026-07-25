'use server'

import {
    getAssetsFromSupabase,
    getAssetSummaryFromSupabase,
    getAssetDistributionsFromSupabase,
    type AssetSummary,
    type AssetDistributions,
} from '@/functions/api/assets';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import type { Asset } from '@/entities/asset';

/**
 * Server Action to fetch assets
 * This runs on the server, bypassing browser CORS/Adblock issues
 */
export async function fetchAssetsAction(
    page: number = 1,
    pageSize: number = 50,
    search: string = '',
    sortField: string = 'asset_name',
    sortDirection: 'asc' | 'desc' = 'asc',
    statusFilter?: string[],
    disciplineFilter?: string[]
): Promise<{ data: Asset[], count: number, error?: string }> {
    try {
        const supabase = await getSupabaseServerClient();
        const result = await getAssetsFromSupabase(page, pageSize, search, sortField, sortDirection, statusFilter, disciplineFilter, supabase);
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

export async function fetchAssetSummaryAction(): Promise<AssetSummary & { error?: string }> {
    try {
        const supabase = await getSupabaseServerClient();
        return await getAssetSummaryFromSupabase(supabase);
    } catch (err) {
        console.error('Asset Summary Action Error:', err);
        return {
            total: 0,
            workingStatus: 0,
            toVerify: 0,
            highCriticality: 0,
            amcCovered: 0,
            endOfLifeSoon: 0,
            highCriticalityNoAmc: 0,
            boqCoverage: 0,
            error: err instanceof Error ? err.message : 'Server-side summary fetch failed',
        };
    }
}

/**
 * Register-wide distributions for the Overview charts. Separate from the
 * summary because it pages the whole table — it is fetched once per visit,
 * not on every sort/page change.
 */
export async function fetchAssetDistributionsAction(): Promise<AssetDistributions & { error?: string }> {
    try {
        const supabase = await getSupabaseServerClient();
        return await getAssetDistributionsFromSupabase(supabase);
    } catch (err) {
        console.error('Asset Distributions Action Error:', err);
        return {
            criticality: [],
            condition: [],
            lifecycle: [],
            disciplines: 0,
            rowsScanned: 0,
            error: err instanceof Error ? err.message : 'Server-side distribution fetch failed',
        };
    }
}
