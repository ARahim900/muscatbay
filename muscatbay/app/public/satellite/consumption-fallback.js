"use strict";
(() => {
  const SVG_NS = "http://www.w3.org/2000/svg";
  const DEFAULT_BOUNDS = [58.615, 23.525, 58.675, 23.57];
  const MIN_LNG_SPAN = 0.0018;
  const MIN_LAT_SPAN = 0.0014;
  const TILE_SIZE = 256;
  const MIN_TILE_ZOOM = 1;
  const MAX_TILE_ZOOM = 19;

  const longitudeToWorld = (longitude) => (longitude + 180) / 360;
  const latitudeToWorld = (latitude) => {
    const limited = Math.max(-85.051129, Math.min(85.051129, latitude));
    const radians = (limited * Math.PI) / 180;
    return (
      (1 - Math.log(Math.tan(radians) + 1 / Math.cos(radians)) / Math.PI) /
      2
    );
  };

  const extent = (coordinates) => {
    if (!coordinates.length) return [...DEFAULT_BOUNDS];
    const lngs = coordinates.map((point) => point[0]);
    const lats = coordinates.map((point) => point[1]);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const lngPad = Math.max((maxLng - minLng) * 0.18, MIN_LNG_SPAN / 2);
    const latPad = Math.max((maxLat - minLat) * 0.18, MIN_LAT_SPAN / 2);
    return [minLng - lngPad, minLat - latPad, maxLng + lngPad, maxLat + latPad];
  };

  const centreBounds = (coordinate) => [
    coordinate[0] - MIN_LNG_SPAN,
    coordinate[1] - MIN_LAT_SPAN,
    coordinate[0] + MIN_LNG_SPAN,
    coordinate[1] + MIN_LAT_SPAN,
  ];

  const createSvgElement = (name) => document.createElementNS(SVG_NS, name);

  window.createSatelliteFallback = ({
    container,
    context,
    network,
    onMeter,
    onZone,
    onStatus,
    volume,
  }) => {
    container.replaceChildren();
    container.className = "compat-map";

    const scene = document.createElement("div");
    scene.className = "compat-scene";
    const imagery = document.createElement("div");
    imagery.className = "compat-imagery";
    imagery.setAttribute("aria-hidden", "true");
    const lines = createSvgElement("svg");
    lines.classList.add("compat-network");
    lines.setAttribute("aria-hidden", "true");
    const markers = document.createElement("div");
    markers.className = "compat-markers";
    scene.append(imagery, lines, markers);

    const controls = document.createElement("div");
    controls.className = "compat-controls";
    const zoomIn = document.createElement("button");
    zoomIn.type = "button";
    zoomIn.textContent = "+";
    zoomIn.setAttribute("aria-label", "Zoom in");
    const zoomOut = document.createElement("button");
    zoomOut.type = "button";
    zoomOut.textContent = "−";
    zoomOut.setAttribute("aria-label", "Zoom out");
    controls.append(zoomIn, zoomOut);

    const attribution = document.createElement("div");
    attribution.className = "compat-attribution";
    attribution.textContent = "Imagery © Esri · compatibility map";
    container.append(scene, controls, attribution);

    let bounds = [...DEFAULT_BOUNDS];
    let latest = null;
    let previousFocus = "";
    let imageKey = "";
    let imageryGeneration = 0;
    let drag = null;
    let imageryUnavailable = false;

    const size = () => ({
      width: Math.max(container.clientWidth || 390, 1),
      height: Math.max(container.clientHeight || 520, 1),
    });

    const project = (coordinate) => {
      const { width, height } = size();
      const west = longitudeToWorld(bounds[0]);
      const east = longitudeToWorld(bounds[2]);
      const north = latitudeToWorld(bounds[3]);
      const south = latitudeToWorld(bounds[1]);
      return {
        x:
          ((longitudeToWorld(coordinate[0]) - west) / (east - west)) * width,
        y:
          ((latitudeToWorld(coordinate[1]) - north) / (south - north)) *
          height,
      };
    };

    const pathPoints = (coordinates) =>
      coordinates
        .map((coordinate) => {
          const point = project(coordinate);
          return `${point.x.toFixed(1)},${point.y.toFixed(1)}`;
        })
        .join(" ");

    const addLine = (coordinates, className, opacity) => {
      if (!Array.isArray(coordinates) || coordinates.length < 2) return;
      const polyline = createSvgElement("polyline");
      polyline.setAttribute("points", pathPoints(coordinates));
      polyline.setAttribute("class", className);
      polyline.setAttribute("opacity", String(opacity));
      lines.append(polyline);
    };

    const renderLines = () => {
      lines.replaceChildren();
      const zone = latest?.zone || "";
      for (const route of network) {
        if ((route.k !== 0 && route.k !== 1) || !Array.isArray(route.c)) continue;
        const routeZone = context.zoneIds[route.zoneId] || route.zoneId || "";
        const opacity = !zone
          ? 1
          : routeZone === zone
            ? 1
            : routeZone === ""
              ? 0.55
              : 0.15;
        addLine(route.c, "compat-network-case", opacity);
        addLine(route.c, "compat-network-line", opacity);
      }
      if (zone === "Zone_01_(FM)") {
        for (const feature of context.connections || []) {
          const coordinates = feature?.geometry?.coordinates;
          const account = feature?.properties?.account;
          const opacity = latest.selected
            ? account === latest.selected
              ? 1
              : 0.3
            : 0.85;
          addLine(coordinates, "compat-fm-line", opacity);
        }
      }
    };

    const place = (element, coordinate, anchor = "bottom") => {
      const point = project(coordinate);
      element.style.left = `${point.x}px`;
      element.style.top = `${point.y}px`;
      element.style.transform =
        anchor === "top" ? "translate(-50%, 10px)" : "translate(-50%, calc(-100% - 10px))";
      markers.append(element);
    };

    const renderMarkers = () => {
      markers.replaceChildren();
      if (!latest) return;
      const points = latest.meters.filter((meter) => meter.location);
      const overview = !latest.zone && !latest.selected;
      if (overview) {
        const groups = new Map();
        for (const meter of points) {
          if (!groups.has(meter.zone)) groups.set(meter.zone, []);
          groups.get(meter.zone).push(meter);
        }
        for (const [zone, group] of groups) {
          const centre = [0, 1].map(
            (index) =>
              group.reduce(
                (sum, meter) => sum + meter.location.coordinates[index],
                0,
              ) / group.length,
          );
          const zoneMeters = latest.meters.filter((meter) => meter.zone === zone);
          const recorded = zoneMeters.filter((meter) => meter.value !== null);
          const total = recorded.length
            ? recorded.reduce((sum, meter) => sum + meter.value, 0)
            : null;
          const button = document.createElement("button");
          button.type = "button";
          button.className = "zone-marker";
          button.textContent = group[0].zoneName || zone.split("_").join(" ");
          const value = document.createElement("strong");
          value.textContent = `${volume(total)} m³`;
          const count = document.createElement("span");
          count.textContent = `${recorded.length}/${zoneMeters.length} reporting · ${group.length} mapped`;
          button.append(value, count);
          button.setAttribute(
            "aria-label",
            `Select ${group[0].zoneName || zone}, ${group.length} mapped meters`,
          );
          button.addEventListener("click", () => onZone(zone));
          place(button, centre, zone.includes("03_(A)") ? "bottom" : "top");
        }
        return;
      }

      const priority = [...points].sort(
        (a, b) =>
          Number(b.account === latest.selected) -
            Number(a.account === latest.selected) ||
          (b.value ?? -Infinity) - (a.value ?? -Infinity),
      );
      const { width, height } = size();
      const occupied = [
        { left: 0, right: Math.min(width - 64, 330), top: 0, bottom: 92 },
        { left: width - 64, right: width, top: 0, bottom: 110 },
      ];
      for (const meter of priority) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "compat-meter-point";
        button.classList.toggle("selected", meter.account === latest.selected);
        button.classList.toggle("missing", meter.value === null || meter.value < 0);
        const dot = document.createElement("span");
        dot.className = "compat-meter-dot";
        button.append(dot);
        button.setAttribute(
          "aria-label",
          `${meter.name}, ${latest.date}, ${meter.value === null ? "no reading" : volume(meter.value) + " cubic metres"}. Open meter details`,
        );
        button.addEventListener("click", () => onMeter(meter.account));
        const point = project(meter.location.coordinates);
        button.style.left = `${point.x}px`;
        button.style.top = `${point.y}px`;
        button.style.transform = "translate(-50%, -50%)";
        markers.append(button);

        const box = {
          left: point.x - 55,
          right: point.x + 55,
          top: point.y - 66,
          bottom: point.y - 16,
        };
        const outside =
          box.left < 0 || box.right > width || box.top < 0 || box.bottom > height;
        const overlap = occupied.some(
          (item) =>
            box.left < item.right + 8 &&
            box.right > item.left - 8 &&
            box.top < item.bottom + 8 &&
            box.bottom > item.top - 8,
        );
        if (meter.account !== latest.selected && (outside || overlap)) continue;

        const label = document.createElement("div");
        label.className = "meter-label compat-meter-card";
        label.classList.toggle("selected", meter.account === latest.selected);
        label.classList.toggle("missing", meter.value === null || meter.value < 0);
        label.setAttribute("aria-hidden", "true");
        const name = document.createElement("span");
        name.textContent = meter.name;
        const value = document.createElement("strong");
        value.textContent = `${volume(meter.value)} m³`;
        label.append(name, value);
        label.style.left = `${point.x}px`;
        label.style.top = `${point.y}px`;
        label.style.transform = "translate(-50%, calc(-100% - 10px))";
        markers.append(label);
        occupied.push(box);
      }
    };

    const updateImagery = () => {
      const { width, height } = size();
      const key = `${bounds.map((value) => value.toFixed(6)).join(",")}:${width}:${height}`;
      if (key === imageKey) return;
      imageKey = key;
      imageryGeneration += 1;
      const generation = imageryGeneration;
      imagery.replaceChildren();

      const west = longitudeToWorld(bounds[0]);
      const east = longitudeToWorld(bounds[2]);
      const north = latitudeToWorld(bounds[3]);
      const south = latitudeToWorld(bounds[1]);
      const worldWidth = Math.max(east - west, Number.EPSILON);
      const worldHeight = Math.max(south - north, Number.EPSILON);
      const zoom = Math.max(
        MIN_TILE_ZOOM,
        Math.min(
          MAX_TILE_ZOOM,
          Math.floor(
            Math.log2(
              Math.min(
                width / (worldWidth * TILE_SIZE),
                height / (worldHeight * TILE_SIZE),
              ),
            ),
          ),
        ),
      );
      const tileCount = 2 ** zoom;
      const firstX = Math.floor(west * tileCount);
      const lastX = Math.floor(east * tileCount);
      const firstY = Math.floor(north * tileCount);
      const lastY = Math.floor(south * tileCount);
      let pending = 0;
      let loaded = 0;

      const settle = (succeeded) => {
        if (generation !== imageryGeneration) return;
        pending -= 1;
        if (succeeded) loaded += 1;
        if (pending > 0) return;
        if (loaded === 0) {
          imageryUnavailable = true;
          onStatus(
            "Satellite image could not load. The network and daily meter positions remain available.",
          );
        } else if (imageryUnavailable) {
          imageryUnavailable = false;
          onStatus(
            "Compatibility satellite map active. Daily meters and network lines remain interactive.",
          );
        }
      };

      const fragment = document.createDocumentFragment();
      for (let y = firstY; y <= lastY; y += 1) {
        if (y < 0 || y >= tileCount) continue;
        for (let x = firstX; x <= lastX; x += 1) {
          const wrappedX = ((x % tileCount) + tileCount) % tileCount;
          const tile = document.createElement("img");
          tile.className = "compat-imagery-tile";
          tile.alt = "";
          tile.decoding = "async";
          tile.loading = "eager";
          tile.src = `/api/satellite-tiles/${zoom}/${wrappedX}/${y}`;
          const tileWest = x / tileCount;
          const tileNorth = y / tileCount;
          tile.style.left = `${((tileWest - west) / worldWidth) * width}px`;
          tile.style.top = `${((tileNorth - north) / worldHeight) * height}px`;
          tile.style.width = `${(width / (worldWidth * tileCount)) + 1}px`;
          tile.style.height = `${(height / (worldHeight * tileCount)) + 1}px`;
          pending += 1;
          tile.addEventListener("load", () => settle(true), { once: true });
          tile.addEventListener(
            "error",
            () => {
              tile.hidden = true;
              settle(false);
            },
            { once: true },
          );
          fragment.append(tile);
        }
      }
      imagery.append(fragment);
    };

    const render = (withImagery = true) => {
      if (withImagery) updateImagery();
      renderLines();
      renderMarkers();
    };

    const fit = (force = false) => {
      if (!latest) return;
      const focus = `${latest.zone}:${latest.selected}`;
      if (!force && focus === previousFocus) return;
      const points = latest.meters.filter((meter) => meter.location);
      const selected = points.find((meter) => meter.account === latest.selected);
      const coordinates =
        context.zones[latest.zone] ||
        points.map((meter) => meter.location.coordinates);
      if (selected) bounds = centreBounds(selected.location.coordinates);
      else if (coordinates.length) bounds = extent(coordinates);
      previousFocus = focus;
    };

    const zoom = (factor) => {
      const centreLng = (bounds[0] + bounds[2]) / 2;
      const centreLat = (bounds[1] + bounds[3]) / 2;
      const halfLng = Math.max(((bounds[2] - bounds[0]) * factor) / 2, MIN_LNG_SPAN / 2);
      const halfLat = Math.max(((bounds[3] - bounds[1]) * factor) / 2, MIN_LAT_SPAN / 2);
      bounds = [
        centreLng - halfLng,
        centreLat - halfLat,
        centreLng + halfLng,
        centreLat + halfLat,
      ];
      render();
    };
    zoomIn.addEventListener("click", () => zoom(0.6));
    zoomOut.addEventListener("click", () => zoom(1.7));

    container.addEventListener("pointerdown", (event) => {
      if (event.target.closest("button")) return;
      drag = { x: event.clientX, y: event.clientY, bounds: [...bounds] };
      container.setPointerCapture?.(event.pointerId);
    });
    container.addEventListener("pointermove", (event) => {
      if (!drag) return;
      scene.style.transform = `translate(${event.clientX - drag.x}px, ${event.clientY - drag.y}px)`;
    });
    const finishDrag = (event) => {
      if (!drag) return;
      const { width, height } = size();
      const lngShift = ((event.clientX - drag.x) / width) * (drag.bounds[2] - drag.bounds[0]);
      const latShift = ((event.clientY - drag.y) / height) * (drag.bounds[3] - drag.bounds[1]);
      bounds = [
        drag.bounds[0] - lngShift,
        drag.bounds[1] + latShift,
        drag.bounds[2] - lngShift,
        drag.bounds[3] + latShift,
      ];
      drag = null;
      scene.style.transform = "";
      render();
    };
    container.addEventListener("pointerup", finishDrag);
    container.addEventListener("pointercancel", () => {
      drag = null;
      scene.style.transform = "";
    });

    return {
      update(payload) {
        latest = payload;
        fit();
        render();
      },
      focus() {
        fit(true);
        render();
      },
      resize() {
        imageKey = "";
        render();
      },
      remove() {
        container.replaceChildren();
        container.className = "";
      },
    };
  };
})();
