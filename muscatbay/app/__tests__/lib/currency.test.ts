import { describe, it, expect } from 'vitest';
import { formatOmr } from '@/lib/currency';

describe('formatOmr', () => {
    it('always shows 3 decimals with thousands separators', () => {
        expect(formatOmr(1648.5)).toBe('1,648.500');
        expect(formatOmr(259593.84)).toBe('259,593.840');
        expect(formatOmr(0.025)).toBe('0.025');
    });

    it('keeps a genuine zero as 0.000', () => {
        expect(formatOmr(0)).toBe('0.000');
    });

    it('shows the fallback, never 0.000, when there is no figure', () => {
        expect(formatOmr(null)).toBe('—');
        expect(formatOmr(undefined)).toBe('—');
        expect(formatOmr(Number.NaN)).toBe('—');
        expect(formatOmr(null, 'No reading')).toBe('No reading');
    });
});
