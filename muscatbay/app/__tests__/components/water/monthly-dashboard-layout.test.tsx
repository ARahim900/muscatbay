import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { WaterMonthlyDashboard } from '@/components/water/monthly/water-monthly-dashboard';
import type { WaterMeter } from '@/lib/water-data';

/**
 * jsdom implements none of these. The dashboard's shared chrome calls all three
 * on mount — the tab strip scrolls the active tab into view, the period filter
 * queries a media query, and `StatsGrid` / `ChartContainer` observe intersection
 * for their entrance animations — so without stubs nothing renders at all.
 */
class NoopIntersectionObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() { return []; }
    root = null;
    rootMargin = '';
    thresholds = [];
}

beforeAll(() => {
    vi.stubGlobal('IntersectionObserver', NoopIntersectionObserver);
    Element.prototype.scrollIntoView = vi.fn();
    vi.stubGlobal('matchMedia', vi.fn((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })));
});

/**
 * Minimal but complete network: a NAMA main bulk, one zone bulk and one
 * end-user meter, over two months of 2026.
 */
const METERS: WaterMeter[] = [
    {
        label: 'Main Bulk (NAMA)', accountNumber: 'C43659', level: 'L1', zone: 'Main Bulk',
        parentMeter: 'NAMA', type: 'Main BULK',
        consumption: { 'Jan-26': 1000, 'Feb-26': 1000 },
    },
    {
        label: 'ZONE 5 (Bulk Zone 5)', accountNumber: '4300345', level: 'L2', zone: 'Zone_05',
        parentMeter: 'Main Bulk (NAMA)', type: 'Zone Bulk',
        consumption: { 'Jan-26': 800, 'Feb-26': 800 },
    },
    {
        label: 'Z5-001', accountNumber: '4300001', level: 'L3', zone: 'Zone_05',
        parentMeter: 'ZONE 5 (Bulk Zone 5)', type: 'Residential (Villa)',
        consumption: { 'Jan-26': 500, 'Feb-26': 500 },
    },
];

const KPI_LABELS = ['Total Supply (A1)', 'Consumption (A3)', 'System Loss', 'Loss Cost'];

describe('WaterMonthlyDashboard layout', () => {
    beforeEach(() => {
        // The dashboard restores its last section from localStorage; start clean
        // so each case begins on the default sub-tab.
        window.localStorage.clear();
    });

    it('renders the KPI deck and the water briefing on the default sub-tab', () => {
        render(<WaterMonthlyDashboard waterMeters={METERS} />);

        for (const label of KPI_LABELS) {
            expect(screen.getByText(label)).toBeInTheDocument();
        }
        expect(screen.getByRole('heading', { name: 'Water briefing' })).toBeInTheDocument();
    });

    it('keeps both on every other Monthly sub-tab, matching Electricity and STP', () => {
        render(<WaterMonthlyDashboard waterMeters={METERS} />);

        for (const tab of ['Zone Analysis', 'Assets & Connections', 'Main Database', 'Exceptions & Actions']) {
            fireEvent.click(screen.getByRole('tab', { name: new RegExp(tab.replace('&', '&')) }));

            for (const label of KPI_LABELS) {
                expect(screen.getByText(label), `${label} missing on ${tab}`).toBeInTheDocument();
            }
            expect(
                screen.getByRole('heading', { name: 'Water briefing' }),
                `briefing missing on ${tab}`,
            ).toBeInTheDocument();
        }
    });

    it('frames its charts with the shared chart shell, management note included', () => {
        render(<WaterMonthlyDashboard waterMeters={METERS} />);

        expect(screen.getByRole('heading', { name: 'Monthly Supply, Consumption & Loss' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Consumption by Type' })).toBeInTheDocument();
        expect(screen.getAllByText('Management note:').length).toBeGreaterThan(0);
    });

    it('shows the shell empty state rather than plotting a chart of zeros', () => {
        // Every meter reported, and every reading is zero — there is no volume to
        // plot, so the shell says so instead of drawing flat bars at the axis.
        const zeroed: WaterMeter[] = METERS.map((m) => ({
            ...m,
            consumption: { 'Jan-26': 0, 'Feb-26': 0 },
        }));
        render(<WaterMonthlyDashboard waterMeters={zeroed} />);

        expect(screen.getByText('No supply or consumption volume is recorded for any month of this year.')).toBeInTheDocument();
        expect(screen.getByText('No end-user consumption is recorded for this period.')).toBeInTheDocument();
    });
});
