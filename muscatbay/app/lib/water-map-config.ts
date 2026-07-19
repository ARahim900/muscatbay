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
 * REAL surveyed coordinates for the NAMA main bulk and all six zone bulk meters
 * (plus a few landmark direct-connection meters) were provided by operations on
 * 2026-07-19 and are used directly — see {@link SITE_ANCHOR}, `MAP_ZONES[].geo`
 * and {@link KNOWN_METER_COORDS}. Every ZONE is therefore placed at its true
 * location.
 *
 * INDIVIDUAL meter positions *within* a zone remain provisional: the backend has
 * no per-meter survey, so a zone's meters are laid out deterministically around
 * its real bulk-meter point. Swap in per-meter coordinates (or a GeoJSON layer)
 * when they exist; nothing else needs to change. The consumption, loss and
 * efficiency shown ON these positions are always the REAL values from the DB.
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
export const SITE_ANCHOR: LatLon = { lat: 23.54339, lon: 58.62936 };

/** True: individual meter positions within a zone are provisional (zones themselves are surveyed). */
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
    /** REAL surveyed zone bulk-meter coordinate (operations, 2026-07-19). */
    geo: LatLon;
    /** Zone bulk-meter centre in local metres — derived from {@link geo}. */
    local: LocalXZ;
    /** Footprint (metres) the zone's provisional meter layout spreads across. */
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
 * Canonical zone layout. `geo` is the REAL surveyed zone bulk-meter coordinate
 * (operations, 2026-07-19); `local` is derived from it. Only the per-meter
 * spread within `footprint` is provisional.
 */
export const MAP_ZONES: readonly MapZoneConfig[] = [
    { id: "3A", name: "Zone 3A", short: "Zone 3A", monthlyCode: "Zone_03_(A)", dailyCode: "Zone_03A", bulkAccount: "4300343", hasBuildings: true, seriesToken: "var(--chart-1)", geo: { lat: 23.54899, lon: 58.6377 }, local: latLonToLocal({ lat: 23.54899, lon: 58.6377 }), footprint: { w: 110, d: 90 } },
    { id: "3B", name: "Zone 3B", short: "Zone 3B", monthlyCode: "Zone_03_(B)", dailyCode: "Zone_03B", bulkAccount: "4300344", hasBuildings: true, seriesToken: "var(--chart-2)", geo: { lat: 23.54888, lon: 58.63742 }, local: latLonToLocal({ lat: 23.54888, lon: 58.63742 }), footprint: { w: 120, d: 95 } },
    { id: "05", name: "Zone 5", short: "Zone 05", monthlyCode: "Zone_05", dailyCode: "Zone_05", bulkAccount: "4300345", hasBuildings: true, seriesToken: "var(--chart-3)", geo: { lat: 23.54818, lon: 58.63931 }, local: latLonToLocal({ lat: 23.54818, lon: 58.63931 }), footprint: { w: 110, d: 90 } },
    { id: "08", name: "Zone 8", short: "Zone 08", monthlyCode: "Zone_08", dailyCode: "Zone_08", bulkAccount: "4300342", hasBuildings: true, seriesToken: "var(--chart-4)", geo: { lat: 23.54741, lon: 58.644 }, local: latLonToLocal({ lat: 23.54741, lon: 58.644 }), footprint: { w: 110, d: 90 } },
    { id: "VS", name: "Village Square", short: "Village Sq", monthlyCode: "Zone_VS", dailyCode: "Zone_VS", bulkAccount: "4300335", hasBuildings: true, seriesToken: "var(--chart-5)", geo: { lat: 23.54729, lon: 58.636 }, local: latLonToLocal({ lat: 23.54729, lon: 58.636 }), footprint: { w: 100, d: 80 } },
    { id: "FM", name: "Zone FM", short: "Zone FM", monthlyCode: "Zone_01_(FM)", dailyCode: "Zone_FM", bulkAccount: "4300346", hasBuildings: true, seriesToken: "var(--chart-gray)", geo: { lat: 23.54143, lon: 58.63336 }, local: latLonToLocal({ lat: 23.54143, lon: 58.63336 }), footprint: { w: 110, d: 90 } },
];

/** Main bulk (NAMA L1) node — the real anchor; sits at the local origin. */
export const MAIN_BULK_NODE = {
    accountNumber: "C43659",
    name: "Main Bulk (NAMA)",
    local: { x: 0, z: 0 } as LocalXZ,
} as const;

/** Direct-connection cluster centre for DC meters that lack a surveyed coordinate (provisional). */
export const DIRECT_CONNECTION_NODE = {
    name: "Direct Connections",
    local: { x: 640, z: -150 } as LocalXZ,
} as const;

/**
 * Real surveyed coordinates for specific individual meters (operations,
 * 2026-07-19), keyed by account number. The adapter places these at their true
 * location instead of the provisional zone layout. Extend as more points arrive.
 */
export const KNOWN_METER_COORDS: Record<string, LatLon> = {
    "4300334": { lat: 23.55023, lon: 58.64195 }, // Hotel (JMB) main building
    "4300348": { lat: 23.54726, lon: 58.63139 }, // Al Adrak Camp
    "4300349": { lat: 23.54576, lon: 58.63636 }, // Al Adrak Accommodation (site)
    "4300294": { lat: 23.54726, lon: 58.64399 }, // Zone 08 irrigation tank
};

/** Local position for an account that has a real surveyed coordinate, else undefined. */
export function knownLocalForAccount(account: string): LocalXZ | undefined {
    const geo = KNOWN_METER_COORDS[account];
    return geo ? latLonToLocal(geo) : undefined;
}

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
