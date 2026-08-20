import { describe, it, expect } from 'vitest';
import {
    UNMONITORED_SECTIONS,
    composeDailyReport,
    composeMonthlyReport,
    reportToCsvRows,
    summarise,
} from '@/lib/monitoring/report';
import { waterDailyExpectations } from '@/lib/monitoring/expectations';
import type { DailyMeterMonth } from '@/lib/monitoring/daily';
import type { SourceStatus } from '@/lib/monitoring/types';
import type { ContractorTracker } from '@/entities/contractor';

const at = (iso: string) => new Date(`${iso}T00:00:00.000Z`);
const NOW = at('2026-08-20');

const okSource = (key: string, rows = 10): SourceStatus => ({ key, label: key, state: 'ok', rows });
const brokenSource = (key: string): SourceStatus =>
    ({ key, label: key, state: 'error', rows: null, message: 'connection reset' });

const everyMeterRead = (): DailyMeterMonth[] =>
    waterDailyExpectations().map((e) => ({
        account: e.account,
        meterName: e.label,
        month: 'Aug-26',
        days: Array.from({ length: 31 }, () => 10),
    }));

const contractors: ContractorTracker[] = [{
    Contractor: 'Gulf Expert', 'Service Provided': 'HVAC', Status: 'Active',
    'Contract Type': 'AMC', 'Start Date': '2024-01-01', 'End Date': '2027-06-01',
    'Contract (OMR)/Month': null, 'Contract Total (OMR)/Year': null,
    'Annual Value (OMR)': null, 'Renewal Plan': null, Note: null,
}];

describe('daily report', () => {
    it('titles the window it actually covers and never includes today', () => {
        const report = composeDailyReport({
            waterRows: everyMeterRead(),
            stpRows: [],
            contractors,
            sources: [okSource('water-daily')],
            now: NOW,
            windowDays: 7,
        });
        expect(report.periodLabel).toBe('13 Aug 2026 – 19 Aug 2026');
        expect(report.days.map((d) => d.getUTCDate())).not.toContain(20);
    });

    it('names every module it does not monitor, so silence is never mistaken for health', () => {
        const report = composeDailyReport({
            waterRows: everyMeterRead(), stpRows: [], contractors,
            sources: [okSource('water-daily')], now: NOW,
        });
        expect(report.unmonitored).toEqual([...UNMONITORED_SECTIONS]);
        expect(report.unmonitored.length).toBeGreaterThan(0);
    });

    it('marks the report partial and excludes unreadable sections from the completeness figure', () => {
        const report = composeDailyReport({
            waterRows: everyMeterRead(),
            stpRows: null,
            contractors,
            sources: [okSource('water-daily'), brokenSource('stp-daily')],
            now: NOW,
            windowDays: 3,
        });
        expect(report.partial).toBe(true);
        // Water is fully read, STP is unknown → completeness reflects water only,
        // rather than being dragged down (or propped up) by a source nobody read.
        expect(report.completeness).toBe(100);
        expect(summarise(report).blindSections).toContain('STP — Daily log');
    });

    it('returns a null completeness — not a zero — when nothing could be assessed', () => {
        const report = composeDailyReport({
            waterRows: null, stpRows: null, contractors: null,
            sources: [brokenSource('water-daily'), brokenSource('stp-daily'), brokenSource('contractors')],
            now: NOW,
        });
        expect(report.completeness).toBeNull();
        expect(summarise(report).completenessLabel).toBe('—');
        expect(report.findings).toHaveLength(0);
    });

    it('keeps the renewal ladder out of the entry-completeness percentage', () => {
        // 14 contracts and 840 meter-days are not the same kind of count;
        // averaging them would produce a number that means nothing.
        const report = composeDailyReport({
            waterRows: everyMeterRead(),
            stpRows: [{ date: '2026-08-19', inlet: 500, tse: 480, tankers: 1 }],
            contractors: [
                ...contractors,
                { ...contractors[0], Contractor: 'No Date Co', 'End Date': null },
            ],
            sources: [okSource('water-daily'), okSource('stp-daily'), okSource('contractors')],
            now: NOW,
            windowDays: 1,
        });
        const renewals = report.sections.find((s) => s.key === 'contractor-renewals')!;
        expect(renewals.excludeFromCompleteness).toBe(true);
        // One contract of two has an unreadable date (50%); water and STP are
        // both complete — so the headline is 100%, not dragged to ~83%.
        expect(renewals.coverage.pct).toBe(50);
        expect(report.completeness).toBe(100);
    });

    it('never assesses a day whose entries are not yet due', () => {
        // A caller asking for a window that runs into today must not produce a
        // "missing" finding for a day still being uploaded.
        const report = composeDailyReport({
            waterRows: [],           // nothing recorded at all
            stpRows: [],
            contractors,
            sources: [okSource('water-daily'), okSource('stp-daily')],
            now: NOW,
            windowDays: 3,
        });
        const periods = report.findings.map((f) => f.period).join(' ');
        expect(periods).not.toContain('2026-08-20');
        expect(report.days.map((d) => d.getUTCDate())).toEqual([17, 18, 19]);
    });

    it('does not attach a negative reading from outside the window to this window', () => {
        const rows = everyMeterRead();
        rows[0].days[4] = -30;   // 5 Aug — real, but eight days before the window
        const report = composeDailyReport({
            waterRows: rows,
            stpRows: [],
            contractors,
            sources: [okSource('water-daily')],
            now: NOW,
            windowDays: 3,       // 17–19 Aug
        });
        expect(report.findings.some((f) => f.confirmed.includes('negative'))).toBe(false);

        rows[0].days[17] = -30;  // 18 Aug — inside the window this time
        const inWindow = composeDailyReport({
            waterRows: rows, stpRows: [], contractors,
            sources: [okSource('water-daily')], now: NOW, windowDays: 3,
        });
        const negative = inWindow.findings.find((f) => f.confirmed.includes('negative'))!;
        expect(negative.period).toBe('2026-08-19');
        expect(negative.affected[0].label).toContain('18 Aug-26');
    });

    it('orders findings most severe first', () => {
        const rows = everyMeterRead();
        rows[0].days[18] = null;   // one meter unread on 19 Aug → high/watch
        const report = composeDailyReport({
            waterRows: rows,
            stpRows: [],            // no STP rows at all → critical
            contractors,
            sources: [okSource('water-daily'), okSource('stp-daily')],
            now: NOW,
            windowDays: 3,
        });
        expect(report.findings[0].severity).toBe('critical');
        const severities = report.findings.map((f) => f.severity);
        const rank = { critical: 0, high: 1, watch: 2, good: 3, nodata: 4 } as const;
        expect(severities.map((s) => rank[s])).toEqual([...severities.map((s) => rank[s])].sort((a, b) => a - b));
    });
});

describe('monthly report', () => {
    it('reports on the newest month whose entries are due, not the current one', () => {
        const report = composeMonthlyReport({
            electricityMeters: [], electricityReadings: [],
            waterMeters: [], derivedMonths: [], contractors,
            sources: [okSource('electricity-monthly')], now: NOW,
        });
        expect(report.monthKey).toBe('Jul-26');
        expect(report.periodLabel).toBe('July 2026');
    });

    it('trends over the requested number of due months, oldest first', () => {
        const report = composeMonthlyReport({
            electricityMeters: [], electricityReadings: [],
            waterMeters: [], derivedMonths: [], contractors,
            sources: [], now: NOW, trendMonths: 3,
        });
        expect(report.trend.map((t) => t.key)).toEqual(['May-26', 'Jun-26', 'Jul-26']);
    });
});

describe('CSV export', () => {
    it('keeps the confirmed issue and the recommended check in separate columns', () => {
        const report = composeDailyReport({
            waterRows: everyMeterRead(), stpRows: [], contractors,
            sources: [okSource('stp-daily')], now: NOW, windowDays: 2,
        });
        const rows = reportToCsvRows(report);
        expect(rows.length).toBeGreaterThan(0);
        expect(Object.keys(rows[0])).toEqual([
            'Period', 'Section', 'Severity', 'Type',
            'Confirmed issue', 'Affected data points', 'Recommended check',
        ]);
        expect(rows[0]['Confirmed issue']).not.toBe(rows[0]['Recommended check']);
        expect(rows[0]['Affected data points']).toContain('[');
    });
});
