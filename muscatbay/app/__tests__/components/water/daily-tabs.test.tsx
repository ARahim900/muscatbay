import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ZoneWatch } from '@/components/water/daily-report/zone-watch';
import { DailyDatabase } from '@/components/water/daily-report/daily-database';
import { DailyExceptions } from '@/components/water/daily-report/daily-exceptions';
import { ZoneL3Table } from '@/components/water/daily-report/inline-zone-l3-table';
import type { ZoneRow } from '@/components/water/daily-report/inline-shared';
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
    it('renders a table row per zone and flags the high-loss zone', () => {
        render(
            <ZoneWatch briefing={null} monthData={monthData} selectedDay={2} month="Mar-26" onInspectZone={() => {}} />,
        );
        expect(screen.getByRole('table', { name: 'Water zone performance' })).toBeInTheDocument();
        for (const z of ZONE_BULK_CONFIG) {
            expect(screen.getAllByText(z.zoneName).length).toBeGreaterThan(0);
        }
        // Day 2: loss 40 m³ / 40% → "High" severity chip on the Zone FM row.
        expect(screen.getAllByText('High').length).toBeGreaterThan(0);
    });

    it('navigates to the zone analysis when a zone row is clicked', () => {
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

// ─── Zone Analysis — L3 meters table ──────────────────────────────────────────

describe('ZoneL3Table', () => {
    const fmZoneRow: ZoneRow = {
        zoneName: 'Zone FM',
        l2Account: FM.l2Account,
        l2Value: 100,
        l3Sum: 90,
        diff: 10,
        isNullL2: false,
        isHighLoss: false,
    };

    it('shows the meter NAME in the Meter column while the Account column keeps the account number', () => {
        render(
            <ZoneL3Table zoneRow={fmZoneRow} zoneConfig={FM} monthData={monthData} buildingRows={[]} />,
        );
        // The first L3 meter carries meter_name "Building FM" (see fixture above).
        // The Meter column must render that name, not the bare account number.
        expect(screen.getByText('Building FM')).toBeInTheDocument();
        // …and the account number still appears (in the Account column).
        expect(screen.getByText(FM.l3Accounts[0])).toBeInTheDocument();
    });

    it('falls back to the account number when a meter has no recorded name', () => {
        const namelessData: SupabaseDailyWaterConsumption[] = [
            row(FM.l2Account, [100], { label: 'L2', meter_name: 'ZONE FM (Bulk)' }),
            row(FM.l3Accounts[0], [90], { meter_name: '' }),
        ];
        render(
            <ZoneL3Table zoneRow={fmZoneRow} zoneConfig={FM} monthData={namelessData} buildingRows={[]} />,
        );
        // With no name, the account number stands in for the meter label, so it
        // appears in BOTH the Meter and Account columns (≥ 2 occurrences).
        expect(screen.getAllByText(FM.l3Accounts[0]).length).toBeGreaterThanOrEqual(2);
    });
});
