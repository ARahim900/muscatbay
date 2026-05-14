import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock environment variables before importing
vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '');

describe('Supabase Utilities', () => {
    describe('isSupabaseConfigured', () => {
        it('should return false when env vars are not set', async () => {
            const { isSupabaseConfigured } = await import('@/lib/supabase');

            expect(isSupabaseConfigured()).toBe(false);
        });
    });

    describe('getSupabaseClient', () => {
        it('should return null when not configured', async () => {
            const { getSupabaseClient } = await import('@/lib/supabase');

            const client = getSupabaseClient();
            expect(client).toBeNull();
        });
    });
});

describe('Asset Transformation', () => {
    it('should transform Supabase asset to app format', async () => {
        const { transformAsset } = await import('@/lib/supabase');

        const dbAsset = {
            Asset_UID: '1',
            Source_Row: 100,
            Asset_Tag: 'TAG-001',
            Asset_Name: 'Test Pump',
            Asset_Description: 'A test pump',
            Discipline: 'Pump',
            Building: 'Building A',
            Location_Name: 'Room 101',
            Floor_Area: '1',
            System_Area: 'Engineering',
            Model: 'Model X',
            Manufacturer_Brand: 'TestBrand',
            Install_Date: '2024-01-01',
            Condition: 'Good',
            Status: 'Active',
            Quantity: 1,
            Notes_Remarks: 'Test notes',
            Source_Sheet: 'Sheet1',
            Category: 'Equipment',
            // Add other required fields with null or default values to satisfy type
            Location_Tag: null,
            Zone: null,
            Country_Of_Origin: null,
            Capacity_Size: null,
            Install_Year: 2024,
            PPM_Frequency: null,
            PPM_Interval: null,
            Is_Asset_Active: 'Y',
            Life_Expectancy_Years: null,
            Current_Age_Years: null,
            ERL_Years: null,
            Supplier_Vendor: null,
            AMC_Contractor: null,
            Responsibility_Owner: null,
            Tag_Duplicate_Flag: false,
        } as unknown as Parameters<typeof transformAsset>[0];

        const result = transformAsset(dbAsset);

        // id resolves via fallback chain: Asset_UID → Asset_Tag → legacy_tag → deriveAssetIdFromContent
        expect(result.id).toBe('1');
        expect(result.name).toBe('Test Pump');
        expect(result.type).toBe('Equipment');
        expect(result.location).toBe('Room 101');
        expect(result.status).toBe('Active');
        expect(result.serialNumber).toBe('TAG-001');
    });

    it('should handle null/undefined values gracefully', async () => {
        const { transformAsset } = await import('@/lib/supabase');

        const minimalAsset = {
            Asset_UID: '1',
            Source_Row: null,
            Asset_Tag: null,
            Asset_Name: null,
            Asset_Description: null,
            Discipline: null,
            Building: null,
            Location_Name: null,
            Floor_Area: null,
            System_Area: null,
            Model: null,
            Manufacturer_Brand: null,
            Install_Date: null,
            Condition: null,
            Status: null,
            Quantity: null,
            Notes_Remarks: null,
            Source_Sheet: null,
            Category: null,
            // Other fields
            Location_Tag: null,
            Zone: null,
            Country_Of_Origin: null,
            Capacity_Size: null,
            Install_Year: null,
            PPM_Frequency: null,
            PPM_Interval: null,
            Is_Asset_Active: null,
            Life_Expectancy_Years: null,
            Current_Age_Years: null,
            ERL_Years: null,
            Supplier_Vendor: null,
            AMC_Contractor: null,
            Responsibility_Owner: null,
            Tag_Duplicate_Flag: null,
        } as unknown as Parameters<typeof transformAsset>[0];

        const result = transformAsset(minimalAsset);

        expect(result.id).toBe('1');
        expect(result.name).toBe('Unknown Asset');
        expect(result.type).toBe('General');
        expect(result.location).toBe('Unknown Location');
    });

    describe('id generation when asset_uid is missing', () => {
        it('falls back to asset_tag when asset_uid is missing', async () => {
            const { transformAsset } = await import('@/lib/supabase');

            const result = transformAsset({
                asset_uid: null,
                asset_tag: 'TAG-XYZ',
                asset_name: 'Pump A',
            } as unknown as Parameters<typeof transformAsset>[0]);

            expect(result.id).toBe('TAG-XYZ');
        });

        it('falls back to legacy_tag when asset_uid and asset_tag are missing', async () => {
            const { transformAsset } = await import('@/lib/supabase');

            const result = transformAsset({
                asset_uid: null,
                asset_tag: null,
                legacy_tag: 'LEGACY-1',
                asset_name: 'Pump A',
            } as unknown as Parameters<typeof transformAsset>[0]);

            expect(result.id).toBe('LEGACY-1');
        });

        it('produces a stable id for the same input across calls', async () => {
            const { transformAsset } = await import('@/lib/supabase');

            const input = {
                asset_uid: null,
                asset_tag: null,
                asset_name: 'Chiller',
                zone: 'Zone-A',
                building_area: 'Bldg-1',
                install_date: '2024-01-01',
            } as unknown as Parameters<typeof transformAsset>[0];

            const a = transformAsset(input);
            const b = transformAsset(input);

            expect(a.id).toBe(b.id);
            expect(a.id).not.toBe('unknown-asset');
            expect(a.id.length).toBeGreaterThan(0);
        });

        it('produces different ids for two assets sharing only a name', async () => {
            const { transformAsset } = await import('@/lib/supabase');

            const a = transformAsset({
                asset_uid: null,
                asset_tag: null,
                asset_name: 'Pump',
                zone: 'Zone-A',
                building_area: 'Bldg-1',
            } as unknown as Parameters<typeof transformAsset>[0]);

            const b = transformAsset({
                asset_uid: null,
                asset_tag: null,
                asset_name: 'Pump',
                zone: 'Zone-B',
                building_area: 'Bldg-2',
            } as unknown as Parameters<typeof transformAsset>[0]);

            expect(a.id).not.toBe(b.id);
        });

        it('produces different ids for two assets with no identifying fields but different rows', async () => {
            const { transformAsset } = await import('@/lib/supabase');

            const a = transformAsset({
                asset_uid: null,
                asset_tag: null,
                asset_name: null,
                discipline: 'HVAC',
            } as unknown as Parameters<typeof transformAsset>[0]);

            const b = transformAsset({
                asset_uid: null,
                asset_tag: null,
                asset_name: null,
                discipline: 'Plumbing',
            } as unknown as Parameters<typeof transformAsset>[0]);

            expect(a.id).not.toBe(b.id);
        });

        it('never returns the literal "unknown-asset" sentinel', async () => {
            const { transformAsset } = await import('@/lib/supabase');

            const result = transformAsset({
                asset_uid: null,
                asset_tag: null,
                asset_name: null,
            } as unknown as Parameters<typeof transformAsset>[0]);

            expect(result.id).not.toBe('unknown-asset');
            expect(result.id.length).toBeGreaterThan(0);
        });

        it('treats whitespace-only asset_tag as absent and falls through to legacy_tag', async () => {
            const { transformAsset } = await import('@/lib/supabase');

            const result = transformAsset({
                asset_uid: null,
                asset_tag: '   ',
                legacy_tag: 'LEGACY-2',
                asset_name: 'Pump B',
            } as unknown as Parameters<typeof transformAsset>[0]);

            expect(result.id).toBe('LEGACY-2');
        });

        it('treats empty-string asset_tag as absent and falls through to legacy_tag', async () => {
            const { transformAsset } = await import('@/lib/supabase');

            const result = transformAsset({
                asset_uid: null,
                asset_tag: '',
                legacy_tag: 'LEGACY-3',
            } as unknown as Parameters<typeof transformAsset>[0]);

            expect(result.id).toBe('LEGACY-3');
        });

        it('treats whitespace-only asset_uid as absent and falls through to asset_tag', async () => {
            const { transformAsset } = await import('@/lib/supabase');

            const result = transformAsset({
                asset_uid: '  ',
                asset_tag: 'TAG-WS',
            } as unknown as Parameters<typeof transformAsset>[0]);

            expect(result.id).toBe('TAG-WS');
        });

        it('falls through to derived id when all explicit identifiers are blank/whitespace', async () => {
            const { transformAsset } = await import('@/lib/supabase');

            const result = transformAsset({
                asset_uid: '   ',
                asset_tag: '',
                legacy_tag: '\t',
                asset_name: 'Chiller',
                zone: 'Zone-C',
            } as unknown as Parameters<typeof transformAsset>[0]);

            expect(result.id).toMatch(/^asset-/);
        });

        it('falls through to legacy Asset_UID when modern asset_uid is empty string', async () => {
            const { transformAsset } = await import('@/lib/supabase');

            const result = transformAsset({
                asset_uid: '',
                Asset_UID: 'LEGACY-UID-9',
                asset_tag: null,
            } as unknown as Parameters<typeof transformAsset>[0]);

            expect(result.id).toBe('LEGACY-UID-9');
        });

        it('falls through to legacy Asset_Tag when modern asset_tag is whitespace', async () => {
            const { transformAsset } = await import('@/lib/supabase');

            const result = transformAsset({
                asset_uid: null,
                asset_tag: '  ',
                Asset_Tag: 'LEGACY-TAG-7',
            } as unknown as Parameters<typeof transformAsset>[0]);

            expect(result.id).toBe('LEGACY-TAG-7');
        });

        it('trims surrounding whitespace from the chosen identifier', async () => {
            const { transformAsset } = await import('@/lib/supabase');

            const result = transformAsset({
                asset_uid: '  UID-42  ',
                asset_tag: null,
            } as unknown as Parameters<typeof transformAsset>[0]);

            expect(result.id).toBe('UID-42');
        });
    });
});
