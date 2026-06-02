import { describe, it, expect, vi } from 'vitest';
import { findLatestMonthWithData } from '@/lib/water-data';

// Chronological, oldest → newest (same shape getDynamicMonths() returns).
const MONTHS = ['Jan-26', 'Feb-26', 'Mar-26', 'Apr-26', 'May-26', 'Jun-26'];

describe('findLatestMonthWithData', () => {
    it('returns the newest month that has data, skipping empty newer months', async () => {
        // Jun-26 empty, May-26 has data → should resolve to May-26.
        const hasData = vi.fn(async (m: string) => m !== 'Jun-26');
        const result = await findLatestMonthWithData(MONTHS, hasData);
        expect(result).toBe('May-26');
        // Probes newest-first and stops at the first hit (Jun then May only).
        expect(hasData).toHaveBeenCalledTimes(2);
        expect(hasData).toHaveBeenNthCalledWith(1, 'Jun-26');
        expect(hasData).toHaveBeenNthCalledWith(2, 'May-26');
    });

    it('returns the newest month when the latest month already has data', async () => {
        const hasData = vi.fn(async () => true);
        const result = await findLatestMonthWithData(MONTHS, hasData);
        expect(result).toBe('Jun-26');
        expect(hasData).toHaveBeenCalledTimes(1);
    });

    it('returns null when no probed month has data', async () => {
        const hasData = vi.fn(async () => false);
        const result = await findLatestMonthWithData(MONTHS, hasData);
        expect(result).toBeNull();
    });

    it('caps the number of probes (does not scan unbounded history)', async () => {
        const many = Array.from({ length: 40 }, (_, i) => `M${i}`);
        const hasData = vi.fn(async () => false);
        await findLatestMonthWithData(many, hasData, 18);
        expect(hasData).toHaveBeenCalledTimes(18);
    });

    it('stops probing as soon as data is found (no wasted calls)', async () => {
        const hasData = vi.fn(async (m: string) => m === 'Mar-26');
        const result = await findLatestMonthWithData(MONTHS, hasData);
        expect(result).toBe('Mar-26');
        // Jun, May, Apr, Mar = 4 probes, then stop.
        expect(hasData).toHaveBeenCalledTimes(4);
    });
});
