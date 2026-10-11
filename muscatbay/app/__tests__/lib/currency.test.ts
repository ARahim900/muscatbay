import { describe, it, expect } from 'vitest';
import { formatOmr, formatOmrRate } from '@/lib/currency';

describe('formatOmr', () => {
    it('always shows 1 decimal with thousands separators', () => {
        expect(formatOmr(12886.301)).toBe('12,886.3');
        expect(formatOmr(1648.5)).toBe('1,648.5');
        expect(formatOmr(259593.84)).toBe('259,593.8');
        expect(formatOmr(42)).toBe('42.0');
    });

    it('keeps a genuine zero as 0.0', () => {
        expect(formatOmr(0)).toBe('0.0');
    });

    it('shows the fallback, never 0.0, when there is no figure', () => {
        expect(formatOmr(null)).toBe('—');
        expect(formatOmr(undefined)).toBe('—');
        expect(formatOmr(Number.NaN)).toBe('—');
        expect(formatOmr(null, 'No reading')).toBe('No reading');
    });
});

describe('formatOmrRate', () => {
    it('keeps a tariff at the precision it was set with — never rounds it to a false 0', () => {
        expect(formatOmrRate(0.025)).toBe('0.025');
        expect(formatOmrRate(1.32)).toBe('1.32');
        expect(formatOmrRate(4.5)).toBe('4.5');
    });
});
