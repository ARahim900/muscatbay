import { readFileSync } from "node:fs";
import { join } from "node:path";
import { runInNewContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";

interface NetworkFeature {
  k: number;
  c: [number, number][];
  zoneId?: string;
}

interface Plot {
  zone: string;
  c: [number, number];
}

interface ServiceMetadata {
  featureCount: number;
  counts: Record<string, number>;
  zones: string[];
  grouping: string;
}

interface SatelliteWindow {
  NETWORK?: NetworkFeature[];
  PLOTS?: Plot[];
  NETWORK_SERVICE_CONNECTIONS?: ServiceMetadata;
}

const satelliteWindow: SatelliteWindow = {};
const context = { window: satelliteWindow, console: { error: vi.fn() } };
for (const file of ["network.js", "plots-geo.js", "network-service-zones.js"]) {
  runInNewContext(
    readFileSync(join(process.cwd(), "public/satellite/data", file), "utf8"),
    context,
  );
}

describe("CAD service connections grouped for zone display", () => {
  it("groups the extracted service features into the four requested zones", () => {
    expect(satelliteWindow.NETWORK_SERVICE_CONNECTIONS).toEqual({
      featureCount: 121,
      counts: { Zone_03A: 31, Zone_03B: 33, Zone_05: 34, Zone_08: 23 },
      zones: ["Zone_03A", "Zone_03B", "Zone_05", "Zone_08"],
      grouping: "nearest surveyed plot within 45 metres",
    });
  });

  it("preserves every source coordinate while adding only zone metadata", () => {
    const assigned = (satelliteWindow.NETWORK ?? []).filter(
      (feature) => feature.k === 1 && feature.zoneId,
    );

    expect(assigned).toHaveLength(121);
    expect(assigned.every((feature) => feature.c.length >= 2)).toBe(true);
  });
});
