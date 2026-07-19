/**
 * @fileoverview Water 3D Map — aerial image scenes & calibration (single source).
 *
 * Three local aerial image scenes cover the estate. Each scene is calibrated by
 * CONTROL POINTS: verified bulk-meter coordinates (operations, 2026-07-19) tied
 * to the pixel where the meter is marked on the calibration copies of the same
 * images (repo `Zones Pics/`, kept out of the app bundle). The visible base
 * layers in `public/water-map/*.jpg` are the CLEAN derivatives — the blue
 * calibration ink and app badges were patched out programmatically; the imagery
 * itself is untouched.
 *
 * Rules encoded here (do not violate elsewhere):
 *  - Calibration/geometry lives HERE, separate from Supabase consumption data.
 *  - Map components must not hard-code marker values — they look up live values
 *    by zone id / account number from the MapSnapshot.
 *  - The three images are NOT merged into one geographic layer (different
 *    captures; merging would require distortion). Zone selection loads the
 *    scene that contains the zone.
 *  - The verified coordinates are authoritative for the listed points only; no
 *    survey accuracy is claimed for the rest of an image.
 *
 * Replaceable later by full GeoJSON/GIS data: swap the scene definitions and
 * the `properties` arrays; the rendering layer only consumes this module.
 *
 * @module lib/water-map-scenes
 */

import type { MapZoneId } from "@/lib/water-map-config";

/** How a point's position was established (kept as metadata; not shouted in UI). */
export type PlacementKind = "verified-coordinate" | "building-centroid" | "manually-mapped";

export interface SceneControlPoint {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    /** Pixel position on the ORIGINAL calibration image (not the downscaled web copy). */
    pixelX: number;
    pixelY: number;
    normalisedX: number;
    normalisedY: number;
}

/** The calibration contract for one local image scene. */
export interface ImageSceneCalibration {
    sceneId: string;
    /** Web path of the CLEAN base layer (annotations removed). */
    imagePath: string;
    /** ORIGINAL calibration-image dimensions that `pixelX/pixelY` refer to. */
    width: number;
    height: number;
    controlPoints: SceneControlPoint[];
}

/** A zone's marker on a scene (live values come from the snapshot by zone id). */
export interface SceneZonePoint {
    zoneId: MapZoneId;
    controlPointId: string;
    placement: PlacementKind;
}

/** An individual meter marker on a scene (live values by account number). */
export interface SceneMeterPoint {
    account: string;
    name: string;
    controlPointId: string;
    placement: PlacementKind;
}

/**
 * Future per-property mapping (buildings/villas): clickable polygons drawn over
 * the clean aerial, associated to Supabase accounts. None exist yet — the
 * backend has no building footprints/coordinates, and guessing placements is
 * forbidden. Add entries here (or a GeoJSON file) as they are mapped.
 */
export interface ScenePropertyPolygon {
    account: string;
    name: string;
    placement: PlacementKind;
    /** Polygon in normalised image space, [ [x,y], ... ] with 0..1 coords. */
    polygon: [number, number][];
}

export type WaterMapSceneId = "core" | "east" | "fm";

export interface WaterMapScene {
    calibration: ImageSceneCalibration;
    label: string;
    zonePoints: SceneZonePoint[];
    meterPoints: SceneMeterPoint[];
    properties: ScenePropertyPolygon[];
    /**
     * Fallback metres-per-pixel when a scene has <2 control points (similarity
     * not solvable). Nominal, documented, affects only camera feel — never data.
     */
    nominalMetresPerPixel: number;
}

const norm = (px: number, size: number): number => +(px / size).toFixed(5);

function cp(
    id: string,
    name: string,
    latitude: number,
    longitude: number,
    pixelX: number,
    pixelY: number,
    width: number,
    height: number,
): SceneControlPoint {
    return { id, name, latitude, longitude, pixelX, pixelY, normalisedX: norm(pixelX, width), normalisedY: norm(pixelY, height) };
}

/* ── Scene definitions ─────────────────────────────────────────────────────── */

const CORE_W = 2738, CORE_H = 1403;
const EAST_W = 2632, EAST_H = 1478;
const FM_W = 2743, FM_H = 1472;

export const WATER_MAP_SCENES: Record<WaterMapSceneId, WaterMapScene> = {
    core: {
        label: "Zones 3A · 3B · 05 · VS",
        calibration: {
            sceneId: "core",
            imagePath: "/water-map/scene-core.jpg",
            width: CORE_W,
            height: CORE_H,
            controlPoints: [
                cp("z03b-bulk", "Zone 03B Bulk Meter", 23.54888, 58.63742, 1286, 662, CORE_W, CORE_H),
                cp("z03a-bulk", "Zone 03A Bulk Meter", 23.54899, 58.6377, 1408, 670, CORE_W, CORE_H),
                cp("zvs-bulk", "Village Square Bulk Meter", 23.54729, 58.636, 560, 979, CORE_W, CORE_H),
                cp("z05-bulk", "Zone 05 Bulk Meter", 23.54818, 58.63931, 1767, 1162, CORE_W, CORE_H),
            ],
        },
        zonePoints: [
            { zoneId: "3B", controlPointId: "z03b-bulk", placement: "verified-coordinate" },
            { zoneId: "3A", controlPointId: "z03a-bulk", placement: "verified-coordinate" },
            { zoneId: "VS", controlPointId: "zvs-bulk", placement: "verified-coordinate" },
            { zoneId: "05", controlPointId: "z05-bulk", placement: "verified-coordinate" },
        ],
        meterPoints: [],
        properties: [],
        nominalMetresPerPixel: 0.29,
    },
    east: {
        label: "Zone 08 & Hotel",
        calibration: {
            sceneId: "east",
            imagePath: "/water-map/scene-east.jpg",
            width: EAST_W,
            height: EAST_H,
            controlPoints: [
                cp("jmb-hotel", "Hotel JMB", 23.55023, 58.64195, 665, 568, EAST_W, EAST_H),
                cp("z08-bulk", "Zone 08 Bulk Meter", 23.54741, 58.644, 894, 1282, EAST_W, EAST_H),
                // Pixel derived by projecting the verified coordinate through the
                // solved two-point transform (it sits ~1.5 m from the bulk).
                cp("z08-irr", "Zone 08 Irrigation Meter", 23.54726, 58.64399, 897, 1296, EAST_W, EAST_H),
            ],
        },
        zonePoints: [{ zoneId: "08", controlPointId: "z08-bulk", placement: "verified-coordinate" }],
        meterPoints: [
            { account: "4300334", name: "Hotel Main Building", controlPointId: "jmb-hotel", placement: "verified-coordinate" },
            { account: "4300294", name: "IRR Tank Z08", controlPointId: "z08-irr", placement: "verified-coordinate" },
        ],
        properties: [],
        nominalMetresPerPixel: 0.5,
    },
    fm: {
        label: "Zone FM",
        calibration: {
            sceneId: "fm",
            imagePath: "/water-map/scene-fm.jpg",
            width: FM_W,
            height: FM_H,
            controlPoints: [
                cp("zfm-bulk", "Zone FM Bulk Meter", 23.54143, 58.63336, 1168, 846, FM_W, FM_H),
            ],
        },
        zonePoints: [{ zoneId: "FM", controlPointId: "zfm-bulk", placement: "verified-coordinate" }],
        meterPoints: [],
        properties: [],
        nominalMetresPerPixel: 0.32,
    },
};

/** Which scene shows which zone — zone selection loads this scene. */
export const SCENE_FOR_ZONE: Record<MapZoneId, WaterMapSceneId> = {
    "3A": "core",
    "3B": "core",
    "05": "core",
    VS: "core",
    "08": "east",
    FM: "fm",
};

export const SCENE_ORDER: readonly WaterMapSceneId[] = ["core", "east", "fm"] as const;

/* ── Geo ↔ pixel similarity (per scene) ────────────────────────────────────── */

export interface SceneGeoSolution {
    /** Metres per ORIGINAL-image pixel. */
    metresPerPixel: number;
    /** Rotation of the image relative to north (radians), from the fit. */
    rotationRad: number;
    /** RMS residual of the fit across control points, in pixels. */
    residualPx: number;
    /** True when ≥2 control points allowed a real similarity fit. */
    projective: boolean;
}

const M_PER_DEG_LAT = 110_574;

/**
 * Least-squares 2D similarity fit (rotation + uniform scale + translation)
 * mapping geo offsets (metres east/north) → image pixels. With one control
 * point the scene is anchored but not projective — the nominal scale applies.
 */
export function solveSceneGeo(scene: WaterMapScene): SceneGeoSolution {
    const pts = scene.calibration.controlPoints;
    if (pts.length < 2) {
        return { metresPerPixel: scene.nominalMetresPerPixel, rotationRad: 0, residualPx: 0, projective: false };
    }
    const lat0 = pts.reduce((s, p) => s + p.latitude, 0) / pts.length;
    const lon0 = pts.reduce((s, p) => s + p.longitude, 0) / pts.length;
    const mPerDegLon = 111_320 * Math.cos((lat0 * Math.PI) / 180);

    // Geo (E, N) metres and pixel (x, y-up) about their centroids.
    const geo = pts.map((p) => ({ x: (p.longitude - lon0) * mPerDegLon, y: (p.latitude - lat0) * M_PER_DEG_LAT }));
    const px = pts.map((p) => ({ x: p.pixelX, y: -p.pixelY }));
    const gc = { x: 0, y: 0 };
    const pc = {
        x: px.reduce((s, p) => s + p.x, 0) / px.length,
        y: px.reduce((s, p) => s + p.y, 0) / px.length,
    };

    let a = 0, b = 0, gg = 0;
    for (let i = 0; i < pts.length; i++) {
        const g = { x: geo[i].x - gc.x, y: geo[i].y - gc.y };
        const q = { x: px[i].x - pc.x, y: px[i].y - pc.y };
        a += g.x * q.x + g.y * q.y;
        b += g.x * q.y - g.y * q.x;
        gg += g.x * g.x + g.y * g.y;
    }
    const scalePxPerM = Math.hypot(a, b) / (gg || 1);
    const rotationRad = Math.atan2(b, a);

    // Residual: project each geo point and compare to its pixel.
    const cos = Math.cos(rotationRad), sin = Math.sin(rotationRad);
    let sq = 0;
    for (let i = 0; i < pts.length; i++) {
        const g = geo[i];
        const projX = scalePxPerM * (g.x * cos - g.y * sin) + pc.x;
        const projY = scalePxPerM * (g.x * sin + g.y * cos) + pc.y;
        sq += (projX - px[i].x) ** 2 + (projY - px[i].y) ** 2;
    }
    return {
        metresPerPixel: 1 / (scalePxPerM || 1),
        rotationRad,
        residualPx: Math.sqrt(sq / pts.length),
        projective: true,
    };
}

const solved = new Map<WaterMapSceneId, SceneGeoSolution>();

/** Cached geo solution for a scene. */
export function sceneGeo(sceneId: WaterMapSceneId): SceneGeoSolution {
    let s = solved.get(sceneId);
    if (!s) {
        s = solveSceneGeo(WATER_MAP_SCENES[sceneId]);
        solved.set(sceneId, s);
    }
    return s;
}

/** Control point lookup within a scene. */
export function sceneControlPoint(sceneId: WaterMapSceneId, controlPointId: string): SceneControlPoint | undefined {
    return WATER_MAP_SCENES[sceneId].calibration.controlPoints.find((p) => p.id === controlPointId);
}
