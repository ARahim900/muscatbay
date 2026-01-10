/**
 * @fileoverview Asset Entity
 * Database model and transform function for assets table (mb_assets)
 * @module entities/asset
 */

import type { Asset } from '@/lib/mock-data';

/**
 * Asset type matching the mb_assets table schema in Supabase
 */
export interface SupabaseAsset {
    id: number;
    row_id: number | null;
    asset_id: string | null;
    asset_tag: string | null;
    asset_name: string | null;
    asset_description: string | null;
    asset_type: string | null;
    category: string | null;
    sub_category: string | null;
    system_area: string | null;
    location_name: string | null;
    location_tag: string | null;
    floor_area: string | null;
    building: string | null;
    make_brand: string | null;
    model: string | null;
    capacity_size: string | null;
    country_origin: string | null;
    supplier: string | null;
    install_date: string | null;
    life_expectancy_years: number | null;
    current_age_years: number | null;
    erl_years: number | null;
    status: string | null;
    condition: string | null;
    ppm_frequency: string | null;
    is_active: string | null;
    quantity: number | null;
    om_volume: string | null;
    responsibility: string | null;
    amc_contractor: string | null;
    floors_served: string | null;
    notes: string | null;
    source_sheet: string | null;
    created_at?: string;
    updated_at?: string;
}

/**
 * Transform Supabase asset to match the app's Asset interface
 */
export function transformAsset(dbAsset: SupabaseAsset): Asset {
    return {
        id: String(dbAsset.id),
        name: dbAsset.asset_name || 'Unknown Asset',
        type: dbAsset.asset_type || dbAsset.category || 'General',
        location: dbAsset.location_name || dbAsset.building || 'Unknown Location',
        status: (dbAsset.status as Asset['status']) || 'Active',
        purchaseDate: dbAsset.install_date || '',
        value: 0,
        serialNumber: dbAsset.asset_tag || dbAsset.asset_id || '',
        lastService: '',
    };
}
