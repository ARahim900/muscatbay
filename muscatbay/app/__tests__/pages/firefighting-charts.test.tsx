import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import FirefightingPage from '@/app/firefighting/page';
import { clearPageCache } from '@/lib/page-cache';
import type { FireSafetyData } from '@/actions/fire-safety';

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

// One equipment row is enough: the charts render only when the register is
// non-empty, and the plots are driven by derived counts rather than row shape.
vi.mock('@/actions/fire-safety', () => ({
    fetchFireSafetyDataAction: async (): Promise<FireSafetyData> => ({
        equipment: [{
            id: 'fe-1',
            name: 'Fire extinguisher',
            location: 'Zone 01 — pump room',
            status: 'Operational',
            priority: 'High',
            battery: null,
            signal: null,
            next_maintenance: '2026-12-01',
            inspector: 'BEC',
            type: 'Extinguisher',
            zone: 'Zone 01',
        }],
        activities: [],
        issues: [],
        contacts: [],
    }),
}));

vi.mock('@/hooks/useSupabaseRealtime', () => ({
    useSupabaseRealtime: () => ({ isLive: false }),
}));

describe('/firefighting — Overview charts', () => {
    // The real tab strip mounts in this test (unlike the loading-state one) and
    // scrolls the active tab into view; jsdom ships no scrollIntoView.
    beforeAll(() => {
        Element.prototype.scrollIntoView ??= () => {};
    });

    beforeEach(() => {
        clearPageCache();
    });

    it('mounts both plots through the shared chart container', async () => {
        render(<FirefightingPage />);

        const containers = await screen.findAllByTestId('chart-container');
        expect(containers).toHaveLength(2);
    });

    it('keeps the 260px chart height as the container floor', async () => {
        render(<FirefightingPage />);

        for (const container of await screen.findAllByTestId('chart-container')) {
            expect(container).toHaveAttribute('data-min-height', '260');
        }
    });
});
