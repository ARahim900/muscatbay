import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { beforeEach, describe, expect, it, vi } from "vitest";

const fallbackSource = readFileSync(
  "public/satellite/consumption-fallback.js",
  "utf8",
);

type FallbackPayload = {
  date: string;
  zone: string;
  selected: string;
  meters: {
    account: string;
    name: string;
    zone: string;
    zoneName: string;
    value: number | null;
    location: { coordinates: [number, number] };
  }[];
};

type CompatibilityMap = {
  update: (payload: FallbackPayload) => void;
  focus: () => void;
  resize: () => void;
  remove: () => void;
};

type FallbackWindow = {
  devicePixelRatio: number;
  createSatelliteFallback?: (options: Record<string, unknown>) => CompatibilityMap;
};

describe("non-WebGL satellite compatibility map", () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  it("renders satellite imagery, network lines and tappable daily meter values", () => {
    const container = document.createElement("div");
    container.id = "map";
    Object.defineProperties(container, {
      clientWidth: { configurable: true, value: 390 },
      clientHeight: { configurable: true, value: 520 },
    });
    document.body.append(container);
    const fallbackWindow: FallbackWindow = { devicePixelRatio: 2 };
    runInNewContext(fallbackSource, {
      window: fallbackWindow,
      document,
      URLSearchParams,
    });
    const onMeter = vi.fn();
    const onZone = vi.fn();
    const onStatus = vi.fn();
    const map = fallbackWindow.createSatelliteFallback!({
      container,
      context: {
        positions: [],
        zoneIds: { 5: "Zone_05" },
        zones: { Zone_05: [[58.64, 23.55]] },
        connections: [],
      },
      network: [{ k: 0, zoneId: 5, c: [[58.639, 23.549], [58.641, 23.551]] }],
      onMeter,
      onZone,
      onStatus,
      volume: (value: number | null) => (value === null ? "—" : value.toFixed(2)),
    });
    map.update({
      date: "2026-09-12",
      zone: "Zone_05",
      selected: "",
      meters: [
        {
          account: "4300155",
          name: "Villa meter",
          zone: "Zone_05",
          zoneName: "Zone 5",
          value: 10.25,
          location: { coordinates: [58.64, 23.55] },
        },
        {
          account: "missing",
          name: "Missing meter",
          zone: "Zone_05",
          zoneName: "Zone 5",
          value: null,
          location: { coordinates: [58.6405, 23.5505] },
        },
      ],
    });

    const tiles = Array.from(
      container.querySelectorAll<HTMLImageElement>(".compat-imagery-tile"),
    );
    expect(tiles.length).toBeGreaterThan(0);
    expect(tiles[0]).toHaveAttribute(
      "src",
      expect.stringMatching(/^\/api\/satellite-tiles\/\d+\/\d+\/\d+$/),
    );
    expect(container.querySelectorAll(".compat-network-line")).toHaveLength(1);
    expect(container).toHaveTextContent("10.25 m³");
    expect(
      container.querySelector('button.missing[aria-label*="no reading"]'),
    ).toBeInTheDocument();
    const meter = container.querySelector<HTMLButtonElement>(
      'button[aria-label*="Villa meter"]',
    );
    meter?.click();
    expect(onMeter).toHaveBeenCalledWith("4300155");

    tiles[0].dispatchEvent(new Event("load"));
    tiles.slice(1).forEach((tile) => tile.dispatchEvent(new Event("error")));
    expect(onStatus).not.toHaveBeenCalled();
  });
});
