import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The view's own map is WebGL/compat-heavy; a stub exposes only the full-screen
// contract the view drives (`fullScreen` in, `onFullScreen` out).
vi.mock("@/components/water/satellite/SatelliteMap", () => ({
  SatelliteMap: ({
    fullScreen,
    onFullScreen,
  }: {
    fullScreen: boolean;
    onFullScreen: (open: boolean) => void;
  }) => (
    <div data-testid="satellite-map" data-full-screen={String(fullScreen)}>
      <button type="button" onClick={() => onFullScreen(false)}>
        Close map
      </button>
      <button type="button" onClick={() => onFullScreen(true)}>
        Open map
      </button>
    </div>
  ),
}));

const NO_ROWS: never[] = [];
vi.mock("@/components/water/satellite/useSatelliteDaily", () => ({
  useSatelliteDaily: () => ({
    rows: NO_ROWS,
    refreshed: null,
    loading: false,
    error: "",
    stale: false,
    refresh: () => {},
  }),
}));

import { SatelliteView } from "@/components/water/satellite/satellite-view";

type Listener = () => void;

/** jsdom ships no matchMedia; this one lets a test cross the breakpoint. */
function installMatchMedia(matches: boolean) {
  const listeners = new Set<Listener>();
  const mql = {
    matches,
    media: "",
    addEventListener: (_: string, cb: Listener) => void listeners.add(cb),
    removeEventListener: (_: string, cb: Listener) => void listeners.delete(cb),
  };
  vi.stubGlobal(
    "matchMedia",
    vi.fn((media: string) => Object.assign(mql, { media })),
  );
  return {
    set(next: boolean) {
      act(() => {
        mql.matches = next;
        listeners.forEach((cb) => cb());
      });
    },
  };
}

const fullScreen = () =>
  screen.getByTestId("satellite-map").getAttribute("data-full-screen");

beforeEach(() => {
  const Observer = class {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  };
  vi.stubGlobal("ResizeObserver", Observer);
  vi.stubGlobal("IntersectionObserver", Observer);
  // jsdom has no layout; the segmented controls scroll their active chip.
  Element.prototype.scrollIntoView ??= () => {};
});
afterEach(() => vi.unstubAllGlobals());

describe("satellite view phone-width immersive map", () => {
  it("keeps an auto-opened phone map open when the width crosses to tablet", () => {
    const media = installMatchMedia(true);
    render(<SatelliteView waterMeters={[]} />);
    expect(fullScreen()).toBe("true");

    // Rotation past the breakpoint: phone -> tablet.
    media.set(false);
    expect(fullScreen()).toBe("true");
  });

  it("does not re-open the map on entering phone width after the operator closed it", () => {
    const media = installMatchMedia(true);
    render(<SatelliteView waterMeters={[]} />);
    expect(fullScreen()).toBe("true");

    fireEvent.click(screen.getByRole("button", { name: "Close map" }));
    expect(fullScreen()).toBe("false");

    media.set(false);
    expect(fullScreen()).toBe("false");
    media.set(true);
    expect(fullScreen()).toBe("false");
  });

  it("starts desktop in the panel layout and auto-opens on first entering phone width", () => {
    const media = installMatchMedia(false);
    render(<SatelliteView waterMeters={[]} />);
    expect(fullScreen()).toBe("false");
    media.set(true);
    expect(fullScreen()).toBe("true");
  });
});
