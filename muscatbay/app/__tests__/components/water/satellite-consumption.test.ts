import { describe, expect, it } from "vitest";
import type { WaterMeter } from "@/lib/water-data";
import {
  buildConsumptionMeters,
  meterStatus,
  parseLocations,
  readSatelliteState,
  satelliteUrl,
  summariseMeters,
} from "@/components/water/satellite/consumptionModel";
import {
  dailyValue,
  latestRecordedDay,
  omanToday,
  parseDailyRows,
  shiftDay,
  validDate,
  type DailyMeterRow,
} from "@/components/water/satellite/dailyModel";
const meter = (
  account: string,
  level: WaterMeter["level"] = "L3",
): WaterMeter => ({
  accountNumber: account,
  label: account,
  level,
  zone: "Zone_05",
  parentMeter: "Bulk",
  type: "Villa",
  consumption: { "Sep-26": 9999 },
});
const row = (account: string, value: number | null): DailyMeterRow => ({
  account_number: account,
  month: "Sep-26",
  year: 2026,
  day_14: value,
});
describe("satellite daily consumption contract", () => {
  it("uses exact daily readings, preserving missing, zero, negative and decimal values", () => {
    const rows = buildConsumptionMeters(
      ["a", "b", "c", "d"].map((a) => meter(a)),
      "2026-09-14",
      [],
      [row("a", null), row("b", 0), row("c", 12.34), row("d", -2)],
    );
    expect(rows.map((m) => m.value)).toEqual([null, 0, 12.34, -2]);
    expect(summariseMeters(rows)).toMatchObject({
      total: 10.34,
      reporting: 3,
      partial: true,
      invalid: 1,
    });
  });
  it("never substitutes monthly totals for unavailable daily readings", () => {
    expect(
      buildConsumptionMeters([meter("a")], "2026-09-14", [])[0].value,
    ).toBeNull();
    expect(summariseMeters([]).total).toBeNull();
  });
  it("keeps previous calendar day and seven-day gaps across month boundaries", () => {
    const rows: DailyMeterRow[] = [
      { account_number: "a", month: "Aug-26", year: 2026, day_31: 7 },
      { ...row("a", null), day_1: 12 },
    ];
    const result = buildConsumptionMeters(
      [meter("a")],
      "2026-09-01",
      [],
      rows,
    )[0];
    expect(result.previous).toBe(7);
    expect(result.trend.map((p) => p.value)).toEqual([
      null,
      null,
      null,
      null,
      null,
      7,
      12,
    ]);
    expect(result.trend[0].date).toBe("2026-08-26");
    expect(shiftDay("2024-03-01", -1)).toBe("2024-02-29");
    expect(shiftDay("2026-01-01", -1)).toBe("2025-12-31");
  });
  it("rejects impossible and future days and defaults to yesterday in Oman", () => {
    expect(omanToday(new Date("2026-09-14T21:00:00Z"))).toBe("2026-09-15");
    expect(validDate("2026-02-30")).toBe(false);
    expect(validDate("2099-01-01")).toBe(false);
    expect(
      readSatelliteState("?period=May-24&date=bad", [meter("a")]).date,
    ).toBe(shiftDay(omanToday(), -1));
  });
  it("selects a latest recorded day only within the requested month and scope", () => {
    const rows = [
      { ...row("a", null), day_12: 0 },
      row("b", 40),
      { account_number: "a", month: "Aug-26", year: 2026, day_31: 9 },
    ];
    expect(latestRecordedDay(rows, new Set(["a"]), "2026-09-14")).toBe(
      "2026-09-12",
    );
    expect(dailyValue(rows[2], "2026-09-14")).toBeNull();
  });
  it("validates daily records and refuses duplicates or invalid values", () => {
    expect(parseDailyRows([row("a", 0)])[0].day_1).toBeNull();
    expect(parseDailyRows([{ ...row("a", 0), day_3: "1.32" }])[0].day_3).toBe(
      1.32,
    );
    expect(() => parseDailyRows([row("a", 0), row("a", 2)])).toThrow(
      "Duplicate",
    );
    expect(() =>
      parseDailyRows([{ ...row("a", 0), day_3: "invalid" }]),
    ).toThrow("valid number");
  });
  it("validates geometry and leaves unlocated meters unlocated", () => {
    const locations = parseLocations([
      { account: "a", coordinates: [58, 23], precision: "approximate" },
      { account: "b", coordinates: [NaN, 23] },
      { account: "c", coordinates: [58, 200] },
    ]);
    expect(locations).toHaveLength(1);
    const rows = buildConsumptionMeters(
      [meter("a"), meter("b")],
      "2026-09-14",
      locations,
    );
    expect(rows[0].location?.precision).toBe("approximate");
    expect(rows[1].location).toBeNull();
  });
  it("round-trips daily links and removes obsolete monthly state", () => {
    const meters = [meter("a", "L4")];
    const state = readSatelliteState(
      "?date=2026-09-14&meter=a&level=L1",
      meters,
    );
    expect(state).toMatchObject({
      date: "2026-09-14",
      meter: "a",
      zone: "Zone_05",
      level: "L4",
    });
    const url = satelliteUrl(
      "https://example.com/water?period=May-24&other=keep#section",
      state,
    );
    expect(
      readSatelliteState(new URL(url, "https://example.com").search, meters),
    ).toEqual(state);
    expect(url).not.toContain("period=");
    expect(url).toContain("other=keep");
  });
  describe("meter status", () => {
    const quiet = [1, 1.2, 0.8, 1, 1.1, 0.9, 1];
    it("keeps missing, negative and zero readings apart", () => {
      expect(meterStatus(null, quiet).status).toBe("missing");
      expect(meterStatus(-3, quiet).status).toBe("missing");
      expect(meterStatus(-3, quiet).statusNote).toContain("Negative");
      expect(meterStatus(0, quiet).status).toBe("zero");
      expect(meterStatus(1.3, quiet).status).toBe("normal");
    });
    it("flags high usage with the Daily report's spike rule (≥ 2× recent average and ≥ 5 m³ above it)", () => {
      expect(meterStatus(9, quiet).status).toBe("high");
      expect(meterStatus(9, quiet).statusNote).toContain("×9.0");
      expect(meterStatus(3, quiet).status).toBe("normal"); // 3× the average but only 2 m³ above it
      expect(meterStatus(9, [1, null, null]).status).toBe("normal"); // no baseline, no verdict
    });
    it("reads the status filter from the link and ignores an unknown one", () => {
      expect(readSatelliteState("?status=zero", []).status).toBe("zero");
      expect(readSatelliteState("?status=broken", []).status).toBe("");
    });
  });
});
