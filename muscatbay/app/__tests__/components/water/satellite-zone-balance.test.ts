import { describe, expect, it } from "vitest";
import {
  summariseZoneBalance,
  summariseZoneLosses,
} from "@/components/water/satellite/zoneBalance";
import type { ConsumptionMeter } from "@/components/water/satellite/consumptionModel";
const meter = (
  account: string,
  level: ConsumptionMeter["level"],
  value: number | null,
  zone = "Zone_05",
): ConsumptionMeter => ({
  account,
  name: account,
  level,
  value,
  zone,
  zoneName: zone,
  parent: "Bulk",
  previous: null,
  trend: [],
  updatedAt: null,
  location: null,
  status: "normal",
  statusNote: "",
});
const bulk = (value: number | null) => meter("4300345", "L2", value);
describe("daily zone bulk versus L3 comparison", () => {
  it("uses the configured zone bulk and all L3 meters, excluding L1, L4 and direct connections", () => {
    const result = summariseZoneBalance(
      [
        bulk(139),
        meter("a", "L3", 60),
        meter("b", "L3", 5.14),
        meter("parent", "L1", 999),
        meter("child", "L4", 60),
        meter("direct", "DC", 100),
        meter("other", "L3", 500, "Zone_08"),
      ],
      "Zone_05",
    );
    expect(result.bulk).toBe(139);
    expect(result.l3.total).toBe(65.14);
    expect(result.count).toBe(2);
    expect(result.difference).toBeCloseTo(73.86);
  });
  // Owner ruling 2026-09-20: a silent L3 meter no longer blanks the zone. The
  // measured difference is shown and marked partial, as the Daily report does.
  it("shows the measured difference, marked partial, when an L3 reading is missing", () => {
    const result = summariseZoneBalance(
      [bulk(105), meter("a", "L3", 59.43), meter("b", "L3", null)],
      "Zone_05",
    );
    expect(result.l3.total).toBe(59.43);
    expect(result.l3.reporting).toBe(1);
    expect(result.difference).toBeCloseTo(45.57);
    expect(result.partial).toBe(true);
    expect(result.missing).toBe(1);
    expect(result.unavailable).toBe("");
  });
  it("has no difference at all when no L3 meter reported", () => {
    const result = summariseZoneBalance(
      [bulk(105), meter("a", "L3", null)],
      "Zone_05",
    );
    expect(result.difference).toBeNull();
    expect(result.partial).toBe(false);
  });
  it("does not substitute another bulk meter for the registered zone inlet", () => {
    const result = summariseZoneBalance(
      [meter("other-bulk", "L2", 100), meter("a", "L3", 60)],
      "Zone_05",
    );
    expect(result.bulk).toBeNull();
    expect(result.difference).toBeNull();
  });
  it("withholds missing bulk and negative source comparisons", () => {
    expect(
      summariseZoneBalance([bulk(null), meter("a", "L3", 1)], "Zone_05")
        .difference,
    ).toBeNull();
    expect(
      summariseZoneBalance([bulk(-1), meter("a", "L3", 1)], "Zone_05")
        .difference,
    ).toBeNull();
    expect(
      summariseZoneBalance([bulk(10), meter("a", "L3", -1)], "Zone_05")
        .difference,
    ).toBeNull();
  });
  it("preserves a zero balance and a negative difference without clamping", () => {
    expect(
      summariseZoneBalance([bulk(0), meter("a", "L3", 0)], "Zone_05")
        .difference,
    ).toBe(0);
    expect(
      summariseZoneBalance([bulk(4), meter("a", "L3", 5)], "Zone_05")
        .difference,
    ).toBe(-1);
  });
  it("requires a selected zone and non-empty L3 population", () => {
    expect(
      summariseZoneBalance([bulk(10), meter("a", "L3", 5)], "").difference,
    ).toBeNull();
    expect(summariseZoneBalance([bulk(10)], "Zone_05").difference).toBeNull();
    expect(
      summariseZoneBalance([bulk(10), bulk(10), meter("a", "L3", 5)], "Zone_05")
        .difference,
    ).toBeNull();
  });
  it("writes each zone's loss on the Daily report's scale, and never estimates one", () => {
    const losses = summariseZoneLosses([
      bulk(139),
      meter("a", "L3", 60),
      meter("b", "L3", 5),
      meter("4300342", "L2", null, "Zone_08"),
      meter("c", "L3", 16, "Zone_08"),
    ]);
    const zone5 = losses.find((z) => z.id === "Zone_05")!;
    expect(zone5.loss).toBe(74);
    expect(zone5.lossPct).toBeCloseTo(53.2, 1);
    expect(zone5.severity).toBe("critical");
    expect(zone5.label).toBe("Loss 74 m³ · 53% · Critical");
    // Zone 8's bulk reading is missing: the loss stays unknown, it is not 0.
    const zone8 = losses.find((z) => z.id === "Zone_08")!;
    expect(zone8.loss).toBeNull();
    expect(zone8.severity).toBe("nodata");
    expect(zone8.label).toBe("Loss — · bulk reading missing");
  });
});
