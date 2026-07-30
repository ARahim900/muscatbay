/* Surveyed positions for metered assets that have no plot tag, so they never
   came through the plot join. Keyed on account, merged with plots-geo.js at
   load. Extracted 27-Jul-2026 from COO87-CA-AB-PL-PW-05.dwg, model space
   UTM 40N (EPSG:32640) -> WGS84; coordinates are survey values, not fitted.

   4300321  Irrigation Tank 03 (Z05)
     Structure: 9.20 x 3.20 m rectangle, 29.4 m2, layer "PLAN".
     Corroborated by the 32 mm HDPE branch that tees off the 110 HDPE main at
     E 667362.67 / N 2605306.14 and terminates 3.0 m from the tank's east
     corner, and by the sheet note "32Ø BRANCH FOR TANK CONNECTION +
     32x40Ø REDUCER". The "IRRIGATION TANK" text sits 12.7 m west of the
     structure — it is an annotation with a leader, not the asset itself.

   4300320  Irrigation Tank 02 (Z03)
     LABEL POSITION ONLY. The "IRRIGATION TANK" text for Zone 3B sits at
     E 667020.70 / N 2605163.33, but no tank structure is drawn near it on
     PW-05 — the shapes around it are villa swimming pools. Flagged approximate
     until a structure is found on another sheet. Do not treat as surveyed. */
window.ASSETS = [
  {
    acct: "4300321",
    id: "IRR-TANK-Z05",
    label: "Z5 Tank",
    name: "Irrigation Tank 03 (Z05)",
    zone: "Zone 5",
    kind: "tank",
    precision: "surveyed",
    c: [58.639528, 23.549493],
    e: 667349.17, n: 2605307.42,
    footprint_m2: 29.4,
    dims: "9.20 × 3.20 m",
    ring: [
      [58.639499, 23.549528],
      [58.639574, 23.549482],
      [58.639557, 23.549458],
      [58.639482, 23.549504],
      [58.639499, 23.549528]
    ],
    feed: {
      bore: 32, material: "HDPE",
      tee: [58.639660, 23.549480],
      tee_e: 667362.67, tee_n: 2605306.14,
      run_m: 5.9,
      from: "110 mm OD HDPE distribution main",
      note: "32Ø branch for tank connection + 32×40Ø reducer"
    }
  },
  {
    acct: "4300320",
    id: "IRR-TANK-Z03",
    label: "Z3 Tank",
    name: "Irrigation Tank 02 (Z03)",
    zone: "Zone 3B",
    kind: "tank",
    precision: "label",
    c: [58.636136, 23.548190],
    e: 667020.70, n: 2605163.33
  }
];
