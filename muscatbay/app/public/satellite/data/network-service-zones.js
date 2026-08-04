/* Group the extracted CAD house-connection features by the nearest surveyed
   plot. This changes only display filtering; the service geometry remains the
   original COO87 geometry. */
(function groupServiceConnectionsByZone() {
  const network = window.NETWORK;
  const plots = window.PLOTS;
  if (!Array.isArray(network) || !Array.isArray(plots)) {
    console.error("Service connections could not load: network or plot data is missing.");
    return;
  }

  const zoneIds = {
    "Zone 3A": "Zone_03A",
    "Zone 3B": "Zone_03B",
    "Zone 5": "Zone_05",
    "Zone 8": "Zone_08",
  };
  const maximumDistanceMetres = 45;
  const maximumDistanceSquared = maximumDistanceMetres ** 2;
  const counts = Object.fromEntries(Object.values(zoneIds).map((zoneId) => [zoneId, 0]));

  for (const feature of network) {
    if (feature.k !== 1) continue;

    let nearestPlot = null;
    let nearestDistanceSquared = Number.POSITIVE_INFINITY;
    for (const plot of plots) {
      const zoneId = zoneIds[plot.zone];
      if (!zoneId) continue;
      for (const coordinate of feature.c) {
        const dx = (coordinate[0] - plot.c[0]) * 102000;
        const dy = (coordinate[1] - plot.c[1]) * 110540;
        const distanceSquared = dx * dx + dy * dy;
        if (distanceSquared < nearestDistanceSquared) {
          nearestDistanceSquared = distanceSquared;
          nearestPlot = plot;
        }
      }
    }

    if (!nearestPlot || nearestDistanceSquared > maximumDistanceSquared) continue;
    feature.zoneId = zoneIds[nearestPlot.zone];
    feature.source = feature.source || "coo87-surveyed-service";
    counts[feature.zoneId] += 1;
  }

  window.NETWORK_SERVICE_CONNECTIONS = {
    featureCount: Object.values(counts).reduce((total, count) => total + count, 0),
    counts,
    zones: Object.keys(counts),
    grouping: "nearest surveyed plot within 45 metres",
  };
})();
