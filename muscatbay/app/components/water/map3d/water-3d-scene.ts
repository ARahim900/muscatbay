/**
 * @fileoverview Water 3D Map — the Three.js aerial scene (framework-free class).
 *
 * Renders one calibrated aerial image scene (see `lib/water-map-scenes.ts`) as
 * a textured ground plane in metres, with PROGRAMMATIC markers on it:
 *  - a pin + soft ground ring per zone bulk meter (severity-coloured, from the
 *    live MapSnapshot — never hard-coded values);
 *  - smaller pins for individually-verified meters (Hotel JMB, Z08 IRR);
 *  - HTML callouts projected each frame (our own labels — the source images'
 *    calibration ink was removed from the base layers).
 * There are deliberately NO abstract platforms, magnitude pillars, straight
 * network lines or illustratively-scattered meter nodes — un-surveyed meters
 * are surfaced through the panels/search/table instead of fake positions.
 *
 * Discipline (mirrors `components/three/ambient-bay.tsx`): token-resolved
 * colours that re-resolve on theme change, WebGL created in try/catch (graceful
 * failure → caller shows the table fallback), on-demand rendering that idles to
 * zero work, paused off-screen and when the tab is hidden, honours
 * reduced-motion (camera moves snap instead of glide), and fully disposes.
 *
 * @module components/water/map3d/water-3d-scene
 */

import {
    AmbientLight,
    CircleGeometry,
    Color,
    CylinderGeometry,
    DirectionalLight,
    Mesh,
    MeshBasicMaterial,
    MeshLambertMaterial,
    PerspectiveCamera,
    PlaneGeometry,
    Raycaster,
    RingGeometry,
    Scene,
    SphereGeometry,
    SRGBColorSpace,
    Texture,
    TextureLoader,
    Vector2,
    Vector3,
    WebGLRenderer,
} from "three";
import type { MapSnapshot, MapSeverity, MapZoneDatum, MapMeterDatum } from "@/lib/water-map-data";
import type { MapZoneId } from "@/lib/water-map-config";
import {
    WATER_MAP_SCENES,
    sceneGeo,
    sceneControlPoint,
    type WaterMapSceneId,
} from "@/lib/water-map-scenes";

export type SceneSelectionKind = "zone" | "meter" | "main" | "none";
export interface SceneSelection {
    kind: SceneSelectionKind;
    id: string;
}
export interface SceneHover {
    kind: "zone" | "meter";
    label: string;
    value: string;
    x: number;
    y: number;
}
export interface SceneCallbacks {
    onSelect?: (s: SceneSelection) => void;
    onHover?: (h: SceneHover | null) => void;
}
export interface SceneLayers {
    meters: boolean;
    labels: boolean;
}
export interface SceneOptions {
    reducedMotion: boolean;
    layers: SceneLayers;
}

const SEVERITY_FALLBACK: Record<MapSeverity, string> = {
    good: "#84B59F",
    watch: "#E0A458",
    high: "#C0504D",
    critical: "#B0413E",
    nodata: "#9CA3AF",
};

const fmt = (n: number | null): string =>
    n == null ? "–" : Math.round(n).toLocaleString("en-GB");

/** Resolve a CSS custom property to a THREE color, with a safe fallback. */
function token(name: string, fallback: string): Color {
    try {
        const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
        return new Color(raw || fallback);
    } catch {
        return new Color(fallback);
    }
}

interface ZoneMarker {
    zoneId: MapZoneId;
    pos: Vector3;
    pole: Mesh;
    head: Mesh;
    ring: Mesh;
    pick: Mesh;
}
interface MeterMarker {
    account: string;
    /** Snapshot meter key when resolvable (account:role) — falls back to account. */
    key: string;
    pos: Vector3;
    pole: Mesh;
    head: Mesh;
}

export class Water3DScene {
    private container: HTMLElement;
    private cb: SceneCallbacks;
    private opts: SceneOptions;

    private renderer: WebGLRenderer | null = null;
    private scene = new Scene();
    private camera: PerspectiveCamera;
    private labelLayer: HTMLDivElement;
    private texLoader = new TextureLoader();
    private textures = new Map<WaterMapSceneId, Texture>();

    private ok_ = false;
    private disposed = false;

    // Camera orbit state (spherical around `target`).
    private target = new Vector3(0, 0, 0);
    private theta = 0;
    private phi = 0.5;
    private radius = 700;
    private targetWanted = new Vector3(0, 0, 0);
    private radiusWanted = 700;
    private homeTarget = new Vector3(0, 0, 0);
    private homeRadius = 700;
    private easing = false;

    // Interaction
    private dragging = false;
    private lastPointer = new Vector2();
    private raycaster = new Raycaster();
    private pointerNdc = new Vector2();

    // Loop control
    private running = false;
    private onScreen = true;
    private visible = true;
    private lastTime = 0;

    // Colours (re-resolved on theme change)
    private severityColor = new Map<MapSeverity, Color>();
    private accentColor = new Color("#A1D1D5");

    // Current content
    private sceneId: WaterMapSceneId = "core";
    private snapshot: MapSnapshot | null = null;
    private ground: Mesh | null = null;
    private zoneMarkers: ZoneMarker[] = [];
    private meterMarkers: MeterMarker[] = [];
    private selectionRing: Mesh | null = null;
    private planeW = 800;
    private planeD = 420;
    private pinH = 26;
    private selection: SceneSelection = { kind: "none", id: "" };
    private pendingFocus: MapZoneId | null = null;

    private resizeObserver: ResizeObserver | null = null;
    private intersectionObserver: IntersectionObserver | null = null;
    private themeObserver: MutationObserver | null = null;
    private readonly onVisibility = () => {
        this.visible = document.visibilityState === "visible";
        if (this.visible) this.invalidate();
        else this.stopLoop();
    };

    constructor(container: HTMLElement, cb: SceneCallbacks, opts: SceneOptions) {
        this.container = container;
        this.cb = cb;
        this.opts = opts;
        this.camera = new PerspectiveCamera(48, 1, 1, 12000);
        this.labelLayer = document.createElement("div");
        try {
            this.renderer = new WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
        } catch {
            this.ok_ = false;
            return;
        }
        this.init();
    }

    get ok(): boolean {
        return this.ok_;
    }

    private init(): void {
        const renderer = this.renderer;
        if (!renderer) return;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
        renderer.setClearColor(0x000000, 0);
        const el = renderer.domElement;
        el.style.position = "absolute";
        el.style.inset = "0";
        el.style.width = "100%";
        el.style.height = "100%";
        el.style.touchAction = "none";
        this.container.appendChild(el);

        this.labelLayer.style.position = "absolute";
        this.labelLayer.style.inset = "0";
        this.labelLayer.style.pointerEvents = "none";
        this.labelLayer.style.overflow = "hidden";
        this.container.appendChild(this.labelLayer);

        this.resolveColors();

        this.scene.add(new AmbientLight(0xffffff, 1.05));
        const dir = new DirectionalLight(0xffffff, 0.55);
        dir.position.set(300, 700, 250);
        this.scene.add(dir);

        this.resizeObserver = new ResizeObserver(() => this.resize());
        this.resizeObserver.observe(this.container);
        this.intersectionObserver = new IntersectionObserver(
            (entries) => {
                this.onScreen = entries.some((e) => e.isIntersecting);
                if (this.onScreen) this.invalidate();
                else this.stopLoop();
            },
            { threshold: 0.01 },
        );
        this.intersectionObserver.observe(this.container);
        this.themeObserver = new MutationObserver(() => {
            this.resolveColors();
            this.applyColors();
            this.invalidate();
        });
        this.themeObserver.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["class", "data-theme", "style"],
        });
        document.addEventListener("visibilitychange", this.onVisibility);

        el.addEventListener("pointerdown", this.onPointerDown);
        el.addEventListener("pointermove", this.onPointerMove);
        el.addEventListener("pointerup", this.onPointerUp);
        el.addEventListener("pointerleave", this.onPointerLeave);
        el.addEventListener("wheel", this.onWheel, { passive: false });

        this.ok_ = true;
        this.resize();
    }

    private resolveColors(): void {
        this.severityColor.set("good", token("--mb-success", SEVERITY_FALLBACK.good));
        this.severityColor.set("watch", token("--mb-warning", SEVERITY_FALLBACK.watch));
        this.severityColor.set("high", token("--mb-danger", SEVERITY_FALLBACK.high));
        this.severityColor.set("critical", token("--mb-danger", SEVERITY_FALLBACK.critical));
        this.severityColor.set("nodata", token("--mb-stale", SEVERITY_FALLBACK.nodata));
        this.accentColor = token("--secondary", "#A1D1D5");
    }

    private colorFor(sev: MapSeverity): Color {
        return this.severityColor.get(sev) ?? new Color(SEVERITY_FALLBACK[sev]);
    }

    /* ── Content ──────────────────────────────────────────────────────────── */

    setScene(sceneId: WaterMapSceneId): void {
        if (!this.ok_ || sceneId === this.sceneId) return;
        this.sceneId = sceneId;
        this.rebuild(true);
    }

    setSnapshot(snapshot: MapSnapshot): void {
        if (!this.ok_) return;
        this.snapshot = snapshot;
        this.rebuild(false);
    }

    /** World position (metres) of a control point on the current scene plane. */
    private worldFor(pixelX: number, pixelY: number, mPerPx: number, w: number, h: number): Vector3 {
        return new Vector3((pixelX - w / 2) * mPerPx, 0, (pixelY - h / 2) * mPerPx);
    }

    private rebuild(cameraHome: boolean): void {
        if (!this.renderer) return;
        this.clearContent();
        const def = WATER_MAP_SCENES[this.sceneId];
        const geo = sceneGeo(this.sceneId);
        const mPerPx = geo.metresPerPixel;
        const W = def.calibration.width;
        const H = def.calibration.height;
        this.planeW = W * mPerPx;
        this.planeD = H * mPerPx;
        this.pinH = Math.min(44, Math.max(18, this.planeW * 0.032));

        // Ground: the clean aerial base layer.
        const groundMat = new MeshBasicMaterial({ color: 0xffffff });
        const tex = this.textures.get(this.sceneId);
        if (tex) {
            groundMat.map = tex;
            groundMat.color = new Color(0xffffff);
        } else {
            groundMat.color = token("--muted", "#e5e7eb");
            this.texLoader.load(def.calibration.imagePath, (loaded) => {
                if (this.disposed) {
                    loaded.dispose();
                    return;
                }
                loaded.colorSpace = SRGBColorSpace;
                loaded.anisotropy = Math.min(4, this.renderer?.capabilities.getMaxAnisotropy() ?? 1);
                this.textures.set(def.calibration.sceneId as WaterMapSceneId, loaded);
                if (this.sceneId === def.calibration.sceneId && this.ground) {
                    const mat = this.ground.material as MeshBasicMaterial;
                    mat.map = loaded;
                    mat.color = new Color(0xffffff);
                    mat.needsUpdate = true;
                    this.invalidate();
                }
            });
        }
        const ground = new Mesh(new PlaneGeometry(this.planeW, this.planeD), groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.userData = { kind: "ground" };
        this.scene.add(ground);
        this.ground = ground;

        const snap = this.snapshot;
        const zoneById = new Map<MapZoneId, MapZoneDatum>((snap?.zones ?? []).map((z) => [z.id, z]));
        const meterByAccount = new Map<string, MapMeterDatum>();
        for (const m of snap?.meters ?? []) if (!meterByAccount.has(m.account)) meterByAccount.set(m.account, m);

        // Zone markers.
        for (const zp of def.zonePoints) {
            const point = sceneControlPoint(this.sceneId, zp.controlPointId);
            if (!point) continue;
            const z = zoneById.get(zp.zoneId);
            const sev: MapSeverity = z?.severity ?? "nodata";
            const color = this.colorFor(sev);
            const pos = this.worldFor(point.pixelX, point.pixelY, mPerPx, W, H);
            const h = this.pinH;

            const pole = new Mesh(
                new CylinderGeometry(h * 0.05, h * 0.075, h, 10),
                new MeshLambertMaterial({ color }),
            );
            pole.position.set(pos.x, h / 2, pos.z);
            const head = new Mesh(new SphereGeometry(h * 0.17, 18, 14), new MeshLambertMaterial({ color }));
            head.position.set(pos.x, h * 1.04, pos.z);
            const ring = new Mesh(
                new RingGeometry(h * 0.55, h * 0.78, 40),
                new MeshBasicMaterial({ color, transparent: true, opacity: 0.5, depthWrite: false }),
            );
            ring.rotation.x = -Math.PI / 2;
            ring.position.set(pos.x, 0.4, pos.z);
            const pick = new Mesh(
                new CircleGeometry(h * 2.6, 24),
                new MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
            );
            pick.rotation.x = -Math.PI / 2;
            pick.position.set(pos.x, 0.2, pos.z);

            const ud = { kind: "zone", id: zp.zoneId };
            pole.userData = ud;
            head.userData = ud;
            ring.userData = ud;
            pick.userData = ud;
            this.scene.add(pole, head, ring, pick);
            this.zoneMarkers.push({ zoneId: zp.zoneId, pos, pole, head, ring, pick });
        }

        // Individually-verified meter markers.
        for (const mp of def.meterPoints) {
            const point = sceneControlPoint(this.sceneId, mp.controlPointId);
            if (!point) continue;
            const m = meterByAccount.get(mp.account);
            const sev: MapSeverity = m?.severity ?? "nodata";
            const color = this.colorFor(sev);
            const pos = this.worldFor(point.pixelX, point.pixelY, mPerPx, W, H);
            const h = this.pinH * 0.62;
            const pole = new Mesh(
                new CylinderGeometry(h * 0.055, h * 0.08, h, 8),
                new MeshLambertMaterial({ color }),
            );
            pole.position.set(pos.x, h / 2, pos.z);
            const head = new Mesh(new SphereGeometry(h * 0.19, 14, 10), new MeshLambertMaterial({ color }));
            head.position.set(pos.x, h * 1.05, pos.z);
            const key = m?.key ?? mp.account;
            const ud = { kind: "meter", id: key, account: mp.account };
            pole.userData = ud;
            head.userData = ud;
            pole.visible = this.opts.layers.meters;
            head.visible = this.opts.layers.meters;
            this.scene.add(pole, head);
            this.meterMarkers.push({ account: mp.account, key, pos, pole, head });
        }

        this.buildLabels(def.zonePoints.map((zp) => zp.zoneId), zoneById, meterByAccount);

        // Camera framing — near-top-down home view that fills the frame.
        this.homeTarget.set(0, 0, 0);
        this.homeRadius = Math.min(2400, Math.max(160, Math.max(this.planeW * 0.44, this.planeD * 0.9)));
        if (cameraHome || !this.easing) {
            if (cameraHome) {
                this.target.copy(this.homeTarget);
                this.radius = this.homeRadius;
                this.targetWanted.copy(this.homeTarget);
                this.radiusWanted = this.homeRadius;
                this.updateCamera();
            }
        }
        if (this.pendingFocus) {
            const f = this.pendingFocus;
            this.pendingFocus = null;
            this.focusZone(f);
        }
        this.applySelectionVisual();
        this.invalidate();
    }

    private buildLabels(
        zoneIds: MapZoneId[],
        zoneById: Map<MapZoneId, MapZoneDatum>,
        meterByAccount: Map<string, MapMeterDatum>,
    ): void {
        this.labelLayer.replaceChildren();
        const mk = (id: string, title: string, value: string, sev: MapSeverity, small: boolean) => {
            const el = document.createElement("div");
            el.dataset.labelId = id;
            el.style.position = "absolute";
            el.style.transform = "translate(-50%, -130%)";
            el.style.padding = small ? "2px 6px" : "3px 8px";
            el.style.borderRadius = "7px";
            el.style.font = `600 ${small ? 10 : 11}px/1.25 var(--font-sans, system-ui), sans-serif`;
            el.style.whiteSpace = "nowrap";
            el.style.color = "var(--card-foreground, #111)";
            el.style.background = "color-mix(in srgb, var(--card, #fff) 92%, transparent)";
            el.style.border = "1px solid var(--border, #e5e7eb)";
            el.style.boxShadow = "0 2px 8px rgba(0,0,0,0.16)";
            el.style.visibility = "hidden";
            const dot = `<span style="display:inline-block;width:7px;height:7px;border-radius:9999px;background:${this.colorFor(sev).getStyle()};margin-inline-end:5px;vertical-align:middle"></span>`;
            el.innerHTML = `${dot}<span style="vertical-align:middle">${title}</span> <span style="opacity:.7;vertical-align:middle">${value}</span>`;
            this.labelLayer.appendChild(el);
        };
        for (const id of zoneIds) {
            const z = zoneById.get(id);
            mk(`zone:${id}`, z?.short ?? id, z?.hasData ? `${fmt(z.bulk)} m³` : "no data", z?.severity ?? "nodata", false);
        }
        for (const mm of this.meterMarkers) {
            const m = meterByAccount.get(mm.account);
            mk(`meter:${mm.account}`, m?.name ?? mm.account, m ? `${fmt(m.value)} m³` : "–", m?.severity ?? "nodata", true);
        }
        this.labelLayer.style.display = this.opts.layers.labels ? "block" : "none";
    }

    private updateLabels(): void {
        if (!this.renderer) return;
        const { width, height } = this.renderer.domElement;
        const dpr = this.renderer.getPixelRatio();
        const w = width / dpr;
        const h = height / dpr;
        const v = new Vector3();
        const place = (id: string, world: Vector3) => {
            const el = this.labelLayer.querySelector<HTMLElement>(`[data-label-id="${CSS.escape(id)}"]`);
            if (!el) return;
            v.copy(world).project(this.camera);
            if (v.z > 1) {
                el.style.visibility = "hidden";
                return;
            }
            el.style.left = `${((v.x + 1) / 2) * w}px`;
            el.style.top = `${((-v.y + 1) / 2) * h}px`;
            el.style.visibility = "visible";
        };
        for (const zm of this.zoneMarkers) place(`zone:${zm.zoneId}`, new Vector3(zm.pos.x, this.pinH * 1.25, zm.pos.z));
        if (this.opts.layers.meters) {
            for (const mm of this.meterMarkers) place(`meter:${mm.account}`, new Vector3(mm.pos.x, this.pinH * 0.85, mm.pos.z));
        } else {
            for (const mm of this.meterMarkers) {
                const el = this.labelLayer.querySelector<HTMLElement>(`[data-label-id="${CSS.escape(`meter:${mm.account}`)}"]`);
                if (el) el.style.visibility = "hidden";
            }
        }
    }

    /* ── Selection & colours ──────────────────────────────────────────────── */

    setSelection(sel: SceneSelection): void {
        this.selection = sel;
        this.applySelectionVisual();
        this.invalidate();
    }

    private applySelectionVisual(): void {
        for (const zm of this.zoneMarkers) {
            const on = this.selection.kind === "zone" && this.selection.id === zm.zoneId;
            const mat = zm.head.material as MeshLambertMaterial;
            mat.emissive.copy(on ? this.accentColor : new Color(0x000000));
            mat.emissiveIntensity = on ? 0.55 : 0;
            (zm.ring.material as MeshBasicMaterial).opacity = on ? 0.85 : 0.5;
        }
        const selMeter =
            this.selection.kind === "meter"
                ? this.meterMarkers.find((m) => m.key === this.selection.id || m.account === this.selection.id)
                : undefined;
        if (selMeter) {
            if (!this.selectionRing) {
                this.selectionRing = new Mesh(
                    new RingGeometry(this.pinH * 0.32, this.pinH * 0.45, 28),
                    new MeshBasicMaterial({ color: this.accentColor, transparent: true, opacity: 0.95, depthWrite: false }),
                );
                this.selectionRing.rotation.x = -Math.PI / 2;
                this.scene.add(this.selectionRing);
            }
            this.selectionRing.position.set(selMeter.pos.x, 0.6, selMeter.pos.z);
            this.selectionRing.visible = true;
        } else if (this.selectionRing) {
            this.selectionRing.visible = false;
        }
    }

    private applyColors(): void {
        const snap = this.snapshot;
        const zoneById = new Map<MapZoneId, MapZoneDatum>((snap?.zones ?? []).map((z) => [z.id, z]));
        for (const zm of this.zoneMarkers) {
            const c = this.colorFor(zoneById.get(zm.zoneId)?.severity ?? "nodata");
            (zm.pole.material as MeshLambertMaterial).color.copy(c);
            (zm.head.material as MeshLambertMaterial).color.copy(c);
            (zm.ring.material as MeshBasicMaterial).color.copy(c);
        }
        const meterByAccount = new Map<string, MapMeterDatum>();
        for (const m of snap?.meters ?? []) if (!meterByAccount.has(m.account)) meterByAccount.set(m.account, m);
        for (const mm of this.meterMarkers) {
            const c = this.colorFor(meterByAccount.get(mm.account)?.severity ?? "nodata");
            (mm.pole.material as MeshLambertMaterial).color.copy(c);
            (mm.head.material as MeshLambertMaterial).color.copy(c);
        }
    }

    /* ── Camera ───────────────────────────────────────────────────────────── */

    focusZone(zoneId: MapZoneId | null): void {
        if (zoneId) {
            const zm = this.zoneMarkers.find((z) => z.zoneId === zoneId);
            if (!zm) {
                this.pendingFocus = zoneId; // zone lives on another scene; applied after setScene rebuild
                return;
            }
            this.targetWanted.copy(zm.pos);
            this.radiusWanted = Math.min(420, Math.max(110, this.planeW * 0.2));
        } else {
            this.targetWanted.copy(this.homeTarget);
            this.radiusWanted = this.homeRadius;
        }
        if (this.opts.reducedMotion) {
            this.target.copy(this.targetWanted);
            this.radius = this.radiusWanted;
            this.easing = false;
            this.updateCamera();
        } else {
            this.easing = true;
        }
        this.invalidate();
    }

    private updateCamera(): void {
        const x = this.target.x + this.radius * Math.sin(this.phi) * Math.sin(this.theta);
        const y = this.target.y + this.radius * Math.cos(this.phi);
        const z = this.target.z + this.radius * Math.sin(this.phi) * Math.cos(this.theta);
        this.camera.position.set(x, y, z);
        this.camera.lookAt(this.target);
    }

    setLayers(partial: Partial<SceneLayers>): void {
        this.opts.layers = { ...this.opts.layers, ...partial };
        for (const mm of this.meterMarkers) {
            mm.pole.visible = this.opts.layers.meters;
            mm.head.visible = this.opts.layers.meters;
        }
        this.labelLayer.style.display = this.opts.layers.labels ? "block" : "none";
        this.invalidate();
    }

    /* ── Pointer ──────────────────────────────────────────────────────────── */

    private readonly onPointerDown = (e: PointerEvent) => {
        this.dragging = true;
        this.lastPointer.set(e.clientX, e.clientY);
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    };
    private readonly onPointerUp = (e: PointerEvent) => {
        const moved = this.lastPointer.distanceTo(new Vector2(e.clientX, e.clientY));
        this.dragging = false;
        if (moved < 4) this.pick(e, true);
    };
    private readonly onPointerLeave = () => {
        this.dragging = false;
        this.cb.onHover?.(null);
    };
    private readonly onPointerMove = (e: PointerEvent) => {
        if (this.dragging) {
            const dx = e.clientX - this.lastPointer.x;
            const dy = e.clientY - this.lastPointer.y;
            this.lastPointer.set(e.clientX, e.clientY);
            this.theta -= dx * 0.005;
            this.phi = Math.min(1.22, Math.max(0.14, this.phi - dy * 0.005));
            this.easing = false;
            this.updateCamera();
            this.invalidate();
        } else {
            this.pick(e, false);
        }
    };
    private readonly onWheel = (e: WheelEvent) => {
        e.preventDefault();
        const maxR = Math.max(this.homeRadius * 1.5, 400);
        this.radius = Math.min(maxR, Math.max(60, this.radius * (1 + Math.sign(e.deltaY) * 0.08)));
        this.easing = false;
        this.updateCamera();
        this.invalidate();
    };

    private pick(e: PointerEvent, select: boolean): void {
        if (!this.renderer) return;
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.pointerNdc.set(
            ((e.clientX - rect.left) / rect.width) * 2 - 1,
            -((e.clientY - rect.top) / rect.height) * 2 + 1,
        );
        this.raycaster.setFromCamera(this.pointerNdc, this.camera);

        const snap = this.snapshot;
        // Meter pins first (small, on top).
        if (this.opts.layers.meters && this.meterMarkers.length > 0) {
            const objs = this.meterMarkers.flatMap((m) => [m.pole, m.head]);
            const hit = this.raycaster.intersectObjects(objs, false)[0];
            if (hit) {
                const ud = hit.object.userData as { id?: string; account?: string };
                const m = snap?.meters.find((x) => x.key === ud.id || x.account === ud.account);
                if (select) this.cb.onSelect?.({ kind: "meter", id: ud.id ?? ud.account ?? "" });
                else if (m) this.cb.onHover?.({ kind: "meter", label: m.name, value: `${fmt(m.value)} m³`, x: e.clientX - rect.left, y: e.clientY - rect.top });
                return;
            }
        }
        // Zone pins + interactive discs.
        const zoneObjs = this.zoneMarkers.flatMap((z) => [z.pole, z.head, z.pick, z.ring]);
        const zoneHit = this.raycaster.intersectObjects(zoneObjs, false)[0];
        if (zoneHit) {
            const id = (zoneHit.object.userData as { id?: string }).id as MapZoneId | undefined;
            const z = id ? snap?.zones.find((x) => x.id === id) : undefined;
            if (id) {
                if (select) this.cb.onSelect?.({ kind: "zone", id });
                else if (z) this.cb.onHover?.({ kind: "zone", label: z.name, value: `${fmt(z.bulk)} m³ · ${z.lossPct.toFixed(1)}% loss`, x: e.clientX - rect.left, y: e.clientY - rect.top });
                return;
            }
        }
        if (select) this.cb.onSelect?.({ kind: "none", id: "" });
        else this.cb.onHover?.(null);
    }

    /* ── Loop ─────────────────────────────────────────────────────────────── */

    private invalidate(): void {
        if (!this.ok_ || this.disposed || !this.onScreen || !this.visible) return;
        if (!this.running) {
            this.running = true;
            this.lastTime = performance.now();
            this.renderer?.setAnimationLoop(this.tick);
        }
    }

    private stopLoop(): void {
        this.running = false;
        this.renderer?.setAnimationLoop(null);
    }

    private readonly tick = (now: number) => {
        if (this.disposed || !this.renderer) return;
        const delta = Math.min((now - this.lastTime) / 1000, 0.05);
        this.lastTime = now;

        if (this.easing) {
            const damp = 1 - Math.exp(-6 * delta);
            this.target.lerp(this.targetWanted, damp);
            this.radius += (this.radiusWanted - this.radius) * damp;
            this.updateCamera();
            if (this.target.distanceTo(this.targetWanted) < 0.4 && Math.abs(this.radius - this.radiusWanted) < 0.4) {
                this.easing = false;
            }
        }

        this.updateLabels();
        this.renderer.render(this.scene, this.camera);
        if (!this.easing && !this.dragging) this.stopLoop();
    };

    resize(): void {
        if (!this.renderer) return;
        const rect = this.container.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
        this.renderer.setSize(rect.width, rect.height, false);
        this.camera.aspect = rect.width / rect.height;
        this.camera.updateProjectionMatrix();
        this.invalidate();
    }

    private disposeMesh(m: Mesh | null): void {
        if (!m) return;
        this.scene.remove(m);
        m.geometry.dispose();
        const mat = m.material;
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
        else mat.dispose();
    }

    private clearContent(): void {
        // Ground material is disposed but cached textures are kept for re-use.
        if (this.ground) {
            const mat = this.ground.material as MeshBasicMaterial;
            mat.map = null;
            this.disposeMesh(this.ground);
            this.ground = null;
        }
        for (const zm of this.zoneMarkers) {
            this.disposeMesh(zm.pole);
            this.disposeMesh(zm.head);
            this.disposeMesh(zm.ring);
            this.disposeMesh(zm.pick);
        }
        this.zoneMarkers = [];
        for (const mm of this.meterMarkers) {
            this.disposeMesh(mm.pole);
            this.disposeMesh(mm.head);
        }
        this.meterMarkers = [];
        this.disposeMesh(this.selectionRing);
        this.selectionRing = null;
    }

    dispose(): void {
        this.disposed = true;
        this.stopLoop();
        this.resizeObserver?.disconnect();
        this.intersectionObserver?.disconnect();
        this.themeObserver?.disconnect();
        document.removeEventListener("visibilitychange", this.onVisibility);
        const el = this.renderer?.domElement;
        if (el) {
            el.removeEventListener("pointerdown", this.onPointerDown);
            el.removeEventListener("pointermove", this.onPointerMove);
            el.removeEventListener("pointerup", this.onPointerUp);
            el.removeEventListener("pointerleave", this.onPointerLeave);
            el.removeEventListener("wheel", this.onWheel);
        }
        this.clearContent();
        for (const tex of this.textures.values()) tex.dispose();
        this.textures.clear();
        this.labelLayer.remove();
        this.renderer?.dispose();
        this.renderer?.domElement.remove();
        this.renderer = null;
    }
}
