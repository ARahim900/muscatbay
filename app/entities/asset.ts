/**
 * @fileoverview Asset Entity
 * Database model and transform function for asset_database_master table
 * @module entities/asset
 */

import type { Asset } from '@/lib/mock-data';

/**
 * Asset type matching the asset_database_master table schema in Supabase
 * Combines BOQ financial data + operational fields
 */
export interface SupabaseAsset {
    // Identity (from BOQ)
    id: number | null;
    asset_id: string | null;
    source_boq: string | null;
    contractor: string | null;
    component: string | null;
    trade_section: string | null;
    description: string | null;

    // Financial (from BOQ)
    qty: number | null;
    unit: string | null;
    rate_omr: number | null;
    boq_amount_omr: number | null;
    rfs_category: string | null;
    life_years: number | null;
    rfs_status: string | null;
    rfs_reason: string | null;
    annual_reserve_omr: number | null;

    // Operational (user fills in)
    asset_name: string | null;
    asset_tag: string | null;
    manufacturer_brand: string | null;
    model: string | null;
    serial_number: string | null;
    capacity_size: string | null;
    zone: string | null;
    building: string | null;
    floor_area: string | null;
    location_detail: string | null;

    // Lifecycle (user fills in)
    install_date: string | null;
    install_year: number | null;
    warranty_expiry: string | null;
    condition: string | null;
    condition_date: string | null;
    condition_notes: string | null;
    remaining_life_years: number | null;
    replacement_year: number | null;
    replacement_cost_omr: number | null;

    // Maintenance (user fills in)
    ppm_frequency: string | null;
    amc_contractor: string | null;
    amc_contract_ref: string | null;
    is_active: boolean | null;

    // Metadata
    created_at: string | null;
    updated_at: string | null;
    notes: string | null;
}

/**
 * Transform Supabase asset to match the app's Asset interface
 */
export function transformAsset(dbAsset: SupabaseAsset): Asset {
    // Determine status from rfs_status + condition + is_active
    let status: Asset['status'] = 'Active';
    if (dbAsset.is_active === false) {
        status = 'Decommissioned';
    } else if (dbAsset.condition === 'Critical') {
        status = 'Under Maintenance';
    } else if (dbAsset.rfs_status === 'Non-Covered') {
        status = 'In Storage'; // Using as proxy for Non-Covered display
    }

    // Build display name: prefer asset_name, fallback to description
    const displayName = dbAsset.asset_name || dbAsset.description || 'Unknown Asset';

    // Build location: prefer zone + building + location_detail, fallback to component
    const locationParts = [dbAsset.zone, dbAsset.building, dbAsset.location_detail].filter(Boolean);
    const location = locationParts.length > 0 ? locationParts.join(' - ') : dbAsset.component || 'Unknown';

    return {
        id: dbAsset.asset_id || String(dbAsset.id || Math.random()),
        name: displayName,
        type: dbAsset.trade_section || dbAsset.rfs_category || 'General',
        location: location,
        status: status,
        purchaseDate: dbAsset.install_date || '',
        value: Number(dbAsset.boq_amount_omr) || 0,
        serialNumber: dbAsset.asset_tag || dbAsset.serial_number || '',
        lastService: '',
    };
}
