import { describe, it, expect } from 'vitest';
import {
    buildDailyGrid, gridValue, dailySeverity, buildZoneDaySeries, buildZoneWatch,
    buildZoneDayBreakdown, buildNetworkDaySeries, buildDailyExceptions,
    risingLossStreak, detectSpike, zeroStreak, wasActiveBefore,
    type DayValues, type ZoneDayPoint,
} from '@/components/water/daily-report/daily-metrics';
import { ZONE_BULK_CONFIG, BUILDING_CONFIG } from '@/lib/water-accounts';
import type { SupabaseDailyWaterConsumption } from '@/entities/water';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

/** Minimal month row: account + readings for the first N days. */
function row(account: string, readings: (number | null)[], name = `Meter ${account}`): SupabaseDailyWaterConsumption {
    const base = {
        id: 1, meter_name: name, account_number: account, label: 'L3',
        zone: 'Zone FM', parent_meter: null, type: 'Residential', month: 'Mar-26', year: 2026,
    } as unknown as SupabaseDailyWaterConsumption;
    for (let d = 1; d <= 31; d++) {
        (base as unknown as Record<string, number | null>)[`day_${d}`] = readings[d - 1] ?? null;
    }
    return base;
}

/** Days array helper: pad a prefix of readings to 31 slots. */
function days(...vals: (number | null)[]): (number | null)[] {
    return [...vals, ...Array.from({ length: 31 - vals.length }, () => null)];
}

const FM = ZONE_BULK_CONFIG.find(z => z.zoneName === 'Zone FM')!;
const ZEN = ZONE_BULK_CONFIG.find(z => z.zoneName === 'ZEN Project')!;

// ─── buildDailyGrid ───────────────────────────────────────────────────────────

describe('buildDailyGrid', () => {
    it('indexes readings by account and finds the latest day with data', () => {
        const grid = buildDailyGrid([
            row('A', days(1, 2, 3)),
            row('B', days(null, null, null, null, 7)),
        ]);
        expect(gridValue(grid, 'A', 2)).toBe(2);
        expect(gridValue(grid, 'B', 5)).toBe(7);
        expect(gridValue(grid, 'B', 1)).toBeNull();
        expect(gridValue(grid, 'missing', 1)).toBeNull();
        expect(grid.latestDay).toBe(5);
        expect(grid.names.get('A')).toBe('Meter A');
    });

    it('defaults latestDay to 1 when there is no data at all', () => {
        expect(buildDailyGrid([row('A', days())]).latestDay).toBe(1);
    });
});

// ─── dailySeverity ────────────────────────────────────────────────────────────

describe('dailySeverity', () => {
    it('returns nodata when the balance is not computable', () => {
        expect(dailySeverity(null, null)).toBe('nodata');
    });
    it('flags negative balances as check', () => {
        expect(dailySeverity(-12, -10)).toBe('check');
    });
    it('never alarms on tiny absolute losses regardless of percentage', () => {
        expect(dailySeverity(3, 60)).toBe('good');
    });
    it('applies the 10/25/50 percentage bands', () => {
        expect(dailySeverity(9, 8)).toBe('good');
        expect(dailySeverity(12, 12)).toBe('moderate');
        expect(dailySeverity(15, 30)).toBe('high');
        expect(dailySeverity(18, 55)).toBe('critical');
    });
    it('escalates on absolute m³ even at low percentages', () => {
        expect(dailySeverity(25, 5)).toBe('moderate');
        expect(dailySeverity(60, 5)).toBe('high');
        expect(dailySeverity(120, 5)).toBe('critical');
    });
});

// ─── Zone series & fleet view ─────────────────────────────────────────────────

describe('buildZoneDaySeries / buildZoneWatch', () => {
    const grid = buildDailyGrid([
        row(FM.l2Account, days(100, 100, null)),
        row(FM.l3Accounts[0], days(40, 90, 10)),
        row(FM.l3Accounts[1], days(30, 5, null)),
    ]);
    const series = buildZoneDaySeries(grid);
    const fm = series.find(s => s.zoneName === 'Zone FM')!;

    it('computes per-day L2, ΣL3, loss and loss %', () => {
        expect(fm.points[0]).toMatchObject({ day: 1, l2: 100, l3Sum: 70, loss: 30, lossPct: 30 });
        expect(fm.points[0].severity).toBe('high');
    });

    it('marks the balance as not computable when L2 is missing', () => {
        expect(fm.points[2]).toMatchObject({ l2: null, l3Sum: 10, loss: null, lossPct: null, severity: 'nodata' });
        expect(fm.points[2].hasData).toBe(true);
    });

    it('aggregates month-to-date and sparkline in the fleet view', () => {
        const watch = buildZoneWatch(series, 3);
        const w = watch.find(x => x.zoneName === 'Zone FM')!;
        expect(w.mtdL2).toBe(200);   // 100 + 100 + (null→0)
        expect(w.mtdL3).toBe(175);   // 70 + 95 + 10
        expect(w.mtdLoss).toBe(25);
        expect(w.mtdLossPct).toBe(12.5);
        expect(w.spark).toEqual([30, 5, null]);
    });

    it('produces one row per configured zone even with no data', () => {
        expect(series.length).toBe(ZONE_BULK_CONFIG.length);
        const empty = series.find(s => s.zoneName === 'Zone 8')!;
        expect(empty.points[0].hasData).toBe(false);
        expect(empty.points[0].severity).toBe('nodata');
    });

    it('calculates the ZEN Project bulk-to-apartment balance', () => {
        const zenGrid = buildDailyGrid([
            row(ZEN.l2Account, days(20)),
            row(ZEN.l3Accounts[0], days(7)),
            row(ZEN.l3Accounts[1], days(5)),
        ]);
        const zen = buildZoneDaySeries(zenGrid).find(s => s.zoneName === 'ZEN Project')!;

        expect(zen.points[0]).toMatchObject({
            l2: 20,
            l3Sum: 12,
            loss: 8,
            lossPct: 40,
        });
    });
});

describe('buildZoneDayBreakdown', () => {
    it('ranks the largest meters, folds the rest into Other and ranks the loss alongside', () => {
        const grid = buildDailyGrid([
            row(FM.l2Account, days(100)),
            row(FM.l3Accounts[0], days(30), 'Big'),
            row(FM.l3Accounts[1], days(20), 'Mid'),
            row(FM.l3Accounts[2], days(5), 'Small'),
            row(FM.l3Accounts[3], days(0), 'Idle'),
        ]);
        const b = buildZoneDayBreakdown(grid, FM, 1, 2);
        expect(b).toMatchObject({ l2: 100, l3Sum: 55, loss: 45, hasData: true });
        expect(b.bars.map(x => [x.key, x.label, x.value, x.kind])).toEqual([
            // 13 meters were not read — the loss bar says so, because their use sits inside it.
            ['loss', 'Unmetered (13 unread)', 45, 'loss'],
            [FM.l3Accounts[0], 'Big', 30, 'meter'],
            [FM.l3Accounts[1], 'Mid', 20, 'meter'],
            ['other', `Other (${FM.l3Accounts.length - 2} meters)`, 5, 'other'],
        ]);
        // Small, Idle and every unread meter fold into Other; only unread ones count as unread.
        expect(b.otherCount).toBe(FM.l3Accounts.length - 2);
        expect(b.unread).toBe(FM.l3Accounts.length - 4);
        expect(b.bars[0].shareOfSupply).toBe(45);
    });

    it('labels the loss plainly when every meter was read', () => {
        const grid = buildDailyGrid([
            row(FM.l2Account, days(100)),
            ...FM.l3Accounts.map((a, i) => row(a, days(i === 0 ? 30 : 1))),
        ]);
        const b = buildZoneDayBreakdown(grid, FM, 1);
        expect(b.unread).toBe(0);
        expect(b.bars.find(x => x.kind === 'loss')).toMatchObject({ label: 'Unmetered loss', value: 54 });
    });

    it('shows no loss bar and no share of supply when the bulk was not read', () => {
        const grid = buildDailyGrid([row(FM.l3Accounts[0], days(12), 'Only')]);
        const b = buildZoneDayBreakdown(grid, FM, 1);
        expect(b).toMatchObject({ l2: null, loss: null, l3Sum: 12, hasData: true });
        expect(b.bars.some(x => x.kind === 'loss')).toBe(false);
        expect(b.bars[0]).toMatchObject({ key: FM.l3Accounts[0], label: 'Only', value: 12, shareOfSupply: null });
    });

    it('omits the loss bar when meters read more than the bulk, and is empty with no readings', () => {
        const over = buildZoneDayBreakdown(
            buildDailyGrid([row(FM.l2Account, days(10)), row(FM.l3Accounts[0], days(14))]), FM, 1,
        );
        expect(over.loss).toBe(-4);
        expect(over.bars.some(x => x.kind === 'loss')).toBe(false);

        const empty = buildZoneDayBreakdown(buildDailyGrid([row(FM.l2Account, days(null))]), FM, 1);
        expect(empty.hasData).toBe(false);
        expect(empty.bars).toEqual([]);
        expect(empty.unread).toBe(FM.l3Accounts.length);
    });

    it('names a building bulk by its curated building name, like the L3 table', () => {
        const zone3a = ZONE_BULK_CONFIG.find(z => z.zoneName === 'Zone 3A')!;
        const building = BUILDING_CONFIG.find(b => b.zone === '3A')!;
        const grid = buildDailyGrid([row(building.bulkAccount, days(9), 'db name')]);
        expect(buildZoneDayBreakdown(grid, zone3a, 1).bars[0].label).toBe(building.buildingName);
    });
});

describe('buildNetworkDaySeries', () => {
    const grid = buildDailyGrid([
        row(FM.l2Account, days(100, 50)),
        row(FM.l3Accounts[0], days(80, 40)),
    ]);
    const series = buildZoneDaySeries(grid);

    it('sums all zones into the network trend and skips no-data days', () => {
        const net = buildNetworkDaySeries(series, 2);
        expect(net).toHaveLength(2);
        expect(net[0]).toMatchObject({ day: 1, supply: 100, metered: 80, loss: 20, lossPct: 20 });
    });
});

// ─── Anomaly detectors ────────────────────────────────────────────────────────

describe('risingLossStreak', () => {
    const pts = (losses: (number | null)[]): ZoneDayPoint[] =>
        losses.map((loss, i) => ({
            day: i + 1, l2: 100, l3Sum: 0, hasData: true, loss,
            lossPct: loss, severity: 'good',
        }));

    it('counts consecutive strictly-increasing positive-loss days', () => {
        expect(risingLossStreak(pts([2, 5, 9, 14]), 4)).toBe(3);
    });
    it('breaks on a flat or falling day', () => {
        expect(risingLossStreak(pts([2, 9, 9, 14]), 4)).toBe(1);
        expect(risingLossStreak(pts([2, 9, 5, 14]), 4)).toBe(1);
    });
    it('breaks on a missing balance', () => {
        expect(risingLossStreak(pts([2, null, 9, 14]), 4)).toBe(1);
    });
    it('is zero when today is not a positive increase', () => {
        expect(risingLossStreak(pts([5, 3]), 2)).toBe(0);
    });
});

describe('detectSpike', () => {
    it('flags a reading ≥2× the trailing average and ≥5 m³ above it', () => {
        const v: DayValues = days(4, 5, 3, 20);
        const s = detectSpike(v, 4)!;
        expect(s).toBeTruthy();
        expect(s.avg).toBe(4);
        expect(s.value).toBe(20);
        expect(s.ratio).toBe(5);
    });
    it('requires at least 3 prior readings', () => {
        expect(detectSpike(days(4, 5, 20), 3)).toBeNull();
    });
    it('ignores small absolute jumps on quiet meters', () => {
        expect(detectSpike(days(0.5, 0.4, 0.6, 2), 4)).toBeNull();
    });
    it('returns null when the day itself is missing', () => {
        expect(detectSpike(days(4, 5, 3, null), 4)).toBeNull();
    });
});

describe('zeroStreak / wasActiveBefore', () => {
    it('counts trailing explicit zeros only', () => {
        const v = days(5, 0, 0, 0);
        expect(zeroStreak(v, 4)).toBe(3);
        expect(wasActiveBefore(v, 4, 3)).toBe(true);
    });
    it('treats null as missing, not zero', () => {
        expect(zeroStreak(days(5, 0, null, 0), 4)).toBe(1);
    });
    it('does not mark never-active meters', () => {
        const v = days(0, 0, 0, 0);
        expect(wasActiveBefore(v, 4, 4)).toBe(false);
    });
});

// ─── Exceptions register ──────────────────────────────────────────────────────

describe('buildDailyExceptions', () => {
    it('reports a high-loss zone with severity from the loss percentage', () => {
        const grid = buildDailyGrid([
            row(FM.l2Account, days(100)),
            row(FM.l3Accounts[0], days(60)),
        ]);
        const rows = buildDailyExceptions(grid, buildZoneDaySeries(grid), 1);
        const hit = rows.find(r => r.Category === 'High daily loss' && r.Item === 'Zone FM')!;
        expect(hit).toBeTruthy();
        expect(hit.Severity).toBe('Critical'); // 40% > 25%
    });

    it('reports a missing L2 reading when sub-meters recorded flow', () => {
        const grid = buildDailyGrid([row(FM.l3Accounts[0], days(60))]);
        const rows = buildDailyExceptions(grid, buildZoneDaySeries(grid), 1);
        expect(rows.some(r => r.Category === 'Missing L2 reading' && r.Item === 'Zone FM')).toBe(true);
    });

    it('reports a negative balance as critical', () => {
        const grid = buildDailyGrid([
            row(FM.l2Account, days(10)),
            row(FM.l3Accounts[0], days(60)),
        ]);
        const rows = buildDailyExceptions(grid, buildZoneDaySeries(grid), 1);
        expect(rows.some(r => r.Category === 'Negative balance' && r.Severity === 'Critical')).toBe(true);
    });

    it('reports the rising-loss leak signature', () => {
        const grid = buildDailyGrid([
            row(FM.l2Account, days(100, 100, 100, 100)),
            row(FM.l3Accounts[0], days(98, 95, 90, 85)),
        ]);
        const rows = buildDailyExceptions(grid, buildZoneDaySeries(grid), 4);
        const hit = rows.find(r => r.Category === 'Rising-loss signature')!;
        expect(hit).toBeTruthy();
        expect(hit.Severity).toBe('Critical');
    });

    it('reports building bulk vs ΣL4 mismatches', () => {
        const b = BUILDING_CONFIG[0];
        const grid = buildDailyGrid([
            row(b.bulkAccount, days(30)),
            row(b.l4Accounts[0], days(5)),
        ]);
        const rows = buildDailyExceptions(grid, buildZoneDaySeries(grid), 1);
        const hit = rows.find(r => r.Category === 'Building mismatch')!;
        expect(hit).toBeTruthy();
        expect(hit.Severity).toBe('Critical'); // 25 m³ > 15
        expect(hit.Item).toContain(b.buildingName);
    });

    it('reports meter spikes and zero-streaks with meter names', () => {
        const acc = FM.l3Accounts[0];
        const stuck = FM.l3Accounts[1];
        const grid = buildDailyGrid([
            row(acc, days(4, 5, 3, 20), 'Villa 1'),
            row(stuck, days(6, 0, 0, 0), 'Villa 2'),
        ]);
        const rows = buildDailyExceptions(grid, buildZoneDaySeries(grid), 4);
        expect(rows.some(r => r.Category === 'Consumption spike' && r.Item.includes('Villa 1'))).toBe(true);
        expect(rows.some(r => r.Category === 'Zero-streak' && r.Item.includes('Villa 2'))).toBe(true);
    });

    it('sorts critical rows before watch rows', () => {
        const b = BUILDING_CONFIG[0];
        const grid = buildDailyGrid([
            row(b.bulkAccount, days(12)),   // building diff 12 → Watch
            row(b.l4Accounts[0], days(0)),
            row(FM.l2Account, days(10)),    // negative balance → Critical
            row(FM.l3Accounts[0], days(60)),
        ]);
        const rows = buildDailyExceptions(grid, buildZoneDaySeries(grid), 1);
        const firstWatch = rows.findIndex(r => r.Severity === 'Watch');
        const lastCritical = rows.map(r => r.Severity).lastIndexOf('Critical');
        expect(lastCritical).toBeLessThan(firstWatch === -1 ? rows.length : firstWatch);
    });

    it('returns an empty register on a clean day', () => {
        const grid = buildDailyGrid([
            row(FM.l2Account, days(100)),
            row(FM.l3Accounts[0], days(98)),
        ]);
        expect(buildDailyExceptions(grid, buildZoneDaySeries(grid), 1)).toEqual([]);
    });
});
