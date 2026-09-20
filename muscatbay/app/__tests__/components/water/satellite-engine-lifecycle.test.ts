// @vitest-environment node
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";
const engine = readFileSync("public/satellite/consumption-engine.js", "utf8");
function environment(fail = false, extra: Record<string, unknown> = {}) {
  const listeners: Record<string, (event: Record<string, unknown>) => void> =
    {};
  const mapEvents: Record<string, (event?: unknown) => void> = {};
  const canvas = { tagName: "CANVAS" };
  const parent = { postMessage: vi.fn() };
  const source = { setData: vi.fn() };
  const linkSource = { setData: vi.fn() };
  const fallback = {
    update: vi.fn(),
    focus: vi.fn(),
    resize: vi.fn(),
    remove: vi.fn(),
  };
  const createSatelliteFallback = vi.fn(() => fallback);
  const elements: {
    textContent: string;
    children: unknown[];
    style: { visibility?: string };
  }[] = [];
  const createElement = () => {
    const element = {
      textContent: "",
      className: "",
      children: [] as unknown[],
      dataset: {} as Record<string, string>,
      style: {} as { visibility?: string },
      classList: { toggle: vi.fn(), add: vi.fn(), remove: vi.fn() },
      attributes: {} as Record<string, string>,
      listeners: {} as Record<string, () => void>,
      setAttribute(name: string, value: string) {
        this.attributes[name] = value;
      },
      addEventListener(name: string, callback: () => void) {
        this.listeners[name] = callback;
      },
      replaceChildren() {
        this.children = [];
      },
      append(...children: unknown[]) {
        this.children.push(...children);
      },
    };
    elements.push(element);
    return element;
  };
  const map = {
    touchZoomRotate: { disableRotation: vi.fn(), enableRotation: vi.fn() },
    touchPitch: { enable: vi.fn(), disable: vi.fn() },
    cooperativeGestures: { enable: vi.fn(), disable: vi.fn() },
    addControl: vi.fn(),
    on: vi.fn((name: string, ...rest: unknown[]) => {
      // map.on(event, handler) or map.on(event, layer, handler)
      const key = rest.length === 2 ? `${name}:${String(rest[0])}` : name;
      mapEvents[key] = rest[rest.length - 1] as (event?: unknown) => void;
    }),
    getCanvas: () => canvas,
    addSource: vi.fn(),
    addLayer: vi.fn(),
    getSource: (id: string) => (id === "villa-link" ? linkSource : source),
    setLayoutProperty: vi.fn(),
    setPaintProperty: vi.fn(),
    setFilter: vi.fn(),
    easeTo: vi.fn(),
    once: vi.fn(),
    getZoom: () => 16,
    fitBounds: vi.fn(),
    remove: vi.fn(),
    resize: vi.fn(),
    getContainer: () => ({ clientWidth: 1000, clientHeight: 800 }),
    project: () => ({ x: 400, y: 400 }),
  };
  const construct = vi.fn(function () {
    if (fail) throw new Error("Failed to initialise WebGL");
    return map;
  });
  const window = {
    parent,
    PLOTS: [],
    ASSETS: [],
    NETWORK: [],
    SATELLITE_CONTEXT: {
      positions: [],
      connections: [],
      zoneIds: {},
      zones: {
        "Zone_03_(A)": [
          [58.637927, 23.549146],
          [58.635, 23.549],
        ],
      },
    },
    matchMedia: () => ({ matches: true }),
    createSatelliteFallback,
    ...extra,
    addEventListener: (
      name: string,
      callback: (event: Record<string, unknown>) => void,
    ) => {
      listeners[name] = callback;
    },
  };
  runInNewContext(engine, {
    window,
    location: { origin: "https://example.com" },
    document: {
      getElementById: () => ({ textContent: "" }),
      body: { append: vi.fn() },
      documentElement: { classList: { toggle: vi.fn() } },
      createElement,
    },
    console: { error: vi.fn() },
    maplibregl: {
      Map: construct,
      NavigationControl: function () {},
      Marker: function () {
        return {
          setLngLat() {
            return this;
          },
          addTo() {
            return this;
          },
          remove: vi.fn(),
        };
      },
      LngLatBounds: function () {
        return { extend() {} };
      },
    },
  });
  const send = (
    type: string,
    payload: unknown,
    messageSource: object = parent,
  ) =>
    listeners.message({
      origin: "https://example.com",
      source: messageSource,
      data: { type, payload },
    });
  return {
    map,
    source,
    linkSource,
    construct,
    send,
    canvas,
    mapEvents,
    parent,
    listeners,
    elements,
    fallback,
    createSatelliteFallback,
  };
}
const threeDButton = (env: ReturnType<typeof environment>) =>
  env.elements.find(
    (e) => (e as { className?: string }).className === "three-d-button",
  ) as unknown as { listeners: Record<string, () => void> };
const payload = {
  date: "2026-09-14",
  zone: "Zone_05",
  selected: "a",
  meters: [
    {
      account: "a",
      name: "A",
      zone: "Zone_05",
      value: 10,
      location: { coordinates: [58.64, 23.55] },
    },
  ],
};
describe("consumption renderer", () => {
  it("lights the selected villa's outline and house connection, once per selection", () => {
    const ring = [[58.64, 23.55], [58.6401, 23.55], [58.6401, 23.5501], [58.64, 23.55]];
    const env = environment(false, {
      VILLA_BUILDINGS: {
        buildings: [
          { acct: "a", zone: "Zone 5", st: "built", ring, svc: [{ c: [[58.6399, 23.5499], [58.64, 23.55]], d: 25, m: "HDPE", len: 6.4 }] },
        ],
      },
    });
    env.send("satviz:data", payload);
    env.mapEvents.load();
    const ids = env.map.addLayer.mock.calls.map((c: [{ id: string }]) => c[0].id);
    expect(ids.indexOf("buildings-line")).toBeLessThan(ids.indexOf("network-line"));
    // MapLibre rejects data expressions in line-dasharray; the style must stay constant per layer.
    for (const [layer] of env.map.addLayer.mock.calls as [{ paint?: Record<string, unknown> }][])
      expect(Array.isArray(layer.paint?.["line-dasharray"]) && typeof (layer.paint?.["line-dasharray"] as unknown[])[0] === "string").toBe(false);
    expect(ids.indexOf("villa-link-line")).toBeGreaterThan(ids.indexOf("network-line"));
    // 3D houses exist but stay hidden until the operator asks for them; the map opens flat.
    const extrude = (env.map.addLayer.mock.calls as [{ id: string; type: string; layout?: { visibility?: string } }][])
      .map((c) => c[0]).find((l) => l.id === "buildings-3d");
    expect(extrude).toMatchObject({ type: "fill-extrusion", layout: { visibility: "none" } });
    expect(env.construct.mock.calls[0][0]).toMatchObject({ pitch: 0, dragRotate: false, touchPitch: false });
    expect(env.map.addControl).toHaveBeenCalledTimes(2);
    expect(env.linkSource.setData).toHaveBeenCalledTimes(1);
    const data = env.linkSource.setData.mock.calls[0][0] as { features: { properties: { part: string } }[] };
    expect(data.features.map((f) => f.properties.part)).toEqual(["outline", "connection"]);
    env.send("satviz:update", { ...payload, meters: [{ ...payload.meters[0], value: 20 }] });
    expect(env.linkSource.setData).toHaveBeenCalledTimes(1);
    env.send("satviz:update", { ...payload, selected: "" });
    expect(env.linkSource.setData).toHaveBeenCalledTimes(2);
    expect((env.linkSource.setData.mock.calls[1][0] as { features: unknown[] }).features).toEqual([]);
  });
  it("keeps the camera and instance when readings change in place", () => {
    const env = environment();
    env.send("satviz:data", payload);
    env.mapEvents.load();
    expect(env.map.easeTo).toHaveBeenCalledTimes(1);
    env.send("satviz:update", {
      ...payload,
      meters: [{ ...payload.meters[0], value: 20 }],
    });
    expect(env.construct).toHaveBeenCalledTimes(1);
    expect(env.map.easeTo).toHaveBeenCalledTimes(1);
    expect(env.source.setData).toHaveBeenCalledTimes(2);
    expect(env.construct.mock.calls[0][0]).toMatchObject({
      preserveDrawingBuffer: false,
      antialias: false,
      pitch: 0,
    });
  });
  // Owner ruling 2026-09-20: selecting a zone frames it but never tilts the map.
  it("frames a selected zone flat, and tilts to the oblique angle only from the 3D button", () => {
    const env = environment();
    env.send("satviz:data", { ...payload, selected: "" });
    env.mapEvents.load();
    expect(env.map.fitBounds).toHaveBeenCalledTimes(1);
    expect(env.map.fitBounds.mock.calls[0][1]).toMatchObject({ pitch: 0, bearing: 0 });
    expect(env.map.once).not.toHaveBeenCalled();
    threeDButton(env).listeners.click();
    expect(env.map.fitBounds).toHaveBeenCalledTimes(2);
    expect(env.map.fitBounds.mock.calls[1][1]).toMatchObject({ pitch: 55, bearing: 28 });
    expect(env.map.once).toHaveBeenCalledWith("moveend", expect.any(Function));
    threeDButton(env).listeners.click();
    expect(env.map.fitBounds.mock.calls[2][1]).toMatchObject({ pitch: 0, bearing: 0 });
  });
  it("opens the meter whose label was tapped, not the dot lying under that label", () => {
    const env = environment();
    env.send("satviz:data", { ...payload, selected: "" });
    env.mapEvents.load();
    const hit = env.mapEvents["click:meter-hit"] as (event: unknown) => void;
    const feature = { geometry: { coordinates: [58.64, 23.55] }, properties: { account: "under-the-label" } };
    env.parent.postMessage.mockClear();
    hit({ point: { x: 1, y: 1 }, features: [feature], originalEvent: { target: { tagName: "BUTTON" } } });
    expect(env.parent.postMessage).not.toHaveBeenCalled();
    hit({ point: { x: 1, y: 1 }, features: [feature], originalEvent: { target: env.canvas } });
    expect(env.parent.postMessage).toHaveBeenCalledWith(
      { type: "satviz:select-meter", account: "under-the-label" }, "https://example.com");
  });
  it("labels findings in words and writes each zone's loss on its marker", () => {
    const env = environment();
    const at = (n: number) => ({ coordinates: [58.64 + n / 1000, 23.55] });
    const meters = [
      { account: "n", name: "Villa N", zone: "Zone_05", zoneName: "Zone 5", level: "L3", value: 2, status: "normal", location: at(1) },
      { account: "h", name: "Villa H", zone: "Zone_05", zoneName: "Zone 5", level: "L3", value: 40, status: "high", location: at(2) },
      { account: "z", name: "Villa Z", zone: "Zone_05", zoneName: "Zone 5", level: "L3", value: 0, status: "zero", location: at(3) },
    ];
    env.send("satviz:data", { ...payload, selected: "", zone: "Zone_05", meters });
    env.mapEvents.load();
    const text = () => env.elements.map((e) => e.textContent);
    expect(text()).toEqual(expect.arrayContaining(["High usage", "Zero reading"]));
    const features = (env.source.setData.mock.calls.at(-1)![0] as {
      features: { properties: { account: string; status: string; radius: number } }[] }).features;
    expect(features.find((f) => f.properties.account === "h")!.properties.status).toBe("high");
    expect(features.find((f) => f.properties.account === "z")!.properties.radius).toBe(6); // a zero is never a speck
    env.send("satviz:update", { ...payload, selected: "", zone: "", meters,
      zoneLosses: [{ id: "Zone_05", severity: "high", label: "Loss 30 m³ · 26% · High" }] });
    expect(text()).toContain("Loss 30 m³ · 26% · High");
  });
  it("hangs overlapping zone cards off different sides of their points", () => {
    const env = environment();
    const at = (n: number) => ({ coordinates: [58.64 + n / 1000, 23.55] });
    env.send("satviz:data", { ...payload, selected: "", zone: "", meters: [
      { account: "a", name: "A", zone: "Zone_05", level: "L3", value: 1, location: at(1) },
      { account: "b", name: "B", zone: "Zone_08", level: "L3", value: 2, location: at(2) },
    ] });
    env.mapEvents.load();
    // Both zone centres project to the same screen point in this mock map.
    for (const element of env.elements) Object.assign(element, { offsetWidth: 120, offsetHeight: 60 });
    env.mapEvents.moveend();
    const placed = env.elements
      .map((e) => e.style as { left?: string; top?: string })
      .filter((style) => style.left);
    expect(placed).toHaveLength(2);
    const box = (style: { left?: string; top?: string }) => {
      const left = parseFloat(style.left!), top = parseFloat(style.top!);
      return { left, top, right: left + 120, bottom: top + 60 };
    };
    const [one, two] = placed.map(box);
    expect(one.right <= two.left || two.right <= one.left || one.bottom <= two.top || two.bottom <= one.top).toBe(true);
  });
  it("steps back after a tilted move until every zone point is on screen", () => {
    const env = environment();
    env.send("satviz:data", { ...payload, selected: "" });
    env.mapEvents.load();
    threeDButton(env).listeners.click();
    env.map.project = () => ({ x: 400, y: 790 }); // below the safe area of the 800 px map
    (env.map.once.mock.calls[0][1] as () => void)();
    expect(env.map.easeTo).toHaveBeenCalledWith(expect.objectContaining({ zoom: 15.7 }));
    env.map.project = () => ({ x: 400, y: 400 });
    (env.map.once.mock.calls[1][1] as () => void)();
    expect(env.map.easeTo).toHaveBeenCalledTimes(1);
  });
  it("gives one-finger control only in full screen, and switches zone from the on-map chips", () => {
    const env = environment();
    const zones = [{ id: "Zone_03_(A)", name: "Zone 3A" }, { id: "Zone_09", name: "No coordinates" }];
    env.send("satviz:data", { ...payload, selected: "", zones });
    env.mapEvents.load();
    expect(env.map.cooperativeGestures.enable).toHaveBeenCalled();
    expect(env.map.cooperativeGestures.disable).not.toHaveBeenCalled();
    env.listeners.message({ origin: "https://example.com", source: env.parent, data: { type: "satviz:mode", full: true } });
    expect(env.map.cooperativeGestures.disable).toHaveBeenCalledTimes(1);
    expect(env.map.touchPitch.enable).toHaveBeenCalledTimes(1);
    const chips = env.elements.filter((e) => (e as { className?: string }).className === "zone-chip") as unknown as
      { textContent: string; listeners: Record<string, () => void> }[];
    expect(chips.map((c) => c.textContent)).toEqual(["All", "Zone 3A"]); // a zone with no coordinates gets no chip
    chips[1].listeners.click();
    expect(env.parent.postMessage).toHaveBeenLastCalledWith(
      { type: "satviz:select-zone", zone: "Zone_03_(A)" }, "https://example.com");
    chips[0].listeners.click();
    expect(env.parent.postMessage).toHaveBeenLastCalledWith(
      { type: "satviz:select-zone", zone: "" }, "https://example.com");
  });
  it("shows whole-number figures, and sets the zone bulk meter apart from the individual meters", () => {
    const env = environment();
    const at = (n: number) => ({ coordinates: [58.64 + n / 1000, 23.55] });
    env.send("satviz:data", { ...payload, selected: "", meters: [
      { account: "v1", name: "Villa 1", zone: "Zone_05", level: "L3", value: 10, location: at(1) },
      { account: "v2", name: "Villa 2", zone: "Zone_05", level: "L3", value: 0.35, location: at(2) },
      { account: "v3", name: "Villa 3", zone: "Zone_05", level: "L3", value: 0.01, location: at(3) },
      { account: "v4", name: "Villa 4", zone: "Zone_05", level: "L3", value: null, location: at(4) },
      { account: "b", name: "Zone 5 (Bulk)", zone: "Zone_05", level: "L2", value: 3920.4, location: at(5) },
    ] });
    env.mapEvents.load();
    const text = env.elements.map((e) => e.textContent);
    // 10.00 → 10; small daily readings keep one decimal so they never read as 0; no reading stays —
    for (const expected of ["10 m³", "0.4 m³", "<0.1 m³", "— m³", "3,920 m³", "Bulk meter"])
      expect(text).toContain(expected);
    const features = (env.source.setData.mock.calls.at(-1)![0] as {
      features: { properties: { account: string; bulk: boolean; radius: number } }[] }).features;
    const bulk = features.find((f) => f.properties.account === "b")!;
    expect(bulk.properties).toMatchObject({ bulk: true, radius: 11 });
    // the villas are sized against each other, not against the bulk meter
    expect(features.find((f) => f.properties.account === "v1")!.properties.radius).toBe(18);
  });
  it("uses the visual compatibility map for creation and context loss failures", () => {
    const env = environment(true);
    env.send("satviz:data", payload);
    expect(env.createSatelliteFallback).toHaveBeenCalledTimes(1);
    // The compatibility map (mostly iOS) keeps the one-tap zone chips.
    expect(env.elements.some((e) => (e as { className?: string }).className === "zone-chip")).toBe(true);
    expect(env.fallback.update).toHaveBeenCalledWith(payload);
    expect(env.parent.postMessage).toHaveBeenLastCalledWith(
      expect.objectContaining({ type: "satviz:status", status: "degraded" }),
      "https://example.com",
    );
    const active = environment();
    active.send("satviz:data", payload);
    active.mapEvents.webglcontextlost();
    expect(active.createSatelliteFallback).toHaveBeenCalledTimes(1);
    expect(active.parent.postMessage).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: "degraded" }),
      "https://example.com",
    );
  });
  it("rejects foreign-window messages and invalid coordinates", () => {
    const env = environment();
    env.send("satviz:data", payload, {});
    env.send("satviz:data", {
      ...payload,
      meters: [{ ...payload.meters[0], location: { coordinates: [NaN, 23] } }],
    });
    expect(env.construct).not.toHaveBeenCalled();
  });
  // Owner ruling 2026-09-20: map labels show whole numbers (10 m³, not 10.00 m³).
  it("places daily values in interactive map labels and retains missing labels", () => {
    const env = environment();
    env.send("satviz:data", payload);
    env.mapEvents.load();
    expect(env.elements.some((el) => el.textContent === "10 m³")).toBe(true);
    env.send("satviz:update", {
      ...payload,
      meters: [{ ...payload.meters[0], value: null }],
    });
    expect(env.elements.some((el) => el.textContent === "— m³")).toBe(true);
  });
  it("frames zone geography when the selected level has no mapped meters", () => {
    const env = environment();
    env.send("satviz:data", {
      ...payload,
      zone: "Zone_03_(A)",
      selected: "",
      meters: [],
    });
    env.mapEvents.load();
    expect(env.map.fitBounds).toHaveBeenCalledTimes(1);
    env.send("satviz:update", {
      ...payload,
      zone: "Zone_03_(A)",
      selected: "",
      meters: [],
    });
    expect(env.map.fitBounds).toHaveBeenCalledTimes(1);
    env.send("satviz:focus", undefined);
    expect(env.map.fitBounds).toHaveBeenCalledTimes(2);
  });
  it("waits for geographic positions before consuming an initial focus request", () => {
    const env = environment();
    env.send("satviz:data", { ...payload, selected: "", meters: [] });
    env.mapEvents.load();
    expect(env.map.fitBounds).not.toHaveBeenCalled();
    env.send("satviz:update", { ...payload, selected: "" });
    expect(env.map.fitBounds).toHaveBeenCalledTimes(1);
  });
  it("loads network layers beneath meters and distinguishes schematic FM links", () => {
    const env = environment();
    env.send("satviz:data", { ...payload, zone: "Zone_01_(FM)" });
    env.mapEvents.load();
    const layers = env.map.addLayer.mock.calls.map(
      (call) => call[0] as { id: string; paint: Record<string, unknown> },
    );
    expect(
      layers.findIndex((layer) => layer.id === "network-line"),
    ).toBeLessThan(layers.findIndex((layer) => layer.id === "meter-circles"));
    expect(
      layers.find((layer) => layer.id === "fm-connections")?.paint[
        "line-dasharray"
      ],
    ).toEqual([2, 2]);
    expect(env.map.setLayoutProperty).toHaveBeenCalledWith(
      "fm-connections",
      "visibility",
      "visible",
    );
  });
  it("releases its graphics resources when the frame leaves", () => {
    const env = environment();
    env.send("satviz:data", payload);
    env.listeners.pagehide({});
    expect(env.map.remove).toHaveBeenCalledTimes(1);
  });
});
