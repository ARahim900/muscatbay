import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import type { SupabaseDailyWaterConsumption } from '@/entities/water';
import { ZONE_BULK_CONFIG } from '@/lib/water-accounts';

/**
 * The iPhone "Water by zone" widget links each zone row to
 * /water?view=daily&zone=<zone>. The Daily report must open that zone's
 * analysis — over the operator's saved tab and zone — consume the parameter,
 * and leave the saved preference alone until the operator changes it.
 */

let currentQuery = '';
vi.mock('next/navigation', () => ({
    useSearchParams: () => new URLSearchParams(currentQuery),
    useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
    usePathname: () => '/water',
}));

const FM = ZONE_BULK_CONFIG.find(z => z.zoneName === 'Zone FM')!;

function row(account: string, readings: (number | null)[]): SupabaseDailyWaterConsumption {
    const base = {
        id: 1, meter_name: `Meter ${account}`, account_number: account, label: 'L2',
        zone: 'Zone FM', parent_meter: null, type: 'Zone Bulk', month: 'Mar-26', year: 2026,
    } as unknown as SupabaseDailyWaterConsumption;
    for (let d = 1; d <= 31; d++) {
        (base as unknown as Record<string, number | null>)[`day_${d}`] = readings[d - 1] ?? null;
    }
    return base;
}

const rows = [row(FM.l2Account, [100, 110, 105])];

vi.mock('@/lib/supabase', () => {
    const result = { data: rows, count: rows.length, error: null };
    const query = { select: () => query, eq: () => Promise.resolve(result) };
    return { getSupabaseClient: () => ({ from: () => query }) };
});
vi.mock('@/hooks/useSupabaseRealtime', () => ({ useSupabaseRealtime: () => ({ isLive: false }) }));

vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
Element.prototype.scrollIntoView = () => {};

const PREFS_KEY = 'mb_filters_water-daily';

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

function setUrl(query: string) {
    currentQuery = query;
    window.history.replaceState(null, '', `/water${query ? `?${query}` : ''}`);
}

async function renderReport() {
    const { DailyWaterReport } = await import('@/components/water/daily-water-report');
    return render(<DailyWaterReport />);
}

function selectedZone(): string {
    return (screen.getByLabelText('Select zone') as HTMLSelectElement).value;
}

describe('DailyWaterReport zone deep link', () => {
    beforeEach(() => {
        vi.stubGlobal('localStorage', memoryStorage());
        localStorage.setItem(PREFS_KEY, JSON.stringify({ tab: 'watch', zone: 'Zone FM' }));
    });
    afterEach(() => {
        setUrl('');
    });

    it('opens the linked zone on Zone Analysis over the saved tab and zone', async () => {
        setUrl('view=daily&zone=Zone+8');
        await renderReport();
        await waitFor(() => expect(screen.getByLabelText('Select zone')).toBeInTheDocument(), { timeout: 3000 });
        expect(selectedZone()).toBe('Zone 8');
        // One-shot: the zone leaves the address bar, the view stays.
        expect(window.location.search).toBe('?view=daily');
        // Shown, not saved.
        expect(JSON.parse(localStorage.getItem(PREFS_KEY)!)).toEqual({ tab: 'watch', zone: 'Zone FM' });
    });

    it('ignores a zone the report does not know', async () => {
        setUrl('view=daily&zone=Zone_08');
        await renderReport();
        await waitFor(() => expect(screen.getByText(/^Day 3/)).toBeInTheDocument(), { timeout: 3000 });
        expect(screen.queryByLabelText('Select zone')).not.toBeInTheDocument();
        expect(window.location.search).toBe('?view=daily');
    });

    it('saves again once the operator picks a zone themselves', async () => {
        setUrl('view=daily&zone=Zone+8');
        await renderReport();
        await waitFor(() => expect(screen.getByLabelText('Select zone')).toBeInTheDocument(), { timeout: 3000 });
        act(() => {
            fireEvent.change(screen.getByLabelText('Select zone'), { target: { value: 'Zone 5' } });
        });
        expect(selectedZone()).toBe('Zone 5');
        expect(JSON.parse(localStorage.getItem(PREFS_KEY)!)).toEqual({ tab: 'zones', zone: 'Zone 5' });
    });
});
