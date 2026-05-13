import { describe, it, expect } from 'vitest';
import { sortAssets } from '@/app/assets/sort';
import type { Asset } from '@/entities/asset';

const rows: Asset[] = [
    {
        id: '1', name: 'Bravo Pump',   discipline: 'Water',        type: 'Pump',
        location: 'Zone 3', zone: 'Zone 3', status: 'Working',
        purchaseDate: '2022-03-01', lastService: '', manufacturer: '', serialNumber: '',
        installYear: 2022, condition: '', replacementCost: 1000,
    },
    {
        id: '2', name: 'Alpha Boiler', discipline: 'HVAC',         type: 'Boiler',
        location: 'Mall', zone: 'Mall', status: 'Under Maintenance',
        purchaseDate: '2024-06-01', lastService: '', manufacturer: '', serialNumber: '',
        installYear: 2024, condition: '', replacementCost: 5000,
    },
    {
        id: '3', name: 'Charlie Tank', discipline: 'Electrical',   type: 'Tank',
        location: 'Tower', zone: 'Tower', status: 'Active',
        purchaseDate: '2020-01-01', lastService: '', manufacturer: '', serialNumber: '',
        installYear: 2020, condition: '', replacementCost: 250,
    },
];

describe('sortAssets', () => {
    it('sorts by name asc', () => {
        const out = sortAssets(rows, 'name', 'asc');
        expect(out.map(r => r.name)).toEqual(['Alpha Boiler', 'Bravo Pump', 'Charlie Tank']);
    });

    it('sorts by name desc', () => {
        const out = sortAssets(rows, 'name', 'desc');
        expect(out.map(r => r.name)).toEqual(['Charlie Tank', 'Bravo Pump', 'Alpha Boiler']);
    });

    it('sorts by replCost asc (numeric)', () => {
        const out = sortAssets(rows, 'replCost', 'asc');
        expect(out.map(r => r.replacementCost)).toEqual([250, 1000, 5000]);
    });

    it('sorts by replCost desc (numeric)', () => {
        const out = sortAssets(rows, 'replCost', 'desc');
        expect(out.map(r => r.replacementCost)).toEqual([5000, 1000, 250]);
    });

    it('sorts by installYear asc (numeric)', () => {
        const out = sortAssets(rows, 'installYear', 'asc');
        expect(out.map(r => r.id)).toEqual(['3', '1', '2']);
    });

    it('sorts by discipline asc (string)', () => {
        const out = sortAssets(rows, 'discipline', 'asc');
        expect(out.map(r => r.discipline)).toEqual(['Electrical', 'HVAC', 'Water']);
    });

    it('returns input unchanged when field is null', () => {
        const out = sortAssets(rows, null, 'asc');
        expect(out).toEqual(rows);
    });

    it('does not mutate input', () => {
        const before = JSON.stringify(rows);
        sortAssets(rows, 'name', 'desc');
        expect(JSON.stringify(rows)).toBe(before);
    });

    it('handles null values gracefully (null sorts last in asc)', () => {
        const withNull: Asset[] = [
            { ...rows[0], id: 'a', replacementCost: null as unknown as number },
            { ...rows[1], id: 'b', replacementCost: 5 },
        ];
        const out = sortAssets(withNull, 'replCost', 'asc');
        expect(out.map(r => r.id)).toEqual(['b', 'a']);
    });
});
