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
            id: 1,
            row_id: 100,
            asset_id: 'AST-001',
            asset_tag: 'TAG-001',
            asset_name: 'Test Pump',
            asset_description: 'A test pump',
            asset_type: 'Pump',
            building: 'Building A',
            location: 'Room 101',
            location_name: 'Room 101',
            floor_no: '1',
            department: 'Engineering',
            model: 'Model X',
            serial_no: 'SN123',
            brand: 'TestBrand',
            purchase_date: '2024-01-01',
            purchase_price: 1000,
            install_date: '2024-01-15',
            warranty_period: '2 years',
            condition: 'Good',
            status: 'Active',
            power_rating: '5kW',
            capacity: '100L',
            dimensions: '50x50x100',
            material: 'Steel',
            ip_rating: 'IP65',
            quantity: 1,
            om_volume: '10L',
            responsibility: 'Maintenance',
            amc_contractor: 'ABC Services',
            floors_served: '1-3',
            notes: 'Test notes',
            source_sheet: 'Sheet1',
            category: 'Equipment',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-15T00:00:00Z',
        };

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
            id: 1,
            row_id: null,
            asset_id: null,
            asset_tag: null,
            asset_name: null,
            asset_description: null,
            asset_type: null,
            building: null,
            location: null,
            location_name: null,
            floor_no: null,
            department: null,
            model: null,
            serial_no: null,
            brand: null,
            purchase_date: null,
            purchase_price: null,
            install_date: null,
            warranty_period: null,
            condition: null,
            status: null,
            power_rating: null,
            capacity: null,
            dimensions: null,
            material: null,
            ip_rating: null,
            quantity: null,
            om_volume: null,
            responsibility: null,
            amc_contractor: null,
            floors_served: null,
            notes: null,
            source_sheet: null,
            category: null,
        };

        const result = transformAsset(minimalAsset);

        expect(result.id).toBe('1');
        expect(result.name).toBe('Unknown Asset');
        expect(result.type).toBe('General');
        expect(result.location).toBe('Unknown Location');
    });
});
