import { describe, it, expect } from 'vitest';
import { transformAsset, type SupabaseAsset } from '@/entities/asset';

function baseRow(overrides: Partial<SupabaseAsset> = {}): SupabaseAsset {
    return {
        asset_uid: null,
        asset_tag: null,
        legacy_tag: null,
        asset_name: 'Pump A',
        asset_description: null,
        discipline: 'Mechanical',
        category: 'Pumps',
        subcategory: null,
        system_area: 'STP',
        zone: 'Zone 3',
        sub_zone: null,
        building_area: null,
        floor_level: null,
        room_role: null,
        manufacturer: 'Grundfos',
        model: 'CR-5',
        country_of_origin: null,
        serial_number: null,
        power_capacity: null,
        quantity: null,
        manufacturing_date: null,
        install_year: 2020,
        install_date: '2020-06-01',
        commissioning_date: null,
        warranty_expiry_date: null,
        registration_date: null,
        registration_authority: null,
        life_expectancy_years: null,
        current_age_years: null,
        erl_years: null,
        pct_life_used: null,
        criticality: null,
        condition: null,
        status: null,
        is_asset_active: null,
        ppm_frequency: null,
        ppm_interval_months: null,
        maintenance_requirements: null,
        last_ppm_date: null,
        next_ppm_date: null,
        last_inspection_date: null,
        next_inspection_date: null,
        amc_contractor: null,
        amc_notes: null,
        supplier_vendor: null,
        responsibility_owner: null,
        original_unit_cost_omr: null,
        current_replacement_cost_omr: null,
        boq_project_ref: null,
        boq_category_design_life: null,
        oam_reference: null,
        notes_remarks: null,
        tag_duplicate_flag: null,
        data_source: null,
        record_created: null,
        last_updated: null,
        ...overrides,
    };
}

describe('transformAsset id fallback', () => {
    it('uses asset_uid when present', () => {
        const asset = transformAsset(baseRow({ asset_uid: 'UID-001', asset_tag: 'TAG-001' }));
        expect(asset.id).toBe('UID-001');
    });

    it('falls through whitespace-only asset_uid to asset_tag', () => {
        const asset = transformAsset(baseRow({ asset_uid: '   ', asset_tag: 'TAG-001' }));
        expect(asset.id).toBe('TAG-001');
    });

    it('falls through whitespace-only asset_tag to legacy_tag', () => {
        const asset = transformAsset(baseRow({ asset_tag: '   ', legacy_tag: 'LEG-9' }));
        expect(asset.id).toBe('LEG-9');
    });

    it('falls through empty asset_tag to legacy_tag', () => {
        const asset = transformAsset(baseRow({ asset_tag: '', legacy_tag: 'LEG-9' }));
        expect(asset.id).toBe('LEG-9');
    });

    it('falls through whitespace-only legacy_tag to content hash', () => {
        const asset = transformAsset(baseRow({ legacy_tag: '   ' }));
        expect(asset.id).toMatch(/^asset-[0-9a-z]+$/);
    });

    it('trims whitespace around real ids', () => {
        const asset = transformAsset(baseRow({ asset_uid: '  UID-002  ' }));
        expect(asset.id).toBe('UID-002');
    });

    it('falls through all blank id sources to content hash', () => {
        const asset = transformAsset(baseRow({ asset_uid: '', asset_tag: '   ', legacy_tag: null }));
        expect(asset.id).toMatch(/^asset-[0-9a-z]+$/);
    });

    it('honours legacy Asset_UID / Asset_Tag fields in fallback order', () => {
        const asset = transformAsset(baseRow({ Asset_UID: 'LEGACY-UID', Asset_Tag: 'LEGACY-TAG' }));
        expect(asset.id).toBe('LEGACY-UID');
    });
});
