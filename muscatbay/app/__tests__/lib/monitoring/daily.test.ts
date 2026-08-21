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
import { classifyCoverage } from '@/lib/monitoring/coverage';
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

    it('takes the worst day as the section severity, so one lost plant day cannot average away', () => {
        // A twenty-day window with a single unlogged day is 95% complete, which
        // the shared coverage gates call `watch`. But a day of inlet, TSE and
        // tanker figures that was never written cannot be reconstructed later,
        // and the per-day row and `stp-daily-missing` both call that critical —
        // so the section that sits above them has to as well.
        const window20 = dueDayWindow(NOW, 20);
        const missingDay = window20[7];
        const rows = logged(
            window20.filter((d) => d !== missingDay).map((d) => d.toISOString().slice(0, 10)),
        );

        const { stpSection } = evaluateDailyRules({
            days: window20, waterRows: [], stpRows: rows, now: NOW,
        });

        expect(stpSection.coverage.recorded).toBe(19);
        expect(stpSection.coverage.expected).toBe(20);
        // What averaging the window would have concluded…
        expect(classifyCoverage(stpSection.coverage)).toBe('watch');
        // …and what the section actually reports.
        expect(stpSection.severity).toBe('critical');
        expect(stpSection.breakdown.filter((b) => b.severity === 'critical')).toHaveLength(1);
    });

    it('judges "future-dated" on the Muscat calendar the database itself writes by', () => {
        // Asia/Muscat is UTC+4, so between 20:00 and 24:00 UTC the plant is
        // already on the next calendar day. `stp_reject_future_dates`
        // (sql/migrations/20260718_security_hardening_part2.sql) compares
        // against `now() at time zone 'Asia/Muscat'`, so a row dated "today in
        // Muscat" is one the database deliberately accepted — reporting it as
        // impossible would be the monitor inventing a defect.
        const evening = new Date('2026-08-20T21:00:00.000Z'); // 01:00 on 21 Aug in Muscat
        const days = dueDayWindow(evening, 3);                // 17–19 Aug

        const { findings } = evaluateDailyRules({
            days,
            waterRows: [],
            stpRows: logged(['2026-08-17', '2026-08-18', '2026-08-19', '2026-08-21']),
            now: evening,
        });
        expect(findings.some((f) => f.id.startsWith('stp-future-dated'))).toBe(false);
        // …and the accepted row still counts as the newest entry, so the log is
        // not simultaneously reported as stale.
        expect(findings.some((f) => f.id.startsWith('stp-daily-stale'))).toBe(false);

        // A row genuinely beyond the Muscat day is still reported, at that same
        // instant — the gate moved by four hours, it did not switch off.
        const withFuture = evaluateDailyRules({
            days,
            waterRows: [],
            stpRows: logged(['2026-08-17', '2026-08-18', '2026-08-19', '2026-08-21', '2026-08-22']),
            now: evening,
        });
        const future = withFuture.findings.find((f) => f.id.startsWith('stp-future-dated'))!;
        expect(future.affected.map((a) => a.id)).toEqual(['2026-08-22']);
        expect(future.confirmed).toContain('22 Aug 2026');
        expect(future.confirmed).not.toContain('21 Aug 2026');
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

    it('does not count a row that arrived with no figures at all as a logged day', () => {
        // `stp_operations.inlet_sewage`, `tse_for_irrigation` and `tanker_trips`
        // are all nullable and the reader preserves the NULLs. A week of rows
        // carrying nothing but a date must not read as a fully recorded week —
        // the STP page renders those same blanks as 0 m³.
        const blank: StpDayRecord[] = ['2026-08-17', '2026-08-18', '2026-08-19']
            .map((d) => ({ date: d, inlet: null, tse: null, tankers: null }));
        const perDay = evaluateStpDailyCoverage(blank, DAYS);
        expect(perDay.map((d) => d.logged)).toEqual([false, false, false]);
        expect(perDay.map((d) => d.blankRow)).toEqual([true, true, true]);

        const result = evaluateDailyRules({ days: DAYS, waterRows: [], stpRows: blank, now: NOW });
        expect(result.stpSection.coverage.recorded).toBe(0);
        expect(result.stpSection.severity).toBe('critical');

        const blankFinding = result.findings.find((f) => f.id.startsWith('stp-daily-blank'))!;
        expect(blankFinding.confirmed).toContain('inlet, TSE and tanker trips all blank');
        expect(blankFinding.affected.map((a) => a.id)).toEqual(['2026-08-17', '2026-08-18', '2026-08-19']);
        // …and it is not reported as "no row", which would send the operator to
        // the wrong half of the pipeline.
        expect(result.findings.some((f) => f.id.startsWith('stp-daily-missing'))).toBe(false);
    });

    it('reports a row that landed with only some of the day’s figures', () => {
        const rows: StpDayRecord[] = [
            { date: '2026-08-17', inlet: 500, tse: 480, tankers: 2 },
            { date: '2026-08-18', inlet: 500, tse: null, tankers: 2 },
            { date: '2026-08-19', inlet: 500, tse: 480, tankers: 2 },
        ];
        const { findings } = evaluateDailyRules({ days: DAYS, waterRows: [], stpRows: rows, now: NOW });
        const partial = findings.find((f) => f.id.startsWith('stp-daily-partial'))!;
        expect(partial.severity).toBe('watch');
        expect(partial.confirmed).toContain('18 Aug 2026 · no TSE');
        expect(partial.confirmed).toContain('rendered as 0 m³');
        // The day still counts as recorded — something was written for it.
        expect(evaluateStpDailyCoverage(rows, DAYS).every((d) => d.logged)).toBe(true);
    });

    it('does not attach a partially-blank row from outside the window to this window', () => {
        const rows: StpDayRecord[] = [
            { date: '2026-07-02', inlet: 500, tse: null, tankers: 2 },
            ...logged(['2026-08-17', '2026-08-18', '2026-08-19']),
        ];
        const { findings } = evaluateDailyRules({ days: DAYS, waterRows: [], stpRows: rows, now: NOW });
        expect(findings.some((f) => f.id.startsWith('stp-daily-partial'))).toBe(false);
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

    it('never asserts the plant was reporting from a row that arrived blank', () => {
        const rows = everyMeterRead();
        rows[0].days[17] = null; // 18 Aug, one meter unread
        const { perDay } = evaluateWaterDailyCoverage(rows, DAYS);
        const stp = evaluateStpDailyCoverage(
            [{ date: '2026-08-18', inlet: null, tse: null, tankers: null }],
            DAYS,
        );
        expect(evaluateDailyCrossChecks(perDay, stp, rows)).toHaveLength(0);
    });

    it('never runs when either source failed to load', () => {
        const result = evaluateDailyRules({ days: DAYS, waterRows: everyMeterRead(), stpRows: null, now: NOW });
        expect(result.findings.some((f) => f.kind === 'cross-check')).toBe(false);
    });
});
