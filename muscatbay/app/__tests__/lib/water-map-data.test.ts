import { describe, it, expect } from "vitest";
import {
    buildMonthlyMapSnapshot,
    buildDailyMapSnapshot,
    severityFromLossPct,
    monthlyPeriodsFromMeters,
} from "@/lib/water-map-data";
import type { WaterMeter } from "@/lib/water-data";
import type { SupabaseDailyWaterConsumption } from "@/entities/water";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function meter(m: Partial<WaterMeter> & Pick<WaterMeter, "accountNumber" | "level" | "zone">): WaterMeter {
    return {
        id: m.accountNumber,
        label: m.label ?? `Meter ${m.accountNumber}`,
        accountNumber: m.accountNumber,
        level: m.level,
        zone: m.zone,
        parentMeter: m.parentMeter ?? "",
        type: m.type ?? "Residential (Villa)",
        consumption: m.consumption ?? {},
    };
}

/** Minimal raw daily row with readings for the first N days. */
function drow(
    account: string,
    label: string,
    zone: string,
    readings: (number | null)[],
): SupabaseDailyWaterConsumption {
    const base = {
        id: 1,
        meter_name: `Meter ${account}`,
        account_number: account,
        label,
        zone,
        parent_meter: null,
        type: "Residential",
        month: "Mar-26",
        year: 2026,
    } as unknown as SupabaseDailyWaterConsumption;
    for (let d = 1; d <= 31; d++) {
        (base as unknown as Record<string, number | null>)[`day_${d}`] = readings[d - 1] ?? null;
    }
    return base;
}

// ─── Monthly ────────────────────────────────────────────────────────────────

describe("buildMonthlyMapSnapshot", () => {
    const meters: WaterMeter[] = [
        meter({ accountNumber: "C43659", level: "L1", zone: "Main Bulk", type: "Main BULK", label: "Main Bulk (NAMA)", consumption: { "Jun-26": 1000 } }),
        meter({ accountNumber: "4300343", level: "L2", zone: "Zone_03_(A)", type: "Zone Bulk", label: "ZONE 3A (BULK)", consumption: { "Jun-26": 500 } }),
        meter({ accountNumber: "V1", level: "L3", zone: "Zone_03_(A)", type: "Residential (Villa)", consumption: { "Jun-26": 300 } }),
        meter({ accountNumber: "V2", level: "L3", zone: "Zone_03_(A)", type: "Retail", consumption: { "Jun-26": 100 } }),
    ];

    it("computes the per-zone balance from the real engines", () => {
        const snap = buildMonthlyMapSnapshot(meters, "2026", 5); // Jun (index 5)
        const z3a = snap.zones.find((z) => z.id === "3A")!;
        expect(z3a.bulk).toBe(500);
        expect(z3a.downstream).toBe(400);
        expect(z3a.loss).toBe(100);
        expect(z3a.lossPct).toBeCloseTo(20, 1);
        expect(z3a.efficiency).toBeCloseTo(80, 1);
        expect(z3a.meterCount).toBe(2);
        expect(z3a.missingCount).toBe(0);
        expect(z3a.abnormalCount).toBe(0);
        expect(z3a.severity).toBe("watch"); // 10 ≤ 20 < 25
        expect(z3a.hasData).toBe(true);
    });

    it("reports the network totals and the real main bulk", () => {
        const snap = buildMonthlyMapSnapshot(meters, "2026", 5);
        expect(snap.totals.bulk).toBe(1000); // A1 (NAMA)
        expect(snap.totals.downstream).toBe(400); // A3
        expect(snap.totals.loss).toBe(600);
        expect(snap.totals.distributionLevel).toBe(false);
        expect(snap.mainBulk?.value).toBe(1000);
        expect(snap.provisionalPositions).toBe(true);
        expect(snap.mode).toBe("monthly");
    });

    it("always covers the five required zones (empty when no data)", () => {
        const snap = buildMonthlyMapSnapshot(meters, "2026", 5);
        for (const id of ["3A", "3B", "05", "08", "VS"]) {
            expect(snap.zones.some((z) => z.id === id)).toBe(true);
        }
        const z3b = snap.zones.find((z) => z.id === "3B")!;
        expect(z3b.hasData).toBe(false);
        expect(z3b.bulk).toBe(0);
    });

    it("is safe when the zone bulk is zero (no division error, efficiency 0)", () => {
        const zero: WaterMeter[] = [
            meter({ accountNumber: "4300343", level: "L2", zone: "Zone_03_(A)", type: "Zone Bulk", consumption: { "Jun-26": 0 } }),
            meter({ accountNumber: "V1", level: "L3", zone: "Zone_03_(A)", type: "Residential (Villa)", consumption: { "Jun-26": 50 } }),
        ];
        const snap = buildMonthlyMapSnapshot(zero, "2026", 5);
        const z3a = snap.zones.find((z) => z.id === "3A")!;
        expect(z3a.efficiency).toBe(0);
        expect(Number.isFinite(z3a.lossPct)).toBe(true);
        expect(Number.isFinite(z3a.loss)).toBe(true);
        expect(Number.isNaN(z3a.efficiency)).toBe(false);
    });

    it("flags a missing reading in the zone counts", () => {
        const withMissing: WaterMeter[] = [
            meter({ accountNumber: "4300343", level: "L2", zone: "Zone_03_(A)", type: "Zone Bulk", consumption: { "Jun-26": 500 } }),
            meter({ accountNumber: "V1", level: "L3", zone: "Zone_03_(A)", type: "Residential (Villa)", consumption: { "Jun-26": 300 } }),
            meter({ accountNumber: "V2", level: "L3", zone: "Zone_03_(A)", type: "Retail", consumption: { "Jun-26": null } }),
        ];
        const snap = buildMonthlyMapSnapshot(withMissing, "2026", 5);
        const z3a = snap.zones.find((z) => z.id === "3A")!;
        expect(z3a.missingCount).toBe(1);
    });
});

describe("monthlyPeriodsFromMeters", () => {
    it("lists only months with readings, ascending", () => {
        const meters: WaterMeter[] = [
            meter({ accountNumber: "V1", level: "L3", zone: "Zone_03_(A)", consumption: { "Apr-26": 10, "Jun-26": 20 } }),
        ];
        const periods = monthlyPeriodsFromMeters(meters);
        expect(periods.map((p) => p.periodKey)).toEqual(["2026-04", "2026-06"]);
        expect(periods[1].label).toBe("Jun 2026");
    });
});

// ─── Daily ────────────────────────────────────────────────────────────────────

describe("buildDailyMapSnapshot", () => {
    // Real Zone FM accounts: L2 bulk 4300346, L3 4300296 + 4300298.
    const rows: SupabaseDailyWaterConsumption[] = [
        drow("4300346", "L2", "Zone_FM", [100]),
        drow("4300296", "L3", "Zone_FM", [40]),
        drow("4300298", "L3", "Zone_FM", [30]),
    ];

    it("computes the distribution balance for the selected day", () => {
        const snap = buildDailyMapSnapshot(rows, "Mar-26", 2026, 1);
        const fm = snap.zones.find((z) => z.id === "FM")!;
        expect(fm.bulk).toBe(100);
        expect(fm.downstream).toBe(70);
        expect(fm.loss).toBe(30);
        expect(fm.lossPct).toBeCloseTo(30, 1);
        expect(fm.severity).toBe("high"); // 25 ≤ 30 < 50
        expect(snap.totals.distributionLevel).toBe(true);
        expect(snap.totals.bulk).toBe(100);
        expect(snap.mode).toBe("daily");
        expect(snap.periodLabel).toBe("Mar 1, 2026");
    });

    it("is safe with no rows", () => {
        const snap = buildDailyMapSnapshot([], "Mar-26", 2026, 1);
        expect(snap.hasData).toBe(false);
        expect(snap.totals.bulk).toBe(0);
        expect(Number.isNaN(snap.totals.lossPct)).toBe(false);
    });
});

// ─── Severity mapping ──────────────────────────────────────────────────────────

describe("severityFromLossPct", () => {
    it("mirrors the monthly sev() bands", () => {
        expect(severityFromLossPct(5, true)).toBe("good");
        expect(severityFromLossPct(20, true)).toBe("watch");
        expect(severityFromLossPct(30, true)).toBe("high");
        expect(severityFromLossPct(60, true)).toBe("critical");
    });
    it("returns nodata when there is no data or the balance is negative", () => {
        expect(severityFromLossPct(5, false)).toBe("nodata");
        expect(severityFromLossPct(-5, true)).toBe("nodata");
        expect(severityFromLossPct(null, true)).toBe("nodata");
    });
});
