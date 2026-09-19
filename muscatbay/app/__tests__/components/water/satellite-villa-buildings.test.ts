import { readFileSync } from "node:fs";
import { join } from "node:path";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";

type LonLat = [number, number];

type BuildingStatus =
  | "built"
  | "not-built"
  | "occupied-footprint-unknown"
  | "design-outline-not-as-built";

interface ServiceConnection {
  c: LonLat[];
  d: number;
  m: string;
  len: number;
  net: number;
}

interface VillaBuilding {
  st: BuildingStatus;
  src: string;
  h: number;
  a: number;
  ring: LonLat[];
  n?: string;
  id?: string;
  acct?: string;
  zone?: string;
  svc?: ServiceConnection[];
  note?: string;
}

interface NetworkFeature {
  k: number;
  c: LonLat[];
}

interface SatelliteWindow {
  VILLA_BUILDINGS?: {
    meta: { heights: string; count: number };
    buildings: VillaBuilding[];
  };
  NETDATA?: { surveyed: NetworkFeature[] };
}

const satelliteWindow: SatelliteWindow = {};
for (const file of ["villa-buildings.js", "network.js"]) {
  runInNewContext(
    readFileSync(join(process.cwd(), "public/satellite/data", file), "utf8"),
    { window: satelliteWindow, console },
  );
}

const buildings = satelliteWindow.VILLA_BUILDINGS?.buildings ?? [];
const villas = buildings.filter((b) => b.id !== undefined);

describe("satellite villa buildings", () => {
  it("carries the complete per-villa building set", () => {
    expect(buildings).toHaveLength(319);
    expect(satelliteWindow.VILLA_BUILDINGS?.meta.count).toBe(319);
  });

  it("splits into the four known statuses", () => {
    const counts: Record<string, number> = {};
    for (const b of buildings) counts[b.st] = (counts[b.st] ?? 0) + 1;
    expect(counts).toEqual({
      built: 193,
      "not-built": 107,
      "occupied-footprint-unknown": 9,
      "design-outline-not-as-built": 10,
    });
  });

  it("every ring is closed, finite and inside Muscat Bay bounds", () => {
    for (const { ring } of buildings) {
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

  it("every ring is building-sized and agrees with the record's own area", () => {
    // Shoelace area in local metres, as in satellite-building-footprints.test.ts
    // — guards against a bad UTM->WGS transform, which distorts areas by orders
    // of magnitude before the bounds check fails. Measured on 2026-09-19: rings
    // span 43-7,736 m² and every one is within -10 % / +1 % of its own `a`
    // (rings are inset 0.2 m, `a` is not), so both limits pass with margin.
    const area = (ring: LonLat[]) => {
      let s = 0;
      for (let i = 0; i < ring.length - 1; i++) {
        const [x0, y0] = ring[i];
        const [x1, y1] = ring[i + 1];
        s += (x0 * 102000) * (y1 * 110540) - (x1 * 102000) * (y0 * 110540);
      }
      return Math.abs(s / 2);
    };
    for (const b of buildings) {
      const computed = area(b.ring);
      expect(computed).toBeGreaterThan(30);
      expect(computed).toBeLessThan(9000);
      expect(b.a).toBeGreaterThan(0);
      expect(Math.abs(computed / b.a - 1)).toBeLessThanOrEqual(0.25);
    }
  });

  it("names 117 villas, each with a unique plot ID and a zone", () => {
    expect(villas).toHaveLength(117);
    expect(new Set(villas.map((v) => v.id)).size).toBe(117);
    for (const v of villas) {
      expect(typeof v.id).toBe("string");
      expect(v.id).not.toBe("");
      expect(typeof v.zone).toBe("string");
      expect(v.zone).not.toBe("");
    }
  });

  it("heights are positive, at most 30 m, and declared as assumed", () => {
    // The drawings carry no heights — the file must keep saying so, because
    // the legend and INTEGRATION.md repeat the claim.
    expect(satelliteWindow.VILLA_BUILDINGS?.meta.heights).toMatch(/assumed/i);
    for (const b of buildings) {
      expect(typeof b.h).toBe("number");
      expect(b.h).toBeGreaterThan(0);
      expect(b.h).toBeLessThanOrEqual(30);
    }
  });

  it("uses only the three assumed storey heights (4, 6 and 9 m)", () => {
    // INTEGRATION.md names these three. A fourth value means the model changed
    // and the documentation has to change with it.
    const heights = [...new Set(buildings.map((b) => b.h))].sort((x, y) => x - y);
    expect(heights).toEqual([4, 6, 9]);
  });

  it("every house connection points at a k=1 feature in the surveyed network", () => {
    const surveyed = satelliteWindow.NETDATA?.surveyed ?? [];
    expect(surveyed.length).toBeGreaterThan(0);
    let checked = 0;
    for (const b of buildings) {
      for (const s of b.svc ?? []) {
        expect(Number.isInteger(s.net)).toBe(true);
        expect(surveyed[s.net]).toBeDefined();
        expect(surveyed[s.net].k).toBe(1);
        checked += 1;
      }
    }
    expect(checked).toBeGreaterThan(0);
  });

  it("links each house connection to one villa only, with the network's own geometry", () => {
    // The engine lights a villa from a clicked pipe (and the reverse) by this
    // index. One pipe claimed by two villas, or a copy of the geometry that has
    // drifted from network.js, would light the wrong house.
    const surveyed = satelliteWindow.NETDATA?.surveyed ?? [];
    const claimed = new Map<number, string>();
    for (const b of villas) {
      for (const s of b.svc ?? []) {
        expect(claimed.get(s.net)).toBeUndefined();
        claimed.set(s.net, b.id ?? "");
        expect(s.c.length).toBeGreaterThanOrEqual(2);
        expect(s.c).toEqual(surveyed[s.net].c);
      }
    }
    expect(claimed.size).toBeGreaterThan(0);
  });
});
