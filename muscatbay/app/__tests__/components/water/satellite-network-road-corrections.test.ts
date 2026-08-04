import { readFileSync } from "node:fs";
import { join } from "node:path";
import { runInNewContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";

interface NetworkFeature {
  k: number;
  c: [number, number][];
  d?: number;
  m?: string;
  source?: string;
  accuracy?: string;
  segment?: string;
}

interface AlignmentMetadata {
  zones: string[];
  featureCount: number;
  effectiveDate: string;
  basis: string;
  superseded: string;
}

interface SatelliteWindow {
  NETDATA?: { surveyed: NetworkFeature[] };
  NETWORK?: NetworkFeature[];
  NETWORK_ROAD_ALIGNMENT?: AlignmentMetadata;
}

const consoleError = vi.fn();
const satelliteWindow: SatelliteWindow = {};
const context = { window: satelliteWindow, console: { error: consoleError } };
runInNewContext(
  readFileSync(join(process.cwd(), "public/satellite/data/network.js"), "utf8"),
  context,
);
runInNewContext(
  readFileSync(
    join(process.cwd(), "public/satellite/data/network-road-corrections.js"),
    "utf8",
  ),
  context,
);

const corrected = () =>
  (satelliteWindow.NETWORK ?? []).filter(
    (feature) => feature.source === "owner-confirmed-road-alignment",
  );

const containsPoint = (feature: NetworkFeature | undefined, point: [number, number]) =>
  (feature?.c ?? []).some(([lon, lat]) => lon === point[0] && lat === point[1]);

describe("owner-confirmed road-aligned water mains", () => {
  it("matches every targeted run in the curve-true network (no silent no-op)", () => {
    expect(consoleError).not.toHaveBeenCalled();
  });

  it("replaces only the Zone 3 and Zone 8 corridors the DWG curve does not cover", () => {
    expect(corrected()).toHaveLength(3);
    expect(corrected().every((feature) => feature.accuracy === "site-aligned")).toBe(
      true,
    );
    expect(corrected().map((feature) => feature.segment).sort()).toEqual([
      "Zone 3 · owner-marked inner road curve",
      "Zone 8 · FH-29/30 to IV-21",
      "Zone 8 · IV-10 to FH-29/30",
    ]);
  });

  it("keeps the CAD junctions connected while following the road bends", () => {
    const upper = corrected().find((feature) => feature.segment?.startsWith("Zone 8 · IV-10"));
    const lower = corrected().find((feature) => feature.segment?.startsWith("Zone 8 · FH-29"));
    const zone3 = corrected().find((feature) => feature.segment?.startsWith("Zone 3 ·"));

    // Junction endpoints are survey vertices and must never move.
    expect(upper?.c[0]).toEqual([58.644324, 23.549489]);
    expect(upper?.c.at(-1)).toEqual([58.643795, 23.54825]);
    expect(lower?.c[0]).toEqual([58.646767, 23.549411]);
    expect(lower?.c.at(-1)).toEqual([58.643795, 23.54825]);
    expect(zone3?.c[0]).toEqual([58.633948, 23.548216]);
    expect(zone3?.c.at(-1)).toEqual([58.640441, 23.551963]);

    // Owner-marked road vertices are present in the spliced runs.
    expect(containsPoint(zone3, [58.6352831, 23.5495005])).toBe(true);
    expect(containsPoint(zone3, [58.6366296, 23.5488613])).toBe(true);
    expect(containsPoint(zone3, [58.637472, 23.548906])).toBe(true);
    expect(containsPoint(upper, [58.644356, 23.549226])).toBe(true);
    expect(containsPoint(lower, [58.64354, 23.547489])).toBe(true);
    expect(containsPoint(lower, [58.644084, 23.547469])).toBe(true);
  });

  it("leaves the Zone 5 corridors on surveyed DWG geometry (marks superseded)", () => {
    const zone5Trunk = (satelliteWindow.NETWORK ?? []).find(
      (feature) =>
        feature.k === 0 &&
        feature.d === 200 &&
        feature.m === "DI" &&
        feature.c.some(([lon, lat]) => lon === 58.634697 && lat === 23.54348),
    );

    expect(zone5Trunk).toBeDefined();
    expect(zone5Trunk?.source).toBeUndefined();
  });

  it("publishes the correction provenance", () => {
    expect(satelliteWindow.NETWORK_ROAD_ALIGNMENT).toEqual({
      zones: ["Zone 3", "Zone 8"],
      featureCount: 3,
      effectiveDate: "2026-08-04",
      basis: "owner-confirmed buried pipe follows road corridor",
      superseded: "Zone 5 marks retired — the curve-true DWG geometry matches them",
    });
  });
});
