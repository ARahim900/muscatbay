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
    // Reserve Fund / BOQ enrichment fields
    boqProjectRef?: string | null;
    boqDesignLife?: number | null;
    boqUnitCost?: number | null;
    replacementCost?: number | null;
}

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
    Install_Year: number | string | null;
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
    BOQ_Project_Ref: string | null;
    BOQ_Category_Design_Life: number | null;
    BOQ_Unit_Cost_OMR: number | null;
    Current_Replacement_Cost_OMR: number | null;
}

/** Expand abbreviated PPM frequency codes into human-readable labels. */
function normalizePpmFrequency(raw: string | null | undefined): string {
    if (!raw) return '';
    const upper = raw.trim().toUpperCase();
    switch (upper) {
        case 'Q':
        case 'QUARTERLY':   return 'Quarterly';
        case 'HY':
        case 'SEMI-ANNUAL': return 'Semi-Annual';
        case '4M':          return 'Every 4 Months';
        case 'MONTHLY':     return 'Monthly';
        case 'ANNUAL':      return 'Annual';
        case 'OC':          return 'On Condition';
        case 'WEEKLY':      return 'Weekly';
        case '2':           return '2× / Year';
        case '4':           return '4× / Year';
        default:            return raw.trim();
    }
}

/** Transform Supabase asset row into the app-level Asset interface. */
export function transformAsset(dbAsset: SupabaseAsset): Asset {
    const CURRENT_YEAR = new Date().getFullYear();

    // ── Is_Asset_Active — normalise 'Y' and 'Yes' both to true ──
    const isActiveStr = (dbAsset.Is_Asset_Active || '').toUpperCase().trim();
    const isActiveFlag = isActiveStr === 'Y' || isActiveStr === 'YES';

    // ── Status ───────────────────────────────────────────────────
    let status: Asset['status'] = 'Active';
    if (dbAsset.Status) {
        const upper = dbAsset.Status.toUpperCase().trim();
        const lower = dbAsset.Status.toLowerCase();
        if (upper === 'WORKING')          status = 'Working';
        else if (upper === 'TO VERIFY')   status = 'TO VERIFY';
        else if (upper === 'ACTIVE')      status = 'Active';
        else if (lower.includes('maintenance'))              status = 'Under Maintenance';
        else if (lower.includes('decommission') || lower.includes('inactive')) status = 'Decommissioned';
        else if (lower.includes('storage'))                  status = 'In Storage';
    } else if (!isActiveFlag) {
        status = 'Decommissioned';
    }

    // ── Install year (stored as int OR string in the DB) ─────────
    const installYear = dbAsset.Install_Year !== null && dbAsset.Install_Year !== undefined
        ? Number(dbAsset.Install_Year) || null
        : null;

    // ── Current age: use DB value if present, otherwise derive from Install_Year ──
    const computedAge = installYear ? CURRENT_YEAR - installYear : null;
    const currentAgeYears: number | null = dbAsset.Current_Age_Years ?? computedAge;

    const lifeExpectancyYears: number | null = dbAsset.Life_Expectancy_Years ?? null;

    // ── ERL: use DB value if present, otherwise compute Life − Age ──
    const erlYears: number | null = dbAsset.ERL_Years !== null && dbAsset.ERL_Years !== undefined
        ? dbAsset.ERL_Years
        : (lifeExpectancyYears !== null && currentAgeYears !== null
            ? Math.max(0, lifeExpectancyYears - currentAgeYears)
            : null);

    // ── Lifecycle risk ────────────────────────────────────────────
    let lifecycleRisk: Asset['lifecycleRisk'] = 'Normal';
    if ((erlYears !== null && erlYears <= 2) || status === 'TO VERIFY' || status === 'Decommissioned') {
        lifecycleRisk = 'Critical';
    } else if (erlYears !== null && erlYears <= 5) {
        lifecycleRisk = 'Watch';
    }

    // ── Location: prefer Location_Name, then Zone, then System_Area ──
    const location =
        dbAsset.Location_Name ||
        dbAsset.Zone ||
        dbAsset.System_Area ||
        dbAsset.Building ||
        'Unspecified';

    return {
        id: dbAsset.Asset_UID || String(Math.random()),
        name: dbAsset.Asset_Name || 'Unknown Asset',
        type: dbAsset.Category || dbAsset.Discipline || 'General',
        category: dbAsset.Category || '',
        systemArea: dbAsset.System_Area || '',
        location,
        status,
        purchaseDate: dbAsset.Install_Date || '',
        value: dbAsset.Current_Replacement_Cost_OMR ?? dbAsset.BOQ_Unit_Cost_OMR ?? 0,
        serialNumber: dbAsset.Asset_Tag || '',
        lastService: '',
        manufacturer: dbAsset.Manufacturer_Brand || '',
        model: dbAsset.Model || '',
        countryOfOrigin: dbAsset.Country_Of_Origin || '',
        capacitySize: dbAsset.Capacity_Size || '',
        quantity: dbAsset.Quantity ?? null,
        ppmFrequency: normalizePpmFrequency(dbAsset.PPM_Frequency),
        installYear,
        discipline: dbAsset.Discipline || '',
        subcategory: dbAsset.Subcategory || '',
        condition: dbAsset.Condition || '',
        responsibilityOwner: dbAsset.Responsibility_Owner || '',
        lifeExpectancyYears,
        currentAgeYears,
        erlYears,
        lifecycleRisk,
        isAssetActive: isActiveFlag,
        notes: dbAsset.Notes_Remarks || '',
        boqProjectRef: dbAsset.BOQ_Project_Ref || null,
        boqDesignLife: dbAsset.BOQ_Category_Design_Life ?? null,
        boqUnitCost: dbAsset.BOQ_Unit_Cost_OMR ?? null,
        replacementCost: dbAsset.Current_Replacement_Cost_OMR ?? null,
    };
}
