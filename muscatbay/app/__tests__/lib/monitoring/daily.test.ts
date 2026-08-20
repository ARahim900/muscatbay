import { describe, it, expect } from 'vitest';
import {
    evaluateDailyCrossChecks,
    evaluateDailyRules,
    evaluateStpDailyCoverage,
    evaluateWaterDailyCoverage,
    type DailyMeterMonth,
    type StpDayRecord,
} from '@/lib/monitoring/daily';
import { dueDayWindow } from '@/lib/monitoring/calendar';
import { waterDailyExpectations } from '@/lib/monitoring/expectations';
import { MAIN_BULK_ACCOUNT } from '@/lib/water-accounts';

const at = (iso: string) => new Date(`${iso}T00:00:00.000Z`);
const NOW = at('2026-08-20');
const DAYS = dueDayWindow(NOW, 3); // 17, 18, 19 Aug

/** A fully-read August row for one account. */
function fullMonth(account: string, meterName = ''): DailyMeterMonth {
    return { account, meterName, month: 'Aug-26', days: Array.from({ length: 31 }, () => 10) };
}

/** Every expected meter reading 10 m³ every day of August. */
function everyMeterRead(): DailyMeterMonth[] {
    return waterDailyExpectations().map((e) => fullMonth(e.account, e.label));
}

describe('water daily coverage', () => {
    it('reports a fully-read window as complete with nothing missing', () => {
        const { perDay } = evaluateWaterDailyCoverage(everyMeterRead(), DAYS);
        expect(perDay).toHaveLength(3);
        expect(perDay.every((d) => d.misses.length === 0)).toBe(true);
        expect(perDay.every((d) => d.severity === 'good')).toBe(true);
    });

    it('separates "no row for the month" from "row present, day blank"', () => {
        const rows = everyMeterRead();
        // Drop one meter's row entirely…
        const dropped = rows[rows.length - 1].account;
        rows.pop();
        // …and blank a single day on another.
        const blanked = rows[rows.length - 1];
        blanked.days[17] = null; // 18 Aug

        const { perDay } = evaluateWaterDailyCoverage(rows, DAYS);
        const day18 = perDay.find((d) => d.iso === '2026-08-18')!;
        const reasons = new Map(day18.misses.map((m) => [m.expectation.account, m.reason]));
        expect(reasons.get(dropped)).toBe('no-row');
        expect(reasons.get(blanked.account)).toBe('blank-day');
    });

    it('treats a genuine zero reading as recorded, not missing', () => {
        const rows = everyMeterRead();
        rows[0].days[17] = 0;
        const { perDay } = evaluateWaterDailyCoverage(rows, DAYS);
        const day18 = perDay.find((d) => d.iso === '2026-08-18')!;
        expect(day18.misses).toHaveLength(0);
    });

    it('escalates a missing main bulk to critical even at 99% coverage', () => {
        const rows = everyMeterRead().filter((r) => r.account !== MAIN_BULK_ACCOUNT);
        const { perDay } = evaluateWaterDailyCoverage(rows, DAYS);
        expect(perDay.every((d) => d.blockingMisses.length === 1)).toBe(true);
        expect(perDay.every((d) => d.severity === 'critical')).toBe(true);
    });

    it('names the blocking meter first in the finding and says the balance is not computable', () => {
        const rows = everyMeterRead().filter((r) => r.account !== MAIN_BULK_ACCOUNT);
        const { findings } = evaluateDailyRules({ days: DAYS, waterRows: rows, stpRows: [], now: NOW });
        const finding = findings.find((f) => f.id === 'water-daily-missing:2026-08-19')!;
        expect(finding.severity).toBe('critical');
        expect(finding.confirmed).toContain('Main Bulk (NAMA)');
        expect(finding.confirmed).toContain('cannot be computed');
        expect(finding.affected.some((a) => a.id === MAIN_BULK_ACCOUNT)).toBe(true);
    });

    it('reports a negative daily reading rather than clamping it away', () => {
        const rows = everyMeterRead();
        rows[0].days[17] = -42;
        const { findings } = evaluateDailyRules({ days: DAYS, waterRows: rows, stpRows: [], now: NOW });
        const negative = findings.find((f) => f.kind === 'integrity' && f.confirmed.includes('negative'))!;
        expect(negative).toBeDefined();
        expect(negative.confirmed).toContain('physically impossible');
    });

    it('flags an account that reports data but is not in the reading register', () => {
        const rows = [...everyMeterRead(), fullMonth('9999999', 'Ghost meter')];
        const { findings } = evaluateDailyRules({ days: DAYS, waterRows: rows, stpRows: [], now: NOW });
        const unregistered = findings.find((f) => f.id.startsWith('water-daily-unregistered'))!;
        expect(unregistered.affected.map((a) => a.id)).toContain('9999999');
    });

    it('says "unknown", not "healthy", when the source could not be read', () => {
        const result = evaluateDailyRules({ days: DAYS, waterRows: null, stpRows: [], now: NOW });
        expect(result.waterSection.severity).toBe('nodata');
        expect(result.waterSection.unavailable).toContain('not confirmed healthy');
        expect(result.findings.filter((f) => f.section.startsWith('Water'))).toHaveLength(0);
    });
});

describe('STP daily log coverage', () => {
    const logged = (isoDays: string[]): StpDayRecord[] =>
        isoDays.map((d) => ({ date: d, inlet: 500, tse: 480, tankers: 2 }));

    it('marks every due day with no operations row', () => {
        const perDay = evaluateStpDailyCoverage(logged(['2026-08-17', '2026-08-19']), DAYS);
        expect(perDay.map((d) => d.logged)).toEqual([true, false, true]);
    });

    it('raises the missing days as one critical finding naming each date', () => {
        const { findings } = evaluateDailyRules({
            days: DAYS,
            waterRows: [],
            stpRows: logged(['2026-08-17']),
            now: NOW,
        });
        const missing = findings.find((f) => f.id.startsWith('stp-daily-missing'))!;
        expect(missing.severity).toBe('critical');
        expect(missing.affected.map((a) => a.id)).toEqual(['2026-08-18', '2026-08-19']);
    });

    it('reports a stale log past the staleness gate', () => {
        const { findings } = evaluateDailyRules({
            days: DAYS,
            waterRows: [],
            stpRows: logged(['2026-08-10']),
            now: NOW,
        });
        const stale = findings.find((f) => f.id.startsWith('stp-daily-stale'))!;
        expect(stale.confirmed).toContain('10 days behind');
    });

    it('reports a future-dated row instead of silently dropping it', () => {
        const { findings } = evaluateDailyRules({
            days: DAYS,
            waterRows: [],
            stpRows: logged(['2026-08-17', '2026-08-18', '2026-08-19', '2027-05-06']),
            now: NOW,
        });
        const future = findings.find((f) => f.id.startsWith('stp-future-dated'))!;
        expect(future.confirmed).toContain('6 May 2027');
        // …and a future row must not be mistaken for the newest log entry.
        expect(findings.some((f) => f.id.startsWith('stp-daily-stale'))).toBe(false);
    });

    it('reports duplicate rows for the same date', () => {
        const { findings } = evaluateDailyRules({
            days: DAYS,
            waterRows: [],
            stpRows: logged(['2026-08-17', '2026-08-18', '2026-08-19', '2026-08-19']),
            now: NOW,
        });
        const duplicate = findings.find((f) => f.id.startsWith('stp-duplicate-days'))!;
        expect(duplicate.confirmed).toContain('2026-08-19 ×2');
    });

    it('reports rows whose date cannot be read at all', () => {
        const { findings } = evaluateDailyRules({
            days: DAYS,
            waterRows: [],
            stpRows: [...logged(['2026-08-17', '2026-08-18', '2026-08-19']), { date: 'not a date', inlet: 1, tse: 1, tankers: 0 }],
            now: NOW,
        });
        const invalid = findings.find((f) => f.id.startsWith('stp-unparseable-dates'))!;
        expect(invalid.confirmed).toContain('cannot be read');
        expect(invalid.recommendation).toContain('silently invisible');
    });
});

describe('cross-check — STP filed, water meters not', () => {
    it('raises the owner’s worked example', () => {
        const rows = everyMeterRead();
        rows[0].days[17] = null; // 18 Aug, one meter unread
        const { perDay } = evaluateWaterDailyCoverage(rows, DAYS);
        const stp = evaluateStpDailyCoverage(
            [{ date: '2026-08-18', inlet: 500, tse: 480, tankers: 1 }],
            DAYS,
        );

        const findings = evaluateDailyCrossChecks(perDay, stp, rows);
        expect(findings).toHaveLength(1);
        expect(findings[0].confirmed).toContain('the STP daily report was submitted');
        expect(findings[0].confirmed).toContain('1 of');
        expect(findings[0].recommendation).toContain('the gap is on the water side');
    });

    it('stays silent on a day the STP report was not filed either', () => {
        const rows = everyMeterRead();
        rows[0].days[17] = null;
        const { perDay } = evaluateWaterDailyCoverage(rows, DAYS);
        const stp = evaluateStpDailyCoverage([], DAYS);
        expect(evaluateDailyCrossChecks(perDay, stp, rows)).toHaveLength(0);
    });

    it('never runs when either source failed to load', () => {
        const result = evaluateDailyRules({ days: DAYS, waterRows: everyMeterRead(), stpRows: null, now: NOW });
        expect(result.findings.some((f) => f.kind === 'cross-check')).toBe(false);
    });
});
