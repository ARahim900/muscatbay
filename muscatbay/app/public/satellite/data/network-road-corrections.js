/* Owner-confirmed road alignment for buried potable-water mains.
   Original CAD junctions are retained while long drawing chords are replaced
   by vertices that follow the visible road corridors marked on 04 Aug 2026. */
(function applyOwnerConfirmedRoadAlignments() {
  const network = window.NETWORK;
  if (!Array.isArray(network)) {
    console.error("Road alignments could not load: network data is missing.");
    return;
  }

  const samePoint = (point, expected) =>
    Array.isArray(point) &&
    Math.abs(point[0] - expected[0]) < 0.000001 &&
    Math.abs(point[1] - expected[1]) < 0.000001;

  const findMain = ({ diameter, material, length, start, end }) =>
    network.find((feature) =>
      feature.k === 0 &&
      feature.d === diameter &&
      feature.m === material &&
      feature.c.length === length &&
      samePoint(feature.c[0], start) &&
      samePoint(feature.c.at(-1), end),
    );

  const zone8Upper = findMain({
    diameter: 110,
    material: "HDPE",
    length: 6,
    start: [58.644324, 23.549489],
    end: [58.643795, 23.54825],
  });
  const zone8Lower = findMain({
    diameter: 110,
    material: "HDPE",
    length: 16,
    start: [58.646767, 23.549411],
    end: [58.643795, 23.54825],
  });
  const zone5East = findMain({
    diameter: 200,
    material: "DI",
    length: 21,
    start: [58.638814, 23.547466],
    end: [58.634697, 23.54348],
  });
  const zone5West = findMain({
    diameter: 160,
    material: "HDPE",
    length: 9,
    start: [58.634954, 23.545728],
    end: [58.634609, 23.54331],
  });
  const zone3Curve = findMain({
    diameter: 160,
    material: "HDPE",
    length: 23,
    start: [58.633948, 23.548216],
    end: [58.640441, 23.551963],
  });

  if (!zone8Upper || !zone8Lower || !zone5East || !zone5West || !zone3Curve) {
    console.error("Road alignments could not load: source segments changed.");
    return;
  }

  zone3Curve.c = zone3Curve.c.slice(0, 11).concat([
    [58.6352831, 23.5495005],
    [58.6354065, 23.5494883],
    [58.6355272, 23.5494637],
    [58.6356506, 23.5494243],
    [58.635774, 23.5493801],
    [58.6358973, 23.5493211],
    [58.636018, 23.5492522],
    [58.6361387, 23.5491735],
    [58.6362541, 23.5490825],
    [58.6363748, 23.5489916],
    [58.6364982, 23.5489129],
    [58.6366296, 23.5488613],
    [58.6367583, 23.5488342],
    [58.6368817, 23.5488301],
    [58.6370051, 23.5488383],
    [58.6371285, 23.5488506],
    [58.6372519, 23.548867],
    [58.6373753, 23.5488875],
    [58.637472, 23.548906],
  ], zone3Curve.c.slice(14));

  zone8Upper.c = [
    [58.644324, 23.549489],
    [58.64429, 23.549416],
    [58.6443, 23.549353],
    [58.64433, 23.54929],
    [58.644356, 23.549226],
    [58.644352, 23.549164],
    [58.644327, 23.549098],
    [58.644288, 23.549039],
    [58.644242, 23.548994],
    [58.644192, 23.54895],
    [58.644138, 23.548893],
    [58.644085, 23.548831],
    [58.644035, 23.548764],
    [58.644004, 23.548692],
    [58.643956, 23.548612],
    [58.643903, 23.548532],
    [58.643856, 23.548457],
    [58.643831, 23.54838],
    [58.643805, 23.548309],
    [58.643795, 23.54825],
  ];

  const zone8LowerRoad = [
    [58.643795, 23.54825],
    [58.643755, 23.54816],
    [58.643716, 23.548084],
    [58.643678, 23.548008],
    [58.64364, 23.547933],
    [58.643605, 23.547848],
    [58.643574, 23.547756],
    [58.643553, 23.547664],
    [58.64354, 23.547572],
    [58.64354, 23.547489],
    [58.643558, 23.547406],
    [58.643595, 23.547332],
    [58.64365, 23.547284],
    [58.643718, 23.547256],
    [58.643793, 23.54725],
    [58.64387, 23.547274],
    [58.643944, 23.547321],
    [58.644012, 23.547378],
    [58.644084, 23.547469],
  ];
  zone8Lower.c = zone8Lower.c.slice(0, 11).concat(zone8LowerRoad.reverse());

  zone5East.c = zone5East.c.slice(0, 13).concat([
    [58.635571, 23.545225],
    [58.63549, 23.54509],
    [58.635424, 23.54494],
    [58.63534, 23.54477],
    [58.635276, 23.54461],
    [58.635203, 23.54448],
    [58.63512, 23.54436],
    [58.635032, 23.54424],
    [58.634955, 23.54412],
    [58.634892, 23.54399],
    [58.634838, 23.54386],
    [58.63479, 23.54373],
    [58.634744, 23.5436],
    [58.634697, 23.54348],
  ]);

  zone5West.c = [
    [58.634954, 23.545728],
    [58.63484, 23.54552],
    [58.63473, 23.5452],
    [58.63461, 23.54488],
    [58.63455, 23.54462],
    [58.63452, 23.54434],
    [58.63449, 23.54412],
    [58.63443, 23.54391],
    [58.63435, 23.54372],
    [58.634411, 23.543493],
    [58.634558, 23.543434],
    [58.634609, 23.54331],
  ];

  const corrected = [
    [zone3Curve, "Zone 3", "owner-marked inner road curve"],
    [zone8Upper, "Zone 8", "IV-10 to FH-29/30"],
    [zone8Lower, "Zone 8", "FH-29/30 to IV-21"],
    [zone5East, "Zone 5", "DI trunk beside AV-01"],
    [zone5West, "Zone 5", "HDPE distribution road beside AV-01"],
  ];

  for (const [feature, zone, segment] of corrected) {
    feature.source = "owner-confirmed-road-alignment";
    feature.accuracy = "site-aligned";
    feature.drawing = "Owner-confirmed road corridor · 04 Aug 2026";
    feature.segment = `${zone} · ${segment}`;
  }

  window.NETWORK_ROAD_ALIGNMENT = {
    zones: ["Zone 3", "Zone 5", "Zone 8"],
    featureCount: corrected.length,
    effectiveDate: "2026-08-04",
    basis: "owner-confirmed buried pipe follows road corridor",
  };
})();
