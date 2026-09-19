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
  let zoneMarkers = [];
  let meterLabels = [];
  let linkNote = null;
  let threeD = false;
  // Operator's own 2D/3D choice for this session; null = follow the automatic view.
  let manualThreeD = null;
  let threeDButton = null;
  let threeDBadge = null;
  // Zone view: the same oblique angle as the standalone as-built 3D model —
  // camera south-west of the zone, looking north-east, whole zone in frame.
  const TILT = 55;
  const ZONE_BEARING = 28;
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
  const volume = (value) =>
    value === null
      ? "—"
      : value.toLocaleString("en-GB", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
  function layoutMeterLabels() {
    if (!map) return;
    const { clientWidth: width, clientHeight: height } = map.getContainer();
    const occupied = [
      { left: 0, right: width - 64, top: 0, bottom: 64 },
      { left: 0, right: Math.min(width - 64, 330), top: 64, bottom: 120 },
      { left: width - 64, right: width, top: 0, bottom: 110 },
    ];
    if (latest?.selected)
      occupied.push({
        left: width < 640 ? 0 : width - 350,
        right: width,
        top: height - 160,
        bottom: height,
      });
    for (const label of meterLabels) {
      const point = map.project(label.coordinates);
      const w = label.element.offsetWidth || 110;
      const h = label.element.offsetHeight || 48;
      const box = {
        left: point.x - w / 2,
        right: point.x + w / 2,
        top: point.y - h - 10,
        bottom: point.y - 10,
      };
      const outside =
        box.right > width || box.left < 0 || box.bottom > height || box.top < 0;
      const overlap = occupied.some(
        (b) =>
          box.left < b.right + 8 &&
          box.right > b.left - 8 &&
          box.top < b.bottom + 8 &&
          box.bottom > b.top - 8,
      );
      const hidden = outside || (!label.selected && overlap);
      label.element.style.visibility = hidden ? "hidden" : "visible";
      if (!hidden) occupied.push(box);
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
    const max = Math.max(1, ...points.map((m) => Math.max(0, m.value ?? 0)));
    map.getSource("meters").setData({
      type: "FeatureCollection",
      features: points.map((m) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: m.location.coordinates },
        properties: {
          account: m.account,
          zone: m.zone,
          selected: m.account === selected,
          focused: !selected || m.account === selected,
          recorded: m.value !== null && m.value >= 0,
          radius:
            m.value === null || m.value < 0
              ? 6
              : Math.max(3, Math.sqrt(m.value / max) * 22),
        },
      })),
    });
    map.setLayoutProperty(
      "meter-circles",
      "visibility",
      overview ? "none" : "visible",
    );
    map.setLayoutProperty(
      "meter-hit",
      "visibility",
      overview ? "none" : "visible",
    );
    zoneMarkers.forEach((marker) => marker.remove());
    zoneMarkers = [];
    meterLabels.forEach((label) => label.marker.remove());
    meterLabels = [];
    if (!overview) {
      const priority = [...points].sort(
        (a, b) =>
          Number(b.account === selected) - Number(a.account === selected) ||
          (b.value ?? -Infinity) - (a.value ?? -Infinity),
      );
      for (const meter of priority) {
        const element = document.createElement("button");
        element.type = "button";
        element.className = "meter-label";
        element.classList.toggle("selected", meter.account === selected);
        element.classList.toggle(
          "missing",
          meter.value === null || meter.value < 0,
        );
        const name = document.createElement("span");
        name.textContent = meter.name;
        const value = document.createElement("strong");
        value.textContent = `${volume(meter.value)} m³`;
        element.append(name, value);
        element.addEventListener("click", () =>
          send("satviz:select-meter", { account: meter.account }),
        );
        const marker = new maplibregl.Marker({
          element,
          anchor: "bottom",
          offset: [0, -10],
        })
          .setLngLat(meter.location.coordinates)
          .addTo(map);
        element.setAttribute(
          "aria-label",
          `${meter.name}, ${latest.date}, ${meter.value === null ? "no reading" : volume(meter.value) + " cubic metres"}. Open meter details`,
        );
        meterLabels.push({
          marker,
          element,
          coordinates: meter.location.coordinates,
          selected: meter.account === selected,
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
        const el = document.createElement("button");
        el.type = "button";
        el.className = "zone-marker";
        el.textContent = group[0].zoneName || name.split("_").join(" ");
        const count = document.createElement("span");
        const zoneMeters = meters.filter((m) => m.zone === name);
        const recorded = zoneMeters.filter((m) => m.value !== null);
        const total = recorded.length
          ? recorded.reduce((sum, m) => sum + m.value, 0)
          : null;
        const value = document.createElement("strong");
        value.textContent = `${volume(total)} m³`;
        count.textContent = `${recorded.length}/${zoneMeters.length} reporting · ${group.length} mapped`;
        el.append(value, count);
        el.addEventListener("click", () =>
          send("satviz:select-zone", { zone: name }),
        );
        zoneMarkers.push(
          new maplibregl.Marker({
            element: el,
            anchor: name.includes("03_(A)") ? "bottom" : "top",
          })
            .setLngLat(centre)
            .addTo(map),
        );
        el.setAttribute(
          "aria-label",
          `Select ${group[0].zoneName || name}, ${group.length} mapped meters`,
        );
      }
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
    const wantThreeD = manualThreeD ?? Boolean(zone);
    const modeChanged = wantThreeD !== threeD;
    if (modeChanged) applyThreeD(wantThreeD);
    showVillaLink(selected);
    const view = { pitch: threeD ? TILT : 0, bearing: threeD ? ZONE_BEARING : 0 };
    const focus = `${zone}:${selected}`;
    if (focus !== previousFocus || modeChanged) {
      const selectedPosition =
        points.find((m) => m.account === selected)?.location ||
        locations.find((p) => p.account === selected);
      const coordinates =
        context.zones[zone] || points.map((m) => m.location.coordinates);
      const { clientWidth: width } = map.getContainer();
      if (selectedPosition) {
        map.easeTo({
          center: selectedPosition.coordinates,
          zoom: 18.5,
          ...view,
          padding: { top: 110, bottom: 170, left: 30, right: 30 },
          duration: reducedMotion ? 0 : 700,
        });
        previousFocus = focus;
      } else if (coordinates.length) {
        const bounds = new maplibregl.LngLatBounds();
        coordinates.forEach((coordinate) => bounds.extend(coordinate));
        map.fitBounds(bounds, {
          padding: {
            top: 120,
            bottom: 65,
            left: width < 640 ? 30 : 60,
            right: width < 640 ? 30 : 60,
          },
          maxZoom: 17,
          ...view,
          duration: reducedMotion ? 0 : 900,
        });
        previousFocus = focus;
        keepInView(coordinates, focus, 4);
      }
    }
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
    if (!threeD || typeof map.once !== "function") return;
    map.once("moveend", () => {
      if (!map || focus !== previousFocus || tries <= 0) return;
      const { clientWidth: width, clientHeight: height } = map.getContainer();
      const outside = coordinates.some((coordinate) => {
        const point = map.project(coordinate);
        return (
          point.x < 24 || point.x > width - 24 || point.y < 100 || point.y > height - 48
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
    if (linkNote) linkNote.remove();
    linkNote = null;
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
    if (!s) return;
    const note = document.createElement("div");
    note.className = "link-note";
    const title = document.createElement("strong");
    title.textContent = `House connection · ${s.d ?? "size not recorded"}${s.d ? " mm" : ""} ${s.m ?? ""} · ${s.len} m`;
    const caveat = document.createElement("span");
    caveat.textContent = "Matched by position — confirm against the meter schedule";
    note.append(title, caveat);
    // Below the house, clear of the meter label above the plot point: the corner
    // lowest on screen for the current view (south when flat, south-west when tilted).
    const bearing = ((threeD ? ZONE_BEARING : 0) * Math.PI) / 180;
    const scale = Math.cos((villa.ring[0][1] * Math.PI) / 180);
    const up = (c) => c[0] * scale * Math.sin(bearing) + c[1] * Math.cos(bearing);
    const lowest = villa.ring.reduce((a, b) => (up(b) < up(a) ? b : a));
    linkNote = new maplibregl.Marker({ element: note, anchor: "top", offset: [0, 8] })
      .setLngLat(lowest)
      .addTo(map);
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
    group.append(button);
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
      map.on("moveend", layoutMeterLabels);
      map.on("resize", layoutMeterLabels);
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
        map.addSource("meters", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });
        map.addLayer({
          id: "meter-circles",
          type: "circle",
          source: "meters",
          paint: {
            "circle-radius": ["get", "radius"],
            "circle-color": "#A4C5BB",
            "circle-opacity": [
              "case",
              ["!", ["get", "recorded"]],
              0,
              ["get", "focused"],
              1,
              0.25,
            ],
            "circle-stroke-color": [
              "case",
              ["get", "selected"],
              "#4E4456",
              "#454545",
            ],
            "circle-stroke-width": ["case", ["get", "selected"], 4, 1.5],
            "circle-stroke-opacity": ["case", ["get", "focused"], 1, 0.25],
          },
        });
        map.addLayer({
          id: "meter-hit",
          type: "circle",
          source: "meters",
          paint: { "circle-radius": 22, "circle-opacity": 0 },
        });
        map.on("click", "meter-hit", (event) => {
          const features = event.features || [];
          const nearest = features.sort((a, b) => {
            const ap = map.project(a.geometry.coordinates),
              bp = map.project(b.geometry.coordinates);
            return (
              Math.hypot(ap.x - event.point.x, ap.y - event.point.y) -
              Math.hypot(bp.x - event.point.x, bp.y - event.point.y)
            );
          })[0];
          if (nearest)
            send("satviz:select-meter", {
              account: nearest.properties.account,
            });
        });
        map.on("mouseenter", "meter-hit", () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", "meter-hit", () => {
          map.getCanvas().style.cursor = "";
        });
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
    zoneMarkers.forEach((marker) => marker.remove());
    meterLabels.forEach((label) => label.marker.remove());
    if (linkNote) linkNote.remove();
    if (map) {
      map.remove();
      map = null;
    }
    fallback?.remove();
    fallback = null;
  });
  send("satviz:ready", { locations });
})();