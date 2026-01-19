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
        } as unknown as any;

        const result = transformAsset(dbAsset);

        // transformAsset uses String(dbAsset.id) for id
        expect(result.id).toBe('1');
        expect(result.name).toBe('Test Pump');
        expect(result.type).toBe('Pump');
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
        } as unknown as any;

        const result = transformAsset(minimalAsset);

        expect(result.id).toBe('1');
        expect(result.name).toBe('Unknown Asset');
        expect(result.type).toBe('General');
        expect(result.location).toBe('Unknown Location');
    });
});
