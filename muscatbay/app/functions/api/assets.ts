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

/**
 * Count registered assets without fetching any rows.
 * `head: true` makes Supabase return only the exact count — no data transfer.
 */
export async function getAssetsCountFromSupabase(clientOverride?: SupabaseClient): Promise<number> {
    const client = clientOverride ?? getSupabaseClient();
    if (!client) return 0;

    const { count, error } = await client
        .from(TABLE)
        .select('asset_uid', { count: 'exact', head: true });

    if (error) throw new Error(`Supabase error: ${error.message}`);

    return count || 0;
}

/**
 * Register-wide KPI counts.
 *
 * Every field is ONE query against ONE condition — the label on the KPI card
 * and the predicate below must always be readable as the same sentence.
 */
export interface AssetSummary {
    /** Every row in the register. */
    total: number;
    /** status ∈ (Working, Active). */
    workingStatus: number;
    /** status = 'TO VERIFY'. */
    toVerify: number;
    /** criticality = 'High' (case-insensitive). */
    highCriticality: number;
    /** amc_contractor present and non-blank. */
    amcCovered: number;
    /** erl_years ≤ 2 — remaining life is two years or less. */
    endOfLifeSoon: number;
    /** criticality = 'High' AND no amc_contractor recorded. */
    highCriticalityNoAmc: number;
    /** boq_project_ref present. */
    boqCoverage: number;
}

const EMPTY_SUMMARY: AssetSummary = {
    total: 0, workingStatus: 0, toVerify: 0, highCriticality: 0,
    amcCovered: 0, endOfLifeSoon: 0, highCriticalityNoAmc: 0, boqCoverage: 0,
};

export async function getAssetSummaryFromSupabase(clientOverride?: SupabaseClient): Promise<AssetSummary> {
    const client = clientOverride ?? getSupabaseClient();
    if (!client) return { ...EMPTY_SUMMARY };

    const [totalRes, workingRes, verifyRes, criticalRes, amcRes, eolRes, criticalNoAmcRes, boqRes] = await Promise.all([
        client.from(TABLE).select('asset_uid', { count: 'exact', head: true }),
        client.from(TABLE).select('asset_uid', { count: 'exact', head: true }).in('status', ['Working', 'Active']),
        client.from(TABLE).select('asset_uid', { count: 'exact', head: true }).eq('status', 'TO VERIFY'),
        // `ilike` without wildcards = case-insensitive equality, so a 'HIGH'
        // or 'high' row in the register is still counted as High criticality.
        client.from(TABLE).select('asset_uid', { count: 'exact', head: true }).ilike('criticality', 'High'),
        client.from(TABLE).select('asset_uid', { count: 'exact', head: true })
            .not('amc_contractor', 'is', null).neq('amc_contractor', ''),
        client.from(TABLE).select('asset_uid', { count: 'exact', head: true }).lte('erl_years', 2),
        client.from(TABLE).select('asset_uid', { count: 'exact', head: true })
            .ilike('criticality', 'High').or('amc_contractor.is.null,amc_contractor.eq.'),
        client.from(TABLE).select('asset_uid', { count: 'exact', head: true }).not('boq_project_ref', 'is', null),
    ]);

    const firstError = [totalRes, workingRes, verifyRes, criticalRes, amcRes, eolRes, criticalNoAmcRes, boqRes]
        .find(r => r.error)?.error;
    if (firstError) throw new Error(`Supabase error: ${firstError.message}`);

    return {
        total: totalRes.count || 0,
        workingStatus: workingRes.count || 0,
        toVerify: verifyRes.count || 0,
        highCriticality: criticalRes.count || 0,
        amcCovered: amcRes.count || 0,
        endOfLifeSoon: eolRes.count || 0,
        highCriticalityNoAmc: criticalNoAmcRes.count || 0,
        boqCoverage: boqRes.count || 0,
    };
}

// ── Register profile (distributions for the Overview charts) ─────────────────

export interface AssetBucket {
    label: string;
    count: number;
}

export interface AssetDistributions {
    /** Criticality (High / Medium / Low / Not recorded). */
    criticality: AssetBucket[];
    /** Condition values exactly as recorded, worst-known first, top 8. */
    condition: AssetBucket[];
    /** Remaining-life bands derived from erl_years. */
    lifecycle: AssetBucket[];
    /** Distinct discipline count across the whole register. */
    disciplines: number;
    /** Rows actually aggregated — always compare against `total` before trusting. */
    rowsScanned: number;
}

const PROFILE_PAGE = 1000;
/** Safety stop so a runaway table can never spin forever (30k rows = 30 pages). */
const PROFILE_MAX_PAGES = 30;

interface ProfileRow {
    criticality: string | null;
    condition: string | null;
    erl_years: number | null;
    discipline: string | null;
}

function bucketize(values: (string | null)[], notRecordedLabel: string): AssetBucket[] {
    const counts = new Map<string, number>();
    for (const raw of values) {
        const label = (raw ?? '').trim() || notRecordedLabel;
        counts.set(label, (counts.get(label) ?? 0) + 1);
    }
    return [...counts.entries()]
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count);
}

/**
 * Aggregate the whole register (paged, 4 narrow columns) so the Overview charts
 * describe all assets — not just the 25 rows currently on screen.
 */
export async function getAssetDistributionsFromSupabase(
    clientOverride?: SupabaseClient
): Promise<AssetDistributions> {
    const client = clientOverride ?? getSupabaseClient();
    if (!client) {
        return { criticality: [], condition: [], lifecycle: [], disciplines: 0, rowsScanned: 0 };
    }

    const rows: ProfileRow[] = [];
    for (let page = 0; page < PROFILE_MAX_PAGES; page++) {
        const from = page * PROFILE_PAGE;
        const { data, error } = await client
            .from(TABLE)
            .select('criticality, condition, erl_years, discipline')
            .range(from, from + PROFILE_PAGE - 1);

        if (error) throw new Error(`Supabase error: ${error.message}`);
        const batch = (data as unknown as ProfileRow[]) || [];
        rows.push(...batch);
        if (batch.length < PROFILE_PAGE) break;
    }

    const CRIT_ORDER = ['High', 'Medium', 'Low'];
    const criticality = bucketize(rows.map(r => r.criticality), 'Not recorded')
        .sort((a, b) => {
            const ai = CRIT_ORDER.indexOf(a.label);
            const bi = CRIT_ORDER.indexOf(b.label);
            if (ai !== -1 || bi !== -1) return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
            return b.count - a.count;
        });

    const condition = bucketize(rows.map(r => r.condition), 'Not recorded').slice(0, 8);

    const bands = [
        { label: '≤ 2 yrs', match: (n: number) => n <= 2 },
        { label: '3–5 yrs', match: (n: number) => n > 2 && n <= 5 },
        { label: '6–10 yrs', match: (n: number) => n > 5 && n <= 10 },
        { label: '> 10 yrs', match: (n: number) => n > 10 },
    ];
    const lifecycle: AssetBucket[] = bands.map(b => ({
        label: b.label,
        count: rows.filter(r => r.erl_years !== null && b.match(r.erl_years)).length,
    }));
    const noErl = rows.filter(r => r.erl_years === null).length;
    if (noErl > 0) lifecycle.push({ label: 'Not recorded', count: noErl });

    const disciplines = new Set(
        rows.map(r => (r.discipline ?? '').trim()).filter(Boolean)
    ).size;

    return { criticality, condition, lifecycle, disciplines, rowsScanned: rows.length };
}
