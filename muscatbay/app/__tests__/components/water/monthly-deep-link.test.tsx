import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import type { WaterMeter } from '@/lib/water-data';

/**
 * An alert link (/water?view=monthly&month=…&section=…) must open that month
 * on that section even when the operator's saved preference says otherwise,
 * and must do so again when tapped while the dashboard is already mounted.
 */

let currentQuery = '';
vi.mock('next/navigation', () => ({
    useSearchParams: () => new URLSearchParams(currentQuery),
    useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
    usePathname: () => '/water',
}));

import { WaterMonthlyDashboard } from '@/components/water/monthly/water-monthly-dashboard';

function meter(partial: Partial<WaterMeter> & { consumption: Record<string, number | null> }): WaterMeter {
    return {
        label: 'Test Meter',
        accountNumber: 'C0000',
        level: 'L3',
        zone: 'Zone_05',
        parentMeter: '',
        type: 'Residential (Villa)',
        ...partial,
    };
}

const months = { 'Jan-26': 1000, 'Feb-26': 1100, 'Mar-26': 1200 };
const METERS: WaterMeter[] = [
    meter({ label: 'Main Bulk', accountNumber: 'C43659', level: 'L1', zone: 'Main', consumption: months }),
    meter({ label: 'Zone 5 Bulk', accountNumber: 'Z5', level: 'L2', consumption: { 'Jan-26': 900, 'Feb-26': 950, 'Mar-26': 1000 } }),
    meter({ label: 'Villa 1', accountNumber: 'V1', level: 'L3', consumption: { 'Jan-26': 800, 'Feb-26': 850, 'Mar-26': 700 } }),
];

/** Point jsdom's address bar and the mocked router at the same URL. */
function setUrl(query: string) {
    currentQuery = query;
    window.history.replaceState(null, '', `/water${query ? `?${query}` : ''}`);
}

/**
 * The period picker's [start, end] as ISO month keys — the first two selects
 * on the page (sections render their own filters below it).
 */
function pickedRange(): string[] {
    return screen.getAllByRole('combobox').slice(0, 2).map((el) => (el as HTMLSelectElement).value);
}

function selectedTabName(): string | undefined {
    return screen
        .getAllByRole('tab')
        .find((t) => t.getAttribute('aria-selected') === 'true')
        ?.textContent?.trim();
}

/** In-memory localStorage — Node's own experimental global shadows jsdom's here. */
function memoryStorage(): Storage {
    const store = new Map<string, string>();
    return {
        get length() { return store.size; },
        clear: () => store.clear(),
        getItem: (k: string) => store.get(k) ?? null,
        key: (i: number) => Array.from(store.keys())[i] ?? null,
        removeItem: (k: string) => { store.delete(k); },
        setItem: (k: string, v: string) => { store.set(k, String(v)); },
    };
}

describe('WaterMonthlyDashboard deep link', () => {
    beforeEach(() => {
        // jsdom has no layout: the tab strip scrolls its active pill into view.
        Element.prototype.scrollIntoView ??= vi.fn();
        const storage = memoryStorage();
        vi.stubGlobal('localStorage', storage);
        // Saved preference points somewhere else entirely: Assets, January.
        storage.setItem(
            'mb_filters_water-monthly',
            JSON.stringify({ tab: 'assets', startMonth: 'Jan-26', endMonth: 'Jan-26' }),
        );
    });

    afterEach(() => {
        setUrl('');
        vi.unstubAllGlobals();
    });

    it('opens the linked month and section over the saved preference, then consumes the link', async () => {
        setUrl('view=monthly&month=Mar-26&section=zones');
        await act(async () => {
            render(<WaterMonthlyDashboard waterMeters={METERS} />);
        });
        expect(selectedTabName()).toContain('Zone Analysis');
        expect(pickedRange()).toEqual(['2026-03', '2026-03']);
        // One-shot: month/section leave the URL, the page's own ?view= stays.
        expect(window.location.search).toBe('?view=monthly');
    });

    it('keeps the saved preference on a plain visit', async () => {
        setUrl('view=monthly');
        await act(async () => {
            render(<WaterMonthlyDashboard waterMeters={METERS} />);
        });
        expect(selectedTabName()).toContain('Assets');
        expect(pickedRange()).toEqual(['2026-01', '2026-01']);
    });

    it('switches when an alert is tapped while the dashboard is already open', async () => {
        setUrl('view=monthly');
        const { rerender } = render(<WaterMonthlyDashboard waterMeters={METERS} />);
        await act(async () => {});
        expect(selectedTabName()).toContain('Assets');

        setUrl('view=monthly&month=Mar-26&section=overview');
        await act(async () => {
            rerender(<WaterMonthlyDashboard waterMeters={METERS} />);
        });
        expect(selectedTabName()).toContain('Overview');
        expect(pickedRange()).toEqual(['2026-03', '2026-03']);
    });

    it('keeps a month with no data pending, applies the section, and opens the month once data brings it', async () => {
        setUrl('view=monthly&month=Apr-26&section=exceptions');
        const { rerender } = render(<WaterMonthlyDashboard waterMeters={METERS} />);
        await act(async () => {});
        expect(selectedTabName()).toContain('Exceptions');
        expect(pickedRange()).toEqual(['2026-01', '2026-01']);
        // Section consumed; the month waits for data (e.g. a cached first render).
        expect(window.location.search).toBe('?view=monthly&month=Apr-26');

        // The fresh load adds April — the waiting link now lands.
        const withApril = METERS.map((m) => ({ ...m, consumption: { ...m.consumption, 'Apr-26': 500 } }));
        await act(async () => {
            rerender(<WaterMonthlyDashboard waterMeters={withApril} />);
        });
        expect(pickedRange()).toEqual(['2026-04', '2026-04']);
        expect(window.location.search).toBe('?view=monthly');
    });

    it('never saves a linked month or section over the operator\'s preference', async () => {
        setUrl('view=monthly&month=Mar-26&section=zones');
        const first = render(<WaterMonthlyDashboard waterMeters={METERS} />);
        await act(async () => {});
        expect(pickedRange()).toEqual(['2026-03', '2026-03']);
        first.unmount();

        // Next plain visit: the saved Assets / January range is still there.
        setUrl('view=monthly');
        await act(async () => {
            render(<WaterMonthlyDashboard waterMeters={METERS} />);
        });
        expect(selectedTabName()).toContain('Assets');
        expect(pickedRange()).toEqual(['2026-01', '2026-01']);
    });

    it('saves the operator\'s own tab change after a link, keeping the saved range', async () => {
        setUrl('view=monthly&month=Mar-26&section=zones');
        await act(async () => {
            render(<WaterMonthlyDashboard waterMeters={METERS} />);
        });
        await act(async () => {
            screen.getAllByRole('tab').find((t) => t.textContent?.includes('Exceptions'))?.click();
        });
        expect(JSON.parse(localStorage.getItem('mb_filters_water-monthly') ?? '{}')).toEqual({
            tab: 'exceptions',
            startMonth: 'Jan-26',
            endMonth: 'Jan-26',
        });
    });
});
