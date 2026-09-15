import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SatelliteMap } from "@/components/water/satellite/SatelliteMap";
import { buildConsumptionMeters } from "@/components/water/satellite/consumptionModel";
const props = {
  meters: buildConsumptionMeters([], "2026-09-14", []),
  date: "2026-09-14",
  zone: "",
  selected: "",
  onUnavailable: vi.fn(),
  onLocations: vi.fn(),
  onZone: vi.fn(),
  onMeter: vi.fn(),
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
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
const receive = (
  frame: HTMLIFrameElement,
  data: object,
  source: MessageEventSource | null = frame.contentWindow,
) =>
  act(() => {
    window.dispatchEvent(
      new MessageEvent("message", { origin: location.origin, source, data }),
    );
  });
describe("satellite iframe lifecycle", () => {
  it("updates the same iframe for a new data identity", () => {
    const view = render(<SatelliteMap {...props} />);
    const frame = screen.getByTitle(
      "Water consumption satellite map",
    ) as HTMLIFrameElement;
    const post = vi.spyOn(frame.contentWindow!, "postMessage");
    receive(frame, { type: "satviz:ready", locations: [] });
    view.rerender(
      <SatelliteMap {...props} meters={[...props.meters]} zone="Zone_05" />,
    );
    expect(screen.getByTitle("Water consumption satellite map")).toBe(frame);
    expect(post).toHaveBeenLastCalledWith(
      expect.objectContaining({
        type: "satviz:update",
        payload: expect.objectContaining({ zone: "Zone_05" }),
      }),
      location.origin,
    );
  });
  it("ignores messages from a different frame even on the same origin", () => {
    render(<SatelliteMap {...props} />);
    const frame = screen.getByTitle(
      "Water consumption satellite map",
    ) as HTMLIFrameElement;
    receive(
      frame,
      { type: "satviz:status", status: "error", message: "forged" },
      window,
    );
    expect(screen.queryByText("forged")).toBeNull();
  });
  it("exposes the table and retries only on explicit action", () => {
    render(<SatelliteMap {...props} />);
    const frame = screen.getByTitle(
      "Water consumption satellite map",
    ) as HTMLIFrameElement;
    receive(frame, {
      type: "satviz:status",
      status: "error",
      message: "WebGL unavailable",
    });
    expect(
      screen.getByRole("link", { name: "Use meter table" }),
    ).toHaveAttribute("href", "#satellite-meter-list");
    expect(frame).toHaveClass("hidden");
    fireEvent.click(screen.getByRole("button", { name: "Retry map" }));
    expect(screen.getByTitle("Water consumption satellite map")).not.toBe(
      frame,
    );
  });
  it("does not wait forever for a blocked script or handshake", () => {
    vi.useFakeTimers();
    render(<SatelliteMap {...props} />);
    act(() => {
      vi.advanceTimersByTime(20000);
    });
    expect(screen.getByRole("button", { name: "Retry map" })).toBeVisible();
  });
});
