import { describe, expect, it } from "vitest";
import { summariseZoneBalance } from "@/components/water/satellite/zoneBalance";
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
  it("keeps recorded L3 consumption but withholds a difference when a reading is missing", () => {
    const result = summariseZoneBalance(
      [bulk(105), meter("a", "L3", 59.43), meter("b", "L3", null)],
      "Zone_05",
    );
    expect(result.l3.total).toBe(59.43);
    expect(result.l3.reporting).toBe(1);
    expect(result.difference).toBeNull();
    expect(result.unavailable).toContain("1 L3 reading(s) missing");
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
});
