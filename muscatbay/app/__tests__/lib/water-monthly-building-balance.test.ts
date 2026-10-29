import { describe, expect, it } from "vitest";

import type { WaterMeter } from "@/lib/water-data";
import { BUILDING_CONFIG } from "@/lib/water-accounts";
import { buildMonthlyData, computePeriod } from "@/lib/water-monthly-data";

/**
 * Monthly building balance uses the same rules as the Daily page
 * (lib/water-building-balance): bulk vs apartments + building common, and a
 * month only counts when every one of the building's meters was read.
 */

const D44 = BUILDING_CONFIG.find((b) => b.buildingName === "D-44")!;
const COMMON = D44.l4Accounts[0]; // 4300144 — D 44 Building Common Meter

const meter = (accountNumber: string, level: string, consumption: Record<string, number | null>): WaterMeter => ({
    label: accountNumber === D44.bulkAccount ? "D-44 Building Bulk Meter" : `Meter ${accountNumber}`,
    accountNumber,
    level,
    zone: "Zone_03_(A)",
    parentMeter: accountNumber === D44.bulkAccount ? "ZONE 3A (BULK ZONE 3A)" : "D-44 Building Bulk Meter",
    type: accountNumber === D44.bulkAccount ? "D_Building_Bulk" : "Residential (Apart)",
    consumption,
});

// Jan: bulk 100, seven meters × 10 = 70 → difference 30.
// Feb: bulk 100, one apartment unread → Feb cannot be compared.
const meters: WaterMeter[] = [
    meter(D44.bulkAccount, "L3", { "Jan-26": 100, "Feb-26": 100 }),
    ...D44.l4Accounts.map((a, i) => meter(a, "L4", { "Jan-26": 10, "Feb-26": i === 3 ? null : 10 })),
];

describe("computePeriod — building balance", () => {
    const data = buildMonthlyData(meters);
    const d44 = computePeriod(data, "2026", null).buildings.find((b) => b.name === "D-44")!;

    it("compares only the months where every meter of the building was read", () => {
        expect(d44.compared).toBe(1);
        expect(d44.periods).toBe(2);
        expect(d44.bulk).toBe(100);
        expect(d44.sub).toBe(70);
        expect(d44.loss).toBe(30);
        expect(d44.lossPct).toBe(30);
        expect(d44.status).toBe("possible-leak");
        expect(d44.zone).toBe("Zone 3A");
    });

    it("counts the building common meter among the individual meters", () => {
        const noCommon = buildMonthlyData(meters.filter((m) => m.accountNumber !== COMMON));
        const row = computePeriod(noCommon, "2026", null).buildingBalances.find((b) => b.buildingName === "D-44")!;
        expect(row.compared).toBe(0);
        expect(row.status).toBe("missing");
    });
});

describe("computePeriod — buildings with nothing to compare", () => {
    it("lists every configured building in the balance, as missing when its bulk has no data", () => {
        const data = buildMonthlyData(meters);
        const p = computePeriod(data, "2026", null);
        expect(p.buildingBalances).toHaveLength(BUILDING_CONFIG.length);
        expect(p.buildingBalances.find((b) => b.buildingName === "D-45")?.status).toBe("missing");
    });

    it("keeps unread buildings out of the legacy rows, so they never show as 0 m³", () => {
        const p = computePeriod(buildMonthlyData(meters), "2026", null);
        expect(p.buildings.map((b) => b.name)).toEqual(["D-44"]);
    });
});

describe("buildingExceptions", () => {
    it("lists buildings by their shared balance status, not a separate % rule", async () => {
        const { buildingExceptions } = await import("@/lib/water-monthly-data");
        const base = { zone: "Zone 3A", compared: 1, periods: 1 };
        const rows = buildingExceptions([
            { ...base, name: "D-1", bulk: 100, sub: 80, loss: 20, lossPct: 20, status: "possible-leak" },
            { ...base, name: "D-2", bulk: 10, sub: 6, loss: 4, lossPct: 40, status: "within" },
            { ...base, name: "D-3", bulk: 50, sub: 61, loss: -11, lossPct: -22, status: "bulk-suspect" },
        ]);
        expect(rows.map((r) => [r.Category, r.Item])).toEqual([
            ["High-loss building", "D-1"],
            ["Building bulk meter suspect", "D-3"],
        ]);
    });
});

describe("buildingExceptions severity", () => {
    it("never labels a possible leak as Normal", async () => {
        const { buildingExceptions } = await import("@/lib/water-monthly-data");
        const [row] = buildingExceptions([{ name: "D-1", zone: "Zone 3A", compared: 1, periods: 1, bulk: 100, sub: 88, loss: 12, lossPct: 12, status: "possible-leak" }]);
        expect(row.Severity).not.toBe("Normal");
    });
});
