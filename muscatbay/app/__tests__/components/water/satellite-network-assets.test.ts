import { readFileSync } from "node:fs";
import { join } from "node:path";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";

interface NetworkSource {
  drawingSet: string;
  sheetCount: number;
  crs: string;
  lineFeatures: number;
  lineVertices: number;
  assetPoints: number;
  roadAlignedFeatures: number;
  accuracy: string;
}

interface NetworkAsset {
  id: string;
  type: string;
  label: string;
  layer: string;
  c: [number, number];
  e: number;
  n: number;
}

interface SatelliteWindow {
  NETWORK_SOURCE?: NetworkSource;
  NETWORK_ASSETS?: NetworkAsset[];
  NETWORK?: { c: [number, number][]; source?: string }[];
}

const satelliteWindow: SatelliteWindow = {};
for (const file of ["network.js", "network-road-corrections.js", "network-assets.js"]) {
  runInNewContext(
    readFileSync(join(process.cwd(), "public/satellite/data", file), "utf8"),
    { window: satelliteWindow, console },
  );
}

describe("satellite network CAD assets", () => {
  it("preserves the surveyed drawing-set metadata", () => {
    expect(satelliteWindow.NETWORK_SOURCE).toEqual({
      drawingSet: "COO87-CA-AB-PL-PW-01 through PW-23C",
      sheetCount: 24,
      crs: "EPSG:32640",
      lineFeatures: 423,
      // Curve-true re-extraction (bulges tessellated) + 3 owner-marked splices.
      lineVertices: 1257,
      assetPoints: 101,
      roadAlignedFeatures: 3,
      accuracy: "surveyed-as-built + owner-confirmed road alignment",
    });
  });

  it("contains the complete unique asset register in Muscat Bay bounds", () => {
    const assets = satelliteWindow.NETWORK_ASSETS ?? [];
    expect(assets).toHaveLength(101);
    expect(new Set(assets.map((asset) => asset.id)).size).toBe(101);

    const counts = assets.reduce<Record<string, number>>((result, asset) => {
      result[asset.type] = (result[asset.type] ?? 0) + 1;
      return result;
    }, {});
    expect(counts).toEqual({
      "air-valve": 1,
      "fire-hydrant": 43,
      "flow-meter": 3,
      "gate-valve": 1,
      "isolation-valve": 46,
      "pressure-reducing-valve": 2,
      washout: 3,
      "water-tank": 2,
    });

    for (const asset of assets) {
      expect(asset.c[0]).toBeGreaterThan(58.62);
      expect(asset.c[0]).toBeLessThan(58.66);
      expect(asset.c[1]).toBeGreaterThan(23.53);
      expect(asset.c[1]).toBeLessThan(23.56);
      expect(asset.e).toBeGreaterThan(666_000);
      expect(asset.n).toBeGreaterThan(2_604_000);
    }
  });
});
