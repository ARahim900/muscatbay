import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ZoneWatch } from '@/components/water/daily-report/zone-watch';
import { DailyDatabase } from '@/components/water/daily-report/daily-database';
import { DailyExceptions } from '@/components/water/daily-report/daily-exceptions';
import { ZoneL3Table } from '@/components/water/daily-report/inline-zone-l3-table';
import type { ZoneRow } from '@/components/water/daily-report/inline-shared';
import { DC_METERS, ZEN_APARTMENT_ACCOUNTS, ZONE_BULK_CONFIG } from '@/lib/water-accounts';
import { ZONE_CONFIG } from '@/lib/water-data';
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

describe('ZEN Project configuration', () => {
    it('uses the same verified bulk meter and apartment set in Daily and Monthly views', () => {
        const dailyZone = ZONE_BULK_CONFIG.find(z => z.zoneName === 'ZEN Project');
        const monthlyZone = ZONE_CONFIG.find(z => z.code === 'Zone_03C');

        expect(dailyZone).toMatchObject({
            l2Account: '4300348',
            l3Accounts: ZEN_APARTMENT_ACCOUNTS,
        });
        expect(ZEN_APARTMENT_ACCOUNTS).toHaveLength(81);
        expect(ZEN_APARTMENT_ACCOUNTS[0]).toBe('4300351');
        expect(ZEN_APARTMENT_ACCOUNTS.at(-1)).toBe('4300431');
        expect(new Set(ZEN_APARTMENT_ACCOUNTS).size).toBe(81);
        expect(monthlyZone).toMatchObject({
            name: 'ZEN Project',
            bulkMeterAccount: '4300348',
        });
        expect(DC_METERS.map(meter => meter.account)).not.toContain('4300348');
        expect(DC_METERS.map(meter => meter.account)).toContain('4300349');
    });
});

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
        // …and the row says how many of the zone's meters that ΣL3 rests on.
        expect(screen.getByText(`1 / ${FM.l3Accounts.length} meters reported`)).toBeInTheDocument();
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

    it('names the meters that did not report, so a partial day is never mistaken for a loss', () => {
        render(<DailyExceptions monthData={monthData} selectedDay={1} month="Mar-26" />);
        // Day 1: loss 10 m³ / 10% is under the 20 m³ threshold, but only 1 of
        // Zone FM's 17 meters has a reading — that is the thing to chase.
        expect(screen.getByText('Meters not reporting')).toBeInTheDocument();
        expect(screen.getByText(`1 / ${FM.l3Accounts.length} meters reported`)).toBeInTheDocument();
    });

    it('shows the all-clear empty state on a clean day with every meter reporting', () => {
        const fullDay: SupabaseDailyWaterConsumption[] = [
            row(FM.l2Account, [100], { label: 'L2', meter_name: 'ZONE FM (Bulk)' }),
            ...FM.l3Accounts.map((a, i) => row(a, [i === 0 ? 90 : 0])),
        ];
        render(<DailyExceptions monthData={fullDay} selectedDay={1} month="Mar-26" />);
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

    it('draws day columns to the month horizon, so a whole-zone outage is visible', () => {
        // Every Zone FM L3 meter falls silent after day 2, while the zone bulk
        // and the rest of the site keep reporting to day 4. The table must
        // still draw days 3 and 4 — that is where the outage shows.
        const data: SupabaseDailyWaterConsumption[] = [
            row(FM.l2Account, [100, 100, 100, 100], { label: 'L2', meter_name: 'ZONE FM (Bulk)' }),
            row(FM.l3Accounts[0], [90, 90], { meter_name: 'Building FM' }),
        ];
        render(<ZoneL3Table zoneRow={fmZoneRow} zoneConfig={FM} monthData={data} buildingRows={[]} />);
        expect(screen.getByText('D4')).toBeInTheDocument();
        // Building FM: read on days 1-2, silent on 3-4 → two red cells.
        const fm = screen.getByText('Building FM').closest('tr')!;
        expect(fm.querySelectorAll('td.bg-danger-tint')).toHaveLength(2);
    });

    it('tints a day cell with no reading red, and leaves a recorded zero alone', () => {
        const data: SupabaseDailyWaterConsumption[] = [
            row(FM.l2Account, [100, 100], { label: 'L2', meter_name: 'ZONE FM (Bulk)' }),
            row(FM.l3Accounts[0], [90, null], { meter_name: 'Building FM' }),   // quiet on day 2
            row(FM.l3Accounts[1], [0, 0], { meter_name: 'Idle villa' }),        // 0 is a reading
        ];
        render(<ZoneL3Table zoneRow={fmZoneRow} zoneConfig={FM} monthData={data} buildingRows={[]} />);
        // Every missing cell is a red-tinted cell carrying the same label.
        const missing = screen.getAllByLabelText('No reading');
        expect(missing.length).toBeGreaterThan(0);
        for (const dash of missing) expect(dash.closest('td')).toHaveClass('bg-danger-tint');
        // Building FM: day 1 read, day 2 not — exactly one tinted cell.
        const fm = screen.getByText('Building FM').closest('tr')!;
        expect(fm.querySelectorAll('td.bg-danger-tint')).toHaveLength(1);
        // The idle villa's zeros are readings — plain cells.
        const idle = screen.getByText('Idle villa').closest('tr')!;
        expect(idle.querySelectorAll('td.bg-danger-tint')).toHaveLength(0);
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
