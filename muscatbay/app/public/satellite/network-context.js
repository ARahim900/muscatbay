"use strict";
(() => {
  // Positions retained from index.html POINTS / ZONE_POS / OWNER_ZONE_POS.
  // The fire-pump building uses its current registry account 4300309; the old
  // map used 4300409. This links a building position, never historical readings.
  const positions = [
    {
      account: "C43659",
      coordinates: [58.629591, 23.5431822],
      precision: "Existing building position \u2014 meter chamber not surveyed",
    },
    {
      account: "4300297",
      coordinates: [58.6323657, 23.541871],
      precision: "Existing building position \u2014 meter chamber not surveyed",
    },
    {
      account: "4300295",
      coordinates: [58.635047, 23.5458243],
      precision: "Existing building position \u2014 meter chamber not surveyed",
    },
    {
      account: "4300294",
      coordinates: [58.6440136, 23.547257],
      precision: "Existing building position \u2014 meter chamber not surveyed",
    },
    {
      account: "4300300",
      coordinates: [58.6337936, 23.5410469],
      precision: "Existing building position \u2014 meter chamber not surveyed",
    },
    {
      account: "4300301",
      coordinates: [58.6340144, 23.5409337],
      precision: "Existing building position \u2014 meter chamber not surveyed",
    },
    {
      account: "4300302",
      coordinates: [58.6342207, 23.5408259],
      precision: "Existing building position \u2014 meter chamber not surveyed",
    },
    {
      account: "4300303",
      coordinates: [58.6347064, 23.5413591],
      precision: "Existing building position \u2014 meter chamber not surveyed",
    },
    {
      account: "4300304",
      coordinates: [58.6346233, 23.5415728],
      precision: "Existing building position \u2014 meter chamber not surveyed",
    },
    {
      account: "4300305",
      coordinates: [58.634538, 23.5417426],
      precision: "Existing building position \u2014 meter chamber not surveyed",
    },
    {
      account: "4300306",
      coordinates: [58.6344521, 23.5419359],
      precision: "Existing building position \u2014 meter chamber not surveyed",
    },
    {
      account: "4300307",
      coordinates: [58.6343595, 23.5421354],
      precision: "Existing building position \u2014 meter chamber not surveyed",
    },
    {
      account: "4300324",
      coordinates: [58.6346852, 23.5408934],
      precision: "Existing building position \u2014 meter chamber not surveyed",
    },
    {
      account: "4300296",
      coordinates: [58.6334506, 23.541218],
      precision: "Existing building position \u2014 meter chamber not surveyed",
    },
    {
      account: "4300325",
      coordinates: [58.6335857, 23.5414221],
      precision: "Existing building position \u2014 meter chamber not surveyed",
    },
    {
      account: "4300298",
      coordinates: [58.6335959, 23.5416937],
      precision: "Existing building position \u2014 meter chamber not surveyed",
    },
    {
      account: "4300308",
      coordinates: [58.633789, 23.5415138],
      precision: "Existing building position \u2014 meter chamber not surveyed",
    },
    {
      account: "4300309",
      coordinates: [58.6338696, 23.5414807],
      precision: "Existing building position \u2014 meter chamber not surveyed",
    },
    {
      account: "4300310",
      coordinates: [58.6338327, 23.5414134],
      precision: "Existing building position \u2014 meter chamber not surveyed",
    },
    {
      account: "4300337",
      coordinates: [58.6337867, 23.5413027],
      precision: "Existing building position \u2014 meter chamber not surveyed",
    },
    {
      account: "4300339",
      coordinates: [58.6345929, 23.5409248],
      precision: "Existing building position \u2014 meter chamber not surveyed",
    },
    {
      account: "4300346",
      coordinates: [58.6333192, 23.5414327],
      precision: "FM chamber position from existing as-built register",
    },
    {
      account: "4300343",
      coordinates: [58.637927, 23.549146],
      precision: "Zone entrance reference \u2014 meter chamber not surveyed",
    },
    {
      account: "4300344",
      coordinates: [58.637472, 23.548906],
      precision: "Zone entrance reference \u2014 meter chamber not surveyed",
    },
    {
      account: "4300345",
      coordinates: [58.639325, 23.548135],
      precision: "Zone entrance reference \u2014 meter chamber not surveyed",
    },
    {
      account: "4300335",
      coordinates: [58.6359902, 23.5473952],
      precision: "Zone entrance reference \u2014 meter chamber not surveyed",
    },
    {
      account: "4300342",
      coordinates: [58.64401, 23.54726],
      precision: "Approximate zone reference \u2014 meter chamber not surveyed",
    },
  ];
  const fmAccounts = [
    "4300300",
    "4300301",
    "4300302",
    "4300303",
    "4300304",
    "4300305",
    "4300306",
    "4300307",
    "4300324",
    "4300296",
    "4300325",
    "4300298",
    "4300308",
    "4300309",
    "4300310",
    "4300337",
    "4300339",
  ];
  const zoneIds = {
    "Zone 3A": "Zone_03_(A)",
    Zone_03A: "Zone_03_(A)",
    "Zone 3B": "Zone_03_(B)",
    Zone_03B: "Zone_03_(B)",
    "Zone 5": "Zone_05",
    "Zone 8": "Zone_08",
    Zone_FM: "Zone_01_(FM)",
  };
  const zones = {};
  for (const plot of window.PLOTS || []) {
    const zone = zoneIds[plot.zone] || plot.zone;
    if (!zones[zone]) zones[zone] = [];
    zones[zone].push(plot.c);
  }
  const bulkZones = {
    4300346: "Zone_01_(FM)",
    4300343: "Zone_03_(A)",
    4300344: "Zone_03_(B)",
    4300345: "Zone_05",
    4300342: "Zone_08",
    4300335: "Zone_VS",
    C43659: "Main Bulk",
  };
  for (const point of positions) {
    const zone = fmAccounts.includes(point.account)
      ? "Zone_01_(FM)"
      : bulkZones[point.account];
    if (!zone) continue;
    if (!zones[zone]) zones[zone] = [];
    zones[zone].push(point.coordinates);
  }
  const routes = (window.NETWORK || []).filter(
    (route) => route.source === "zone-fm-external-as-built",
  );
  // Shortest links are navigation schematics, not inferred buried pipe routes.
  function nearestRoutePoint(point) {
    let nearest = null,
      distance = Infinity;
    const scale = Math.cos((point[1] * Math.PI) / 180);
    for (const route of routes)
      for (let i = 1; i < route.c.length; i++) {
        const a = route.c[i - 1],
          b = route.c[i];
        const dx = (b[0] - a[0]) * scale,
          dy = b[1] - a[1];
        const length = dx * dx + dy * dy;
        const t = length
          ? Math.max(
              0,
              Math.min(
                1,
                ((point[0] - a[0]) * scale * dx + (point[1] - a[1]) * dy) /
                  length,
              ),
            )
          : 0;
        const candidate = [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])];
        const d =
          ((point[0] - candidate[0]) * scale) ** 2 +
          (point[1] - candidate[1]) ** 2;
        if (d < distance) {
          distance = d;
          nearest = candidate;
        }
      }
    return nearest;
  }
  const connections = positions
    .filter((p) => fmAccounts.includes(p.account))
    .flatMap((p) => {
      const start = nearestRoutePoint(p.coordinates);
      return start
        ? [
            {
              type: "Feature",
              properties: {
                account: p.account,
                zone: "Zone_01_(FM)",
                schematic: true,
              },
              geometry: {
                type: "LineString",
                coordinates: [start, p.coordinates],
              },
            },
          ]
        : [];
    });
  window.SATELLITE_CONTEXT = { positions, zones, connections, zoneIds };
})();
