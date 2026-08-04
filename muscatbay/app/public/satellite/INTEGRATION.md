# Potable water network integration

The Water page embeds `public/satellite/index.html` in a same-origin iframe. The React host sends live Supabase consumption data with `satviz:data`; the static CAD geometry stays in `public/satellite/data`.

## Geometry sources

- `network.js`: 423 pipe features from the consolidated COO87 potable-water as-built drawing set, PW-01 through PW-23C.
- `network-road-corrections.js`: five marked main segments in Zone 3, the two Zone 5 corridors beside AV-01 and Zone 8. Long CAD chords are replaced by owner-confirmed road-following vertices while surveyed junctions remain fixed. The Zone 3 inner-road correction follows the owner-marked curve between the original connection points. The effective network contains 1,189 vertices.
- `network-assets.js`: 101 surveyed valves, hydrants, flow meters, washouts and tanks. Positions are AutoCAD circle centres and IDs are matched from the `ASSET-ID` layer.
- `network-service-zones.js`: groups 121 unchanged CAD service branches for selected-zone display: 31 in Zone 3A, 33 in Zone 3B, 34 in Zone 5 and 23 in Zone 8.
- `zone-fm-network.js`: the separately controlled Zone FM external as-built network.
- `plots-geo.js`: surveyed plot geometry joined to the meter register.
- `building-footprints.js`: 251 building outlines from the as-built package — true rings where the drawings carry one, minimum-area oriented rectangles (indicative) elsewhere. UTM 40N → WGS84 via the same EPSG transform as the pipes; rebuild with `_build/footprints_to_wgs.py` in the Water Network Viz folder. Rendered as a quiet white outline layer beneath the network with a "Buildings" toggle.
- `assets.js`: metered physical assets that are not normal plots.

The COO87 model-space coordinate system is UTM Zone 40N (`EPSG:32640`). Runtime map coordinates are WGS84 longitude/latitude.

## Runtime behaviour

Load data scripts before the main map script. `index.html` converts pipe and asset records to GeoJSON, then renders them with MapLibre. House connections are on by default above zoom 15.2 and filter to Zones 3A, 3B, 5 or 8 when one is selected. Users can still toggle them, filter DI or HDPE mains, search asset IDs such as `IV-11` or `FH-22`, and click a pipe or asset to see its source details and surveyed coordinates.

The existing iframe message contract must remain unchanged:

- `satviz:ready`: map is ready for host data.
- `satviz:data`: initial live consumption and daily readings.
- `satviz:update`: update readings without rebuilding the map.
- `satviz:resize`: resize the current map while preserving camera and selection.

## Updating the CAD data

1. Consolidate the approved COO87 DWGs and export model space to DXF without changing coordinates.
2. Extract potable-water polylines by their bore/material layers and asset circle centres by asset layer.
3. Transform UTM 40N coordinates to WGS84; do not align geometry by eye to satellite imagery.
4. Update the counts and drawing-set metadata in `network-assets.js`.
5. Run the satellite asset test, lint, the complete test suite and the production build.
6. Verify desktop and mobile map views, pipe filtering, asset search and asset click details in the browser.

## Village Square

Village Square internal routes remain withheld until their CAD model has verified geographic control. The owner-confirmed bulk-meter cabinet is shown, the surveyed 225 HDPE trunk and FM Road 3 / 2A junction fronting the crescent are part of the COO87 network (the tapping between trunk and cabinet is not surveyed), and the zone panel lists the building-connection schedule transcribed from the OSCO as-built set (AB-MB-VS-0173-PL-WS-001/002 and WSS-003, Rev C). Unverified pipeline geometry must not be published as surveyed.

The 2026-08-04 georeferencing attempt is documented for the next person: the three OSCO DWGs model in local Revit paste-up frames with no UTM anywhere (no coordinate text, no georeferenced site block, architecture xrefs unbound), the approved PDFs are raster scans without a survey grid, and the COO87 sheet covering the crescent (PW-03, georeferenced from its printed grid with a passing scale check) predates the building — its context stops at the parking, so no shared vector geometry exists to fit against. Curve-matching the 110Ø filling line was scale-degenerate and matching site context was ambiguous; neither meets the accuracy bar. What unlocks the overlay: GPS capture of two or three features identifiable on sheet WS-001 — the MWMC-01 meter-chamber cover, valve chamber VC-01 at the north-east end, and any hose bib — then a similarity fit with reported residuals.

House-connection (k=1) lines render gold (#E8C064) with a dark casing so sub-connections to villas and buildings read distinctly in every zone; hydrant/washout/valve legs are soft red (#D67A7A), matching hydrant points; teal remains reserved for the Zone FM and approved as-built overlays.
