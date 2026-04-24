/**
 * @fileoverview Muscat Bay Potable Water Network — Static As-Built Data
 *
 * All positions derived from As-Built drawings:
 *   COO87-CA-AB-PL-PW-01 to PW-08  (zone layout / pipeline routes)
 *   COO87-CA-AB-PL-PW-23A/B/C       (irrigation pump room layouts)
 *   Main PAW Entry water line.pdf   (PAW connection point)
 *
 * Coordinate system: WGS84 decimal degrees (converted from UTM Zone 40N,
 * WGS84 horizontal datum per drawing grid data, survey stations NSA 4050 / MY 23 / Y13).
 *
 * Zone key-plan layout (per PW-03 key plan):
 *
 *            [ Z08 ]
 *   [Z04] [Z05] [Z06] [Z07]
 *      [Z02] [Z03]
 *          [Z01]
 *
 * @module lib/water-network-data
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type PipeMaterial = 'DI' | 'HDPE';

export interface ZoneDef {
    id: string;
    name: string;
    center: [lon: number, lat: number];
    /** Polygon ring as [lon, lat] vertices (closed by the renderer). */
    polygon: [number, number][];
    /** Accent colour for the zone outline label. */
    color: string;
    /** Primary inlet pipe diameter (mm) feeding this zone from the trunk. */
    inletDia: number;
    inletMaterial: PipeMaterial;
}

export interface PipeDef {
    id: string;
    label: string;
    dia: number;            // nominal diameter in mm
    material: PipeMaterial;
    /** Route waypoints as [lon, lat]. */
    points: [number, number][];
}

export interface InfraDef {
    id: string;
    type: 'paw_entry' | 'terminal_box' | 'prv' | 'flowmeter' | 'pump_room' | 'air_release' | 'washout';
    label: string;
    lon: number;
    lat: number;
}

export interface SeedMeterDef {
    id: string;
    zone: string;
    type: 'l1' | 'l2' | 'dc' | 'l3' | 'l4' | 'irr';
    parent_id: string | null;
    lat: number;
    lon: number;
    height: number | null;
    consumption: number;
    status: 'working' | 'faulty';
}

// ─────────────────────────────────────────────────────────────────────────────
// ZONES — 8 development zones from as-built drawings
// ─────────────────────────────────────────────────────────────────────────────

export const ZONES: ZoneDef[] = [
    {
        id: 'Z01', name: 'Zone 01',
        center: [58.5458, 23.5932],
        polygon: [
            [58.5430, 23.5912], [58.5510, 23.5912],
            [58.5510, 23.5958], [58.5430, 23.5958],
        ],
        color: '#60A5FA', inletDia: 160, inletMaterial: 'HDPE',
    },
    {
        id: 'Z02', name: 'Zone 02',
        center: [58.5470, 23.5978],
        polygon: [
            [58.5432, 23.5958], [58.5520, 23.5958],
            [58.5520, 23.6005], [58.5432, 23.6005],
        ],
        color: '#34D399', inletDia: 250, inletMaterial: 'HDPE',
    },
    {
        id: 'Z03', name: 'Zone 03',
        center: [58.5538, 23.5972],
        polygon: [
            [58.5518, 23.5940], [58.5605, 23.5940],
            [58.5605, 23.6008], [58.5518, 23.6008],
        ],
        color: '#A78BFA', inletDia: 250, inletMaterial: 'HDPE',
    },
    {
        id: 'Z04', name: 'Zone 04',
        center: [58.5462, 23.6025],
        polygon: [
            [58.5422, 23.6005], [58.5510, 23.6005],
            [58.5510, 23.6048], [58.5422, 23.6048],
        ],
        color: '#FCD34D', inletDia: 160, inletMaterial: 'HDPE',
    },
    {
        id: 'Z05', name: 'Zone 05',
        center: [58.5522, 23.6025],
        polygon: [
            [58.5508, 23.6005], [58.5582, 23.6005],
            [58.5582, 23.6048], [58.5508, 23.6048],
        ],
        color: '#F97316', inletDia: 250, inletMaterial: 'HDPE',
    },
    {
        id: 'Z06', name: 'Zone 06',
        center: [58.5588, 23.6022],
        polygon: [
            [58.5570, 23.6002], [58.5645, 23.6002],
            [58.5645, 23.6048], [58.5570, 23.6048],
        ],
        color: '#FB7185', inletDia: 160, inletMaterial: 'HDPE',
    },
    {
        id: 'Z07', name: 'Zone 07',
        center: [58.5658, 23.5998],
        polygon: [
            [58.5635, 23.5975], [58.5705, 23.5975],
            [58.5705, 23.6025], [58.5635, 23.6025],
        ],
        color: '#38BDF8', inletDia: 110, inletMaterial: 'HDPE',
    },
    {
        id: 'Z08', name: 'Zone 08',
        center: [58.5428, 23.6082],
        polygon: [
            [58.5385, 23.6050], [58.5472, 23.6050],
            [58.5472, 23.6118], [58.5385, 23.6118],
        ],
        color: '#00D2B3', inletDia: 250, inletMaterial: 'DI',
    },
];

// ─────────────────────────────────────────────────────────────────────────────
// PIPELINES — trunk mains and sub-mains from as-built drawings PW-01 to PW-08
// ─────────────────────────────────────────────────────────────────────────────

export const PIPELINES: PipeDef[] = [
    {
        // 225mm OD HDPE main trunk — PAW entry → terminal distribution box
        // Source: PW-01, PW-02, PW-03 — labeled "225 OD HDPE" / "225 HDPE"
        id: 'TM-225-MAIN',
        label: '225mm HDPE Main Trunk',
        dia: 225, material: 'HDPE',
        points: [
            [58.5362, 23.6148], // PAW connection (N entry, per "Main PAW Entry" drawing)
            [58.5378, 23.6132],
            [58.5395, 23.6112],
            [58.5410, 23.6092], // Zone 08 area
            [58.5420, 23.6072],
            [58.5435, 23.6053],
            [58.5450, 23.6032], // Zone 04 branch point
            [58.5468, 23.6018],
            [58.5480, 23.6005], // Terminal distribution box (PW-02)
            [58.5498, 23.5995],
            [58.5520, 23.5985], // Zone 03 area
            [58.5545, 23.5972],
            [58.5572, 23.5965], // Zone 06/07 branch
            [58.5600, 23.5960],
        ],
    },
    {
        // 250mm DI sub-main — Zone 08 branch (from PW-08 / PW-23C)
        id: 'SM-Z08', label: 'Zone 08 Sub-Main 250mm DI',
        dia: 250, material: 'DI',
        points: [
            [58.5410, 23.6092],
            [58.5418, 23.6082],
            [58.5428, 23.6082], // Z08 bulk meter
        ],
    },
    {
        // 250mm HDPE sub-main — Zone 04 branch
        id: 'SM-Z04', label: 'Zone 04 Sub-Main 250mm HDPE',
        dia: 250, material: 'HDPE',
        points: [
            [58.5450, 23.6032],
            [58.5455, 23.6025],
            [58.5462, 23.6025], // Z04 bulk meter
        ],
    },
    {
        // 250mm HDPE sub-main — Zone 05 branch
        id: 'SM-Z05', label: 'Zone 05 Sub-Main 250mm HDPE',
        dia: 250, material: 'HDPE',
        points: [
            [58.5480, 23.6005],
            [58.5498, 23.6012],
            [58.5522, 23.6025], // Z05 bulk meter
        ],
    },
    {
        // 250mm HDPE sub-main — Zone 02 branch
        id: 'SM-Z02', label: 'Zone 02 Sub-Main 250mm HDPE',
        dia: 250, material: 'HDPE',
        points: [
            [58.5480, 23.6005],
            [58.5472, 23.5990],
            [58.5470, 23.5978], // Z02 bulk meter
        ],
    },
    {
        // 250mm HDPE sub-main — Zone 03 branch
        id: 'SM-Z03', label: 'Zone 03 Sub-Main 250mm HDPE',
        dia: 250, material: 'HDPE',
        points: [
            [58.5520, 23.5985],
            [58.5528, 23.5978],
            [58.5538, 23.5972], // Z03 bulk meter
        ],
    },
    {
        // 160mm HDPE sub-main — Zone 06 branch
        id: 'SM-Z06', label: 'Zone 06 Sub-Main 160mm HDPE',
        dia: 160, material: 'HDPE',
        points: [
            [58.5572, 23.5965],
            [58.5578, 23.5985],
            [58.5588, 23.6008], // Z06 bulk meter
        ],
    },
    {
        // 110mm HDPE sub-main — Zone 07 branch (end-of-line zone)
        id: 'SM-Z07', label: 'Zone 07 Sub-Main 110mm HDPE',
        dia: 110, material: 'HDPE',
        points: [
            [58.5600, 23.5960],
            [58.5618, 23.5970],
            [58.5640, 23.5982],
            [58.5658, 23.5998], // Z07 bulk meter
        ],
    },
    {
        // 160mm HDPE sub-main — Zone 01 branch (southernmost zone)
        id: 'SM-Z01', label: 'Zone 01 Sub-Main 160mm HDPE',
        dia: 160, material: 'HDPE',
        points: [
            [58.5472, 23.5990],
            [58.5468, 23.5970],
            [58.5462, 23.5950],
            [58.5458, 23.5932], // Z01 bulk meter
        ],
    },
];

// ─────────────────────────────────────────────────────────────────────────────
// INFRASTRUCTURE POINTS — from PW standard detail drawings and layout sheets
// ─────────────────────────────────────────────────────────────────────────────

export const INFRA_POINTS: InfraDef[] = [
    // PAW main entry (per "Main PAW Entry water line.pdf")
    { id: 'PAW-01',  type: 'paw_entry',    label: 'PAW Main Connection',          lon: 58.5362, lat: 23.6148 },
    // Potable Water Terminal Distribution Box (visible in PW-02, centre of network)
    { id: 'TB-01',   type: 'terminal_box', label: 'Potable Water Terminal Box',   lon: 58.5480, lat: 23.6005 },
    // PRV chambers (PW-14 standard detail; multiple in PW-01/02)
    { id: 'PRV-01',  type: 'prv',          label: 'PRV Chamber 250mm (N Trunk)',   lon: 58.5400, lat: 23.6108 },
    { id: 'PRV-02',  type: 'prv',          label: 'PRV Chamber 250mm (Z03)',       lon: 58.5528, lat: 23.5978 },
    { id: 'PRV-03',  type: 'prv',          label: 'PRV Chamber (Z01 Entry)',       lon: 58.5462, lat: 23.5955 },
    // Air release valve chambers (PW-18 standard detail)
    { id: 'ARV-01',  type: 'air_release',  label: 'Air Release Valve (Trunk N)',   lon: 58.5442, lat: 23.6045 },
    { id: 'ARV-02',  type: 'air_release',  label: 'Air Release Valve (Z03 Main)', lon: 58.5542, lat: 23.5968 },
    // Flow meter chambers (PW-13 standard detail; also PW-09/10 coordinate schedules)
    { id: 'FM-Z02',  type: 'flowmeter',    label: 'Flow Meter Z02 (100mm)',        lon: 58.5470, lat: 23.5978 },
    { id: 'FM-Z03',  type: 'flowmeter',    label: 'Flow Meter Z03 (100mm)',        lon: 58.5538, lat: 23.5975 },
    { id: 'FM-Z08',  type: 'flowmeter',    label: 'Flow Meter Z08 (100mm)',        lon: 58.5428, lat: 23.6082 },
    // Irrigation pump rooms — Zone 3, 5, 8 (per PW-23A, PW-23B, PW-23C)
    { id: 'PM-Z03',  type: 'pump_room',    label: 'Irrigation Pump Room Zone 3',   lon: 58.5542, lat: 23.5968 },
    { id: 'PM-Z05',  type: 'pump_room',    label: 'Irrigation Pump Room Zone 5',   lon: 58.5525, lat: 23.6022 },
    { id: 'PM-Z08',  type: 'pump_room',    label: 'Irrigation Pump Room Zone 8',   lon: 58.5432, lat: 23.6078 },
    // Washout chambers (PW-16/17 standard details)
    { id: 'WO-01',   type: 'washout',      label: 'Washout Chamber 250mm (Trunk)', lon: 58.5490, lat: 23.5998 },
];

// ─────────────────────────────────────────────────────────────────────────────
// SEED METERS — minimal L1 + L2 + IRR hierarchy matching the as-built network
// Used by the "Seed Network" button to pre-populate the map.
// ─────────────────────────────────────────────────────────────────────────────

export const SEED_METERS: SeedMeterDef[] = [
    // ── L1 — PAW main bulk (single source for the entire estate) ─────────────
    {
        id: 'L1-PAW', zone: 'Main', type: 'l1', parent_id: null,
        lat: 23.6148, lon: 58.5362, height: 5,
        consumption: 40600, status: 'working',
    },
    // ── L2 — zone bulk meters (one per zone, all fed from L1) ────────────────
    { id: 'L2-Z01', zone: 'Zone 01', type: 'l2', parent_id: 'L1-PAW', lat: 23.5932, lon: 58.5458, height: 2, consumption: 4820,  status: 'working' },
    { id: 'L2-Z02', zone: 'Zone 02', type: 'l2', parent_id: 'L1-PAW', lat: 23.5978, lon: 58.5470, height: 2, consumption: 5240,  status: 'working' },
    { id: 'L2-Z03', zone: 'Zone 03', type: 'l2', parent_id: 'L1-PAW', lat: 23.5972, lon: 58.5538, height: 2, consumption: 4105,  status: 'working' },
    { id: 'L2-Z04', zone: 'Zone 04', type: 'l2', parent_id: 'L1-PAW', lat: 23.6025, lon: 58.5462, height: 2, consumption: 3480,  status: 'working' },
    { id: 'L2-Z05', zone: 'Zone 05', type: 'l2', parent_id: 'L1-PAW', lat: 23.6025, lon: 58.5522, height: 2, consumption: 5820,  status: 'working' },
    { id: 'L2-Z06', zone: 'Zone 06', type: 'l2', parent_id: 'L1-PAW', lat: 23.6022, lon: 58.5588, height: 2, consumption: 6175,  status: 'working' },
    { id: 'L2-Z07', zone: 'Zone 07', type: 'l2', parent_id: 'L1-PAW', lat: 23.5998, lon: 58.5658, height: 2, consumption: 2790,  status: 'faulty'  },
    { id: 'L2-Z08', zone: 'Zone 08', type: 'l2', parent_id: 'L1-PAW', lat: 23.6082, lon: 58.5428, height: 2, consumption: 4955,  status: 'working' },
    // ── IRR — irrigation tank meters (Zones 3, 5, 8 per PW-23A/B/C) ─────────
    { id: 'IRR-Z03', zone: 'Zone 03', type: 'irr', parent_id: 'L2-Z03', lat: 23.5968, lon: 58.5542, height: 1, consumption: 480, status: 'working' },
    { id: 'IRR-Z05', zone: 'Zone 05', type: 'irr', parent_id: 'L2-Z05', lat: 23.6018, lon: 58.5525, height: 1, consumption: 615, status: 'working' },
    { id: 'IRR-Z08', zone: 'Zone 08', type: 'irr', parent_id: 'L2-Z08', lat: 23.6078, lon: 58.5432, height: 1, consumption: 390, status: 'working' },
    // ── L3 — property bulk meters (2–3 buildings per zone) ──────────────────
    // Zone 01 — 3 buildings → 4,550 m³ dist (loss 5.6% ✓)
    { id: 'L3-Z01-01', zone: 'Zone 01 — Block A', type: 'l3', parent_id: 'L2-Z01', lat: 23.5922, lon: 58.5445, height: 2, consumption: 1450, status: 'working' },
    { id: 'L3-Z01-02', zone: 'Zone 01 — Block B', type: 'l3', parent_id: 'L2-Z01', lat: 23.5938, lon: 58.5465, height: 2, consumption: 1680, status: 'working' },
    { id: 'L3-Z01-03', zone: 'Zone 01 — Block C', type: 'l3', parent_id: 'L2-Z01', lat: 23.5948, lon: 58.5490, height: 2, consumption: 1420, status: 'working' },
    // Zone 02 — 3 buildings → 4,830 m³ dist (loss 7.8% ✓)
    { id: 'L3-Z02-01', zone: 'Zone 02 — Block A', type: 'l3', parent_id: 'L2-Z02', lat: 23.5968, lon: 58.5445, height: 2, consumption: 1890, status: 'working' },
    { id: 'L3-Z02-02', zone: 'Zone 02 — Block B', type: 'l3', parent_id: 'L2-Z02', lat: 23.5982, lon: 58.5472, height: 2, consumption: 1740, status: 'working' },
    { id: 'L3-Z02-03', zone: 'Zone 02 — Block C', type: 'l3', parent_id: 'L2-Z02', lat: 23.5992, lon: 58.5505, height: 2, consumption: 1200, status: 'working' },
    // Zone 03 — 2 buildings + IRR → 3,680 m³ dist (loss 10.4% ⚠)
    { id: 'L3-Z03-01', zone: 'Zone 03 — Block A', type: 'l3', parent_id: 'L2-Z03', lat: 23.5958, lon: 58.5528, height: 2, consumption: 1520, status: 'working' },
    { id: 'L3-Z03-02', zone: 'Zone 03 — Block B', type: 'l3', parent_id: 'L2-Z03', lat: 23.5982, lon: 58.5562, height: 2, consumption: 1680, status: 'working' },
    // Zone 04 — 3 buildings → 3,000 m³ dist (loss 13.8% ⚠)
    { id: 'L3-Z04-01', zone: 'Zone 04 — Block A', type: 'l3', parent_id: 'L2-Z04', lat: 23.6015, lon: 58.5438, height: 2, consumption: 1200, status: 'working' },
    { id: 'L3-Z04-02', zone: 'Zone 04 — Block B', type: 'l3', parent_id: 'L2-Z04', lat: 23.6030, lon: 58.5462, height: 2, consumption:  980, status: 'working' },
    { id: 'L3-Z04-03', zone: 'Zone 04 — Block C', type: 'l3', parent_id: 'L2-Z04', lat: 23.6040, lon: 58.5490, height: 2, consumption:  820, status: 'working' },
    // Zone 05 — 2 buildings + IRR → 5,165 m³ dist (loss 11.3% ⚠)
    { id: 'L3-Z05-01', zone: 'Zone 05 — Block A', type: 'l3', parent_id: 'L2-Z05', lat: 23.6015, lon: 58.5520, height: 2, consumption: 2100, status: 'working' },
    { id: 'L3-Z05-02', zone: 'Zone 05 — Block B', type: 'l3', parent_id: 'L2-Z05', lat: 23.6035, lon: 58.5552, height: 2, consumption: 2450, status: 'working' },
    // Zone 06 — 3 buildings → 5,710 m³ dist (loss 7.5% ✓)
    { id: 'L3-Z06-01', zone: 'Zone 06 — Hotel',   type: 'l3', parent_id: 'L2-Z06', lat: 23.6012, lon: 58.5582, height: 2, consumption: 2890, status: 'working' },
    { id: 'L3-Z06-02', zone: 'Zone 06 — Block B', type: 'l3', parent_id: 'L2-Z06', lat: 23.6030, lon: 58.5605, height: 2, consumption: 1840, status: 'working' },
    { id: 'L3-Z06-03', zone: 'Zone 06 — Block C', type: 'l3', parent_id: 'L2-Z06', lat: 23.6040, lon: 58.5628, height: 2, consumption:  980, status: 'working' },
    // Zone 07 — 2 buildings (faulty L2) → 2,020 m³ dist (loss 27.6% 🔴)
    { id: 'L3-Z07-01', zone: 'Zone 07 — Block A', type: 'l3', parent_id: 'L2-Z07', lat: 23.5988, lon: 58.5648, height: 2, consumption: 1040, status: 'faulty'  },
    { id: 'L3-Z07-02', zone: 'Zone 07 — Block B', type: 'l3', parent_id: 'L2-Z07', lat: 23.6008, lon: 58.5672, height: 2, consumption:  980, status: 'working' },
    // Zone 08 — 2 buildings + IRR → 3,850 m³ dist (loss 22.3% 🔴)
    { id: 'L3-Z08-01', zone: 'Zone 08 — Block A', type: 'l3', parent_id: 'L2-Z08', lat: 23.6065, lon: 58.5405, height: 2, consumption: 1620, status: 'working' },
    { id: 'L3-Z08-02', zone: 'Zone 08 — Block B', type: 'l3', parent_id: 'L2-Z08', lat: 23.6095, lon: 58.5448, height: 2, consumption: 1840, status: 'working' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** CSS colour for a pipe based on diameter and material. */
export function pipeColor(dia: number, material: PipeMaterial): string {
    if (material === 'DI') return '#90CAF9';  // light blue — DI pipe
    if (dia >= 225)        return '#4FC3F7';  // bright cyan — 225mm trunk
    if (dia >= 200)        return '#29B6F6';  // blue — 250mm sub-main
    if (dia >= 150)        return '#81D4FA';  // lighter — 160mm
    return '#B3E5FC';                          // palest — ≤ 110mm
}

/** Line width in pixels for a given diameter. */
export function pipeWidth(dia: number): number {
    if (dia >= 225) return 7;
    if (dia >= 200) return 5;
    if (dia >= 150) return 3.5;
    return 2.5;
}

/** Icon emoji + label colour for an infrastructure type. */
export function infraMeta(type: InfraDef['type']): { icon: string; color: string } {
    switch (type) {
        case 'paw_entry':    return { icon: '⬟', color: '#FF6B35' };
        case 'terminal_box': return { icon: '⬡', color: '#FFD700' };
        case 'prv':          return { icon: 'P', color: '#A78BFA' };
        case 'flowmeter':    return { icon: 'F', color: '#34D399' };
        case 'pump_room':    return { icon: 'R', color: '#60A5FA' };
        case 'air_release':  return { icon: 'A', color: '#9CA3AF' };
        case 'washout':      return { icon: 'W', color: '#F59E0B' };
    }
}
