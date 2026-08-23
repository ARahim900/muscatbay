import { describe, it, expect } from 'vitest';
import {
    consumptionKey,
    daysInMonth,
    dueDayWindow,
    dueMonthWindow,
    formatDay,
    isDayDue,
    isMonthDue,
    newestDueDay,
    newestDueMonth,
    parseConsumptionKey,
} from '@/lib/monitoring/calendar';

const at = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

describe('daily due arithmetic', () => {
    it('treats yesterday as the newest due day — today is still being uploaded', () => {
        expect(formatDay(newestDueDay(at('2026-08-20')))).toBe('19 Aug 2026');
        expect(isDayDue(at('2026-08-20'), at('2026-08-20'))).toBe(false);
        expect(isDayDue(at('2026-08-19'), at('2026-08-20'))).toBe(true);
    });

    it('stays correct at a late hour of the day (UTC midnight anchoring)', () => {
        const lateEvening = new Date('2026-08-20T23:45:00.000Z');
        expect(formatDay(newestDueDay(lateEvening))).toBe('19 Aug 2026');
    });

    it('returns the window oldest-first, ending at the newest due day', () => {
        const days = dueDayWindow(at('2026-08-20'), 7);
        expect(days).toHaveLength(7);
        expect(formatDay(days[0])).toBe('13 Aug 2026');
        expect(formatDay(days[6])).toBe('19 Aug 2026');
    });

    it('crosses a month boundary without skipping days', () => {
        const days = dueDayWindow(at('2026-09-03'), 7);
        expect(days.map(formatDay)).toEqual([
            '27 Aug 2026', '28 Aug 2026', '29 Aug 2026', '30 Aug 2026',
            '31 Aug 2026', '1 Sep 2026', '2 Sep 2026',
        ]);
    });

    it('clamps a nonsensical window to one day rather than returning nothing', () => {
        expect(dueDayWindow(at('2026-08-20'), 0)).toHaveLength(1);
        expect(dueDayWindow(at('2026-08-20'), -5)).toHaveLength(1);
    });
});

describe('monthly due arithmetic', () => {
    it('holds a just-closed month inside its import grace window', () => {
        // 3 Aug: July closed 3 days ago, still inside the 5-day import window.
        expect(isMonthDue(2026, 6, at('2026-08-03'))).toBe(false);
        expect(newestDueMonth(at('2026-08-03')).key).toBe('Jun-26');
        // 6 Aug: the window has passed, July is now due.
        expect(isMonthDue(2026, 6, at('2026-08-06'))).toBe(true);
        expect(newestDueMonth(at('2026-08-06')).key).toBe('Jul-26');
    });

    it('never reports the current month as due', () => {
        expect(isMonthDue(2026, 7, at('2026-08-20'))).toBe(false);
        expect(newestDueMonth(at('2026-08-20')).key).toBe('Jul-26');
    });

    it('walks back across a year boundary', () => {
        expect(newestDueMonth(at('2027-01-02')).key).toBe('Nov-26');
        expect(newestDueMonth(at('2027-01-08')).key).toBe('Dec-26');
    });

    it('builds a trend window oldest-first across a year boundary', () => {
        expect(dueMonthWindow(at('2027-01-08'), 3).map((m) => m.key)).toEqual(['Oct-26', 'Nov-26', 'Dec-26']);
    });

    it('carries the right day count, including a leap February', () => {
        expect(daysInMonth(2026, 1)).toBe(28);
        expect(daysInMonth(2028, 1)).toBe(29);
        expect(newestDueMonth(at('2026-08-20')).days).toBe(31);
    });
});

describe('consumption keys', () => {
    it('round-trips a Mon-YY key', () => {
        expect(consumptionKey(2026, 7)).toBe('Aug-26');
        expect(parseConsumptionKey('Aug-26')).toEqual({ year: 2026, monthIndex: 7 });
    });

    it('rejects a key it cannot read instead of guessing', () => {
        expect(parseConsumptionKey('Augu-2026')).toBeNull();
        expect(parseConsumptionKey('')).toBeNull();
    });
});
