import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';

import { buildMonthlyBriefing } from '@/components/water/monthly/briefing-metrics';
import { MonthlyBriefing } from '@/components/water/monthly/monthly-briefing';
import { buildMonthlyData, computePeriod, type Sel } from '@/lib/water-monthly-data';
import type { WaterMeter } from '@/lib/water-data';

/**
 * Two months of a miniature but complete network: a NAMA main bulk, two zone
 * bulks and their end-user meters. Individual cases below tweak this base.
 */
function meters(overrides: Partial<Record<'main' | 'z5bulk' | 'z5end' | 'z8bulk' | 'z8end', Record<string, number | null>>> = {}): WaterMeter[] {
    return [
        {
            label: 'Main Bulk (NAMA)', accountNumber: 'C43659', level: 'L1', zone: 'Main Bulk',
            parentMeter: 'NAMA', type: 'Main BULK',
            consumption: overrides.main ?? { 'Jan-26': 1000, 'Feb-26': 1000 },
        },
        {
            label: 'ZONE 5 (Bulk Zone 5)', accountNumber: '4300345', level: 'L2', zone: 'Zone_05',
            parentMeter: 'Main Bulk (NAMA)', type: 'Zone Bulk',
            consumption: overrides.z5bulk ?? { 'Jan-26': 400, 'Feb-26': 400 },
        },
        {
            label: 'Z5-001', accountNumber: '4300001', level: 'L3', zone: 'Zone_05',
            parentMeter: 'ZONE 5 (Bulk Zone 5)', type: 'Residential (Villa)',
            consumption: overrides.z5end ?? { 'Jan-26': 380, 'Feb-26': 380 },
        },
        {
            label: 'ZONE 8 (Bulk Zone 8)', accountNumber: '4300342', level: 'L2', zone: 'Zone_08',
            parentMeter: 'Main Bulk (NAMA)', type: 'Zone Bulk',
            consumption: overrides.z8bulk ?? { 'Jan-26': 400, 'Feb-26': 400 },
        },
        {
            label: 'Z8-001', accountNumber: '4300002', level: 'L3', zone: 'Zone_08',
            parentMeter: 'ZONE 8 (Bulk Zone 8)', type: 'Residential (Villa)',
            consumption: overrides.z8end ?? { 'Jan-26': 200, 'Feb-26': 200 },
        },
    ];
}

function metricsFor(rows: WaterMeter[], sel: Sel = null, year = '2026') {
    const data = buildMonthlyData(rows);
    const nMonths = data.meta.monthsWithData[year] ?? 0;
    const period = computePeriod(data, year, sel);
    return buildMonthlyBriefing({ data, year, nMonths, sel, period });
}

/** The briefing item (`<li>`) carrying a given label, so identical values on
 *  two findings can still be asserted apart. */
function finding(label: string): HTMLElement {
    const item = screen.getByText(label).closest('li');
    if (!item) throw new Error(`No briefing item labelled "${label}"`);
    return item;
}

describe('buildMonthlyBriefing', () => {
    it('derives loss, zones and reading counts from the live balance', () => {
        const m = metricsFor(meters());

        // A1 2000, A3 1160 → 840 lost, 42% of supply.
        expect(m.lossM3).toBe(840);
        expect(m.lossPct).toBe(42);
        // Zone 5 loses 5%, Zone 8 loses 50% → one zone above the 15% target.
        expect(m.zonesAboveTarget).toBe(1);
        expect(m.zonesAboveTargetNames).toEqual(['Zone 8']);
        expect(m.zoneCount).toBe(2);
        expect(m.zonesMissingBulk).toBe(0);
        expect(m.monthsWithoutSupply).toEqual([]);
        expect(m.monthsChecked).toBe(2);
        expect(m.missingMeters).toBe(0);
        expect(m.negativeMeters).toBe(0);
    });

    it('reports loss as null — never 0 — when no main-bulk volume is recorded', () => {
        const m = metricsFor(meters({ main: { 'Jan-26': null, 'Feb-26': null } }));

        expect(m.lossPct).toBeNull();
        expect(m.lossM3).toBeNull();
        // Both months genuinely lack an A1 reading, and that is said plainly.
        expect(m.monthsWithoutSupply).toEqual(['Jan', 'Feb']);
    });

    it('names only the months whose main-bulk reading is actually absent', () => {
        const m = metricsFor(meters({ main: { 'Jan-26': 1000, 'Feb-26': null } }));

        expect(m.monthsWithoutSupply).toEqual(['Feb']);
        expect(m.monthsChecked).toBe(2);
        // A1 for the whole period is still measurable from January alone.
        expect(m.lossPct).not.toBeNull();
    });

    it('counts unread and negative meters instead of coercing them to zero', () => {
        const broken = meters({
            z5end: { 'Jan-26': null, 'Feb-26': null },
            z8end: { 'Jan-26': -5, 'Feb-26': 200 },
        });

        const whole = metricsFor(broken);
        expect(whole.missingMeters).toBe(1);
        expect(whole.negativeMeters).toBe(0); // Z8's period total is +195, not negative

        const january = metricsFor(broken, 0);
        expect(january.missingMeters).toBe(1);
        expect(january.negativeMeters).toBe(1);
    });

    it('counts a zone whose bulk meter was not read, even though it drops out of the zone list', () => {
        // Zone 8's bulk has no February reading, so `computePeriod` cannot give
        // it a loss at all and omits it — the briefing still reports it.
        const m = metricsFor(meters({ z8bulk: { 'Jan-26': 400, 'Feb-26': null } }), 1);

        expect(m.zonesMissingBulk).toBe(1);
        expect(m.zoneCount).toBe(1);
        expect(m.zonesAboveTargetNames).not.toContain('Zone 8');
    });

    it('does not treat a bulk meter that reported zero as unread', () => {
        const m = metricsFor(meters({ z8bulk: { 'Jan-26': 400, 'Feb-26': 0 } }), 1);

        expect(m.zonesMissingBulk).toBe(0);
    });
});

describe('MonthlyBriefing', () => {
    it('uses the shared four-finding briefing with the Water title and period label', () => {
        render(<MonthlyBriefing metrics={metricsFor(meters())} periodLabel="Full Year 2026" />);

        expect(screen.getByRole('heading', { name: 'Water briefing' })).toBeInTheDocument();
        expect(screen.getByText('Full Year 2026')).toBeInTheDocument();
        for (const label of [
            'System loss vs target',
            'Zones above target',
            'Months without a supply reading',
            'Readings to validate',
        ]) {
            expect(screen.getByText(label)).toBeInTheDocument();
        }
        expect(screen.getAllByRole('listitem')).toHaveLength(4);
    });

    it('states the loss against the 15% target rather than a bare number', () => {
        render(<MonthlyBriefing metrics={metricsFor(meters())} periodLabel="Full Year 2026" />);

        expect(within(finding('System loss vs target')).getByText('42.0%')).toBeInTheDocument();
        expect(screen.getByText(/27\.0 pp above the 15% target/)).toBeInTheDocument();
        expect(within(finding('Zones above target')).getByText('1 of 2')).toBeInTheDocument();
        expect(screen.getByText('Zone 8')).toBeInTheDocument();
    });

    it('renders an honest dash and an explanation when the loss cannot be computed', () => {
        const metrics = metricsFor(meters({ main: { 'Jan-26': null, 'Feb-26': null } }));
        render(<MonthlyBriefing metrics={metrics} periodLabel="Full Year 2026" />);

        expect(within(finding('System loss vs target')).getByText('—')).toBeInTheDocument();
        expect(screen.getByText(/system loss cannot be computed/)).toBeInTheDocument();
        // A fabricated "0%" loss is exactly the failure mode this guards.
        expect(screen.queryByText('0.0%')).not.toBeInTheDocument();
    });

    it('reports missing months and unread meters without inventing values', () => {
        const metrics = metricsFor(meters({
            main: { 'Jan-26': 1000, 'Feb-26': null },
            z5end: { 'Jan-26': null, 'Feb-26': null },
        }));
        render(<MonthlyBriefing metrics={metrics} periodLabel="Full Year 2026" />);

        expect(within(finding('Months without a supply reading')).getByText('1 of 2')).toBeInTheDocument();
        expect(screen.getByText(/No main-bulk \(NAMA L1\) reading for Feb/)).toBeInTheDocument();
        expect(within(finding('Readings to validate')).getByText('1 meter')).toBeInTheDocument();
        expect(screen.getByText(/the loss above may be overstated/)).toBeInTheDocument();
    });

    it('says so plainly when every zone is within target and every meter reported', () => {
        const metrics = metricsFor(meters({ z8end: { 'Jan-26': 380, 'Feb-26': 380 } }));
        render(<MonthlyBriefing metrics={metrics} periodLabel="Full Year 2026" />);

        expect(within(finding('Zones above target')).getByText('0 of 2')).toBeInTheDocument();
        expect(screen.getByText('All 2 zones within 15%')).toBeInTheDocument();
        expect(within(finding('Readings to validate')).getByText('None')).toBeInTheDocument();
        expect(screen.getByText('Every meter reported a usable reading for this period')).toBeInTheDocument();
    });
});
