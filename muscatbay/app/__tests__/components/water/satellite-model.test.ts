import { describe, expect, it } from "vitest";

import type { WaterMeter } from "@/lib/water-data";
import type { DailyWaterConsumption } from "@/entities";
import {
    buildSatelliteConsumption,
    buildSatelliteDaily,
    buildSatellitePayload,
} from "@/components/water/satellite/satellite-model";

/**
 * Fixture: a miniature of the real register — one L1, two zone bulks, an L3
 * villa, an L3 building bulk with two L4 apartments, one DC, one N/A meter.
 * Values are chosen so every derived figure is hand-checkable.
 */
function meter(partial: Partial<WaterMeter> & Pick<WaterMeter, "label" | "accountNumber" | "level">): WaterMeter {
    return {
        id: partial.accountNumber,
        zone: "",
        parentMeter: "",
        type: "Residential (Villa)",
        consumption: {},
        ...partial,
    } as WaterMeter;
}

const METERS: WaterMeter[] = [
    meter({
        label: "Main Bulk (NAMA)", accountNumber: "C43659", level: "L1", zone: "Main Bulk",
        type: "Main BULK",
        consumption: { "Jan-26": 1000, "Feb-26": 1200, "Jul-26": 400 },
    }),
    meter({
        label: "ZONE 3A (BULK ZONE 3A)", accountNumber: "4300343", level: "L2", zone: "Zone_03_(A)",
        consumption: { "Jan-26": 300, "Feb-26": 350, "Jul-26": null },
    }),
    meter({
        label: "ZONE 5 (Bulk Zone 5)", accountNumber: "4300345", level: "L2", zone: "Zone_05",
        consumption: { "Jan-26": 200, "Feb-26": 180 },
    }),
    meter({
        label: "Z3-44 (Villa)", accountNumber: "4300002", level: "L3", zone: "Zone_03_(A)",
        parentMeter: "ZONE 3A (BULK ZONE 3A)",
        consumption: { "Jan-26": 40, "Feb-26": 50 },
    }),
    meter({
        label: "D-51 Building Bulk Meter", accountNumber: "4300185", level: "L3", zone: "Zone_03_(A)",
        parentMeter: "ZONE 3A (BULK ZONE 3A)", type: "D_Building_Bulk",
        consumption: { "Jan-26": 100, "Feb-26": 110 },
    }),
    meter({
        label: "Z3-51(1) (Building)", accountNumber: "4300111", level: "L4", zone: "Zone_03_(A)",
        parentMeter: "D-51 Building Bulk Meter", type: "Residential (Apart)",
        consumption: { "Jan-26": 30, "Feb-26": 35 },
    }),
    meter({
        label: "Z3-51(2) (Building)", accountNumber: "4300112", level: "L4", zone: "Zone_03_(A)",
        parentMeter: "D-51 Building Bulk Meter", type: "Residential (Apart)",
        consumption: { "Jan-26": 45, "Feb-26": 40 },
    }),
    meter({
        label: "Z5-1 (Villa)", accountNumber: "4300172", level: "L3", zone: "Zone_05",
        parentMeter: "ZONE 5 (Bulk Zone 5)",
        consumption: { "Jan-26": 60, "Feb-26": 70 },
    }),
    meter({
        label: "Hotel Main Building", accountNumber: "4300334", level: "DC", zone: "Direct Connection",
        type: "Retail",
        consumption: { "Jan-26": 400, "Feb-26": 500 },
    }),
    meter({
        label: "Irrigation Tank 01 (Outlet (TSE Water))", accountNumber: "4300322", level: "N/A", zone: "N/A",
        type: "N/A",
        consumption: { "Jan-26": 90 },
    }),
    // A stray meter from an older year must not add a month column.
    meter({
        label: "Old Meter", accountNumber: "9999999", level: "L3", zone: "Zone_05",
        parentMeter: "ZONE 5 (Bulk Zone 5)",
        consumption: { "Dec-25": 123 },
    }),
];

const DERIVED = [{ month: "Jul-26", throughDay: 22 }];

describe("buildSatelliteConsumption", () => {
    const built = buildSatelliteConsumption(METERS, DERIVED);
    if (!built) throw new Error("adapter returned null for a valid register");
    const c = built.consumption;

    it("orders months of the latest year and flags the derived one", () => {
        expect(c.months).toEqual(["Jan", "Feb", "Jul"]);
        expect(c.derived_idx).toEqual([2]);
        expect(c.period_label).toBe("January–July 2026");
        expect(c.period_short).toBe("Jan–Jul");
    });

    it("keeps L1 identity and total", () => {
        expect(c.l1.acct).toBe("C43659");
        expect(c.l1.total).toBe(2600);
        expect(c.l1.monthly).toEqual([1000, 1200, 400]);
    });

    it("builds the zone tree with L4 children under their building bulk", () => {
        expect(c.zones.map((z) => z.name)).toEqual(["Zone 3A", "Zone 5"]);
        const z3a = c.zones[0];
        expect(z3a.acct).toBe("4300343");
        expect(z3a.l2).toBe(650);
        // l3 total: villa 90 + building bulk 210 (L4s excluded — counting them
        // as well would count every building twice)
        expect(z3a.l3).toBe(300);
        expect(z3a.nL3).toBe(2);
        expect(z3a.nL4).toBe(2);
        const bulk = z3a.meters.find((m) => m.acct === "4300185");
        expect(bulk?.children?.length).toBe(2);
        expect(bulk?.kids_m3).toBe(150);
        expect(bulk?.sub_loss).toBe(60);
    });

    it("null-preserves months with no reading (never zero-fills a display slot)", () => {
        const z3a = c.zones[0];
        expect(z3a.ml2).toEqual([300, 350, null]);
        // no L3 recorded July → slot stays null
        expect(z3a.ml3[2]).toBeNull();
    });

    it("computes stage-1 balance the way the master-view compilation did", () => {
        // Jan: 1000 − (300+200) − 400 = 100 ; Feb: 1200 − 530 − 500 = 170 ; Jul: 400 − 0 − 0 = 400
        expect(c.stage1_monthly).toEqual([100, 170, 400]);
        expect(c.stage1_spread).toEqual([10, 100]);
    });

    it("routes DC and N/A meters out of the zone tree", () => {
        expect(c.dc.map((d) => d.acct)).toEqual(["4300334"]);
        expect(c.na.map((d) => d.acct)).toEqual(["4300322"]);
        expect(c.counts).toMatchObject({ L1: 1, L2: 2, L3: 4, L4: 2, DC: 1 });
        expect(c.total_meters).toBe(METERS.length);
    });

    it("reports unparented L4s instead of dropping them silently", () => {
        const orphanRegister = [
            ...METERS,
            meter({
                label: "Z9-9(9)", accountNumber: "4300999", level: "L4", zone: "Zone_05",
                parentMeter: "A Bulk That Does Not Exist",
                consumption: { "Jan-26": 5 },
            }),
        ];
        const res = buildSatelliteConsumption(orphanRegister, []);
        expect(res?.unparented).toHaveLength(1);
        expect(res?.unparented[0]).toContain("4300999");
    });
});

describe("buildSatelliteDaily", () => {
    function dailyRow(month: string, year: number, readings: Record<number, number | null>): DailyWaterConsumption {
        return {
            id: 1, meterName: "Main Bulk (NAMA)", accountNumber: "C43659", label: "L1",
            zone: "Main Bulk", parentMeter: "", type: "Main BULK", month, year,
            dailyReadings: readings,
        };
    }

    it("distinguishes a mid-month gap from a month still in progress", () => {
        const june: Record<number, number | null> = {};
        for (let d = 1; d <= 30; d++) june[d] = d === 9 || d === 10 ? null : 100;
        const july: Record<number, number | null> = {};
        for (let d = 1; d <= 31; d++) july[d] = d <= 22 ? 50 : null;

        const out = buildSatelliteDaily([dailyRow("Jun-26", 2026, june), dailyRow("Jul-26", 2026, july)]);
        expect(out.map((m) => m.key)).toEqual(["2026-06", "2026-07"]);

        const [jun, jul] = out;
        expect(jun.days).toBe(30);
        expect(jun.logged).toBe(28);
        expect(jun.total).toBe(2800);
        expect(jun.gaps).toEqual([9, 10]);
        expect(jun.partial).toBe(false);

        expect(jul.logged).toBe(22);
        expect(jul.gaps).toEqual([]);
        expect(jul.partial).toBe(true);
    });

    it("emits only the L1 series", () => {
        const zoneRow = { ...dailyRow("Jun-26", 2026, { 1: 10 }), label: "L2" };
        const out = buildSatelliteDaily([zoneRow]);
        expect(out).toEqual([]);
    });
});

describe("buildSatellitePayload", () => {
    it("returns null when the register has no months (nothing is fabricated)", () => {
        expect(buildSatellitePayload([meter({ label: "x", accountNumber: "1", level: "L1" })], [], [])).toBeNull();
    });
});
