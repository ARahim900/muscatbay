import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import type { SupabaseDailyWaterConsumption } from '@/entities/water';
import { ZONE_BULK_CONFIG } from '@/lib/water-accounts';

// Readings land a day or two late. The view used to open on "yesterday" from
// the device clock, which often had no rows yet and rendered as
// "0.00 m³ · all zones normal". It must open on the latest recorded day.

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

// Readings for days 1–3 only.
const rows = [row(FM.l2Account, [100, 110, 105])];

vi.mock('@/lib/supabase', () => {
    const result = { data: rows, count: rows.length, error: null };
    const query = { select: () => query, eq: () => Promise.resolve(result) };
    return { getSupabaseClient: () => ({ from: () => query }) };
});
vi.mock('@/hooks/useSupabaseRealtime', () => ({ useSupabaseRealtime: () => ({ isLive: false }) }));

// jsdom has no ResizeObserver; the Radix day slider needs one.
vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
Element.prototype.scrollIntoView = () => {};

describe('DailyWaterReport default day', () => {
    it('opens on the latest day that has readings, not on yesterday', async () => {
        const { DailyWaterReport } = await import('@/components/water/daily-water-report');
        render(<DailyWaterReport />);
        await waitFor(() => expect(screen.getByText(/^Day 3/)).toBeInTheDocument(), { timeout: 3000 });
    });
});
