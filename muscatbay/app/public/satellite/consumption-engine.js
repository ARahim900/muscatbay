/* global maplibregl */
"use strict";
(() => {
  const message = document.getElementById("message");
  const send = (type, extra = {}) =>
    window.parent.postMessage({ type, ...extra }, location.origin);
  const context = window.SATELLITE_CONTEXT || {
    positions: [],
    zones: {},
    connections: [],
    zoneIds: {},
  };
  const locations = [...(window.PLOTS || []), ...(window.ASSETS || [])].map(
    (p) => ({
      account: p.acct,
      coordinates: p.c,
      precision: p.precision || "Plot position — not a surveyed meter chamber",
    }),
  );
  locations.push(...context.positions);
  let map = null;
  let fallback = null;
  let latest = null;
  let loaded = false;
  let previousFocus = "";
  let previousZone = "";
  let zoneMarkers = [];
  let meterLabels = [];
  let meterRings = [];
  const hoverable =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(hover: hover)").matches;
  let threeD = false;
  // The map is flat unless the operator asks for 3D with the map's own button
  // (owner ruling 2026-09-20: a zone must never tilt the map by itself).
  let manualThreeD = false;
  let threeDButton = null;
  let threeDBadge = null;
  // 3D view: the same oblique angle as the standalone as-built 3D model —
  // camera south-west of the zone, looking north-east, whole zone in frame.
  const TILT = 55;
  // Auto fly: choosing a zone stands the camera behind the zone's start (its
  // bulk meter) looking along the zone to its far end, at this gentler tilt,
  // with the whole zone in frame. It never moves for a tap on a meter dot.
  const FLY_TILT = 35;
  let zoneBearing = 0;
  // The meter the operator just tapped on the map: the camera stays where it is.
  let mapPick = "";
  let hoverTag = null;
  let fullScreen = false;
  let chipBar = null;
  let previousLink = null;
  // Per-villa house outlines from the as-built model (data/villa-buildings.js).
  // Each villa also carries its house connection, matched to it by position.
  const buildings = (window.VILLA_BUILDINGS && window.VILLA_BUILDINGS.buildings) || [];
  const villaByAccount = new Map(
    buildings.filter((b) => b.acct).map((b) => [b.acct, b]),
  );
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const report = (status, text) => {
    message.textContent = text;
    send("satviz:status", { status, message: text });
  };
  const valid = (payload) =>
    payload &&
    Array.isArray(payload.meters) &&
    payload.meters.every(
      (m) =>
        typeof m.account === "string" &&
        typeof m.zone === "string" &&
        typeof m.name === "string" &&
        (m.value === null ||
          (typeof m.value === "number" && Number.isFinite(m.value))) &&
        (!m.location ||
          (Array.isArray(m.location.coordinates) &&
            m.location.coordinates.length === 2 &&
            m.location.coordinates.every(Number.isFinite) &&
            Math.abs(m.location.coordinates[0]) <= 180 &&
            Math.abs(m.location.coordinates[1]) <= 90)),
    ) &&
    typeof payload.zone === "string" &&
    typeof payload.selected === "string" &&
    typeof payload.date === "string" &&
    /^20\d{2}-\d{2}-\d{2}$/.test(payload.date);
  // Map figures are whole numbers (10 m³, not 10.00 m³). Below 10 one decimal is
  // kept, because a villa's daily use is often under 1 m³ and must not read as 0.
  const volume = (value) => {
    if (value === null) return "—";
    const size = Math.abs(value);
    if (size > 0 && size < 0.05) return "<0.1";
    return value.toLocaleString("en-GB", {
      maximumFractionDigits: size < 10 ? 1 : 0,
    });
  };
  // Zone and main bulk meters measure everything entering; they are drawn
  // apart from the individual meters and never sized against them.
  const isBulk = (meter) => meter.level === "L2" || meter.level === "L1";
  // The page classifies every reading and works out its ratio to the meter's own
  // recent daily average; the map only draws it. Colour is never the only
  // carrier: the ring's fill says the same thing, and the panels say it in words.
  const STATUS_TAGS = {
    elevated: "Elevated",
    high: "High usage",
    zero: "Zero reading",
    missing: "No reading",
  };
  const statusOf = (meter) =>
    STATUS_TAGS[meter.status] || meter.status === "normal"
      ? meter.status
      : meter.value === null || meter.value < 0
        ? "missing"
        : "normal";
  const STATUS_RANK = { high: 3, elevated: 2, zero: 1, normal: 0, missing: 0 };
  // The page syncs its status tokens into this document; without them (or
  // without computed styles at all) the brand's own status colours are used.
  const token = (name, fallbackColour) =>
    (typeof getComputedStyle === "function" &&
      getComputedStyle(document.documentElement).getPropertyValue(name).trim()) ||
    fallbackColour;
  // Beyond ten times over, a percentage stops being readable; show the multiple.
  const share = (ratio) =>
    typeof ratio !== "number"
      ? ""
      : ratio === 0
        ? "zero"
        : ratio >= 10
          ? `×${Math.round(ratio)}`
          : `${Math.round(ratio * 100)}%`;
  // Saturated indicator colours, the app's own — a lit segment has to carry
  // over satellite imagery, so these are the bright status tokens, not the
  // muted text ones.
  const STATUS_COLOUR = {
    normal: () => token("--status-normal", "#22c55e"),
    elevated: () => token("--status-warning", "#f59e0b"),
    high: () => token("--status-danger", "#ef4444"),
    zero: () => token("--status-warning", "#f59e0b"),
    missing: () => token("--status-missing", "#94a3b8"),
  };
  const SEGMENTS = 5;
  const SEGMENT_STEP = 0.4;
  /**
   * Every meter is the same bar: five segments on a near-black track, lit one
   * per 40% of that meter's own usual and all five from twice it, in the colour
   * of its band. A zero reading lights none and carries an amber edge; no
   * reading, or too few recorded days for an average, is a dashed empty bar.
   */
  function buildBar(meter, selected) {
    const status = statusOf(meter);
    const colour = (STATUS_COLOUR[status] || STATUS_COLOUR.missing)();
    const unknown = typeof meter.ratio !== "number";
    const lit = unknown || meter.ratio <= 0
      ? 0
      : Math.min(SEGMENTS, Math.max(1, Math.ceil(meter.ratio / SEGMENT_STEP)));
    const bar = document.createElement("span");
    bar.className = "meter-bar";
    bar.style.borderColor =
      meter.account === selected
        ? token("--color-primary", "#4e4456")
        : status === "normal" && !unknown
          ? "rgb(255 255 255 / 22%)"
          : colour;
    bar.style.borderStyle = unknown ? "dashed" : "solid";
    if (status === "missing") bar.style.opacity = "0.6";
    for (let index = 0; index < SEGMENTS; index++) {
      const segment = document.createElement("i");
      segment.style.background = index < lit ? colour : "rgb(255 255 255 / 14%)";
      bar.append(segment);
    }
    return bar;
  }
  function buildMeterMarker(meter, selected) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "meter-marker";
    button.dataset.status = statusOf(meter);
    button.classList.toggle("selected", meter.account === selected);
    button.classList.toggle("bulk", isBulk(meter));
    button.append(buildBar(meter, selected));
    const status = statusOf(meter);
    button.setAttribute(
      "aria-label",
      `${meter.name}, ${latest.date}, ${meter.value === null ? "no reading" : volume(meter.value) + " cubic metres"}${share(meter.ratio) ? `, ${share(meter.ratio)} of its usual` : ""}${status === "normal" ? "" : ", " + (STATUS_TAGS[status] || status)}. Open meter details`,
    );
    return button;
  }
  // The map carries no figures: they live in the page's panels. A meter gets a
  // name tag only when it is selected, when it is the zone bulk, or (with a
  // mouse) while it is hovered — then with its figure. One builder serves both
  // renderers, so the compatibility map never drifts.
  function fillMeterLabel(element, meter, selected, withValue) {
    const status = statusOf(meter);
    element.classList.add("meter-label");
    element.classList.toggle("selected", meter.account === selected);
    element.classList.toggle("bulk", isBulk(meter));
    element.dataset.status = status;
    const name = document.createElement("span");
    name.textContent =
      isBulk(meter) && meter.account !== selected && !withValue ? "Zone bulk" : meter.name;
    element.append(name);
    if (withValue) {
      const value = document.createElement("strong");
      value.textContent = `${volume(meter.value)} m³${share(meter.ratio) ? ` · ${share(meter.ratio)}` : ""}`;
      element.append(value);
    }
    element.setAttribute(
      "aria-label",
      `${meter.name}, ${latest.date}, ${meter.value === null ? "no reading" : volume(meter.value) + " cubic metres"}${status === "normal" ? "" : ", " + (STATUS_TAGS[status] || status)}. Open meter details`,
    );
  }
  // Overview: a zone is a pin with its name. Its figures are in the Zones panel.
  function fillZoneMarker(element, zoneId, zoneMeters) {
    const zoneLabel =
      (latest.zones || []).find((z) => z.id === zoneId)?.name ||
      zoneMeters[0]?.zoneName ||
      zoneId.split("_").join(" ");
    const loss = (latest.zoneLosses || []).find((z) => z.id === zoneId);
    element.classList.add("zone-marker");
    const name = document.createElement("b");
    name.textContent = zoneLabel;
    element.append(name);
    element.setAttribute(
      "aria-label",
      `Select ${zoneLabel}${loss && typeof loss.label === "string" ? ": " + loss.label : ""}`,
    );
  }
  const overlaps = (box, others, gap) =>
    others.some(
      (b) =>
        box.left < b.right + gap &&
        box.right > b.left - gap &&
        box.top < b.bottom + gap &&
        box.bottom > b.top - gap,
    );
  // What the page draws over the map: zone strip, zoom column, the two buttons
  // bottom-left, and the meter sheet when one is open.
  function reservedAreas(width, height) {
    const areas = [
      { left: width - 64, right: width, top: 0, bottom: 230 },
      { left: 0, right: 270, top: height - 62, bottom: height },
    ];
    if (fullScreen) areas.push({ left: 0, right: width - 64, top: 0, bottom: 64 });
    if (latest?.selected && fullScreen)
      areas.push(
        width < 640
          ? { left: 0, right: width, top: height - 150, bottom: height }
          : { left: width - 350, right: width, top: height - 200, bottom: height },
      );
    return areas;
  }
  // Overview: every zone keeps its marker. Each card may hang off any of eight
  // sides of its point, full or shrunk to name and figures; a small search finds
  // an arrangement where no two cards (or page controls) overlap.
  const ZONE_SIDES = [
    [-0.5, 0, 0, 12], // below
    [-0.5, -1, 0, -12], // above
    [0, -0.5, 14, 0], // right
    [-1, -0.5, -14, 0], // left
    [0, 0, 10, 10],
    [-1, 0, -10, 10],
    [0, -1, 10, -10],
    [-1, -1, -10, -10],
  ];
  function layoutZoneMarkers() {
    if (!map || !zoneMarkers.length) return;
    const { clientWidth: width, clientHeight: height } = map.getContainer();
    const reserved = reservedAreas(width, height);
    const options = [];
    for (const { element, coordinates } of zoneMarkers) {
      const point = map.project(coordinates);
      const candidates = [];
      // Full card, then without the reporting line, then name and figure only.
      for (const size of [""]) {
        const w = element.offsetWidth;
        const h = element.offsetHeight;
        if (!(w > 0 && h > 0)) return; // not rendered (hidden tab): keep the defaults
        for (const [fx, fy, dx, dy] of ZONE_SIDES) {
          const left = point.x + fx * w + dx;
          const top = point.y + fy * h + dy;
          const box = { left, top, right: left + w, bottom: top + h };
          const inside =
            box.left >= 4 && box.right <= width - 4 && box.top >= 4 && box.bottom <= height - 4;
          if (inside && !overlaps(box, reserved, 6))
            candidates.push({ size, box, x: fx * w + dx, y: fy * h + dy });
        }
      }
      options.push(candidates);
    }
    let chosen = [];
    let budget = 0;
    // Backtracking: an earlier card moves aside when a later one has no room.
    // Only if no full arrangement exists may a card keep its default place.
    const search = (index, lenient) => {
      if (index === options.length) return true;
      for (const candidate of options[index]) {
        if (budget-- <= 0) return false;
        if (overlaps(candidate.box, chosen.filter((c) => !c.fallback).map((c) => c.box), 6))
          continue;
        chosen[index] = candidate;
        if (search(index + 1, lenient)) return true;
        chosen.length = index;
      }
      if (!lenient) return false;
      chosen[index] = { fallback: true };
      if (search(index + 1, lenient)) return true;
      chosen.length = index;
      return false;
    };
    for (const lenient of [false, true]) {
      chosen = [];
      budget = 20000;
      if (search(0, lenient)) break;
    }
    zoneMarkers.forEach(({ element }, index) => {
      const pick = chosen[index];
      const placed = pick && !pick.fallback;
      element.style.transform = placed ? "none" : "";
      element.style.left = placed ? `${pick.x}px` : "";
      element.style.top = placed ? `${pick.y}px` : "";
    });
  }
  function layoutMeterLabels() {
    if (!map) return;
    const { clientWidth: width, clientHeight: height } = map.getContainer();
    const occupied = reservedAreas(width, height);
    // A label that would cover another first shrinks to its figure alone, and is
    // hidden only if even that does not fit. Every meter keeps its dot on the map.
    for (const label of meterLabels) {
      const point = map.project(label.coordinates);
      label.element.style.marginLeft = "";
      const measure = () => {
        const w = label.element.offsetWidth || 110;
        const h = label.element.offsetHeight || 48;
        // The selected meter and the bulk meter are always labelled, so near a
        // side edge their label slides inwards instead of being cut off.
        const slide = label.keep
          ? Math.max(4 - (point.x - w / 2), 0) + Math.min(width - 4 - (point.x + w / 2), 0)
          : 0;
        if (slide) label.element.style.marginLeft = `${slide}px`;
        const box = {
          left: point.x - w / 2 + slide,
          right: point.x + w / 2 + slide,
          top: point.y - h - 22,
          bottom: point.y - 22,
        };
        const outside =
          box.right > width || box.left < 0 || box.bottom > height || box.top < 0;
        return {
          box,
          blocked: outside || (!label.keep && overlaps(box, occupied, 6)),
        };
      };
      label.element.classList.remove("compact");
      let fit = measure();
      if (fit.blocked && !label.keep) {
        label.element.classList.add("compact");
        fit = measure();
      }
      label.element.style.visibility = fit.blocked ? "hidden" : "visible";
      if (!fit.blocked) occupied.push(fit.box);
    }
  }
  function update() {
    if (!loaded || !latest) return;
    renderZoneChips();
    if (fallback) {
      fallback.update(latest);
      return;
    }
    if (!map) return;
    const { meters, selected, zone } = latest;
    const overview = !zone && !selected;
    const points = meters.filter((m) => m.location);
    meterRings.forEach((marker) => marker.remove());
    meterRings = [];
    // Every mapped meter is one ring of the same size — no dot is bigger or
    // smaller than another, so the map reads as a register, not a bubble chart.
    if (!overview)
      for (const meter of points) {
        const element = buildMeterMarker(meter, selected);
        element.addEventListener("click", () => pickMeter(meter.account));
        if (hoverable) {
          element.addEventListener("mouseenter", () => showHover(meter));
          element.addEventListener("mouseleave", clearHover);
        }
        meterRings.push(
          new maplibregl.Marker({ element, anchor: "center" })
            .setLngLat(meter.location.coordinates)
            .addTo(map),
        );
      }
    zoneMarkers.forEach(({ marker }) => marker.remove());
    zoneMarkers = [];
    meterLabels.forEach((label) => label.marker.remove());
    meterLabels = [];
    if (!overview) {
      const priority = [...points].sort(
        (a, b) =>
          Number(b.account === selected) - Number(a.account === selected) ||
          Number(isBulk(b)) - Number(isBulk(a)) ||
          // Findings are labelled before ordinary readings.
          STATUS_RANK[statusOf(b)] - STATUS_RANK[statusOf(a)] ||
          (b.value ?? -Infinity) - (a.value ?? -Infinity),
      );
      for (const meter of priority) {
        if (meter.account !== selected && !isBulk(meter)) continue;
        const element = document.createElement("button");
        element.type = "button";
        fillMeterLabel(element, meter, selected, false);
        element.addEventListener("click", () => pickMeter(meter.account));
        const marker = new maplibregl.Marker({
          element,
          anchor: "bottom",
          offset: [0, -22],
        })
          .setLngLat(meter.location.coordinates)
          .addTo(map);
        meterLabels.push({
          marker,
          element,
          coordinates: meter.location.coordinates,
          keep: meter.account === selected || isBulk(meter),
        });
      }
      layoutMeterLabels();
    }
    if (overview) {
      const groups = new Map();
      for (const meter of points) {
        if (!groups.has(meter.zone)) groups.set(meter.zone, []);
        groups.get(meter.zone).push(meter);
      }
      for (const [name, group] of groups) {
        // A group centre locates a zone; it never claims a bulk-meter position.
        const centre = [0, 1].map(
          (i) =>
            group.reduce((sum, m) => sum + m.location.coordinates[i], 0) /
            group.length,
        );
        // The marker is a point; its card hangs off whichever side is free.
        const anchor = document.createElement("div");
        anchor.className = "zone-anchor";
        const el = document.createElement("button");
        el.type = "button";
        fillZoneMarker(el, name, meters.filter((m) => m.zone === name));
        el.addEventListener("click", () =>
          send("satviz:select-zone", { zone: name }),
        );
        anchor.append(el);
        zoneMarkers.push({
          element: el,
          coordinates: centre,
          marker: new maplibregl.Marker({ element: anchor, anchor: "center" })
            .setLngLat(centre)
            .addTo(map),
        });
      }
      layoutZoneMarkers();
    }
    const opacity = zone
      ? [
          "case",
          ["==", ["get", "zone"], zone],
          1,
          ["==", ["get", "zone"], ""],
          0.55,
          0.15,
        ]
      : 1;
    map.setPaintProperty("network-line", "line-opacity", opacity);
    map.setPaintProperty("network-case", "line-opacity", opacity);
    map.setLayoutProperty(
      "fm-connections",
      "visibility",
      zone === "Zone_01_(FM)" ? "visible" : "none",
    );
    map.setPaintProperty(
      "fm-connections",
      "line-opacity",
      selected ? ["case", ["==", ["get", "account"], selected], 1, 0.3] : 0.85,
    );
    const outlineOpacity = (full) =>
      zone
        ? ["case", ["==", ["get", "zone"], zone], full, ["==", ["get", "zone"], ""], full * 0.55, 0.15]
        : full;
    map.setPaintProperty("buildings-line", "line-opacity", outlineOpacity(0.9));
    map.setPaintProperty("plots-unbuilt-line", "line-opacity", outlineOpacity(0.6));
    // Raise only the selected zone's houses (and buildings that belong to no
    // villa zone); neighbouring zones stay as dimmed outlines, like the network.
    map.setFilter(
      "buildings-3d",
      zone
        ? ["all", ["get", "built"], ["any", ["==", ["get", "zone"], zone], ["==", ["get", "zone"], ""]]]
        : ["get", "built"],
    );
    map.setPaintProperty("buildings-3d", "fill-extrusion-color", [
      "case",
      ["==", ["get", "acct"], selected || "-"],
      "#A4C5BB",
      "#E5E7EB",
    ]);
    const wantThreeD = manualThreeD;
    const modeChanged = wantThreeD !== threeD;
    if (modeChanged) applyThreeD(wantThreeD);
    showVillaLink(selected);
    const coordinates =
      context.zones[zone] || points.map((m) => m.location.coordinates);
    if (zone !== previousZone) zoneBearing = zone ? flyBearing(coordinates, points) : 0;
    const zoneChanged = zone !== previousZone || modeChanged;
    previousZone = zone;
    const view = {
      pitch: zone ? (threeD ? TILT : FLY_TILT) : 0,
      bearing: zone ? zoneBearing : 0,
    };
    const focus = `${zone}:${selected}`;
    if (focus === previousFocus && !modeChanged) return;
    const selectedPosition =
      points.find((m) => m.account === selected)?.location ||
      locations.find((p) => p.account === selected);
    const { clientWidth: width } = map.getContainer();
    if (zoneChanged || !selectedPosition) {
      // Auto fly: only a change of zone (or of 2D/3D) moves the whole camera.
      if (!coordinates.length) return;
      const bounds = new maplibregl.LngLatBounds();
      coordinates.forEach((coordinate) => bounds.extend(coordinate));
      map.fitBounds(bounds, {
        padding: {
          top: fullScreen ? 90 : 40,
          bottom: 70,
          left: width < 640 ? 30 : 60,
          right: width < 640 ? 50 : 80,
        },
        maxZoom: 17.5,
        ...view,
        duration: reducedMotion ? 0 : 1100,
      });
      previousFocus = focus;
      keepInView(coordinates, focus, 5);
    } else if (selected !== mapPick) {
      // Chosen from the page's list: bring the dot to the middle, same angle.
      map.easeTo({
        center: selectedPosition.coordinates,
        zoom: Math.max(map.getZoom(), 17.5),
        duration: reducedMotion ? 0 : 600,
      });
      previousFocus = focus;
    } else previousFocus = focus; // tapped on the map: the camera stays put
  }

  const clearHover = () => {
    hoverTag?.marker.remove();
    hoverTag = null;
  };
  // With a mouse, a ring answers with its name and figure — one tag, gone when
  // the pointer leaves. Touch screens select instead.
  function showHover(meter) {
    if (hoverTag?.account === meter.account || meter.account === latest?.selected) return;
    clearHover();
    const element = document.createElement("div");
    fillMeterLabel(element, meter, "", true);
    element.classList.add("hover");
    hoverTag = {
      account: meter.account,
      marker: new maplibregl.Marker({ element, anchor: "bottom", offset: [0, -22] })
        .setLngLat(meter.location.coordinates)
        .addTo(map),
    };
  }
  const pickMeter = (account) => {
    mapPick = account;
    send("satviz:select-meter", { account });
  };
  // Compass bearing from the zone's start to its far end. The start is the
  // zone's bulk meter; where that position is not on the map, the end of the
  // zone's longest axis that lies nearer the rest of the site stands in for it.
  function flyBearing(coordinates, points) {
    if (coordinates.length < 2) return 0;
    const scale = Math.cos((coordinates[0][1] * Math.PI) / 180);
    const distance = (a, b) => Math.hypot((a[0] - b[0]) * scale, a[1] - b[1]);
    const farthest = (from) =>
      coordinates.reduce((best, c) => (distance(from, c) > distance(from, best) ? c : best));
    let start = points.find((m) => isBulk(m))?.location.coordinates;
    if (!start) {
      const a = farthest(coordinates[0]);
      const b = farthest(a);
      const site = [58.639, 23.5468];
      start = distance(a, site) <= distance(b, site) ? a : b;
    }
    const end = farthest(start);
    const angle =
      (Math.atan2((end[0] - start[0]) * scale, end[1] - start[1]) * 180) / Math.PI;
    return Math.round((angle + 360) % 360);
  }

  // One-tap zone switching on the map itself, so the operator never has to
  // leave it (or full screen) to change zone. "All" returns to the whole site.
  // Mounted on the page, not inside the map: the compatibility renderer clears
  // the map container, and its users (mostly iOS) need the chips just as much.
  function renderZoneChips() {
    if (!latest) return;
    if (!chipBar) {
      chipBar = document.createElement("div");
      chipBar.className = "zone-chips";
      chipBar.setAttribute("role", "group");
      chipBar.setAttribute("aria-label", "Zone");
      document.body.append(chipBar);
    }
    const known = (latest.zones || []).filter(
      (z) => (context.zones[z.id] || []).length > 0,
    );
    const key = `${latest.zone}|${known.map((z) => z.id).join(",")}`;
    if (chipBar.dataset.key === key) return;
    chipBar.dataset.key = key;
    chipBar.replaceChildren();
    for (const z of [{ id: "", name: "All" }, ...known]) {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "zone-chip";
      chip.textContent = z.name;
      chip.setAttribute("aria-pressed", String(z.id === latest.zone));
      chip.addEventListener("click", () => send("satviz:select-zone", { zone: z.id }));
      chipBar.append(chip);
      if (z.id === latest.zone && typeof chip.scrollIntoView === "function")
        chip.scrollIntoView({ block: "nearest", inline: "center" });
    }
  }
  // Embedded in the page, a touch map must leave one finger to the page scroll.
  // Full screen there is no page to scroll, so one finger moves the map, two
  // fingers turn and tilt it, and the compass puts the zone view back.
  function applyMode() {
    if (!map) return;
    const gestures = map.cooperativeGestures;
    if (gestures && fullScreen) gestures.disable();
    else if (gestures) gestures.enable();
    if (fullScreen) {
      map.touchZoomRotate.enableRotation();
      map.touchPitch.enable();
    } else {
      map.touchZoomRotate.disableRotation();
      map.touchPitch.disable();
    }
    document.documentElement.classList.toggle("full", fullScreen);
  }

  // fitBounds sizes the frame for a flat map; tilted, the near edge of a zone can
  // fall off screen. After the move, step back until every point is in view.
  function keepInView(coordinates, focus, tries) {
    if (!latest?.zone || typeof map.once !== "function") return;
    map.once("moveend", () => {
      if (!map || focus !== previousFocus || tries <= 0) return;
      const { clientWidth: width, clientHeight: height } = map.getContainer();
      const outside = coordinates.some((coordinate) => {
        const point = map.project(coordinate);
        return (
          point.x < 24 || point.x > width - 24 || point.y < 40 || point.y > height - 48
        );
      });
      if (!outside) return;
      map.easeTo({ zoom: map.getZoom() - 0.3, duration: reducedMotion ? 0 : 250 });
      keepInView(coordinates, focus, tries - 1);
    });
  }

  // The selected villa's outline and house connection. The link was matched by
  // position when the model was built, so the note on the map says so.
  function showVillaLink(selected) {
    const villa = villaByAccount.get(selected) || null;
    if (villa === previousLink) return;
    previousLink = villa;
    const features = [];
    if (villa) {
      features.push({
        type: "Feature",
        properties: { part: "outline" },
        geometry: { type: "LineString", coordinates: villa.ring },
      });
      for (const s of villa.svc || [])
        features.push({
          type: "Feature",
          properties: { part: "connection" },
          geometry: { type: "LineString", coordinates: s.c },
        });
    }
    map.getSource("villa-link").setData({ type: "FeatureCollection", features });
    const s = villa?.svc?.[0];
    const headline = s
      ? `House connection · ${s.d ?? "size not recorded"}${s.d ? " mm" : ""} ${s.m ?? ""} · ${s.len} m`
      : "";
    const caveatText = "Matched by position — confirm against the meter schedule";
    // The page's meter sheet carries the same words, so a phone — where a note
    // on the map would sit under the thumb and the sheet — does not need it drawn.
    send("satviz:villa-link", { text: s ? `${headline}. ${caveatText}.` : "" });
    // Words go to the page's panel; the map only lights the outline and the pipe.
  }

  function activateFallback(error) {
    console.error("[water-satellite] WebGL map unavailable", error);
    try {
      if (map) map.remove();
      map = null;
      if (typeof window.createSatelliteFallback !== "function")
        throw new Error("Compatibility map did not load.");
      fallback = window.createSatelliteFallback({
        container: document.getElementById("map"),
        context,
        network: window.NETWORK || [],
        volume,
        onMeter: (account) => send("satviz:select-meter", { account }),
        onZone: (zone) => send("satviz:select-zone", { zone }),
        onStatus: (text) => report("degraded", text),
        fillMeterLabel,
        fillZoneMarker,
        statusOf,
        buildBar,
      });
      loaded = true;
      report(
        "degraded",
        "Compatibility satellite map active. Daily meters and network lines remain interactive.",
      );
      update();
    } catch (fallbackError) {
      console.error("[water-satellite] Compatibility map failed", fallbackError);
      report(
        "error",
        "The satellite and compatibility maps are unavailable. Use the meter table or retry the map.",
      );
    }
  }
  // Flat house outlines under the network. Built houses are solid lines; plots
  // with no building on the 11 Jan 2024 imagery, and outlines not yet traced,
  // are dashed. The map stays flat, so no heights are drawn.
  function addBuildings() {
    map.addSource("buildings", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: buildings.map((b) => ({
          type: "Feature",
          properties: {
            built: b.st === "built",
            h: b.h,
            acct: b.acct || "",
            zone: context.zoneIds[b.zone] || "",
          },
          geometry: { type: "Polygon", coordinates: [b.ring] },
        })),
      },
    });
    map.addLayer({
      id: "buildings-fill",
      type: "fill",
      source: "buildings",
      minzoom: 15,
      filter: ["get", "built"],
      paint: { "fill-color": "#F7F8F9", "fill-opacity": 0.12 },
    });
    // Two layers: this MapLibre build cannot vary line-dasharray per feature.
    map.addLayer({
      id: "buildings-line",
      type: "line",
      source: "buildings",
      minzoom: 15,
      filter: ["get", "built"],
      paint: { "line-color": "#F7F8F9", "line-width": 1.2, "line-opacity": 0.9 },
    });
    map.addLayer({
      id: "plots-unbuilt-line",
      type: "line",
      source: "buildings",
      minzoom: 15,
      filter: ["!", ["get", "built"]],
      paint: {
        "line-color": "#F7F8F9",
        "line-width": 1,
        "line-dasharray": [2, 2],
        "line-opacity": 0.6,
      },
    });
  }
  // 3D houses, shown only in the tilted view. Heights come from the model and
  // are ASSUMED (the as-built drawings carry none); the view says so on screen.
  function addBuildings3d() {
    map.addLayer({
      id: "buildings-3d",
      type: "fill-extrusion",
      source: "buildings",
      minzoom: 15,
      filter: ["get", "built"],
      layout: { visibility: "none" },
      paint: {
        "fill-extrusion-color": "#E5E7EB",
        "fill-extrusion-height": ["get", "h"],
        "fill-extrusion-base": 0,
        "fill-extrusion-opacity": 0.9,
        "fill-extrusion-vertical-gradient": true,
      },
    });
  }
  // Layers and button only; update() moves the camera so a zone is re-framed
  // for the new angle in one move.
  function applyThreeD(on) {
    threeD = on;
    previousLink = undefined; // the villa note sits on a different corner when tilted
    map.setLayoutProperty("buildings-3d", "visibility", on ? "visible" : "none");
    map.setLayoutProperty("buildings-fill", "visibility", on ? "none" : "visible");
    if (threeDButton) labelThreeD(on, threeDButton, threeDBadge);
  }
  function labelThreeD(on, button, badge) {
    button.setAttribute("aria-pressed", String(on));
    button.textContent = on ? "2D" : "3D";
    button.setAttribute(
      "aria-label",
      on ? "Return to the flat map" : "Show houses in 3D (heights are assumed)",
    );
    badge.hidden = !on;
  }
  // A map button, not a gesture: tilt stays off for touch, so iOS behaves as before.
  function addThreeDControl() {
    const container = document.createElement("div");
    container.className = "maplibregl-ctrl three-d-control";
    const group = document.createElement("div");
    group.className = "maplibregl-ctrl-group";
    const button = document.createElement("button");
    button.type = "button";
    button.className = "three-d-button";
    const badge = document.createElement("p");
    badge.className = "three-d-badge";
    badge.textContent = "3D · building heights assumed";
    badge.hidden = true;
    button.addEventListener("click", () => {
      manualThreeD = !threeD;
      update();
    });
    threeDButton = button;
    threeDBadge = badge;
    const home = document.createElement("button");
    home.type = "button";
    home.className = "three-d-button";
    home.textContent = "All";
    home.setAttribute("aria-label", "Back to the whole site");
    home.addEventListener("click", () => send("satviz:select-zone", { zone: "" }));
    group.append(home, button);
    container.append(group, badge);
    map.addControl({ onAdd: () => container, onRemove: () => container.remove() }, "top-right");
    labelThreeD(false, button, badge);
  }
  function addVillaLink() {
    map.addSource("villa-link", {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
    });
    map.addLayer({
      id: "villa-link-case",
      type: "line",
      source: "villa-link",
      paint: { "line-color": "#4E4456", "line-width": 7 },
    });
    map.addLayer({
      id: "villa-link-line",
      type: "line",
      source: "villa-link",
      paint: {
        "line-color": "#A4C5BB",
        "line-width": ["case", ["==", ["get", "part"], "connection"], 4, 3],
      },
    });
  }
  function addNetwork() {
    const features = (window.NETWORK || [])
      .filter((route) => route.k === 0 || route.k === 1)
      .map((route) => ({
        type: "Feature",
        properties: {
          zone: context.zoneIds[route.zoneId] || route.zoneId || "",
          diameter: route.d ?? null,
          material: route.m ?? null,
          source: route.source || "existing-coo87-overlay",
          kind: route.k,
        },
        geometry: { type: "LineString", coordinates: route.c },
      }));
    map.addSource("network", {
      type: "geojson",
      data: { type: "FeatureCollection", features },
    });
    map.addLayer({
      id: "network-case",
      type: "line",
      source: "network",
      paint: {
        "line-color": "#4E4456",
        "line-width": ["case", ["==", ["get", "kind"], 0], 5, 3.5],
      },
    });
    map.addLayer({
      id: "network-line",
      type: "line",
      source: "network",
      paint: {
        "line-color": "#A4C5BB",
        "line-width": ["case", ["==", ["get", "kind"], 0], 2.5, 1.5],
      },
    });
    map.addSource("fm-connections", {
      type: "geojson",
      data: { type: "FeatureCollection", features: context.connections },
    });
    map.addLayer({
      id: "fm-connections",
      type: "line",
      source: "fm-connections",
      paint: {
        "line-color": "#A4C5BB",
        "line-width": 2.5,
        "line-dasharray": [2, 2],
      },
    });
  }

  function boot() {
    if (map) return;
    try {
      if (typeof maplibregl === "undefined")
        throw new Error("Map library did not load.");
      map = new maplibregl.Map({
        container: "map",
        center: [58.639, 23.5468],
        zoom: 14.6,
        pitch: 0,
        bearing: 0,
        maxPitch: TILT,
        preserveDrawingBuffer: false,
        antialias: false,
        pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
        dragRotate: false,
        touchPitch: false,
        cooperativeGestures: true,
        attributionControl: { compact: true },
        style: {
          version: 8,
          sources: {
            imagery: {
              type: "raster",
              tileSize: 256,
              maxzoom: 19,
              tiles: ["/api/satellite-tiles/{z}/{x}/{y}"],
              attribution: "Imagery © Esri",
            },
          },
          layers: [{ id: "imagery", type: "raster", source: "imagery" }],
        },
      });
      applyMode();
      const relayout = () => {
        layoutMeterLabels();
        layoutZoneMarkers();
      };
      map.on("moveend", relayout);
      map.on("resize", relayout);
      map.addControl(
        new maplibregl.NavigationControl({ showCompass: true, visualizePitch: true }),
        "top-right",
      );
      map.on("error", (event) => {
        console.error("[water-satellite]", event.error);
        report(
          "degraded",
          "Some imagery could not load. Daily labels and the meter table remain available.",
        );
      });
      map.on("webglcontextlost", (event) => {
        event?.preventDefault?.();
        activateFallback(new Error("WebGL context was lost."));
      });
      map.on("webglcontextrestored", () => {
        report("ready", "");
        update();
      });
      map.on("load", () => {
        addBuildings();
        addBuildings3d();
        addNetwork();
        addVillaLink();
        addThreeDControl();
        loaded = true;
        report("ready", "");
        if (!window.NETWORK?.length || !window.SATELLITE_CONTEXT)
          report(
            "degraded",
            "Network geometry could not load. Meter readings remain available.",
          );
        update();
      });
    } catch (error) {
      activateFallback(error);
    }
  }
  window.addEventListener("message", (event) => {
    if (event.origin !== location.origin || event.source !== window.parent)
      return;
    const data = event.data;
    if (!data || typeof data !== "object") return;
    if (data.type === "satviz:hello") {
      send("satviz:ready", { locations });
      return;
    }
    if (data.type === "satviz:focus") {
      if (fallback) {
        fallback.focus();
        return;
      }
      previousFocus = "";
      previousZone = null; // re-run the zone fly-in
      update();
      return;
    }
    if (data.type === "satviz:mode") {
      fullScreen = data.full === true;
      applyMode();
      return;
    }
    if (data.type === "satviz:resize") {
      if (map) map.resize();
      fallback?.resize();
      return;
    }
    if (data.type !== "satviz:data" && data.type !== "satviz:update") return;
    if (!valid(data.payload)) return;
    latest = data.payload;
    boot();
    update();
  });
  window.addEventListener("pagehide", () => {
    zoneMarkers.forEach(({ marker }) => marker.remove());
    meterLabels.forEach((label) => label.marker.remove());
    meterRings.forEach((marker) => marker.remove());
    clearHover();
    if (map) {
      map.remove();
      map = null;
    }
    fallback?.remove();
    fallback = null;
  });
  send("satviz:ready", { locations });
})();