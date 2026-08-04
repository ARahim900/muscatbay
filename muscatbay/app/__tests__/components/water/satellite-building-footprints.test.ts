import { readFileSync } from "node:fs";
import { join } from "node:path";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";

interface SatelliteWindow {
  BUILDING_FOOTPRINTS?: [number, number][][];
}

const satelliteWindow: SatelliteWindow = {};
runInNewContext(
  readFileSync(
    join(process.cwd(), "public/satellite/data/building-footprints.js"),
    "utf8",
  ),
  { window: satelliteWindow, console },
);

describe("satellite building footprints", () => {
  it("carries the complete as-built footprint set", () => {
    expect(satelliteWindow.BUILDING_FOOTPRINTS).toHaveLength(251);
  });

  it("every ring is closed, finite and inside Muscat Bay bounds", () => {
    for (const ring of satelliteWindow.BUILDING_FOOTPRINTS ?? []) {
      expect(ring.length).toBeGreaterThanOrEqual(4);
      expect(ring[0]).toEqual(ring.at(-1));
      for (const [lon, lat] of ring) {
        expect(Number.isFinite(lon)).toBe(true);
        expect(Number.isFinite(lat)).toBe(true);
        expect(lon).toBeGreaterThan(58.62);
        expect(lon).toBeLessThan(58.66);
        expect(lat).toBeGreaterThan(23.53);
        expect(lat).toBeLessThan(23.56);
      }
    }
  });

  it("footprints are building-sized (40-4500 m² as extracted)", () => {
    // Shoelace area in local metres — guards against a bad UTM->WGS transform,
    // which would distort areas by orders of magnitude before bounds fail.
    const area = (ring: [number, number][]) => {
      let s = 0;
      for (let i = 0; i < ring.length - 1; i++) {
        const [x0, y0] = ring[i];
        const [x1, y1] = ring[i + 1];
        s += (x0 * 102000) * (y1 * 110540) - (x1 * 102000) * (y0 * 110540);
      }
      return Math.abs(s / 2);
    };
    for (const ring of satelliteWindow.BUILDING_FOOTPRINTS ?? []) {
      const a = area(ring);
      expect(a).toBeGreaterThan(30);
      expect(a).toBeLessThan(5000);
    }
  });
});
