import { describe, expect, it } from "vitest";

import { BUILDING_CONFIG, ZONE_BULK_CONFIG, zoneBalanceAccounts } from "@/lib/water-accounts";
import { processReport } from "@/components/water/daily-report/report-data";
import {
    buildDailyGrid, buildZoneDaySeries, zoneMeterCoverage,
} from "@/components/water/daily-report/daily-metrics";
import { summariseWidgetWater, type WidgetWaterRow } from "@/lib/widget/water-summary";
import type { SupabaseDailyWaterConsumption } from "@/entities/water";

/**
 * Zone balance basis (owner ruling 2026-10-27): a zone bulk is compared with
 * every end-user meter it feeds — villas and other L3 meters, plus each
 * building's L4 meters (apartments + building common). Building bulks are
 * left out: several read wrong, and counting a bulk with its own L4s would
 * count the building twice.
 */

const zone = (name: string) => ZONE_BULK_CONFIG.find((z) => z.zoneName === name)!;
const Z3A = zone("Zone 3A");
const Z3B = zone("Zone 3B");
const D44 = BUILDING_CONFIG.find((b) => b.buildingName === "D-44")!;
const bulksIn = (z: typeof Z3A) => BUILDING_CONFIG.filter((b) => z.l3Accounts.includes(b.bulkAccount));
const VILLA_3A = Z3A.l3Accounts.find((a) => !bulksIn(Z3A).some((b) => b.bulkAccount === a))!;

describe("zoneBalanceAccounts", () => {
    it.each([["Zone 3A", Z3A], ["Zone 3B", Z3B]])("%s: building bulks out, their L4 meters in", (_, z) => {
        const accounts = zoneBalanceAccounts(z);
        const buildings = bulksIn(z);
        expect(buildings.length).toBeGreaterThan(0);
        for (const b of buildings) {
            expect(accounts).not.toContain(b.bulkAccount);
            for (const l4 of b.l4Accounts) expect(accounts).toContain(l4);
        }
        const otherL3 = z.l3Accounts.filter((a) => !buildings.some((b) => b.bulkAccount === a));
        for (const a of otherL3) expect(accounts).toContain(a);
        expect(new Set(accounts).size).toBe(accounts.length);
        expect(accounts.length).toBe(otherL3.length + buildings.reduce((s, b) => s + b.l4Accounts.length, 0));
    });

    it("leaves zones without buildings unchanged", () => {
        for (const z of ZONE_BULK_CONFIG.filter((x) => bulksIn(x).length === 0)) {
            expect(zoneBalanceAccounts(z)).toEqual(z.l3Accounts);
        }
    });
});

// Day 1: Zone 3A bulk 100, one villa 10, D-44 bulk reads a faulty 500, its
// seven L4 meters read 1 each. The balance must be 100 − (10 + 7), with the
// faulty bulk ignored.
const readings: Record<string, number | null> = {
    [Z3A.l2Account]: 100,
    [VILLA_3A]: 10,
    [D44.bulkAccount]: 500,
    ...Object.fromEntries(D44.l4Accounts.map((a) => [a, 1])),
};

const asRow = (account: string, v: number | null): SupabaseDailyWaterConsumption =>
    ({ account_number: account, meter_name: account, month: "Oct-26", day_1: v } as unknown as SupabaseDailyWaterConsumption);

describe("Zone 3A balance uses villas + L4", () => {
    it("processReport", () => {
        const row = processReport(readings).zoneRows.find((r) => r.zoneName === "Zone 3A")!;
        expect(row.l3Sum).toBe(17);
        expect(row.diff).toBe(83);
    });

    it("buildZoneDaySeries and zoneMeterCoverage", () => {
        const grid = buildDailyGrid(Object.entries(readings).map(([a, v]) => asRow(a, v)));
        const point = buildZoneDaySeries(grid).find((s) => s.zoneName === "Zone 3A")!.points[0];
        expect(point.l3Sum).toBe(17);
        expect(point.loss).toBe(83);
        const coverage = zoneMeterCoverage(grid, Z3A, 1);
        expect(coverage.configured).toBe(zoneBalanceAccounts(Z3A).length);
        expect(coverage.unread.map((m) => m.account)).not.toContain(D44.bulkAccount);
    });

    it("widget summary", () => {
        const rows = Object.entries(readings).map(([a, v]) => ({ account_number: a, day_1: v }) as WidgetWaterRow);
        const z = summariseWidgetWater(rows, "Oct-26", 2026)!.zones.find((x) => x.name === "Zone 3A")!;
        expect(z.metersM3).toBe(17);
        expect(z.metersTotal).toBe(zoneBalanceAccounts(Z3A).length);
        expect(z.metersRead).toBe(1 + D44.l4Accounts.length);
    });
});
