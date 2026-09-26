import { describe, it, expect } from 'vitest';
import { buildWaterInsight } from '@/components/charts/dashboard-charts';
import type { ChartData } from '@/hooks/useDashboardData';

const complete = (month: string, water: number | null): ChartData => ({ month, water });

describe('buildWaterInsight', () => {
    it('compares the last two complete months', () => {
        const data = [complete('Jul-26', 40), complete('Aug-26', 38)];
        expect(buildWaterInsight(data, 39)).toBe('Aug-26 was 5.0% down on Jul-26; running average is 39.0k m³.');
    });

    it('never compares a month-to-date month with a full one', () => {
        const data: ChartData[] = [
            complete('Jul-26', 40),
            complete('Aug-26', 38),
            { month: 'Sep-26', water: 30, waterThroughDay: 24 },
        ];
        const text = buildWaterInsight(data, 39);
        expect(text).toBe('Sep-26 is month to date (to day 24). Aug-26 was 5.0% down on Jul-26; running average is 39.0k m³.');
        expect(text).not.toMatch(/Sep-26 was/);
    });

    it('skips gap months when finding the comparison pair', () => {
        const data = [complete('Jun-26', 50), complete('Jul-26', null), complete('Aug-26', 50)];
        expect(buildWaterInsight(data, 50)).toBe('Aug-26 was level with Jun-26; running average is 50.0k m³.');
    });

    it('says only that the month is in progress when there is nothing complete to compare', () => {
        const data: ChartData[] = [complete('Aug-26', 38), { month: 'Sep-26', water: 30, waterThroughDay: 24 }];
        expect(buildWaterInsight(data, 38)).toBe('Sep-26 is month to date (to day 24).');
    });
});
