import { describe, it, expect, afterEach } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MonitoringReportView } from '@/components/monitoring/report-view';
import { composeDailyReport } from '@/lib/monitoring/report';
import { waterDailyExpectations } from '@/lib/monitoring/expectations';
import type { HeatColumn } from '@/components/shared/inspection';
import type { DailyMeterMonth } from '@/lib/monitoring/daily';
import type { SourceStatus } from '@/lib/monitoring/types';
import type { ContractorTracker } from '@/entities/contractor';

/**
 * The heatmap is the surface that answers "when did this start?", and a cell is
 * the only place the report says "not assessed". Both assertions below are
 * about that word meaning what it says.
 */

const NOW = new Date('2026-08-20T00:00:00.000Z');

const okSource = (key: string): SourceStatus => ({ key, label: key, state: 'ok', rows: 10 });

const everyMeterRead = (): DailyMeterMonth[] =>
    waterDailyExpectations().map((e) => ({
        account: e.account,
        meterName: e.label,
        month: 'Aug-26',
        days: Array.from({ length: 31 }, () => 10),
    }));

/** One contract already past its end date — a renewal section with a breakdown. */
const contractors: ContractorTracker[] = [{
    Contractor: 'Gulf Expert', 'Service Provided': 'HVAC', Status: 'Active',
    'Contract Type': 'AMC', 'Start Date': '2024-01-01', 'End Date': '2026-07-01',
    'Contract (OMR)/Month': null, 'Contract Total (OMR)/Year': null,
    'Annual Value (OMR)': null, 'Renewal Plan': null, Note: null,
}];

function renderDaily() {
    const report = composeDailyReport({
        waterRows: everyMeterRead(),
        stpRows: [],
        contractors,
        sources: [okSource('water-daily'), okSource('stp-daily'), okSource('contractors')],
        now: NOW,
        windowDays: 7,
    });
    // The exact columns `monitoring-view` builds for the daily tab.
    const columns: HeatColumn[] = report.days.map((day) => ({
        key: day.toISOString().slice(0, 10),
        label: `${day.getUTCDate()}`,
    }));
    render(
        <MonitoringReportView
            report={report}
            columns={columns}
            heatmapTitle="Completeness by day"
            heatmapNote="note"
        />,
    );
    return report;
}

afterEach(cleanup);

describe('MonitoringReportView heatmap', () => {
    it('leaves a section that is not keyed by period out of the heatmap entirely', () => {
        const report = renderDaily();
        const renewals = report.sections.find((s) => s.key === 'contractor-renewals')!;
        // It was assessed — it has a severity, a headline and a breakdown…
        expect(renewals.unavailable).toBeUndefined();
        expect(renewals.breakdown.length).toBeGreaterThan(0);
        // …its bands are just not days, so no cell may claim it was not assessed.
        expect(screen.queryAllByTitle(/Expiry & renewals/)).toHaveLength(0);
    });

    it('names the period in full in a cell, not just the day number in the header', () => {
        renderDaily();
        expect(screen.getByTitle(/Water — Daily readings · 19 Aug 2026/)).toBeTruthy();
    });
});
