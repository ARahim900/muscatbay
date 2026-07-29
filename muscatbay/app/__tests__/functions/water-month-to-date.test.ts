import { describe, it, expect } from 'vitest';
import { monthToDateFromDailyRow } from '@/functions/api/water';

/**
 * The Monthly view derives the current month from the daily readings while the
 * official monthly import is pending (it lands a few days into the NEXT month
 * — June 2026's rows were created on 3–4 July). These tests pin the rollup's
 * data-honesty rules: nulls are skipped rather than counted as zero, an unread
 * meter yields `null` (never a confident 0), and negative readings keep their
 * sign so the caller can flag them.
 */

type Row = { account_number: string; month: string } & Record<string, number | string | null>;

const row = (days: Record<string, number | string | null>): Row => ({
    account_number: '4300001',
    month: 'Jul-26',
    ...days,
});

describe('monthToDateFromDailyRow', () => {
    it('sums the days that have readings and reports the latest day read', () => {
        const { value, lastDay } = monthToDateFromDailyRow(
            row({ day_1: 10, day_2: 12.5, day_3: null, day_28: 7 }),
        );
        expect(value).toBe(29.5);
        expect(lastDay).toBe(28);
    });

    it('returns null — not zero — when the meter has no readings at all', () => {
        const { value, lastDay } = monthToDateFromDailyRow(row({ day_1: null, day_15: null }));
        expect(value).toBeNull();
        expect(lastDay).toBe(0);
    });

    it('treats a recorded zero as a real reading, distinct from "not read"', () => {
        const { value, lastDay } = monthToDateFromDailyRow(row({ day_1: 0 }));
        expect(value).toBe(0);
        expect(lastDay).toBe(1);
    });

    it('keeps negative readings negative so the caller can flag them', () => {
        const { value } = monthToDateFromDailyRow(row({ day_1: 5, day_2: -8 }));
        expect(value).toBe(-3);
    });

    it('accepts Postgres numeric strings, as PostgREST serialises them', () => {
        const { value, lastDay } = monthToDateFromDailyRow(row({ day_1: '3.25', day_9: '1.75' }));
        expect(value).toBe(5);
        expect(lastDay).toBe(9);
    });
});
