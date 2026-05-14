export interface Asset {
    id: string;
    name: string;
    type: string;
    category?: string;
    subcategory?: string;
    systemArea?: string;
    zone?: string;
    buildingArea?: string;
    floorLevel?: string;
    location: string;
    status: 'Active' | 'Working' | 'Under Maintenance' | 'Decommissioned' | 'In Storage' | 'TO VERIFY';
    purchaseDate: string;
    value: number;
    serialNumber: string;
    assetTag?: string;
    lastService: string;
    manufacturer: string;
    model?: string;
    countryOfOrigin?: string;
    powerCapacity?: string;
    serialNo?: string;
    quantity?: number | null;
    ppmFrequency?: string;
    ppmIntervalMonths?: number | null;
    maintenanceRequirements?: string;
    lastPpmDate?: string;
    nextPpmDate?: string;
    installYear: number | null;
    discipline: string;
    condition: string;
    responsibilityOwner?: string;
    lifeExpectancyYears?: number | null;
    currentAgeYears?: number | null;
    erlYears?: number | null;
    pctLifeUsed?: number | null;
    warrantyExpiryDate?: string;
    registrationAuthority?: string;
    criticalityLevel?: 'High' | 'Medium' | 'Low';
    lifecycleRisk?: 'Normal' | 'Watch' | 'Critical';
    isAssetActive?: boolean;
    amcContractor?: string;
    amcNotes?: string;
    notes?: string;
    boqProjectRef?: string | null;
    boqDesignLife?: number | null;
    boqUnitCost?: number | null;
    replacementCost?: number | null;
    dataSource?: string;
}

interface LegacySupabaseAssetFields {
    Asset_UID?: string | null;
    Asset_Tag?: string | null;
    Asset_Name?: string | null;
    Discipline?: string | null;
    Category?: string | null;
    System_Area?: string | null;
    Zone?: string | null;
    Location_Name?: string | null;
    Building?: string | null;
    Manufacturer_Brand?: string | null;
    Model?: string | null;
    Country_Of_Origin?: string | null;
    Capacity_Size?: string | null;
    Quantity?: number | null;
    Install_Year?: number | null;
    Install_Date?: string | null;
    Life_Expectancy_Years?: number | null;
    Current_Age_Years?: number | null;
    ERL_Years?: number | null;
    Condition?: string | null;
    Status?: string | null;
    Is_Asset_Active?: boolean | string | null;
    PPM_Frequency?: string | null;
    PPM_Interval?: number | null;
    Supplier_Vendor?: string | null;
    AMC_Contractor?: string | null;
    Responsibility_Owner?: string | null;
    Notes_Remarks?: string | null;
}

export interface SupabaseAsset extends LegacySupabaseAssetFields {
    asset_uid: string | null;
    asset_tag: string | null;
    legacy_tag: string | null;
    asset_name: string | null;
    asset_description: string | null;
    discipline: string | null;
    category: string | null;
    subcategory: string | null;
    system_area: string | null;
    zone: string | null;
    sub_zone: string | null;
    building_area: string | null;
    floor_level: string | null;
    room_role: string | null;
    manufacturer: string | null;
    model: string | null;
    country_of_origin: string | null;
    serial_number: string | null;
    power_capacity: string | null;
    quantity: number | null;
    manufacturing_date: string | null;
    install_year: number | null;
    install_date: string | null;
    commissioning_date: string | null;
    warranty_expiry_date: string | null;
    registration_date: string | null;
    registration_authority: string | null;
    life_expectancy_years: number | null;
    current_age_years: number | null;
    erl_years: number | null;
    pct_life_used: number | null;
    criticality: string | null;
    condition: string | null;
    status: string | null;
    is_asset_active: boolean | null;
    ppm_frequency: string | null;
    ppm_interval_months: number | null;
    maintenance_requirements: string | null;
    last_ppm_date: string | null;
    next_ppm_date: string | null;
    last_inspection_date: string | null;
    next_inspection_date: string | null;
    amc_contractor: string | null;
    amc_notes: string | null;
    supplier_vendor: string | null;
    responsibility_owner: string | null;
    original_unit_cost_omr: number | null;
    current_replacement_cost_omr: number | null;
    boq_project_ref: string | null;
    boq_category_design_life: string | number | null;
    oam_reference: string | null;
    notes_remarks: string | null;
    tag_duplicate_flag: boolean | null;
    data_source: string | null;
    record_created: string | null;
    last_updated: string | null;
}

function firstNonBlank(...values: Array<string | null | undefined>): string | null {
    for (const v of values) {
        if (typeof v !== 'string') continue;
        const trimmed = v.trim();
        if (trimmed !== '') return trimmed;
    }
    return null;
}

function djb2Hash(input: string): string {
    let hash = 5381;
    for (let i = 0; i < input.length; i++) {
        hash = ((hash << 5) + hash + input.charCodeAt(i)) | 0;
    }
    return (hash >>> 0).toString(36);
}

function deriveAssetIdFromContent(db: SupabaseAsset): string {
    const composite = [
        db.asset_name ?? db.Asset_Name ?? '',
        db.discipline ?? db.Discipline ?? '',
        db.category ?? db.Category ?? '',
        db.subcategory ?? '',
        db.system_area ?? db.System_Area ?? '',
        db.zone ?? db.Zone ?? '',
        db.sub_zone ?? '',
        db.building_area ?? db.Building ?? '',
        db.floor_level ?? '',
        db.room_role ?? db.Location_Name ?? '',
        db.manufacturer ?? db.Manufacturer_Brand ?? '',
        db.model ?? db.Model ?? '',
        db.serial_number ?? '',
        db.install_date ?? db.Install_Date ?? '',
        db.install_year != null ? String(db.install_year) : (db.Install_Year != null ? String(db.Install_Year) : ''),
    ].join('|');
    return `asset-${djb2Hash(composite)}`;
}

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

export function transformAsset(db: SupabaseAsset): Asset {
    const CURRENT_YEAR = new Date().getFullYear();

    const assetTag = (db.asset_tag ?? db.Asset_Tag ?? '').trim();
    const assetName = db.asset_name ?? db.Asset_Name ?? null;
    const discipline = db.discipline ?? db.Discipline ?? null;
    const category = db.category ?? db.Category ?? null;
    const systemArea = db.system_area ?? db.System_Area ?? null;
    const zone = db.zone ?? db.Zone ?? null;
    const buildingArea = db.building_area ?? db.Building ?? null;
    const roomRole = db.room_role ?? db.Location_Name ?? null;
    const manufacturer = db.manufacturer ?? db.Manufacturer_Brand ?? null;
    const model = db.model ?? db.Model ?? null;
    const countryOfOrigin = db.country_of_origin ?? db.Country_Of_Origin ?? null;
    const powerCapacity = db.power_capacity ?? db.Capacity_Size ?? null;
    const quantity = db.quantity ?? db.Quantity ?? null;
    const installYear = db.install_year ?? db.Install_Year ?? null;
    const installDate = db.install_date ?? db.Install_Date ?? '';
    const condition = db.condition ?? db.Condition ?? '';
    const rawStatus = db.status ?? db.Status ?? null;
    const isActiveRaw = db.is_asset_active ?? db.Is_Asset_Active ?? null;
    const isActiveFlag = isActiveRaw === true || isActiveRaw === 'Y';
    const ppmFrequency = db.ppm_frequency ?? db.PPM_Frequency ?? null;
    const ppmIntervalMonths = db.ppm_interval_months ?? db.PPM_Interval ?? null;
    const amcContractor = db.amc_contractor ?? db.AMC_Contractor ?? null;
    const responsibilityOwner = db.responsibility_owner ?? db.Responsibility_Owner ?? null;
    const notes = db.notes_remarks ?? db.Notes_Remarks ?? null;

    let status: Asset['status'] = 'Working';
    if (rawStatus) {
        const upper = rawStatus.toUpperCase().trim();
        const lower = rawStatus.toLowerCase();
        if (upper === 'WORKING')            status = 'Working';
        else if (upper === 'ACTIVE')        status = 'Active';
        else if (upper === 'TO VERIFY')     status = 'TO VERIFY';
        else if (lower.includes('maintenance'))                   status = 'Under Maintenance';
        else if (lower.includes('decommission') || lower.includes('inactive')) status = 'Decommissioned';
        else if (lower.includes('storage'))                       status = 'In Storage';
    } else if (!isActiveFlag) {
        status = 'Decommissioned';
    }

    const computedAge = installYear ? CURRENT_YEAR - installYear : null;
    const currentAgeYears = db.current_age_years ?? db.Current_Age_Years ?? computedAge;
    const lifeExpectancyYears = db.life_expectancy_years ?? db.Life_Expectancy_Years ?? null;
    const rawErlYears = db.erl_years ?? db.ERL_Years ?? null;
    const erlYears = rawErlYears !== null && rawErlYears !== undefined
        ? rawErlYears
        : (lifeExpectancyYears !== null && currentAgeYears !== null
            ? Math.max(0, lifeExpectancyYears - currentAgeYears)
            : null);

    // Map criticality (High/Medium/Low) → lifecycleRisk (Normal/Watch/Critical)
    const criticalityLevel = (db.criticality as Asset['criticalityLevel']) || undefined;
    let lifecycleRisk: Asset['lifecycleRisk'] = 'Normal';
    if (criticalityLevel === 'High' || (erlYears !== null && erlYears <= 2) || status === 'TO VERIFY') {
        lifecycleRisk = 'Critical';
    } else if (criticalityLevel === 'Medium' || (erlYears !== null && erlYears <= 5)) {
        lifecycleRisk = 'Watch';
    }

    const location =
        roomRole ||
        buildingArea ||
        zone ||
        systemArea ||
        db.sub_zone ||
        'Unknown Location';

    return {
        id: firstNonBlank(
            db.asset_uid, db.Asset_UID,
            db.asset_tag, db.Asset_Tag,
            db.legacy_tag,
        ) ?? deriveAssetIdFromContent(db),
        name: assetName || 'Unknown Asset',
        type: category || discipline || 'General',
        category: category || '',
        subcategory: db.subcategory || '',
        systemArea: systemArea || '',
        zone: zone || '',
        buildingArea: buildingArea || '',
        floorLevel: db.floor_level || '',
        location,
        status,
        purchaseDate: installDate,
        value: db.current_replacement_cost_omr ?? db.original_unit_cost_omr ?? 0,
        serialNumber: assetTag,
        assetTag,
        lastService: db.last_ppm_date || '',
        manufacturer: manufacturer || '',
        model: model || '',
        countryOfOrigin: countryOfOrigin || '',
        powerCapacity: powerCapacity || '',
        serialNo: db.serial_number || '',
        quantity,
        ppmFrequency: normalizePpmFrequency(ppmFrequency),
        ppmIntervalMonths,
        maintenanceRequirements: db.maintenance_requirements || '',
        lastPpmDate: db.last_ppm_date || '',
        nextPpmDate: db.next_ppm_date || '',
        installYear,
        discipline: discipline || '',
        condition,
        responsibilityOwner: responsibilityOwner || '',
        lifeExpectancyYears,
        currentAgeYears,
        erlYears,
        pctLifeUsed: db.pct_life_used ?? null,
        warrantyExpiryDate: db.warranty_expiry_date || '',
        registrationAuthority: db.registration_authority || '',
        criticalityLevel,
        lifecycleRisk,
        isAssetActive: isActiveFlag,
        amcContractor: amcContractor || '',
        amcNotes: db.amc_notes || '',
        notes: notes || '',
        boqProjectRef: db.boq_project_ref || null,
        boqDesignLife: db.boq_category_design_life !== null && db.boq_category_design_life !== undefined
            ? Number(db.boq_category_design_life) || null
            : null,
        boqUnitCost: db.original_unit_cost_omr ?? null,
        replacementCost: db.current_replacement_cost_omr ?? null,
        dataSource: db.data_source || '',
    };
}
