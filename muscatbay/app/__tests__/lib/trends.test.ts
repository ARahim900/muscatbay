import { describe, it, expect } from 'vitest';
import { calcTrend, describeTrend, NO_BASELINE } from '@/lib/trends';

describe('calcTrend — the ONE monthly-change calculation', () => {
    it('reports an increase with one decimal', () => {
        expect(calcTrend(112.4, 100)).toEqual({ trend: 'up', trendValue: '12.4%' });
    });

    it('reports a decrease with one decimal', () => {
        expect(calcTrend(88, 100)).toEqual({ trend: 'down', trendValue: '12.0%' });
    });

    it('treats sub-0.5% movement as neutral noise (~0%)', () => {
        expect(calcTrend(100.4, 100)).toEqual({ trend: 'neutral', trendValue: '~0%' });
        expect(calcTrend(99.6, 100)).toEqual({ trend: 'neutral', trendValue: '~0%' });
    });

    it('never claims a change against a missing/zero baseline', () => {
        expect(calcTrend(500, 0)).toEqual(NO_BASELINE);
        expect(calcTrend(500, null)).toEqual(NO_BASELINE);
        expect(calcTrend(500, undefined)).toEqual(NO_BASELINE);
        expect(calcTrend(500, NaN)).toEqual(NO_BASELINE);
    });

    it('guards a non-finite current value', () => {
        expect(calcTrend(NaN, 100)).toEqual(NO_BASELINE);
    });
});

describe('describeTrend', () => {
    it('describes movement directionally', () => {
        expect(describeTrend({ trend: 'up', trendValue: '3.2%' })).toBe('Up 3.2% vs prev month');
        expect(describeTrend({ trend: 'down', trendValue: '3.2%' })).toBe('Down 3.2% vs prev month');
    });

    it('distinguishes "stable" from "no baseline"', () => {
        expect(describeTrend({ trend: 'neutral', trendValue: '~0%' })).toBe('Stable vs previous month');
        expect(describeTrend({ trend: 'neutral', trendValue: '—' })).toBe('No prior month to compare');
    });
});
