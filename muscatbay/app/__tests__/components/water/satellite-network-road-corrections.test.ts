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
}

interface SatelliteWindow {
  NETDATA?: { surveyed: NetworkFeature[] };
  NETWORK?: NetworkFeature[];
  NETWORK_ROAD_ALIGNMENT?: AlignmentMetadata;
}

const satelliteWindow: SatelliteWindow = {};
const context = { window: satelliteWindow, console: { error: vi.fn() } };
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

describe("owner-confirmed road-aligned water mains", () => {
  it("replaces only the five confirmed Zone 3, Zone 5 and Zone 8 road corridors", () => {
    const corrected = (satelliteWindow.NETWORK ?? []).filter(
      (feature) => feature.source === "owner-confirmed-road-alignment",
    );

    expect(corrected).toHaveLength(5);
    expect(corrected.map((feature) => feature.c.length).sort((a, b) => a - b)).toEqual(
      [12, 20, 27, 30, 39],
    );
    expect(corrected.every((feature) => feature.accuracy === "site-aligned")).toBe(
      true,
    );
  });

  it("keeps the CAD junctions connected while following the road bends", () => {
    const corrected = (satelliteWindow.NETWORK ?? []).filter(
      (feature) => feature.source === "owner-confirmed-road-alignment",
    );
    const upper = corrected.find((feature) => feature.segment?.startsWith("Zone 8 · IV-10"));
    const lower = corrected.find((feature) => feature.segment?.startsWith("Zone 8 · FH-29"));
    const zone5Di = corrected.find((feature) => feature.segment?.includes("DI trunk"));
    const zone3 = corrected.find((feature) => feature.segment?.startsWith("Zone 3 ·"));

    expect(upper?.c[0]).toEqual([58.644324, 23.549489]);
    expect(upper?.c.at(-1)).toEqual([58.643795, 23.54825]);
    expect(lower?.c[11]).toEqual([58.644084, 23.547469]);
    expect(lower?.c.at(-1)).toEqual([58.643795, 23.54825]);
    expect(upper?.segment).toBe("Zone 8 · IV-10 to FH-29/30");
    expect(lower?.segment).toBe("Zone 8 · FH-29/30 to IV-21");
    expect(zone5Di?.c[0]).toEqual([58.638814, 23.547466]);
    expect(zone5Di?.c.at(-1)).toEqual([58.634697, 23.54348]);
    expect(zone3?.c[0]).toEqual([58.633948, 23.548216]);
    expect(zone3?.c[10]).toEqual([58.635179, 23.549494]);
    expect(zone3?.c[16]).toEqual([58.6358973, 23.5493211]);
    expect(zone3?.c[22]).toEqual([58.6366296, 23.5488613]);
    expect(zone3?.c[29]).toEqual([58.637472, 23.548906]);
    expect(zone3?.c.at(-1)).toEqual([58.640441, 23.551963]);
  });

  it("publishes the correction provenance", () => {
    expect(satelliteWindow.NETWORK_ROAD_ALIGNMENT).toEqual({
      zones: ["Zone 3", "Zone 5", "Zone 8"],
      featureCount: 5,
      effectiveDate: "2026-08-04",
      basis: "owner-confirmed buried pipe follows road corridor",
    });
  });

  it("replaces the diagonal Zone 3 chord without moving its network endpoints", () => {
    const zone3 = (satelliteWindow.NETWORK ?? []).find(
      (feature) =>
        feature.k === 0 &&
        feature.d === 160 &&
        feature.m === "HDPE" &&
        feature.c[0]?.[0] === 58.633948 &&
        feature.c[0]?.[1] === 23.548216,
    );

    expect(zone3?.source).toBe("owner-confirmed-road-alignment");
    expect(zone3?.c).toHaveLength(39);
    expect(zone3?.c[11]).toEqual([58.6352831, 23.5495005]);
    expect(zone3?.c[21]).toEqual([58.6364982, 23.5489129]);
    expect(zone3?.c[22]).toEqual([58.6366296, 23.5488613]);
    expect(zone3?.c[28]).toEqual([58.6373753, 23.5488875]);
    expect(zone3?.c[29]).toEqual([58.637472, 23.548906]);
    expect(zone3?.c[30]).toEqual([58.637677, 23.548972]);
  });
});
