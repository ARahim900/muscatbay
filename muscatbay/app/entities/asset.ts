/**
 * @fileoverview Asset Entity
 * Database model and transform function for Assets_Register_Database table
 * @module entities/asset
 */

import type { Asset } from '@/lib/mock-data';

/**
 * Asset type matching the Assets_Register_Database table schema in Supabase
 */
export interface SupabaseAsset {
    Asset_UID: string | null;
    Asset_Tag: string | null;
    Asset_Name: string | null;
    Asset_Description: string | null;
    Discipline: string | null;
    Category: string | null;
    Subcategory: string | null;
    System_Area: string | null;
    Location_Name: string | null;
    Location_Tag: string | null;
    Building: string | null;
    Floor_Area: string | null;
    Zone: string | null;
    Manufacturer_Brand: string | null;
    Model: string | null;
    Country_Of_Origin: string | null;
    Capacity_Size: string | null;
    Quantity: number | null;
    Install_Date: string | null;
    Install_Year: number | null;
    PPM_Frequency: string | null;
    PPM_Interval: string | null;
    Is_Asset_Active: string | null;
    Life_Expectancy_Years: number | null;
    Current_Age_Years: number | null;
    ERL_Years: number | null;
    Condition: string | null;
    Status: string | null;
    Supplier_Vendor: string | null;
    AMC_Contractor: string | null;
    Responsibility_Owner: string | null;
    Notes_Remarks: string | null;
    Tag_Duplicate_Flag: boolean | null;
    Source_Sheet: string | null;
    Source_Row: number | null;
}

/**
 * Transform Supabase asset to match the app's Asset interface
 */
export function transformAsset(dbAsset: SupabaseAsset): Asset {
    // Determine status - map Is_Asset_Active and Status fields
    let status: Asset['status'] = 'Active';
    if (dbAsset.Status) {
        const statusLower = dbAsset.Status.toLowerCase();
        if (statusLower.includes('maintenance')) {
            status = 'Under Maintenance';
        } else if (statusLower.includes('decommission') || statusLower.includes('inactive')) {
            status = 'Decommissioned';
        } else if (statusLower.includes('storage')) {
            status = 'In Storage';
        }
    } else if (dbAsset.Is_Asset_Active === 'N') {
        status = 'Decommissioned';
    }

    return {
        id: dbAsset.Asset_UID || String(Math.random()),
        name: dbAsset.Asset_Name || 'Unknown Asset',
        type: dbAsset.Discipline || dbAsset.Category || 'General',
        location: dbAsset.Location_Name || dbAsset.Building || dbAsset.Zone || 'Unknown Location',
        status: status,
        purchaseDate: dbAsset.Install_Date || '',
        value: 0,
        serialNumber: dbAsset.Asset_Tag || '',
        lastService: '',
    };
}
