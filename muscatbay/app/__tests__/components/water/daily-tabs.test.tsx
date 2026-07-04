import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ZoneWatch } from '@/components/water/daily-report/zone-watch';
import { DailyDatabase } from '@/components/water/daily-report/daily-database';
import { DailyExceptions } from '@/components/water/daily-report/daily-exceptions';
import { ZONE_BULK_CONFIG } from '@/lib/water-accounts';
import type { SupabaseDailyWaterConsumption } from '@/entities/water';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function row(
    account: string,
    readings: (number | null)[],
    over: Partial<SupabaseDailyWaterConsumption> = {},
): SupabaseDailyWaterConsumption {
    const base = {
        id: 1, meter_name: `Meter ${account}`, account_number: account, label: 'L3',
        zone: 'Zone FM', parent_meter: null, type: 'Residential (Villa)', month: 'Mar-26', year: 2026,
        ...over,
    } as unknown as SupabaseDailyWaterConsumption;
    for (let d = 1; d <= 31; d++) {
        (base as unknown as Record<string, number | null>)[`day_${d}`] = readings[d - 1] ?? null;
    }
    return base;
}

const FM = ZONE_BULK_CONFIG.find(z => z.zoneName === 'Zone FM')!;

/** Zone FM with a 40% loss on day 2 (L2 100 vs ΣL3 60). */
const monthData: SupabaseDailyWaterConsumption[] = [
    row(FM.l2Account, [100, 100], { label: 'L2', meter_name: 'ZONE FM (Bulk)' }),
    row(FM.l3Accounts[0], [90, 60], { meter_name: 'Building FM' }),
];

// ─── Zone Watch ───────────────────────────────────────────────────────────────

describe('ZoneWatch', () => {
    it('renders a card per zone and flags the high-loss zone', () => {
        render(
            <ZoneWatch briefing={null} monthData={monthData} selectedDay={2} month="Mar-26" onInspectZone={() => {}} />,
        );
        for (const z of ZONE_BULK_CONFIG) {
            expect(screen.getAllByText(z.zoneName).length).toBeGreaterThan(0);
        }
        // Day 2: loss 40 m³ / 40% → "High" severity chip on the Zone FM card.
        expect(screen.getAllByText('High').length).toBeGreaterThan(0);
    });

    it('navigates to the zone analysis when a card is clicked', () => {
        const onInspect = vi.fn();
        render(
            <ZoneWatch briefing={null} monthData={monthData} selectedDay={2} month="Mar-26" onInspectZone={onInspect} />,
        );
        fireEvent.click(screen.getByRole('button', { name: /Inspect Zone FM/i }));
        expect(onInspect).toHaveBeenCalledWith('Zone FM');
    });

    it('navigates with zone AND day when a heatmap cell is clicked', () => {
        const onInspect = vi.fn();
        render(
            <ZoneWatch briefing={null} monthData={monthData} selectedDay={2} month="Mar-26" onInspectZone={onInspect} />,
        );
        fireEvent.click(screen.getByRole('button', { name: /Zone FM, day 1:/i }));
        expect(onInspect).toHaveBeenCalledWith('Zone FM', 1);
    });
});

// ─── Daily Database ───────────────────────────────────────────────────────────

describe('DailyDatabase', () => {
    it('lists every meter with its readings and MTD total', () => {
        render(<DailyDatabase monthData={monthData} selectedDay={2} month="Mar-26" />);
        expect(screen.getByText('ZONE FM (Bulk)')).toBeInTheDocument();
        expect(screen.getByText('Building FM')).toBeInTheDocument();
        expect(screen.getByText(/2 meters/)).toBeInTheDocument();
    });

    it('filters by search text', () => {
        render(<DailyDatabase monthData={monthData} selectedDay={2} month="Mar-26" />);
        fireEvent.change(screen.getByLabelText('Search meter or account…'), { target: { value: 'Building' } });
        expect(screen.queryByText('ZONE FM (Bulk)')).not.toBeInTheDocument();
        expect(screen.getByText('Building FM')).toBeInTheDocument();
    });
});

// ─── Exceptions & Actions ─────────────────────────────────────────────────────

describe('DailyExceptions', () => {
    it('surfaces the high-loss zone in the register with a critical chip', () => {
        render(<DailyExceptions monthData={monthData} selectedDay={2} month="Mar-26" />);
        expect(screen.getByText('High daily loss')).toBeInTheDocument();
        expect(screen.getAllByText('Critical').length).toBeGreaterThan(0);
    });

    it('shows the all-clear empty state on a clean day', () => {
        render(<DailyExceptions monthData={monthData} selectedDay={1} month="Mar-26" />);
        // Day 1: loss 10 m³ / 10% — under the 20 m³ exception threshold.
        expect(screen.getByText(/No exceptions for Day 1/i)).toBeInTheDocument();
    });
});
