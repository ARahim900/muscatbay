import { describe, it, expect } from "vitest";
import {
    WATER_MAP_SCENES,
    SCENE_FOR_ZONE,
    SCENE_ORDER,
    solveSceneGeo,
    sceneControlPoint,
} from "@/lib/water-map-scenes";

describe("water-map scene calibration", () => {
    it("normalised control-point positions match pixel / dimension", () => {
        for (const id of SCENE_ORDER) {
            const { calibration } = WATER_MAP_SCENES[id];
            for (const p of calibration.controlPoints) {
                expect(p.normalisedX).toBeCloseTo(p.pixelX / calibration.width, 4);
                expect(p.normalisedY).toBeCloseTo(p.pixelY / calibration.height, 4);
                expect(p.normalisedX).toBeGreaterThan(0);
                expect(p.normalisedX).toBeLessThan(1);
                expect(p.normalisedY).toBeGreaterThan(0);
                expect(p.normalisedY).toBeLessThan(1);
            }
        }
    });

    it("core scene: 4 verified points fit one similarity transform (alignment check)", () => {
        const s = solveSceneGeo(WATER_MAP_SCENES.core);
        expect(s.projective).toBe(true);
        // Screenshot imagery of this campus resolves at roughly 0.2–0.4 m/px.
        expect(s.metresPerPixel).toBeGreaterThan(0.2);
        expect(s.metresPerPixel).toBeLessThan(0.4);
        // GPS noise on the short 3A↔3B baseline dominates the residual; a
        // gross mismatch (wrong dot ↔ wrong coordinate) would blow far past this.
        expect(s.residualPx).toBeLessThan(45);
    });

    it("east scene: hotel ↔ Z08 baseline solves and the IRR point agrees", () => {
        const s = solveSceneGeo(WATER_MAP_SCENES.east);
        expect(s.projective).toBe(true);
        expect(s.metresPerPixel).toBeGreaterThan(0.35);
        expect(s.metresPerPixel).toBeLessThan(0.65);
        expect(s.residualPx).toBeLessThan(20);
    });

    it("fm scene: single point is anchored but not projective", () => {
        const s = solveSceneGeo(WATER_MAP_SCENES.fm);
        expect(s.projective).toBe(false);
        expect(s.metresPerPixel).toBe(WATER_MAP_SCENES.fm.nominalMetresPerPixel);
    });

    it("every zone maps to a scene that actually contains it", () => {
        for (const [zoneId, sceneId] of Object.entries(SCENE_FOR_ZONE)) {
            const scene = WATER_MAP_SCENES[sceneId];
            const zp = scene.zonePoints.find((z) => z.zoneId === zoneId);
            expect(zp, `${zoneId} missing on scene ${sceneId}`).toBeTruthy();
            expect(sceneControlPoint(sceneId, zp!.controlPointId)).toBeTruthy();
        }
    });

    it("scene meter points reference real control points and Supabase accounts", () => {
        for (const id of SCENE_ORDER) {
            for (const mp of WATER_MAP_SCENES[id].meterPoints) {
                expect(sceneControlPoint(id, mp.controlPointId)).toBeTruthy();
                expect(mp.account).toMatch(/^\d{7}$/);
                expect(mp.placement).toBe("verified-coordinate");
            }
        }
    });
});
