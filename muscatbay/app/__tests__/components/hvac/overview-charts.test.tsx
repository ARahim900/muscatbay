import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OverviewTab } from '@/components/hvac/overview-tab';
import type { GulfExpertData } from '@/components/hvac/types';

// Stands in for the shared container: jsdom has no layout, so the assertion is
// that both plots are handed to it — not what Recharts would draw. If either
// chart ever goes back to Recharts' own ResponsiveContainer (no deferred mount,
// no minHeight floor, so a parent that loses its fixed height renders blank),
// the count below drops and this fails.
vi.mock('@/components/charts/chart-container', () => ({
    ChartContainer: ({ minHeight }: { minHeight?: number }) => (
        <div data-testid="chart-container" data-min-height={minHeight} />
    ),
}));

const NO_DATA: GulfExpertData = {
    findings: [],
    recurringIssues: [],
    contracts: [],
    communications: [],
};

describe('HVAC OverviewTab charts', () => {
    it('mounts both plots through the shared chart container', () => {
        render(<OverviewTab data={NO_DATA} />);

        const containers = screen.getAllByTestId('chart-container');
        expect(containers).toHaveLength(2);
    });

    it('keeps the 280px chart height as the container floor', () => {
        render(<OverviewTab data={NO_DATA} />);

        for (const container of screen.getAllByTestId('chart-container')) {
            expect(container).toHaveAttribute('data-min-height', '280');
        }
    });
});
