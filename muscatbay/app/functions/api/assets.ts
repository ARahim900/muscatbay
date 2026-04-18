import { type SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from '../supabase-client';
import { type Asset, type SupabaseAsset, transformAsset } from '@/entities/asset';

const TABLE = 'master_assets_register';

const SELECT_COLS = [
    'asset_uid', 'asset_tag', 'legacy_tag', 'asset_name', 'asset_description',
    'discipline', 'category', 'subcategory', 'system_area',
    'zone', 'sub_zone', 'building_area', 'floor_level', 'room_role',
    'manufacturer', 'model', 'country_of_origin', 'serial_number', 'power_capacity',
    'quantity', 'install_year', 'install_date', 'warranty_expiry_date', 'registration_authority',
    'life_expectancy_years', 'current_age_years', 'erl_years', 'pct_life_used',
    'criticality', 'condition', 'status', 'is_asset_active',
    'ppm_frequency', 'ppm_interval_months', 'maintenance_requirements',
    'last_ppm_date', 'next_ppm_date',
    'amc_contractor', 'amc_notes', 'supplier_vendor', 'responsibility_owner',
    'original_unit_cost_omr', 'current_replacement_cost_omr',
    'boq_project_ref', 'boq_category_design_life',
    'notes_remarks', 'data_source',
].join(', ');

export async function getAssetsFromSupabase(
    page: number = 1,
    pageSize: number = 50,
    search: string = '',
    sortField: string = 'asset_name',
    sortDirection: 'asc' | 'desc' = 'asc',
    statusFilter?: string[],
    disciplineFilter?: string[],
    clientOverride?: SupabaseClient
): Promise<{ data: Asset[]; count: number }> {
    const client = clientOverride ?? getSupabaseClient();
    if (!client) return { data: [], count: 0 };

    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;

    try {
        let query = client
            .from(TABLE)
            .select(SELECT_COLS, { count: 'exact' });

        if (search) {
            query = query.or(
                `asset_name.ilike.%${search}%,asset_tag.ilike.%${search}%,` +
                `building_area.ilike.%${search}%,zone.ilike.%${search}%,` +
                `discipline.ilike.%${search}%,category.ilike.%${search}%,` +
                `manufacturer.ilike.%${search}%,amc_contractor.ilike.%${search}%`
            );
        }

        if (statusFilter && statusFilter.length > 0) {
            query = query.in('status', statusFilter);
        }

        if (disciplineFilter && disciplineFilter.length > 0) {
            query = query.in('discipline', disciplineFilter);
        }

        const { data, error, count } = await query
            .order(sortField, { ascending: sortDirection === 'asc' })
            .range(start, end);

        if (error) throw new Error(`Supabase error: ${error.message}`);

        return {
            data: ((data as unknown as SupabaseAsset[]) || []).map(transformAsset),
            count: count || 0,
        };
    } catch (err) {
        throw err;
    }
}

export async function getAssetSummaryFromSupabase(clientOverride?: SupabaseClient): Promise<{
    total: number;
    activeFlagged: number;
    workingStatus: number;
    toVerify: number;
    criticalLifecycle: number;
    disciplines: number;
    boqCoverage: number;
}> {
    const client = clientOverride ?? getSupabaseClient();
    if (!client) {
        return { total: 0, activeFlagged: 0, workingStatus: 0, toVerify: 0, criticalLifecycle: 0, disciplines: 0, boqCoverage: 0 };
    }

    const [totalRes, activeRes, workingRes, verifyRes, criticalRes, disciplineRes, boqRes] = await Promise.all([
        client.from(TABLE).select('asset_uid', { count: 'exact', head: true }),
        client.from(TABLE).select('asset_uid', { count: 'exact', head: true }).eq('is_asset_active', true),
        client.from(TABLE).select('asset_uid', { count: 'exact', head: true }).in('status', ['Working', 'Active']),
        client.from(TABLE).select('asset_uid', { count: 'exact', head: true }).eq('status', 'TO VERIFY'),
        client.from(TABLE).select('asset_uid', { count: 'exact', head: true })
            .or('erl_years.lte.2,criticality.eq.High,status.eq.TO VERIFY'),
        client.from(TABLE).select('discipline').range(0, 2999),
        client.from(TABLE).select('asset_uid', { count: 'exact', head: true }).not('boq_project_ref', 'is', null),
    ]);

    const uniqueDisciplines = new Set(
        (disciplineRes.data || []).map((d: { discipline: string | null }) => d.discipline).filter(Boolean)
    );

    return {
        total: totalRes.count || 0,
        activeFlagged: activeRes.count || 0,
        workingStatus: workingRes.count || 0,
        toVerify: verifyRes.count || 0,
        criticalLifecycle: criticalRes.count || 0,
        disciplines: uniqueDisciplines.size,
        boqCoverage: boqRes.count || 0,
    };
}
