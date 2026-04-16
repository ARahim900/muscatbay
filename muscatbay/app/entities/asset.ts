/**
 * @fileoverview Asset Entity
 * Database model and transform function for Assets_Register_Database table
 * @module entities/asset
 */

/**
 * Application-level Asset interface used across the app.
 * Defined here as the single source of truth.
 */
export interface Asset {
    id: string;
    name: string;
    type: string;
    category?: string;
    systemArea?: string;
    location: string;
    status: 'Active' | 'Working' | 'Under Maintenance' | 'Decommissioned' | 'In Storage' | 'TO VERIFY';
    purchaseDate: string;
    value: number;
    serialNumber: string;
    lastService: string;
    manufacturer: string;
    model?: string;
    countryOfOrigin?: string;
    capacitySize?: string;
    quantity?: number | null;
    ppmFrequency?: string;
    installYear: number | null;
    discipline: string;
    subcategory: string;
    condition: string;
    responsibilityOwner?: string;
    lifeExpectancyYears?: number | null;
    currentAgeYears?: number | null;
    erlYears?: number | null;
    lifecycleRisk?: 'Normal' | 'Watch' | 'Critical';
    isAssetActive?: boolean;
    notes?: string;
}

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
        const statusUpper = dbAsset.Status.toUpperCase().trim();
        if (statusUpper === 'WORKING') {
            status = 'Working';
        } else if (statusUpper === 'TO VERIFY') {
            status = 'TO VERIFY';
        } else {
            const statusLower = dbAsset.Status.toLowerCase();
            if (statusLower.includes('maintenance')) {
                status = 'Under Maintenance';
            } else if (statusLower.includes('decommission') || statusLower.includes('inactive')) {
                status = 'Decommissioned';
            } else if (statusLower.includes('storage')) {
                status = 'In Storage';
            }
        }
    } else if (dbAsset.Is_Asset_Active === 'N') {
        status = 'Decommissioned';
    }

    const erlYears = dbAsset.ERL_Years ?? null;
    const lifeExpectancyYears = dbAsset.Life_Expectancy_Years ?? null;
    const currentAgeYears = dbAsset.Current_Age_Years ?? null;
    let lifecycleRisk: Asset['lifecycleRisk'] = 'Normal';
    if ((erlYears !== null && erlYears <= 2) || status === 'TO VERIFY' || status === 'Decommissioned') {
        lifecycleRisk = 'Critical';
    } else if (erlYears !== null && erlYears <= 5) {
        lifecycleRisk = 'Watch';
    }

    return {
        id: dbAsset.Asset_UID || String(Math.random()),
        name: dbAsset.Asset_Name || 'Unknown Asset',
        type: dbAsset.Category || dbAsset.Discipline || 'General',
        category: dbAsset.Category || '',
        systemArea: dbAsset.System_Area || '',
        location: dbAsset.Location_Name || dbAsset.Building || dbAsset.Zone || 'Unknown Location',
        status: status,
        purchaseDate: dbAsset.Install_Date || '',
        value: 0,
        serialNumber: dbAsset.Asset_Tag || '',
        lastService: '',
        manufacturer: dbAsset.Manufacturer_Brand || '',
        model: dbAsset.Model || '',
        countryOfOrigin: dbAsset.Country_Of_Origin || '',
        capacitySize: dbAsset.Capacity_Size || '',
        quantity: dbAsset.Quantity ?? null,
        ppmFrequency: dbAsset.PPM_Frequency || '',
        installYear: dbAsset.Install_Year ?? null,
        discipline: dbAsset.Discipline || '',
        subcategory: dbAsset.Subcategory || '',
        condition: dbAsset.Condition || '',
        responsibilityOwner: dbAsset.Responsibility_Owner || '',
        lifeExpectancyYears,
        currentAgeYears,
        erlYears,
        lifecycleRisk,
        isAssetActive: (dbAsset.Is_Asset_Active || '').toUpperCase() !== 'N',
        notes: dbAsset.Notes_Remarks || '',
    };
}
