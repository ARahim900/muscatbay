import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MapSheet, MapTopBar } from "@/components/water/satellite/map-chrome";
import { SatelliteMap } from "@/components/water/satellite/SatelliteMap";
import {
  buildConsumptionMeters,
  type ConsumptionMeter,
} from "@/components/water/satellite/consumptionModel";

const meter = (account: string, name: string, value: number | null): ConsumptionMeter => ({
  account,
  name,
  zone: "Zone_03_(A)",
  level: "L3",
  zoneName: "Zone 3A",
  parent: "ZONE 3A (BULK ZONE 3A)",
  value,
  previous: null,
  trend: [],
  updatedAt: null,
  location: null,
  status: value === null ? "missing" : "normal",
  statusNote: value === null ? "No reading recorded for this day" : "",
  baseline: null,
  ratio: null,
});

const sheetProps = {
  heading: "Zone 3A · 27 Sep",
  reporting: "22 of 31 reporting · partial",
  reportingTone: "warning" as const,
  stats: [{ label: "Bulk in", value: "173", unit: "m³", icon: () => null }],
  meters: [meter("1", "Z3-36 (Villa)", 6.1), meter("2", "Z3-32 (Villa)", 3.4), meter("3", "D-75", null)],
  selected: undefined,
  date: "2026-09-27",
  villaLink: "",
  query: "",
  onQuery: vi.fn(),
  onMeter: vi.fn(),
  onCloseMeter: vi.fn(),
  onCentre: vi.fn(),
};

beforeEach(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      disconnect() {}
    },
  );
});
afterEach(() => vi.unstubAllGlobals());

describe("phone map sheet", () => {
  it("opens on the figures, then lists the meters without inventing a reading", () => {
    render(<MapSheet {...sheetProps} />);
    expect(screen.getByText("Bulk in")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Meters · 3/ }));
    expect(screen.getByText("Z3-36 (Villa)")).toBeTruthy();
    // A missing reading stays "No reading", never 0.
    const row = screen.getByText("D-75").closest("button");
    expect(row?.textContent).toContain("No reading");
    expect(row?.textContent).not.toContain("0 m³");
    fireEvent.click(screen.getByText("Z3-32 (Villa)"));
    expect(sheetProps.onMeter).toHaveBeenCalledWith("2");
  });

  it("steps between meters in list order and stops at the ends", () => {
    const onMeter = vi.fn();
    render(<MapSheet {...sheetProps} onMeter={onMeter} selected={sheetProps.meters[0]} />);
    expect(screen.getByRole("button", { name: "Previous meter" })).toHaveProperty("disabled", true);
    fireEvent.click(screen.getByRole("button", { name: "Next meter" }));
    expect(onMeter).toHaveBeenCalledWith("2");
  });
});

describe("phone map top bar", () => {
  it("never steps past today", () => {
    const onDate = vi.fn();
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Muscat" });
    render(
      <MapTopBar
        zones={[{ id: "Zone_03_(A)", name: "Zone 3A" }]}
        zone=""
        date={today}
        latestDay={today}
        loading={false}
        onZone={vi.fn()}
        onDate={onDate}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "Next day" })).toHaveProperty("disabled", true);
    fireEvent.click(screen.getByRole("button", { name: "Previous day" }));
    expect(onDate).toHaveBeenCalledTimes(1);
  });
});

describe("host chrome", () => {
  it("draws the overlays in full screen and hides the map's own buttons", () => {
    render(
      <SatelliteMap
        meters={buildConsumptionMeters([], "2026-09-27", [])}
        date="2026-09-27"
        zone=""
        selected=""
        onUnavailable={vi.fn()}
        onLocations={vi.fn()}
        onZone={vi.fn()}
        onMeter={vi.fn()}
        fullScreen
        onFullScreen={vi.fn()}
        overlayTop={<p>Top chrome</p>}
        overlayBottom={<p>Bottom chrome</p>}
      />,
    );
    expect(screen.getByText("Top chrome")).toBeTruthy();
    expect(screen.getByText("Bottom chrome")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Close full screen/ })).toBeNull();
  });
});
