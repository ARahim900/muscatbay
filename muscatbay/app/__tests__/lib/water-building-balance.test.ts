import { describe, expect, it } from "vitest";

import type { BuildingConfig } from "@/lib/water-accounts";
import { balanceBuilding, periodDifferences } from "@/lib/water-building-balance";

/**
 * Building balance (owner ruling 2026-10-29): a building bulk meter is compared
 * with the sum of its own individual meters (apartments + building common), so
 * a leak on the pipe between them shows up. A period only counts when the bulk
 * and every individual meter have a reading — a missing reading is never zero.
 */

const B: BuildingConfig = { buildingName: "D-99", zone: "3A", bulkAccount: "BULK", l4Accounts: ["A1", "A2", "COMMON"] };

const reader = (series: Record<string, (number | null)[]>) => (account: string) => series[account];

describe("balanceBuilding", () => {
    it("compares only periods where the bulk and every individual meter were read", () => {
        const r = balanceBuilding(B, reader({
            BULK: [10, 10, 10],
            A1: [3, null, 3],
            A2: [3, 3, 3],
            COMMON: [1, 1, 1],
        }), 3);
        expect(r.compared).toBe(2);
        expect(r.periods).toBe(3);
        expect(r.bulk).toBe(20);
        expect(r.individuals).toBe(14);
        expect(r.difference).toBe(6);
        expect(r.differencePct).toBe(30);
    });

    it("treats a meter missing from the data as unread, not as zero", () => {
        const r = balanceBuilding(B, reader({ BULK: [10, 10], A1: [3, 3], A2: [3, 3] }), 2);
        expect(r.compared).toBe(0);
        expect(r.status).toBe("missing");
        expect(r.bulk).toBeNull();
        expect(r.difference).toBeNull();
    });

    it("flags a possible leak when the gap exceeds 5 m³ and 10% of the bulk", () => {
        const leak = balanceBuilding(B, reader({ BULK: [100], A1: [40], A2: [40], COMMON: [5] }), 1);
        expect(leak.difference).toBe(15);
        expect(leak.status).toBe("possible-leak");

        const within = balanceBuilding(B, reader({ BULK: [100], A1: [45], A2: [45], COMMON: [1] }), 1);
        expect(within.difference).toBe(9);
        expect(within.status).toBe("within");

        // Small building: the 5 m³ floor applies, not 10% of the bulk.
        const small = balanceBuilding(B, reader({ BULK: [20], A1: [7], A2: [7], COMMON: [1] }), 1);
        expect(small.difference).toBe(5);
        expect(small.status).toBe("within");
    });

    it("marks the bulk meter suspect when it reads well below its individual meters", () => {
        const r = balanceBuilding(B, reader({ BULK: [50], A1: [40], A2: [20], COMMON: [1] }), 1);
        expect(r.difference).toBe(-11);
        expect(r.status).toBe("bulk-suspect");
    });

    it("marks the bulk meter suspect when it has a negative reading on a compared period", () => {
        const r = balanceBuilding(B, reader({ BULK: [-700, 800], A1: [3, 3], A2: [3, 3], COMMON: [1, 1] }), 2);
        expect(r.status).toBe("bulk-suspect");
    });
});

describe("periodDifferences", () => {
    it("returns bulk minus individuals per period, and null where any meter is unread", () => {
        const d = periodDifferences(B, reader({
            BULK: [10, 10, null],
            A1: [3, null, 3],
            A2: [3, 3, 3],
            COMMON: [1, 1, 1],
        }), 3);
        expect(d).toEqual([3, null, null]);
    });
});

describe("zoneBuildingBalances (Daily)", () => {
    it("compares each Zone 3A building over the days the zone has data, skipping unread days", async () => {
        const { BUILDING_CONFIG, ZONE_BULK_CONFIG } = await import("@/lib/water-accounts");
        const { buildDailyGrid, zoneBuildingBalances } = await import("@/components/water/daily-report/daily-metrics");
        const z3a = ZONE_BULK_CONFIG.find((z) => z.zoneName === "Zone 3A")!;
        const d44 = BUILDING_CONFIG.find((b) => b.buildingName === "D-44")!;
        // Days 1–2: bulk 10, seven meters × 1 = 7. Day 2: one flat unread. Day 3: bulk only.
        const row = (account: string, days: (number | null)[]) =>
            ({ account_number: account, meter_name: account, month: "Oct-26", day_1: days[0], day_2: days[1], day_3: days[2] }) as never;
        const grid = buildDailyGrid([
            row(d44.bulkAccount, [10, 10, 10]),
            ...d44.l4Accounts.map((a, i) => row(a, [1, i === 2 ? null : 1, null])),
        ]);
        const rows = zoneBuildingBalances(grid, z3a);
        expect(rows).toHaveLength(BUILDING_CONFIG.filter((b) => b.zone === "3A").length);
        const r = rows.find((x) => x.buildingName === "D-44")!;
        expect(r.periods).toBe(3);
        expect(r.compared).toBe(1);
        expect(r.difference).toBe(3);
    });
});
