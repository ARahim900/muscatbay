import { describe, it, expect } from 'vitest';
import { buildSupplyMatrix, supplyDaySnapshot } from '@/components/water/daily-report/supply-reconciliation';
import {
    ZONE_BULK_CONFIG, DC_METERS, MAIN_BULK_ACCOUNT, TSE_IRRIGATION_METERS,
} from '@/lib/water-accounts';
import type { SupabaseDailyWaterConsumption } from '@/entities/water';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function row(account: string, readings: (number | null)[]): SupabaseDailyWaterConsumption {
    const base = {
        id: 1, meter_name: `Meter ${account}`, account_number: account, label: 'L2',
        zone: 'Zone FM', parent_meter: null, type: 'Zone Bulk', month: 'Sep-26', year: 2026,
    } as unknown as SupabaseDailyWaterConsumption;
    for (let d = 1; d <= 31; d++) {
        (base as unknown as Record<string, number | null>)[`day_${d}`] = readings[d - 1] ?? null;
    }
    return base;
}

/** Every zone bulk reads 10 and every DC reads 5 on days 1–2. */
function fullMonth(): SupabaseDailyWaterConsumption[] {
    return [
        row(MAIN_BULK_ACCOUNT, [200, 200]),
        ...ZONE_BULK_CONFIG.map(z => row(z.l2Account, [10, 10])),
        ...DC_METERS.map(dc => row(dc.account, [5, 5])),
    ];
}

const ZONE_COUNT = ZONE_BULK_CONFIG.length;
const DC_COUNT = DC_METERS.length;

// ─── Account configuration ────────────────────────────────────────────────────

describe('supply account configuration', () => {
    it('keeps TSE irrigation out of the direct connections', () => {
        const dcAccounts = DC_METERS.map(m => m.account);
        for (const tse of TSE_IRRIGATION_METERS) {
            expect(dcAccounts).not.toContain(tse.account);
        }
        // The registry classes these four as label "N/A" precisely because they
        // run on treated effluent, not NAMA supply.
        expect(TSE_IRRIGATION_METERS.map(m => m.account))
            .toEqual(['4300322', '4300340', '4300341', '4300347']);
    });

    it('has one row per Direct_Connection meter in the registry and no duplicates', () => {
        expect(DC_METERS).toHaveLength(9);
        expect(new Set(DC_METERS.map(m => m.account)).size).toBe(9);
        // A zone bulk must never double as a direct connection.
        for (const z of ZONE_BULK_CONFIG) {
            expect(DC_METERS.map(m => m.account)).not.toContain(z.l2Account);
        }
    });
});

// ─── Matrix ───────────────────────────────────────────────────────────────────

describe('buildSupplyMatrix', () => {
    it('lists the main bulk, every zone bulk and every direct connection', () => {
        const m = buildSupplyMatrix(fullMonth());
        expect(m.main?.account).toBe(MAIN_BULK_ACCOUNT);
        expect(m.zones.map(z => z.account)).toEqual(ZONE_BULK_CONFIG.map(z => z.l2Account));
        expect(m.dcs.map(d => d.account)).toEqual(DC_METERS.map(d => d.account));
    });

    it('makes the combined line the sum of the two subtotals, day by day', () => {
        const m = buildSupplyMatrix(fullMonth());
        expect(m.latestDay).toBe(2);
        expect(m.zoneTotals.dailyValues).toEqual([ZONE_COUNT * 10, ZONE_COUNT * 10]);
        expect(m.dcTotals.dailyValues).toEqual([DC_COUNT * 5, DC_COUNT * 5]);
        for (let i = 0; i < m.latestDay; i++) {
            expect(m.combined.dailyValues[i])
                .toBe(m.zoneTotals.dailyValues[i] + m.dcTotals.dailyValues[i]);
        }
        expect(m.combined.total).toBe(m.zoneTotals.total + m.dcTotals.total);
    });

    it('computes trunk loss as main bulk minus the combined line', () => {
        const m = buildSupplyMatrix(fullMonth());
        const expected = 200 - (ZONE_COUNT * 10 + DC_COUNT * 5);
        expect(m.trunkLoss).toEqual([expected, expected]);
        expect(m.trunkLossTotal).toBe(expected * 2);
        expect(m.mainBulkComparableTotal).toBe(400);
    });

    it('gaps the trunk loss on days with no main-bulk reading instead of assuming zero supply', () => {
        const data = fullMonth().map(r => (
            r.account_number === MAIN_BULK_ACCOUNT ? row(MAIN_BULK_ACCOUNT, [null, 200]) : r
        ));
        const m = buildSupplyMatrix(data);
        expect(m.main?.dailyValues[0]).toBeNull();
        expect(m.trunkLoss[0]).toBeNull();
        expect(m.trunkLoss[1]).toBe(200 - (ZONE_COUNT * 10 + DC_COUNT * 5));
        // The month-to-date figures only cover the day that was comparable.
        expect(m.mainBulkComparableTotal).toBe(200);
    });

    it('returns a null main bulk when the month has no L1 rows at all', () => {
        const data = fullMonth().filter(r => r.account_number !== MAIN_BULK_ACCOUNT);
        const m = buildSupplyMatrix(data);
        expect(m.main).toBeNull();
        expect(m.trunkLoss).toEqual([null, null]);
        expect(m.trunkLossTotal).toBeNull();
        expect(m.mainBulkComparableTotal).toBeNull();
    });

    it('keeps a missing reading null on the meter row while counting it as unread', () => {
        const data = fullMonth().map(r => (
            r.account_number === ZONE_BULK_CONFIG[0].l2Account
                ? row(ZONE_BULK_CONFIG[0].l2Account, [null, 10])
                : r
        ));
        const m = buildSupplyMatrix(data);
        const zone = m.zones[0];
        expect(zone.dailyValues[0]).toBeNull();
        expect(zone.unreadDays).toBe(1);
        expect(zone.total).toBe(10);
        expect(m.zoneTotals.unreadPerDay[0]).toBe(1);
        expect(m.zoneTotals.unreadPerDay[1]).toBe(0);
        // Subtotal still sums the meters that did report — 0 for the silent one.
        expect(m.zoneTotals.dailyValues[0]).toBe((ZONE_COUNT - 1) * 10);
    });

    it('keeps an explicit zero distinct from a missing reading', () => {
        const data = fullMonth().map(r => (
            r.account_number === DC_METERS[0].account ? row(DC_METERS[0].account, [0, 5]) : r
        ));
        const m = buildSupplyMatrix(data);
        expect(m.dcs[0].dailyValues[0]).toBe(0);
        expect(m.dcs[0].unreadDays).toBe(0);
        expect(m.dcs[0].total).toBe(5);
    });

    it('gives a meter with no rows at all a null total, not zero', () => {
        const data = fullMonth().filter(r => r.account_number !== DC_METERS[0].account);
        const m = buildSupplyMatrix(data);
        expect(m.dcs[0].total).toBeNull();
        expect(m.dcs[0].dailyValues.every(v => v === null)).toBe(true);
    });

    it('derives latestDay from the supply meters only', () => {
        // A child meter with a late reading must not stretch the supply table.
        const data = [...fullMonth(), row('4300351', Array.from({ length: 20 }, () => 1))];
        expect(buildSupplyMatrix(data).latestDay).toBe(2);
    });

    it('never falls below day 1, even with no data', () => {
        const m = buildSupplyMatrix([]);
        expect(m.latestDay).toBe(1);
        expect(m.days).toEqual([1]);
        expect(m.combined.dailyValues).toEqual([0]);
    });
});

// ─── Day snapshot ─────────────────────────────────────────────────────────────

describe('supplyDaySnapshot', () => {
    it('reports the figures behind the three gauges', () => {
        const s = supplyDaySnapshot(buildSupplyMatrix(fullMonth()), 1);
        expect(s.zoneTotal).toBe(ZONE_COUNT * 10);
        expect(s.dcTotal).toBe(DC_COUNT * 5);
        expect(s.combined).toBe(ZONE_COUNT * 10 + DC_COUNT * 5);
        expect(s.mainBulk).toBe(200);
        expect(s.trunkLoss).toBe(200 - s.combined);
        expect(s.trunkLossPct).toBeCloseTo(((200 - s.combined) / 200) * 100, 2);
        expect(s.zonesRead).toBe(ZONE_COUNT);
        expect(s.dcRead).toBe(DC_COUNT);
    });

    it('reports read coverage so a partial total is not read as a full one', () => {
        const data = fullMonth().map(r => (
            r.account_number === ZONE_BULK_CONFIG[0].l2Account
                ? row(ZONE_BULK_CONFIG[0].l2Account, [null, 10])
                : r
        ));
        const s = supplyDaySnapshot(buildSupplyMatrix(data), 1);
        expect(s.zonesRead).toBe(ZONE_COUNT - 1);
        expect(s.zoneCount).toBe(ZONE_COUNT);
        expect(s.combined).toBe((ZONE_COUNT - 1) * 10 + DC_COUNT * 5);
    });

    it('leaves trunk loss null and percentages null when the main bulk is unread', () => {
        const data = fullMonth().filter(r => r.account_number !== MAIN_BULK_ACCOUNT);
        const s = supplyDaySnapshot(buildSupplyMatrix(data), 1);
        expect(s.mainBulk).toBeNull();
        expect(s.trunkLoss).toBeNull();
        expect(s.trunkLossPct).toBeNull();
    });

    it('treats a day beyond the loaded range as unread, not as zero consumption', () => {
        const s = supplyDaySnapshot(buildSupplyMatrix(fullMonth()), 20);
        expect(s.mainBulk).toBeNull();
        expect(s.zonesRead).toBe(0);
        expect(s.dcRead).toBe(0);
        expect(s.trunkLoss).toBeNull();
    });
});
