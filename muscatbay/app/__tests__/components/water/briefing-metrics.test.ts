import { describe, it, expect } from 'vitest';
import { computeBriefing } from '@/components/water/daily-report/briefing-metrics';
import type { ReportData, ZoneRow } from '@/components/water/daily-report/inline-shared';

function zone(zoneName: string, diff: number | null, isHighLoss: boolean): ZoneRow {
    return { zoneName, l2Account: 'x', l2Value: 100, l3Sum: 80, diff, isNullL2: false, isHighLoss };
}

function report(over: Partial<ReportData>): ReportData {
    return {
        zoneRows: [], buildingRows: [], dcRows: [],
        l2Total: 0, l3Total: 0, dcTotal: 0, grandTotal: 0,
        ...over,
    };
}

describe('computeBriefing', () => {
    it('derives total supply, loss m³ and loss %', () => {
        const today = report({ l2Total: 1000, l3Total: 850, dcTotal: 200, grandTotal: 1200 });
        const m = computeBriefing(today, null);
        expect(m.totalSupply).toBe(1200);
        expect(m.lossM3).toBe(150);
        expect(m.lossPct).toBe(15);
    });

    it('counts alarm zones and lists their names', () => {
        const today = report({
            l2Total: 1000, l3Total: 850, grandTotal: 1000,
            zoneRows: [zone('Zone_03A', 30, true), zone('Zone_01', 5, false), zone('Zone_05', 40, true)],
        });
        const m = computeBriefing(today, null);
        expect(m.alarmCount).toBe(2);
        expect(m.alarmZones).toEqual(['Zone_03A', 'Zone_05']);
        expect(m.status).toBe('warning');
    });

    it('reports status normal when no zone is in high loss', () => {
        const today = report({ zoneRows: [zone('Zone_01', 5, false)] });
        expect(computeBriefing(today, null).status).toBe('normal');
    });

    it('computes day-over-day percent change when yesterday exists', () => {
        const today = report({ grandTotal: 1100 });
        const yesterday = report({ grandTotal: 1000 });
        expect(computeBriefing(today, yesterday).vsYesterdayPct).toBe(10);
    });

    it('returns null vsYesterdayPct when there is no yesterday (day 1)', () => {
        expect(computeBriefing(report({ grandTotal: 1100 }), null).vsYesterdayPct).toBeNull();
    });

    it('returns null vsYesterdayPct when yesterday total is zero (no divide-by-zero)', () => {
        expect(computeBriefing(report({ grandTotal: 1100 }), report({ grandTotal: 0 })).vsYesterdayPct).toBeNull();
    });

    it('returns null lossPct when l2Total is zero (no divide-by-zero)', () => {
        expect(computeBriefing(report({ l2Total: 0, l3Total: 0 }), null).lossPct).toBeNull();
    });
});
