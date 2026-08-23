import { describe, it, expect } from 'vitest';
import {
    daysUntil,
    formatContractDate,
    parseContractDate,
    textConfirmsDate,
} from '@/lib/contract-dates';

/** `yyyy-mm-dd` of a parsed date, or the literal 'null' when unreadable. */
const read = (raw: string | null | undefined): string => {
    const date = parseContractDate(raw);
    return date ? date.toISOString().slice(0, 10) : 'null';
};

describe('parseContractDate — month-first numeric', () => {
    // Every string here is a real value from Contractor_Tracker. 18 of the
    // column's 34 slash dates have a second component above 12, which no
    // day-first reading can produce; none has a first component above 12.
    it('reads the register month-first, including days no month could hold', () => {
        expect(read('12/31/2027')).toBe('2027-12-31'); // KONE Assarain
        expect(read('10/31/2027')).toBe('2027-10-31'); // Bahwan Engineering
        expect(read('8/31/2030')).toBe('2030-08-31');  // Al Khalili
        expect(read('6/30/2028')).toBe('2028-06-30');  // Muna Noor
        expect(read('2/28/2025')).toBe('2025-02-28');  // COMO
        expect(read('1/25/2029')).toBe('2029-01-25');  // OWATCO
    });

    it('reads a value that both conventions could accept as month-first', () => {
        // Gulf Expert stores 6/3/2026 → 6/2/2028; the row's own note reads
        // "latest term 3 Jun 2026 – 2 Jun 2028", and amc_contractor_summary
        // holds 03-Jun-2026 / 02-Jun-2028. Month-first matches both.
        expect(read('6/3/2026')).toBe('2026-06-03');
        expect(read('6/2/2028')).toBe('2028-06-02');
        // Muscat Electronics: note says "AMC expired 2 Jun 2026".
        expect(read('6/2/2026')).toBe('2026-06-02');
        // National Marine: 11/6/2024 → 11/5/2026 is exactly two years.
        expect(read('11/6/2024')).toBe('2024-11-06');
        expect(read('11/5/2026')).toBe('2026-11-05');
    });

    it('applies the same ordering to a dash-separated all-numeric date', () => {
        expect(read('6-30-2028')).toBe('2028-06-30');
    });

    it('does not accept a mixed pair of separators', () => {
        expect(read('6-30/2028')).toBe('null');
    });
});

describe('parseContractDate — ISO', () => {
    it('reads ISO first, with or without a time component', () => {
        expect(read('2026-06-30')).toBe('2026-06-30');
        expect(read('2026-06-30T00:00:00.000Z')).toBe('2026-06-30');
        expect(read('2026-06-30 09:15:00')).toBe('2026-06-30');
    });
});

describe('parseContractDate — named months', () => {
    // amc_contractor_summary and amc_contractor_expiry hold only this shape;
    // the renewals tab reads them through the very same function.
    it('reads the dd-MMM-yyyy values the AMC tables actually store', () => {
        expect(read('02-Jun-2028')).toBe('2028-06-02');
        expect(read('30-Jun-2028')).toBe('2028-06-30');
        expect(read('03-Jun-2026')).toBe('2026-06-03');
    });

    it('reads the other named-month spellings', () => {
        expect(read('2 Jun 2028')).toBe('2028-06-02');
        expect(read('2 June 2028')).toBe('2028-06-02');
        expect(read('2-September-2028')).toBe('2028-09-02');
        expect(read('Jun 2, 2028')).toBe('2028-06-02');
        expect(read('June 2, 2028')).toBe('2028-06-02');
        expect(read('Sept 2, 2028')).toBe('2028-09-02');
    });

    it('does not treat a word that merely starts like a month as one', () => {
        expect(read('2 Junk 2028')).toBe('null');
        expect(read('2 Ma 2028')).toBe('null'); // too short to be unambiguous
    });
});

describe('parseContractDate — what it refuses to guess', () => {
    it('returns null rather than a wrong date', () => {
        expect(read(null)).toBe('null');
        expect(read(undefined)).toBe('null');
        expect(read('')).toBe('null');
        expect(read('   ')).toBe('null');
        expect(read('Schedule of rates')).toBe('null');
        expect(read('TBC')).toBe('null');
        expect(read('when the job is done')).toBe('null');
    });

    it('rejects components that would silently roll over', () => {
        expect(read('13/40/2026')).toBe('null'); // month 13, day 40
        expect(read('13/4/2026')).toBe('null');  // day-first value in a month-first column
        expect(read('2/30/2025')).toBe('null');  // February has no 30th
        expect(read('2/29/2025')).toBe('null');  // 2025 is not a leap year
        expect(read('2/29/2028')).toBe('2028-02-29');
    });

    it('reports a dotted date as unreadable instead of picking a convention', () => {
        // No source table holds one, so there is nothing to disambiguate it
        // against: European reading or this register's reading are equally
        // plausible, and a wrong date is worse than a missing one.
        expect(read('31.12.2027')).toBe('null');
        expect(read('3.4.2027')).toBe('null');
    });

    it('requires a four-digit year', () => {
        expect(read('6/30/28')).toBe('null');
    });
});

describe('daysUntil', () => {
    it('counts whole days between UTC midnights', () => {
        expect(daysUntil(parseContractDate('11/5/2026')!, new Date(Date.UTC(2026, 7, 20)))).toBe(77);
        expect(daysUntil(parseContractDate('6/2/2026')!, new Date(Date.UTC(2026, 7, 20)))).toBe(-79);
        expect(daysUntil(parseContractDate('2026-08-20')!, new Date(Date.UTC(2026, 7, 20)))).toBe(0);
    });

    it('does not drift with the time of day the comparison is made', () => {
        const end = parseContractDate('12/31/2027')!;
        const morning = daysUntil(end, new Date(Date.UTC(2026, 7, 20, 0, 1)));
        const night = daysUntil(end, new Date(Date.UTC(2026, 7, 20, 23, 59)));
        expect(morning).toBe(night);
    });
});

describe('formatContractDate', () => {
    it('renders in UTC so it never shows the neighbouring day', () => {
        expect(formatContractDate(parseContractDate('12/31/2027')!)).toBe('31 Dec 2027');
        expect(formatContractDate(parseContractDate('6/2/2028')!)).toBe('02 Jun 2028');
    });
});

describe('textConfirmsDate', () => {
    const end = parseContractDate('6/2/2028')!;

    it('accepts a note that writes the date out unambiguously', () => {
        // Gulf Expert's real note.
        expect(textConfirmsDate('Third consecutive annual renewal; latest term 3 Jun 2026 – 2 Jun 2028.', end)).toBe(true);
        expect(textConfirmsDate('ends 02-Jun-2028', end)).toBe(true);
        expect(textConfirmsDate('ends 2 June 2028', end)).toBe(true);
        expect(textConfirmsDate('ends 2028-06-02', end)).toBe(true);
    });

    it('does not accept the ambiguous numeric form as its own corroboration', () => {
        expect(textConfirmsDate('ends 6/2/2028', end)).toBe(false);
    });

    it('does not match a different day that merely ends in the same digits', () => {
        expect(textConfirmsDate('ends 12 Jun 2028', end)).toBe(false);
    });

    it('is false for a note with no date, or no note at all', () => {
        expect(textConfirmsDate('New contract overlapping with COMO', end)).toBe(false);
        expect(textConfirmsDate(null, end)).toBe(false);
        expect(textConfirmsDate('', end)).toBe(false);
    });
});
