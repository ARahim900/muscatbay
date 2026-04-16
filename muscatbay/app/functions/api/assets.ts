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
            .select('Asset_UID, Asset_Tag, Asset_Name, Asset_Description, Discipline, Category, Subcategory, System_Area, Location_Name, Location_Tag, Building, Floor_Area, Zone, Manufacturer_Brand, Model, Country_Of_Origin, Capacity_Size, Quantity, Install_Date, Install_Year, PPM_Frequency, PPM_Interval, Is_Asset_Active, Life_Expectancy_Years, Current_Age_Years, ERL_Years, Condition, Status, Supplier_Vendor, AMC_Contractor, Responsibility_Owner, Notes_Remarks, Tag_Duplicate_Flag, Source_Sheet, Source_Row', { count: 'exact' });

        // Apply search filter if provided - using new column names
        if (search) {
            query = query.or(`Asset_Name.ilike.%${search}%,Location_Name.ilike.%${search}%,Asset_Tag.ilike.%${search}%,Category.ilike.%${search}%,Discipline.ilike.%${search}%`);
        }

        // Apply status filter
        if (statusFilter && statusFilter.length > 0) {
            // Map "Active" back to "Working" for Supabase query since the DB uses "Working"
            const dbStatuses = statusFilter.map(s => {
                if (s === 'Active') return 'Working';
                return s;
            });
            query = query.in('Status', dbStatuses);
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

