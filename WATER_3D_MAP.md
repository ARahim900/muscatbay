# Water 3D Map — third Water subsection (build log & decisions)

**Status:** in progress · **Branch:** `claude/app-performance-storage-audit-jnqqv7`

Adds a third subsection — **3D Map** — to the Water module, alongside Monthly and
Daily, wired to the live Supabase data and the app's existing calc engines. This
file is the single place decisions and limitations are recorded honestly; it
doubles as the completion report.

## Objective
An interactive, free, offline-capable 3D operational view of water consumption,
loss and efficiency across Zones 3A, 3B, 05, 08 and Village Square (plus FM),
integrated as a native part of the existing app — no new theme, no rebuild, no
Google/paid map service, no separate database.

## Key decisions (and why)

1. **Integration = a third tab, not a new route.** Water switches Monthly/Daily
   via local `dashboardView` state in `app/water/page.tsx` (persisted to
   `localStorage` key `"water"`). The 3D Map is added the same way, lazy-loaded
   with `next/dynamic` + `ssr:false` (WebGL cannot SSR) and its own preferences
   key `"water-map3d"`. Monthly/Daily state is fully self-contained → zero risk.

2. **Renderer = Three.js, not MapLibre + deck.gl** (a deliberate deviation from
   the brief's "preferred" stack). Rationale:
   - **No real geography to honour.** The backend has *no* surveyed coordinates
     for the operational meters (only `water_network_meters`, a partly-synthetic
     demo table, carries lat/lon, and its zones don't match the operational
     ones). A slippy basemap would add a heavy external-tile dependency for
     synthetic positions.
   - **External tiles are blocked.** The app's CSP (`proxy.ts`) and the target
     environment block third-party tile hosts, so MapLibre would render blank.
   - **Zero new heavy dependencies.** `three@0.184` is already installed and
     proven (`components/three/ambient-bay.tsx`). Adding deck.gl + maplibre-gl +
     loaders.gl would bloat the bundle the lazy-load is meant to keep lean.
   - It is genuinely 3D (the feature is literally "3D Map"), runs with **no API
     key, offline, GPU-accelerated**, and the renderer is isolated so a
     deck.gl/MapLibre geographic layer can replace it when real coordinates +
     tile hosting exist.

3. **Zone positions are surveyed; per-meter positions provisional; data always
   real.** Operations provided real coordinates (2026-07-19) for the NAMA main
   bulk and all six zone bulk meters (+ four landmark DC meters), wired into
   `lib/water-map-config.ts` (`SITE_ANCHOR`, `MAP_ZONES[].geo`,
   `KNOWN_METER_COORDS`). Each zone sits at its true location; individual meters
   are laid out deterministically around their real zone-bulk point until
   per-meter survey data exists. Every consumption/loss/efficiency value is the
   real Supabase value.

4. **Reuse the existing calc engines — no new math.** Monthly reuses
   `buildMonthlyData` → `computePeriod` (A1→A2→A3). Daily reuses
   `buildDailyGrid` → `buildZoneDaySeries` → `buildZoneWatch` (distribution-level
   L2 vs ΣL3; daily has no L1). Severity reuses `sev()`; anomaly flags reuse
   `meterFlags`/`detectSpike`/`zeroStreak`. Target stays `TARGET_LOSS_PCT = 15`
   (i.e. the 85% efficiency target). Division-by-zero is guarded everywhere.

## Data sources (all existing, unchanged)
| Purpose | Source | Access |
|---|---|---|
| Monthly consumption | `water_monthly_consumption` (+ `water_meters`) | `getWaterMetersFromSupabase()` |
| Daily consumption | `water_daily_consumption` (wide `day_1..31`) | raw rows via `functions/api/water-map.ts` |
| Meter/property master | `water_meters` (`account_number`, `label`, `zone`, `parent_meter`, `type`) | same as monthly |
| Zone → L2 bulk + L3 list | `lib/water-accounts.ts` `ZONE_BULK_CONFIG` + `lib/water-data.ts` `ZONE_CONFIG` | central config |

## Zone mapping (central — `lib/water-map-config.ts`)
| id | Friendly name (join key) | Monthly code | Daily code | L2 bulk |
|----|--------------------------|--------------|-----------|---------|
| 3A | Zone 3A | `Zone_03_(A)` | `Zone_03A` | 4300343 |
| 3B | Zone 3B | `Zone_03_(B)` | `Zone_03B` | 4300344 |
| 05 | Zone 5  | `Zone_05`     | `Zone_05`  | 4300345 |
| 08 | Zone 8  | `Zone_08`     | `Zone_08`  | 4300342 |
| VS | Village Square | `Zone_VS` | `Zone_VS` | 4300335 |
| FM | Zone FM | `Zone_01_(FM)` | `Zone_FM` | 4300346 |

> Monthly and daily use *different* zone-code spellings; the friendly name is the
> common key across both engines. Never hard-code zone strings outside this file.

## Files
**Created**
- `lib/water-map-config.ts` — central zone identity + provisional geo layout.
- `lib/water-map-data.ts` — pure adapter → `MapSnapshot` (monthly + daily).
- `functions/api/water-map.ts` — raw daily fetch + available-period helpers.
- `components/water/map3d/water-3d-scene.ts` — the Three.js scene (class).
- `components/water/map3d/use-water-map-data.ts` — data provider hook.
- `components/water/map3d/map-panels.tsx` — KPIs, zone summary, detail panels, legend.
- `components/water/map3d/map-controls.tsx` — toolbar, date controls, search, filters.
- `components/water/map3d/map-table.tsx` — accessible table fallback.
- `components/water/map3d/water-3d-map.tsx` — the subsection wrapper (default export).
- `__tests__/lib/water-map-data.test.ts` — adapter unit tests (10 cases).

**Modified**
- `app/water/page.tsx` — third "3D Map" tab (lazy, `ssr:false`).

## Geographic accuracy (honest)
Zone placement is **surveyed** — the NAMA main bulk and all six zone bulk meters
use real coordinates provided by operations (2026-07-19), plus four landmark DC
meters (Hotel JMB, Al Adrak Camp/Site, Zone 08 irrigation). **Individual meter**
positions within a zone are still illustrative (laid out around the real
zone-bulk point) because the backend has no per-meter survey. No aerial basemap
is shown (none available; external tiles are CSP-blocked).

## Remaining external inputs (only what can't come from the repo/backend)
- Per-meter / per-building coordinates (survey or KML/GeoJSON) to replace the
  within-zone provisional layout. Zone bulks + four landmark meters are already
  surveyed; add more to `KNOWN_METER_COORDS` (or a GeoJSON layer) as they arrive.
- (Optional) a self-hosted PMTiles/aerial basemap for a true satellite backdrop —
  requires relaxing the CSP for that host.

## Acceptance checklist
- [x] Water shows Monthly, Daily, 3D Map · [x] Monthly/Daily unchanged (additive tab only)
- [x] 3D Map lazy-loads on open (`ssr:false` dynamic) · [x] No Google key/billing/tiles
- [x] All five zones supported (+ FM) · [x] Daily reads daily data · [x] Monthly reads monthly data
- [x] Loss/efficiency correct (reuses existing engines) · [x] Zero-bulk safe · [x] Missing handled
- [x] Zone/property/meter selection · [x] Search · [x] Filters · [x] Date/month switching
- [x] Desktop/tablet/mobile · [x] a11y table fallback + reduced motion
- [x] type-check green · [x] lint green · [x] build green · [x] no creds exposed
- [x] adapter unit tests green (10 cases) · [x] data path verified against live DB via MCP

**Not verifiable in this sandbox:** in-browser click-through with live data (the
build environment's network policy blocks the browser from `*.supabase.co`). The
data layer was instead verified against the live DB via the Supabase MCP and unit
tests; the app fetches normally on Vercel.

## Run
```bash
cd muscatbay/app && npm run dev   # http://localhost:3000/water → "3D Map" tab
```
