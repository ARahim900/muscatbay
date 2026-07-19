/**
 * @fileoverview Water 3D Map — central zone & geographic configuration.
 *
 * SINGLE SOURCE OF TRUTH for the Water → 3D Map subsection's spatial model and
 * zone identity. Everything the map renders is positioned from this file, so a
 * new zone (or real survey coordinates) can be added here without touching any
 * map component. There are deliberately NO hard-coded zone-name checks anywhere
 * else in the map code — always resolve through the lookups below.
 *
 * ── Geographic provenance (read before trusting a position) ──────────────────
 * The Muscat Bay backend carries NO surveyed coordinates for the operational
 * water meters. Verified against Supabase: only `water_network_meters` (a
 * partly-synthetic demo table) holds any lat/lon, and its zone taxonomy
 * ("Zone 01–08 / Block A") does not match the operational zones. The ONE real
 * anchor is the NAMA main-bulk meter (account `C43659`) at {@link SITE_ANCHOR}.
 *
 * Every zone/meter position below is therefore a PROVISIONAL, clearly-labelled
 * layout derived from that anchor — illustrative, not a survey. Replace the
 * `local` offsets (or swap in a GeoJSON/tiled layer) when real coordinates
 * arrive; nothing else needs to change. The consumption, loss and efficiency
 * shown ON these positions are always the REAL values from the database.
 *
 * @module lib/water-map-config
 */

/** A geographic point (WGS84 degrees). */
export interface LatLon {
    lat: number;
    lon: number;
}

/** A local planar offset from {@link SITE_ANCHOR}, in metres (+x = east, +z = south). */
export interface LocalXZ {
    x: number;
    z: number;
}

/**
 * Real Muscat Bay anchor — the NAMA main-bulk meter (Supabase
 * `water_network_meters` id `C43659`). The only surveyed coordinate in the
 * backend; used as the origin of the provisional local layout.
 */
export const SITE_ANCHOR: LatLon = { lat: 23.5431822, lon: 58.629591 };

/** True: every non-anchor position is provisional/illustrative, not surveyed. */
export const POSITIONS_ARE_PROVISIONAL = true;

/** Stable internal zone identifiers (never rename — used as React keys). */
export type MapZoneId = "3A" | "3B" | "05" | "08" | "VS" | "FM";

/** The five zones the brief requires (FM is also carried — it has live data). */
export const REQUIRED_ZONE_IDS: readonly MapZoneId[] = ["3A", "3B", "05", "08", "VS"] as const;

export interface MapZoneConfig {
    /** Stable internal id. */
    id: MapZoneId;
    /** Friendly name — matches `ZONE_CONFIG.name`, monthly `ZoneRow.name` AND daily `ZoneWatchRow.zoneName`. This is the cross-engine join key. */
    name: string;
    /** Short chip label as the brief spells it (e.g. "Zone 05"). */
    short: string;
    /** Zone code on the MONTHLY path (`WaterMeter.zone`, already translated to legacy app codes by `getWaterMetersFromSupabase`). */
    monthlyCode: string;
    /** Zone code on the DAILY path (`DailyWaterConsumption.zone` / raw DB value — the daily transform does not translate). */
    dailyCode: string;
    /** L2 zone-bulk account number (from `ZONE_CONFIG.bulkMeterAccount`). */
    bulkAccount: string;
    /** Whether the zone contains building bulks (affects L3→L4 rollup display). */
    hasBuildings: boolean;
    /** Identity colour for legends/series — a theme `--chart-*` token (never a status colour). */
    seriesToken: string;
    /** Provisional platform centre, local metres from the anchor. */
    local: LocalXZ;
    /** Provisional platform footprint, metres. */
    footprint: { w: number; d: number };
}

/* Equirectangular metres-per-degree at the site latitude — good enough for a
   ~1 km campus; the layout is provisional anyway. */
const M_PER_DEG_LAT = 110_574;
const M_PER_DEG_LON = 111_320 * Math.cos((SITE_ANCHOR.lat * Math.PI) / 180);

/** Convert a local planar offset (metres) to a geographic point. */
export function localToLatLon({ x, z }: LocalXZ): LatLon {
    return {
        lat: SITE_ANCHOR.lat - z / M_PER_DEG_LAT, // +z = south
        lon: SITE_ANCHOR.lon + x / M_PER_DEG_LON, // +x = east
    };
}

/** Convert a geographic point to a local planar offset (metres). */
export function latLonToLocal({ lat, lon }: LatLon): LocalXZ {
    return {
        x: (lon - SITE_ANCHOR.lon) * M_PER_DEG_LON,
        z: (SITE_ANCHOR.lat - lat) * M_PER_DEG_LAT,
    };
}

/**
 * Canonical zone layout. Local offsets are PROVISIONAL (see file header) — a
 * spread, non-overlapping arrangement around the anchor, not a survey.
 */
export const MAP_ZONES: readonly MapZoneConfig[] = [
    { id: "3A", name: "Zone 3A", short: "Zone 3A", monthlyCode: "Zone_03_(A)", dailyCode: "Zone_03A", bulkAccount: "4300343", hasBuildings: true, seriesToken: "var(--chart-1)", local: { x: -230, z: -120 }, footprint: { w: 150, d: 120 } },
    { id: "3B", name: "Zone 3B", short: "Zone 3B", monthlyCode: "Zone_03_(B)", dailyCode: "Zone_03B", bulkAccount: "4300344", hasBuildings: true, seriesToken: "var(--chart-2)", local: { x: 15, z: -175 }, footprint: { w: 175, d: 130 } },
    { id: "05", name: "Zone 5", short: "Zone 05", monthlyCode: "Zone_05", dailyCode: "Zone_05", bulkAccount: "4300345", hasBuildings: true, seriesToken: "var(--chart-3)", local: { x: 255, z: -110 }, footprint: { w: 150, d: 120 } },
    { id: "08", name: "Zone 8", short: "Zone 08", monthlyCode: "Zone_08", dailyCode: "Zone_08", bulkAccount: "4300342", hasBuildings: true, seriesToken: "var(--chart-4)", local: { x: -185, z: 120 }, footprint: { w: 150, d: 120 } },
    { id: "VS", name: "Village Square", short: "Village Sq", monthlyCode: "Zone_VS", dailyCode: "Zone_VS", bulkAccount: "4300335", hasBuildings: true, seriesToken: "var(--chart-5)", local: { x: 70, z: 150 }, footprint: { w: 160, d: 120 } },
    { id: "FM", name: "Zone FM", short: "Zone FM", monthlyCode: "Zone_01_(FM)", dailyCode: "Zone_FM", bulkAccount: "4300346", hasBuildings: true, seriesToken: "var(--chart-gray)", local: { x: -295, z: 45 }, footprint: { w: 150, d: 120 } },
] as const;

/** Main bulk (NAMA L1) node — the real anchor; sits at the local origin. */
export const MAIN_BULK_NODE = {
    accountNumber: "C43659",
    name: "Main Bulk (NAMA)",
    local: { x: 0, z: 0 } as LocalXZ,
} as const;

/** Direct-connection cluster centre (provisional). */
export const DIRECT_CONNECTION_NODE = {
    name: "Direct Connections",
    local: { x: 250, z: 135 } as LocalXZ,
} as const;

/* ── Lookups (built once) ────────────────────────────────────────────────── */
const byId = new Map<MapZoneId, MapZoneConfig>(MAP_ZONES.map((z) => [z.id, z]));
const byName = new Map<string, MapZoneConfig>(MAP_ZONES.map((z) => [z.name, z]));
const byMonthly = new Map<string, MapZoneConfig>(MAP_ZONES.map((z) => [z.monthlyCode, z]));
const byDaily = new Map<string, MapZoneConfig>(MAP_ZONES.map((z) => [z.dailyCode, z]));
const byBulk = new Map<string, MapZoneConfig>(MAP_ZONES.map((z) => [z.bulkAccount, z]));

export const zoneById = (id: string): MapZoneConfig | undefined => byId.get(id as MapZoneId);
export const zoneByName = (name: string): MapZoneConfig | undefined => byName.get(name);
export const zoneByMonthlyCode = (code: string): MapZoneConfig | undefined => byMonthly.get(code);
export const zoneByDailyCode = (code: string): MapZoneConfig | undefined => byDaily.get(code);
export const zoneByBulkAccount = (acct: string): MapZoneConfig | undefined => byBulk.get(acct);

/**
 * Deterministically place `count` points inside a zone footprint as a centred
 * grid (provisional building/meter positions). Stable across renders — index i
 * always maps to the same spot — so selection highlighting never jumps.
 */
export function layoutPointsInFootprint(zone: MapZoneConfig, count: number): LocalXZ[] {
    if (count <= 0) return [];
    const cols = Math.max(1, Math.ceil(Math.sqrt(count)));
    const rows = Math.max(1, Math.ceil(count / cols));
    const spanW = zone.footprint.w * 0.82;
    const spanD = zone.footprint.d * 0.82;
    const stepX = cols > 1 ? spanW / (cols - 1) : 0;
    const stepZ = rows > 1 ? spanD / (rows - 1) : 0;
    const x0 = zone.local.x - spanW / 2;
    const z0 = zone.local.z - spanD / 2;
    const pts: LocalXZ[] = [];
    for (let i = 0; i < count; i++) {
        const c = i % cols;
        const rr = Math.floor(i / cols);
        pts.push({ x: x0 + c * stepX, z: z0 + rr * stepZ });
    }
    return pts;
}
