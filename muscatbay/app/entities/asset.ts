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

export interface SupabaseAsset {
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

    const isActiveFlag = db.is_asset_active === true;

    let status: Asset['status'] = 'Working';
    if (db.status) {
        const upper = db.status.toUpperCase().trim();
        const lower = db.status.toLowerCase();
        if (upper === 'WORKING')            status = 'Working';
        else if (upper === 'ACTIVE')        status = 'Active';
        else if (upper === 'TO VERIFY')     status = 'TO VERIFY';
        else if (lower.includes('maintenance'))                   status = 'Under Maintenance';
        else if (lower.includes('decommission') || lower.includes('inactive')) status = 'Decommissioned';
        else if (lower.includes('storage'))                       status = 'In Storage';
    } else if (!isActiveFlag) {
        status = 'Decommissioned';
    }

    const installYear = db.install_year ?? null;
    const computedAge = installYear ? CURRENT_YEAR - installYear : null;
    const currentAgeYears = db.current_age_years ?? computedAge;
    const lifeExpectancyYears = db.life_expectancy_years ?? null;
    const erlYears = db.erl_years !== null && db.erl_years !== undefined
        ? db.erl_years
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
        db.building_area ||
        db.zone ||
        db.system_area ||
        db.sub_zone ||
        'Unspecified';

    return {
        id: db.asset_uid || String(Math.random()),
        name: db.asset_name || 'Unknown Asset',
        type: db.category || db.discipline || 'General',
        category: db.category || '',
        subcategory: db.subcategory || '',
        systemArea: db.system_area || '',
        zone: db.zone || '',
        buildingArea: db.building_area || '',
        floorLevel: db.floor_level || '',
        location,
        status,
        purchaseDate: db.install_date || '',
        value: db.current_replacement_cost_omr ?? db.original_unit_cost_omr ?? 0,
        serialNumber: db.asset_tag || '',
        assetTag: db.asset_tag || '',
        lastService: db.last_ppm_date || '',
        manufacturer: db.manufacturer || '',
        model: db.model || '',
        countryOfOrigin: db.country_of_origin || '',
        powerCapacity: db.power_capacity || '',
        serialNo: db.serial_number || '',
        quantity: db.quantity ?? null,
        ppmFrequency: normalizePpmFrequency(db.ppm_frequency),
        ppmIntervalMonths: db.ppm_interval_months ?? null,
        maintenanceRequirements: db.maintenance_requirements || '',
        lastPpmDate: db.last_ppm_date || '',
        nextPpmDate: db.next_ppm_date || '',
        installYear,
        discipline: db.discipline || '',
        condition: db.condition || '',
        responsibilityOwner: db.responsibility_owner || '',
        lifeExpectancyYears,
        currentAgeYears,
        erlYears,
        pctLifeUsed: db.pct_life_used ?? null,
        warrantyExpiryDate: db.warranty_expiry_date || '',
        registrationAuthority: db.registration_authority || '',
        criticalityLevel,
        lifecycleRisk,
        isAssetActive: isActiveFlag,
        amcContractor: db.amc_contractor || '',
        amcNotes: db.amc_notes || '',
        notes: db.notes_remarks || '',
        boqProjectRef: db.boq_project_ref || null,
        boqDesignLife: db.boq_category_design_life !== null && db.boq_category_design_life !== undefined
            ? Number(db.boq_category_design_life) || null
            : null,
        boqUnitCost: db.original_unit_cost_omr ?? null,
        replacementCost: db.current_replacement_cost_omr ?? null,
        dataSource: db.data_source || '',
    };
}
