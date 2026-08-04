/* Owner-confirmed road alignment for buried potable-water mains.
   Original CAD junctions are retained while the marked spans are replaced by
   vertices that follow the visible road corridors confirmed on 04 Aug 2026.

   Since network.js was re-extracted with DWG curves tessellated (bulged
   polylines no longer collapse to chords), the drawing itself now follows
   most bends. Each owner mark was measured against that curve-true geometry:

     Zone 5 DI trunk beside AV-01    1.0 m from the DWG curve  -> superseded
     Zone 5 HDPE road beside AV-01   4.5 m from the DWG curve  -> superseded
     Zone 3 inner road curve        23.6 m from the DWG curve  -> KEPT
     Zone 8 IV-10 to FH-29/30       11.4 m from the DWG curve  -> KEPT
     Zone 8 FH-29/30 to IV-21       11.3 m from the DWG curve  -> KEPT

   Within ~5 m the mark and the survey describe the same corridor and the
   surveyed curve wins; beyond that the owner's field knowledge overrides
   what the drawing shows. Runs are matched by bore, material and junction
   endpoints — never by vertex count, which changes with every re-extraction —
   and the marked span is spliced in between the nearest surviving vertices,
   so both CAD junctions stay exactly where the survey puts them. */
(function applyOwnerConfirmedRoadAlignments() {
  const network = window.NETWORK;
  if (!Array.isArray(network)) {
    console.error("Road alignments could not load: network data is missing.");
    return;
  }

  // Squared local-metre distance — fine for spans this short.
  const metresSq = (a, b) => {
    const dx = (a[0] - b[0]) * 102000;
    const dy = (a[1] - b[1]) * 110540;
    return dx * dx + dy * dy;
  };
  const ENDPOINT_TOLERANCE_SQ = 1.5 * 1.5;

  const findMain = ({ diameter, material, start, end }) =>
    network.find(
      (feature) =>
        feature.k === 0 &&
        feature.d === diameter &&
        feature.m === material &&
        ((metresSq(feature.c[0], start) < ENDPOINT_TOLERANCE_SQ &&
          metresSq(feature.c.at(-1), end) < ENDPOINT_TOLERANCE_SQ) ||
          (metresSq(feature.c[0], end) < ENDPOINT_TOLERANCE_SQ &&
            metresSq(feature.c.at(-1), start) < ENDPOINT_TOLERANCE_SQ)),
    );

  const nearestIndex = (points, target) => {
    let bestIndex = 0;
    let bestDistance = Infinity;
    points.forEach((point, index) => {
      const d = metresSq(point, target);
      if (d < bestDistance) {
        bestDistance = d;
        bestIndex = index;
      }
    });
    return bestIndex;
  };

  // Replace the span between the vertices nearest the marked path's ends.
  // Handles either run orientation; the junction vertices survive untouched.
  const spliceRoadPath = (feature, roadPath) => {
    const c = feature.c;
    const i0 = nearestIndex(c, roadPath[0]);
    const i1 = nearestIndex(c, roadPath.at(-1));
    feature.c =
      i0 <= i1
        ? c.slice(0, i0).concat(roadPath, c.slice(i1 + 1))
        : c.slice(0, i1).concat([...roadPath].reverse(), c.slice(i0 + 1));
  };

  const zone8Upper = findMain({
    diameter: 110,
    material: "HDPE",
    start: [58.644324, 23.549489],
    end: [58.643795, 23.54825],
  });
  const zone8Lower = findMain({
    diameter: 110,
    material: "HDPE",
    start: [58.646767, 23.549411],
    end: [58.643795, 23.54825],
  });
  const zone3Curve = findMain({
    diameter: 160,
    material: "HDPE",
    start: [58.633948, 23.548216],
    end: [58.640441, 23.551963],
  });

  if (!zone8Upper || !zone8Lower || !zone3Curve) {
    console.error("Road alignments could not load: source segments changed.");
    return;
  }

  spliceRoadPath(zone3Curve, [
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
  ]);

  spliceRoadPath(zone8Upper, [
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
  ]);

  spliceRoadPath(zone8Lower, [
    [58.644084, 23.547469],
    [58.644012, 23.547378],
    [58.643944, 23.547321],
    [58.64387, 23.547274],
    [58.643793, 23.54725],
    [58.643718, 23.547256],
    [58.64365, 23.547284],
    [58.643595, 23.547332],
    [58.643558, 23.547406],
    [58.64354, 23.547489],
    [58.64354, 23.547572],
    [58.643553, 23.547664],
    [58.643574, 23.547756],
    [58.643605, 23.547848],
    [58.64364, 23.547933],
    [58.643678, 23.548008],
    [58.643716, 23.548084],
    [58.643755, 23.54816],
    [58.643795, 23.54825],
  ]);

  const corrected = [
    [zone3Curve, "Zone 3", "owner-marked inner road curve"],
    [zone8Upper, "Zone 8", "IV-10 to FH-29/30"],
    [zone8Lower, "Zone 8", "FH-29/30 to IV-21"],
  ];

  for (const [feature, zone, segment] of corrected) {
    feature.source = "owner-confirmed-road-alignment";
    feature.accuracy = "site-aligned";
    feature.drawing = "Owner-confirmed road corridor · 04 Aug 2026";
    feature.segment = `${zone} · ${segment}`;
  }

  window.NETWORK_ROAD_ALIGNMENT = {
    zones: ["Zone 3", "Zone 8"],
    featureCount: corrected.length,
    effectiveDate: "2026-08-04",
    basis: "owner-confirmed buried pipe follows road corridor",
    superseded: "Zone 5 marks retired — the curve-true DWG geometry matches them",
  };
})();
