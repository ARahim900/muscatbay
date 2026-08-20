import { describe, it, expect } from 'vitest';
import {
    evaluateElectricityMonth,
    evaluateMonthlyRules,
    evaluateWaterMonth,
    type ElectricityMeterRef,
    type ElectricityReadingRef,
    type WaterMeterRef,
} from '@/lib/monitoring/monthly';
import { dueMonthWindow, newestDueMonth } from '@/lib/monitoring/calendar';

const at = (iso: string) => new Date(`${iso}T00:00:00.000Z`);
const NOW = at('2026-08-20');
const JULY = newestDueMonth(NOW); // Jul-26
const MONTHS = dueMonthWindow(NOW, 2); // Jun-26, Jul-26

const meters: ElectricityMeterRef[] = [
    { id: 'm1', name: 'Pumping Station 01', accountNumber: 'R52330', type: 'PS' },
    { id: 'm2', name: 'Apartment D45', accountNumber: 'R53705', type: 'D_Building' },
    { id: 'm3', name: 'Street Light FP-01', accountNumber: 'R54672', type: 'Street Light' },
];

const reading = (meterId: string, month: string, consumption: number | null): ElectricityReadingRef =>
    ({ meterId, month, consumption });

describe('electricity monthly coverage', () => {
    it('counts a meter with no row at all as missing', () => {
        const result = evaluateElectricityMonth(meters, [
            reading('m1', JULY.key, 1200),
            reading('m2', JULY.key, 340),
        ], JULY);
        expect(result.recorded).toBe(2);
        expect(result.missing.map((m) => m.id)).toEqual(['m3']);
        expect(result.notInService).toHaveLength(0);
    });

    it('treats a blank consumption as "not in service", the documented sheet rule — not as a gap', () => {
        const result = evaluateElectricityMonth(meters, [
            reading('m1', JULY.key, 1200),
            reading('m2', JULY.key, 340),
            reading('m3', JULY.key, null),
        ], JULY);
        expect(result.missing).toHaveLength(0);
        expect(result.notInService.map((m) => m.id)).toEqual(['m3']);
    });

    it('ignores readings that belong to another month', () => {
        const result = evaluateElectricityMonth(meters, [
            reading('m1', 'Jun-26', 900),
            reading('m2', 'Jun-26', 900),
            reading('m3', 'Jun-26', 900),
        ], JULY);
        expect(result.recorded).toBe(0);
        expect(result.missing).toHaveLength(3);
    });

    it('reports duplicates and negatives as integrity problems', () => {
        const result = evaluateElectricityMonth(meters, [
            reading('m1', JULY.key, 1200),
            reading('m1', JULY.key, 1200),
            reading('m2', JULY.key, -50),
            reading('m3', JULY.key, 10),
        ], JULY);
        expect(result.duplicates.map((d) => d.meter.id)).toEqual(['m1']);
        expect(result.negatives.map((n) => n.value)).toEqual([-50]);
    });

    it('quotes the shortfall and its effect on the totals in the finding', () => {
        const { findings } = evaluateMonthlyRules({
            months: MONTHS,
            electricityMeters: meters,
            electricityReadings: [reading('m1', JULY.key, 1200)],
            waterMeters: null,
            derivedMonths: [],
            now: NOW,
        });
        const missing = findings.find((f) => f.id.startsWith('electricity-monthly-missing'))!;
        expect(missing.severity).toBe('critical');
        expect(missing.confirmed).toContain('2 meters have no reading row');
        expect(missing.confirmed).toContain('understated by an unknown amount');
        expect(missing.affected.map((a) => a.id)).toEqual(['R53705', 'R54672']);
    });

    it('says "unknown", not "healthy", when the source could not be read', () => {
        const { electricitySection, findings } = evaluateMonthlyRules({
            months: MONTHS,
            electricityMeters: null,
            electricityReadings: null,
            waterMeters: null,
            derivedMonths: [],
            now: NOW,
        });
        expect(electricitySection.severity).toBe('nodata');
        expect(electricitySection.unavailable).toContain('not confirmed healthy');
        expect(findings).toHaveLength(0);
    });
});

describe('water monthly coverage', () => {
    const waterMeters: WaterMeterRef[] = [
        { account: 'C43659', label: 'Main Bulk (NAMA)', level: 'L1', consumption: { 'Jul-26': 40000 } },
        { account: '4300343', label: 'Zone 3A bulk', level: 'L2', consumption: { 'Jul-26': null } },
        { account: '4300002', label: 'Z3-42 Villa', level: 'L3', consumption: {} },
    ];

    it('separates "no row" from "row present but blank"', () => {
        const result = evaluateWaterMonth(waterMeters, JULY, []);
        expect(result.recorded).toBe(1);
        expect(result.blank.map((m) => m.account)).toEqual(['4300343']);
        expect(result.missing.map((m) => m.account)).toEqual(['4300002']);
    });

    it('flags a month shown as month-to-date daily sums rather than billing reads', () => {
        const result = evaluateWaterMonth(waterMeters, JULY, [JULY.key]);
        expect(result.derived).toBe(true);

        const { findings, waterSection } = evaluateMonthlyRules({
            months: [JULY],
            electricityMeters: null,
            electricityReadings: null,
            waterMeters,
            derivedMonths: [JULY.key],
            now: NOW,
        });
        const provenance = findings.find((f) => f.kind === 'provenance')!;
        expect(provenance.confirmed).toContain('not the official billing figures');
        expect(provenance.recommendation).toContain('provisional');
        expect(waterSection.headline).toContain('month-to-date');
    });

    it('explains why a missing child read matters to the loss figure', () => {
        const { findings } = evaluateMonthlyRules({
            months: [JULY],
            electricityMeters: null,
            electricityReadings: null,
            waterMeters,
            derivedMonths: [],
            now: NOW,
        });
        const missing = findings.find((f) => f.id.startsWith('water-monthly-missing'))!;
        expect(missing.confirmed).toContain('inflates the apparent loss');
        expect(missing.affected[0].label).toContain('(L3)');
    });

    it('reports a blank monthly row as a delivery failure, not a zero-consumption month', () => {
        const { findings } = evaluateMonthlyRules({
            months: [JULY],
            electricityMeters: null,
            electricityReadings: null,
            waterMeters,
            derivedMonths: [],
            now: NOW,
        });
        const blank = findings.find((f) => f.id.startsWith('water-monthly-blank'))!;
        expect(blank.recommendation).toContain('not a zero-consumption month');
    });
});
