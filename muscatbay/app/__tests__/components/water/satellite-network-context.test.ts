// @vitest-environment node
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";
interface Context {
  positions: { account: string; coordinates: number[]; precision: string }[];
  zones: Record<string, number[][]>;
  connections: {
    properties: { account: string; schematic: boolean };
    geometry: { coordinates: number[][] };
  }[];
}
function loadContext(): Context {
  const window = {} as { SATELLITE_CONTEXT: Context };
  const sandbox = { window, console };
  for (const file of [
    "data/plots-geo.js",
    "data/assets.js",
    "data/network.js",
    "data/network-road-corrections.js",
    "data/zone-fm-network.js",
    "data/network-service-zones.js",
    "network-context.js",
  ])
    runInNewContext(readFileSync(`public/satellite/${file}`, "utf8"), sandbox);
  return window.SATELLITE_CONTEXT;
}
describe("restored network geography", () => {
  it("maps the FM bulk and every current FM L3 building with schematic connections", () => {
    const context = loadContext();
    const fmAccounts = [
      "4300300",
      "4300301",
      "4300302",
      "4300303",
      "4300304",
      "4300305",
      "4300306",
      "4300307",
      "4300324",
      "4300296",
      "4300325",
      "4300298",
      "4300308",
      "4300309",
      "4300310",
      "4300337",
      "4300339",
    ];
    expect(
      context.positions.find((p) => p.account === "4300346")?.coordinates,
    ).toEqual([58.6333192, 23.5414327]);
    expect(context.connections.map((c) => c.properties.account).sort()).toEqual(
      fmAccounts.sort(),
    );
    for (const link of context.connections) {
      const position = context.positions.find(
        (p) => p.account === link.properties.account,
      );
      expect(link.properties.schematic).toBe(true);
      expect(link.geometry.coordinates[1]).toEqual(position?.coordinates);
      expect(position?.precision).toContain("not surveyed");
      expect(link.geometry.coordinates.flat().every(Number.isFinite)).toBe(
        true,
      );
    }
    expect(context.positions.some((p) => p.account === "4300409")).toBe(false);
  });
  it("keeps geography for zones independent of daily readings and map level", () => {
    const context = loadContext();
    for (const zone of [
      "Zone_01_(FM)",
      "Zone_03_(A)",
      "Zone_03_(B)",
      "Zone_05",
      "Zone_08",
      "Zone_VS",
    ])
      expect(context.zones[zone].length).toBeGreaterThan(0);
    expect(context.zones.Zone_03C).toBeUndefined();
    expect(
      context.positions.find((p) => p.account === "4300342")?.precision,
    ).toContain("Approximate");
  });
});
