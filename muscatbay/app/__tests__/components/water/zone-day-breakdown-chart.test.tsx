import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ZoneDayBreakdownChart } from '@/components/water/daily-report/zone-day-breakdown-chart';
import { ZONE_BULK_CONFIG } from '@/lib/water-accounts';
import type { SupabaseDailyWaterConsumption } from '@/entities/water';

/**
 * The chart body is SVG that jsdom cannot size, so these tests pin the parts
 * an operator reads as words: the title, the footer's balance statement and
 * the honest empty / not-read states (never a fabricated zero loss).
 */

function row(account: string, day1: number | null, name = `Meter ${account}`): SupabaseDailyWaterConsumption {
    const base = {
        id: 1, meter_name: name, account_number: account, label: 'L3',
        zone: 'Zone FM', parent_meter: null, type: 'Retail', month: 'Aug-26', year: 2026,
    } as unknown as Record<string, unknown>;
    for (let d = 1; d <= 31; d++) base[`day_${d}`] = d === 1 ? day1 : null;
    return base as unknown as SupabaseDailyWaterConsumption;
}

const FM = ZONE_BULK_CONFIG.find(z => z.zoneName === 'Zone FM')!;
const props = { activeZoneName: 'Zone FM', selectedDay: 1, month: 'Aug-26' };

describe('ZoneDayBreakdownChart', () => {
    it('states the unmetered share and its band in the footer', () => {
        render(
            <ZoneDayBreakdownChart
                {...props}
                monthData={[row(FM.l2Account, 100, 'Zone FM (Bulk)'), row(FM.l3Accounts[0], 60, 'Building B2')]}
            />,
        );
        expect(screen.getByText('Where the water went — Day 1')).toBeInTheDocument();
        expect(screen.getByText(/Unmetered loss 40\.00 m³ · 40\.0% of the 100\.00 m³ bulk · High · 16 meters not read/)).toBeInTheDocument();
    });

    it('says the bulk was not read instead of showing a zero loss', () => {
        render(<ZoneDayBreakdownChart {...props} monthData={[row(FM.l3Accounts[0], 60, 'Building B2')]} />);
        expect(screen.getByText(/L2 bulk not read on Day 1 — the unmetered share cannot be computed/)).toBeInTheDocument();
    });

    it('renders an honest empty state when nothing was read that day', () => {
        render(<ZoneDayBreakdownChart {...props} monthData={[]} />);
        expect(screen.getByText('No readings recorded for Day 1')).toBeInTheDocument();
        expect(screen.getByText('No L2 or L3 readings recorded for Day 1')).toBeInTheDocument();
    });
});
