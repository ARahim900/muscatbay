/**
 * @fileoverview Assets API Functions
 * Data fetching functions for assets from Supabase
 * @module functions/api/assets
 */

import { getSupabaseClient } from '../supabase-client';
import { type Asset, type SupabaseAsset, transformAsset } from '@/entities/asset';

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
    statusFilter?: string[],
    disciplineFilter?: string[]
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
            .select('Asset_UID, Asset_Tag, Asset_Name, Asset_Description, Discipline, Category, Subcategory, System_Area, Location_Name, Location_Tag, Building, Floor_Area, Zone, Manufacturer_Brand, Model, Country_Of_Origin, Capacity_Size, Quantity, Install_Date, Install_Year, PPM_Frequency, PPM_Interval, Is_Asset_Active, Life_Expectancy_Years, Current_Age_Years, ERL_Years, Condition, Status, Supplier_Vendor, AMC_Contractor, Responsibility_Owner, Notes_Remarks, Tag_Duplicate_Flag, Source_Sheet, Source_Row, BOQ_Project_Ref, BOQ_Category_Design_Life, BOQ_Unit_Cost_OMR, Current_Replacement_Cost_OMR', { count: 'exact' });

        // Apply search filter if provided - using new column names
        if (search) {
            query = query.or(`Asset_Name.ilike.%${search}%,Location_Name.ilike.%${search}%,Asset_Tag.ilike.%${search}%,Category.ilike.%${search}%,Discipline.ilike.%${search}%`);
        }

        // Apply status filter — pass status values as-is; DB stores 'Working', 'Active', 'TO VERIFY', etc.
        if (statusFilter && statusFilter.length > 0) {
            query = query.in('Status', statusFilter);
        }

        // Apply discipline filter
        if (disciplineFilter && disciplineFilter.length > 0) {
            query = query.in('Discipline', disciplineFilter);
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

/**
 * Fetch operations-level summary metrics from Supabase.
 * These are global metrics (not page-limited) for management dashboards.
 */
export async function getAssetSummaryFromSupabase(): Promise<{
    total: number;
    activeFlagged: number;
    workingStatus: number;
    toVerify: number;
    criticalLifecycle: number;
    disciplines: number;
    boqCoverage: number;
}> {
    const client = getSupabaseClient();
    if (!client) {
        return { total: 0, activeFlagged: 0, workingStatus: 0, toVerify: 0, criticalLifecycle: 0, disciplines: 0, boqCoverage: 0 };
    }

    const [totalRes, activeRes, workingRes, verifyRes, criticalRes, disciplineRes, boqRes] = await Promise.all([
        client.from('Assets_Register_Database').select('Asset_UID', { count: 'exact', head: true }),
        client
            .from('Assets_Register_Database')
            .select('Asset_UID', { count: 'exact', head: true })
            .in('Is_Asset_Active', ['Y', 'Yes']),
        client
            .from('Assets_Register_Database')
            .select('Asset_UID', { count: 'exact', head: true })
            .in('Status', ['Working', 'Active']),
        client
            .from('Assets_Register_Database')
            .select('Asset_UID', { count: 'exact', head: true })
            .eq('Status', 'TO VERIFY'),
        client
            .from('Assets_Register_Database')
            .select('Asset_UID', { count: 'exact', head: true })
            .or('ERL_Years.lte.2,Status.eq.TO VERIFY,Status.eq.Decommissioned'),
        client.from('Assets_Register_Database').select('Discipline').range(0, 999),
        client
            .from('Assets_Register_Database')
            .select('Asset_UID', { count: 'exact', head: true })
            .not('BOQ_Project_Ref', 'is', null),
    ]);

    if (totalRes.error || activeRes.error || workingRes.error || verifyRes.error || criticalRes.error || disciplineRes.error || boqRes.error) {
        throw new Error(
            totalRes.error?.message ||
                activeRes.error?.message ||
                workingRes.error?.message ||
                verifyRes.error?.message ||
                criticalRes.error?.message ||
                disciplineRes.error?.message ||
                boqRes.error?.message ||
                'Failed to fetch asset summary'
        );
    }

    const disciplineRows = [...(disciplineRes.data || [])];
    if ((disciplineRes.data || []).length === 1000) {
        let start = 1000;
        const pageSize = 1000;
        // Read all rows so the discipline KPI reflects the full portfolio.
        while (true) {
            const { data, error } = await client
                .from('Assets_Register_Database')
                .select('Discipline')
                .range(start, start + pageSize - 1);
            if (error) {
                throw new Error(error.message);
            }
            if (!data || data.length === 0) {
                break;
            }
            disciplineRows.push(...data);
            if (data.length < pageSize) {
                break;
            }
            start += pageSize;
        }
    }

    const uniqueDisciplines = new Set(disciplineRows.map((d) => d.Discipline).filter(Boolean));

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

