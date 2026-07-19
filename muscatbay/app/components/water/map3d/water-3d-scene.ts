/**
 * @fileoverview Water 3D Map — the Three.js aerial scene (framework-free class).
 *
 * Renders one calibrated aerial image scene (see `lib/water-map-scenes.ts`) as
 * a textured ground plane in metres with PROGRAMMATIC overlays:
 *  - zone bulk pins + soft interactive rings (severity from the live snapshot);
 *  - numbered building markers (D-62 → D-44, D-74, D-75) and villa markers
 *    (V-1 → V-43) traced on the imagery, each linked to its Supabase meter;
 *  - a lightweight provisional pipeline overlay through the numbered chains,
 *    with flow pulses (paused under reduced motion / when toggled off);
 *  - HTML callouts/number chips projected each frame with zoom-dependent
 *    visibility so the imagery stays readable.
 *
 * Camera is Google-Earth style: left-drag / one-finger PANS the ground freely,
 * right/middle/Ctrl-drag orbits & tilts, wheel zooms toward the cursor, pinch
 * zooms + pans, and arrow keys / + − work when the canvas has focus. The view
 * is clamped to the imagery and the plane sits in a matching desert surround
 * with distance fog, so there is no white void at any angle.
 *
 * Discipline (mirrors `components/three/ambient-bay.tsx`): token-resolved
 * colours re-resolved on theme change, WebGL in try/catch (graceful failure →
 * table fallback), rendering idles to zero work when nothing animates, paused
 * off-screen/hidden-tab, honours reduced motion, and disposes fully.
 *
 * @module components/water/map3d/water-3d-scene
 */

import {
    AmbientLight,
    BoxGeometry,
    BufferGeometry,
    CatmullRomCurve3,
    CircleGeometry,
    Color,
    CylinderGeometry,
    DirectionalLight,
    Float32BufferAttribute,
    Fog,
    Line,
    LineBasicMaterial,
    Mesh,
    MeshBasicMaterial,
    MeshLambertMaterial,
    PerspectiveCamera,
    Plane,
    PlaneGeometry,
    Points,
    PointsMaterial,
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
    resolveVillaMeter,
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
    pipes: boolean;
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
interface PropMarker {
    /** "building" | "villa" */
    kind: "building" | "villa";
    label: string;
    account: string;
    /** Snapshot meter key when resolved. */
    key: string | null;
    name: string;
    pos: Vector3;
    mesh: Mesh;
}
interface MeterMarker {
    account: string;
    key: string;
    pos: Vector3;
    pole: Mesh;
    head: Mesh;
}
interface PipeFlow {
    curve: CatmullRomCurve3;
    points: Points;
    count: number;
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
    private pointers = new Map<number, { x: number; y: number }>();
    private gesture: "pan" | "orbit" | "pinch" | null = null;
    private grabPoint: Vector3 | null = null;
    private pinchDist = 0;
    private movedSincePress = 0;
    private raycaster = new Raycaster();
    private pointerNdc = new Vector2();
    private groundPlane = new Plane(new Vector3(0, 1, 0), 0);

    // Loop control
    private running = false;
    private onScreen = true;
    private visible = true;
    private lastTime = 0;
    private elapsed = 0;

    // Colours
    private severityColor = new Map<MapSeverity, Color>();
    private severityMaterial = new Map<MapSeverity, MeshLambertMaterial>();
    private accentColor = new Color("#A1D1D5");

    // Current content
    private sceneId: WaterMapSceneId = "core";
    private snapshot: MapSnapshot | null = null;
    private ground: Mesh | null = null;
    private surround: Mesh | null = null;
    private zoneMarkers: ZoneMarker[] = [];
    private meterMarkers: MeterMarker[] = [];
    private propMarkers: PropMarker[] = [];
    private pipeLines: Line[] = [];
    private pipeFlows: PipeFlow[] = [];
    private selectionRing: Mesh | null = null;
    private buildingGeo: BoxGeometry | null = null;
    private villaGeo: CylinderGeometry | null = null;
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
        this.camera = new PerspectiveCamera(48, 1, 1, 30000);
        this.labelLayer = document.createElement("div");
        try {
            this.renderer = new WebGLRenderer({ alpha: false, antialias: true, powerPreference: "low-power" });
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
        const el = renderer.domElement;
        el.style.position = "absolute";
        el.style.inset = "0";
        el.style.width = "100%";
        el.style.height = "100%";
        el.style.touchAction = "none";
        el.tabIndex = 0;
        el.setAttribute("role", "application");
        el.setAttribute(
            "aria-label",
            "Interactive water map. Drag to move the view, right-drag to rotate, scroll or pinch to zoom. Arrow keys pan; plus and minus zoom.",
        );
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
        el.addEventListener("pointercancel", this.onPointerUp);
        el.addEventListener("pointerleave", this.onPointerLeave);
        el.addEventListener("wheel", this.onWheel, { passive: false });
        el.addEventListener("keydown", this.onKeyDown);
        el.addEventListener("contextmenu", this.onContextMenu);
        el.addEventListener("dblclick", this.onDblClick);

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
        for (const [sev, mat] of this.severityMaterial) mat.color.copy(this.colorFor(sev));
    }

    private colorFor(sev: MapSeverity): Color {
        return this.severityColor.get(sev) ?? new Color(SEVERITY_FALLBACK[sev]);
    }

    private materialFor(sev: MapSeverity): MeshLambertMaterial {
        let m = this.severityMaterial.get(sev);
        if (!m) {
            m = new MeshLambertMaterial({ color: this.colorFor(sev) });
            this.severityMaterial.set(sev, m);
        }
        return m;
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

        // Seamless backdrop: desert-tone surround + fog + matching clear colour.
        const surroundColor = new Color(def.surroundColor);
        this.renderer.setClearColor(surroundColor, 1);
        this.scene.fog = new Fog(surroundColor, this.planeW * 1.7, this.planeW * 5);
        const surround = new Mesh(
            new PlaneGeometry(this.planeW * 14, this.planeD * 18),
            new MeshBasicMaterial({ color: surroundColor }),
        );
        surround.rotation.x = -Math.PI / 2;
        surround.position.y = -0.6;
        this.scene.add(surround);
        this.surround = surround;

        // Ground: the clean aerial base layer.
        const groundMat = new MeshBasicMaterial({ color: 0xffffff });
        const tex = this.textures.get(this.sceneId);
        if (tex) {
            groundMat.map = tex;
        } else {
            groundMat.color = surroundColor.clone();
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

            const pole = new Mesh(new CylinderGeometry(h * 0.05, h * 0.075, h, 10), new MeshLambertMaterial({ color }));
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
                new CircleGeometry(h * 2.2, 24),
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
            const pole = new Mesh(new CylinderGeometry(h * 0.055, h * 0.08, h, 8), new MeshLambertMaterial({ color }));
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

        // Numbered buildings (shared geometry, severity-shared materials).
        const bSize = Math.max(6, this.planeW * 0.008);
        this.buildingGeo = new BoxGeometry(bSize, bSize * 0.9, bSize);
        for (const b of def.buildings) {
            const m = meterByAccount.get(b.account);
            const sev: MapSeverity = m?.severity ?? "nodata";
            const pos = this.worldFor(b.pixelX, b.pixelY, mPerPx, W, H);
            const mesh = new Mesh(this.buildingGeo, this.materialFor(sev));
            mesh.position.set(pos.x, (bSize * 0.9) / 2 + 0.3, pos.z);
            mesh.userData = { kind: "prop", account: b.account, key: m?.key ?? null };
            this.scene.add(mesh);
            this.propMarkers.push({
                kind: "building",
                label: b.label,
                account: b.account,
                key: m?.key ?? null,
                name: m?.name ?? b.label,
                pos,
                mesh,
            });
        }

        // Numbered villas.
        const vR = Math.max(2.2, this.planeW * 0.0032);
        this.villaGeo = new CylinderGeometry(vR, vR, vR * 1.1, 10);
        for (const v of def.villas) {
            const m = resolveVillaMeter(snap?.meters ?? [], v.n);
            const sev: MapSeverity = m?.severity ?? "nodata";
            const pos = this.worldFor(v.pixelX, v.pixelY, mPerPx, W, H);
            const mesh = new Mesh(this.villaGeo, this.materialFor(sev));
            mesh.position.set(pos.x, (vR * 1.1) / 2 + 0.3, pos.z);
            mesh.userData = { kind: "prop", account: m?.account ?? "", key: m?.key ?? null };
            this.scene.add(mesh);
            this.propMarkers.push({
                kind: "villa",
                label: `V-${v.n}`,
                account: m?.account ?? "",
                key: m?.key ?? null,
                name: m?.name ?? `Villa ${v.n}`,
                pos,
                mesh,
            });
        }

        // Pipeline overlay (provisional logical routes) + flow pulses.
        for (const pipe of def.pipes) {
            const pts = pipe.points.map(([px, py]) => {
                const p = this.worldFor(px, py, mPerPx, W, H);
                return new Vector3(p.x, 1.6, p.z);
            });
            if (pts.length < 2) continue;
            const lineGeo = new BufferGeometry().setFromPoints(pts);
            const line = new Line(
                lineGeo,
                new LineBasicMaterial({ color: this.accentColor, transparent: true, opacity: 0.62 }),
            );
            line.visible = this.opts.layers.pipes;
            this.scene.add(line);
            this.pipeLines.push(line);

            if (!this.opts.reducedMotion) {
                const curve = new CatmullRomCurve3(pts, false, "catmullrom", 0.1);
                const count = Math.max(4, Math.min(14, Math.round(pts.length * 0.6)));
                const positions = new Float32Array(count * 3);
                const pGeo = new BufferGeometry();
                pGeo.setAttribute("position", new Float32BufferAttribute(positions, 3));
                const pulse = new Points(
                    pGeo,
                    new PointsMaterial({ color: this.accentColor, size: 5, sizeAttenuation: true, transparent: true, opacity: 0.95, depthWrite: false }),
                );
                pulse.visible = this.opts.layers.pipes;
                this.scene.add(pulse);
                this.pipeFlows.push({ curve, points: pulse, count });
            }
        }
        this.updateFlows(0);

        this.buildLabels(def.zonePoints.map((zp) => zp.zoneId), zoneById, meterByAccount);

        // Camera framing.
        this.homeTarget.set(0, 0, 0);
        this.homeRadius = Math.min(2400, Math.max(160, Math.max(this.planeW * 0.44, this.planeD * 0.9)));
        if (cameraHome) {
            this.target.copy(this.homeTarget);
            this.radius = this.homeRadius;
            this.targetWanted.copy(this.homeTarget);
            this.radiusWanted = this.homeRadius;
            this.updateCamera();
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
        const chip = (id: string, html: string, cls: "callout" | "num") => {
            const el = document.createElement("div");
            el.dataset.labelId = id;
            el.style.position = "absolute";
            el.style.transform = "translate(-50%, -130%)";
            el.style.whiteSpace = "nowrap";
            el.style.visibility = "hidden";
            if (cls === "callout") {
                el.style.padding = "3px 8px";
                el.style.borderRadius = "7px";
                el.style.font = "600 11px/1.25 var(--font-sans, system-ui), sans-serif";
                el.style.color = "var(--card-foreground, #111)";
                el.style.background = "color-mix(in srgb, var(--card, #fff) 92%, transparent)";
                el.style.border = "1px solid var(--border, #e5e7eb)";
                el.style.boxShadow = "0 2px 8px rgba(0,0,0,0.16)";
            } else {
                el.style.padding = "1px 5px";
                el.style.borderRadius = "5px";
                el.style.font = "700 9.5px/1.3 var(--font-sans, system-ui), sans-serif";
                el.style.color = "var(--card-foreground, #111)";
                el.style.background = "color-mix(in srgb, var(--card, #fff) 88%, transparent)";
                el.style.border = "1px solid var(--border, #e5e7eb)";
            }
            el.innerHTML = html;
            this.labelLayer.appendChild(el);
        };
        const dot = (sev: MapSeverity) =>
            `<span style="display:inline-block;width:7px;height:7px;border-radius:9999px;background:${this.colorFor(sev).getStyle()};margin-inline-end:5px;vertical-align:middle"></span>`;

        for (const id of zoneIds) {
            const z = zoneById.get(id);
            chip(
                `zone:${id}`,
                `${dot(z?.severity ?? "nodata")}<span style="vertical-align:middle">${z?.short ?? id}</span> <span style="opacity:.7;vertical-align:middle">${z?.hasData ? `${fmt(z.bulk)} m³` : "no data"}</span>`,
                "callout",
            );
        }
        for (const mm of this.meterMarkers) {
            const m = meterByAccount.get(mm.account);
            chip(
                `meter:${mm.account}`,
                `${dot(m?.severity ?? "nodata")}<span style="vertical-align:middle">${m?.name ?? mm.account}</span> <span style="opacity:.7;vertical-align:middle">${m ? `${fmt(m.value)} m³` : "–"}</span>`,
                "callout",
            );
        }
        for (const p of this.propMarkers) {
            chip(`prop:${p.kind}:${p.label}`, p.label, "num");
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
        const hide = (id: string) => {
            const el = this.labelLayer.querySelector<HTMLElement>(`[data-label-id="${CSS.escape(id)}"]`);
            if (el) el.style.visibility = "hidden";
        };
        const place = (id: string, world: Vector3) => {
            const el = this.labelLayer.querySelector<HTMLElement>(`[data-label-id="${CSS.escape(id)}"]`);
            if (!el) return;
            v.copy(world).project(this.camera);
            if (v.z > 1 || v.x < -1.05 || v.x > 1.05 || v.y < -1.05 || v.y > 1.05) {
                el.style.visibility = "hidden";
                return;
            }
            el.style.left = `${((v.x + 1) / 2) * w}px`;
            el.style.top = `${((-v.y + 1) / 2) * h}px`;
            el.style.visibility = "visible";
        };

        for (const zm of this.zoneMarkers) place(`zone:${zm.zoneId}`, new Vector3(zm.pos.x, this.pinH * 1.25, zm.pos.z));
        for (const mm of this.meterMarkers) {
            if (this.opts.layers.meters) place(`meter:${mm.account}`, new Vector3(mm.pos.x, this.pinH * 0.85, mm.pos.z));
            else hide(`meter:${mm.account}`);
        }
        // Numbered chips appear as you zoom in (buildings first, then villas).
        const showBuildings = this.radius < this.homeRadius * 1.05;
        const showVillas = this.radius < Math.max(230, this.homeRadius * 0.55);
        for (const p of this.propMarkers) {
            const id = `prop:${p.kind}:${p.label}`;
            const show = p.kind === "building" ? showBuildings : showVillas;
            if (show) place(id, new Vector3(p.pos.x, p.kind === "building" ? 14 : 8, p.pos.z));
            else hide(id);
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
        let selPos: Vector3 | null = null;
        if (this.selection.kind === "meter") {
            const mm = this.meterMarkers.find((m) => m.key === this.selection.id || m.account === this.selection.id);
            if (mm) selPos = mm.pos;
            if (!selPos) {
                const pm = this.propMarkers.find((p) => p.key === this.selection.id || (p.account && p.account === this.selection.id));
                if (pm) selPos = pm.pos;
            }
        }
        if (selPos) {
            if (!this.selectionRing) {
                this.selectionRing = new Mesh(
                    new RingGeometry(this.pinH * 0.32, this.pinH * 0.45, 28),
                    new MeshBasicMaterial({ color: this.accentColor, transparent: true, opacity: 0.95, depthWrite: false }),
                );
                this.selectionRing.rotation.x = -Math.PI / 2;
                this.scene.add(this.selectionRing);
            }
            this.selectionRing.position.set(selPos.x, 0.6, selPos.z);
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
        for (const line of this.pipeLines) (line.material as LineBasicMaterial).color.copy(this.accentColor);
        for (const f of this.pipeFlows) (f.points.material as PointsMaterial).color.copy(this.accentColor);
    }

    /* ── Camera ───────────────────────────────────────────────────────────── */

    focusZone(zoneId: MapZoneId | null): void {
        if (zoneId) {
            const zm = this.zoneMarkers.find((z) => z.zoneId === zoneId);
            if (!zm) {
                this.pendingFocus = zoneId;
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
            this.clampView();
            this.updateCamera();
        } else {
            this.easing = true;
        }
        this.invalidate();
    }

    private clampView(): void {
        const mx = this.planeW * 0.6;
        const mz = this.planeD * 0.7;
        this.target.x = Math.min(mx, Math.max(-mx, this.target.x));
        this.target.z = Math.min(mz, Math.max(-mz, this.target.z));
        this.radius = Math.min(this.homeRadius * 1.45, Math.max(40, this.radius));
        this.phi = Math.min(1.05, Math.max(0.12, this.phi));
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
        for (const line of this.pipeLines) line.visible = this.opts.layers.pipes;
        for (const f of this.pipeFlows) f.points.visible = this.opts.layers.pipes;
        this.labelLayer.style.display = this.opts.layers.labels ? "block" : "none";
        this.invalidate();
    }

    /* ── Pointer / keyboard ───────────────────────────────────────────────── */

    /** World point on the ground plane under a client position, or null. */
    private groundAt(clientX: number, clientY: number): Vector3 | null {
        if (!this.renderer) return null;
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.pointerNdc.set(
            ((clientX - rect.left) / rect.width) * 2 - 1,
            -((clientY - rect.top) / rect.height) * 2 + 1,
        );
        this.raycaster.setFromCamera(this.pointerNdc, this.camera);
        const out = new Vector3();
        return this.raycaster.ray.intersectPlane(this.groundPlane, out) ? out : null;
    }

    private readonly onContextMenu = (e: Event) => e.preventDefault();

    private readonly onPointerDown = (e: PointerEvent) => {
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        this.movedSincePress = 0;
        if (this.pointers.size === 2) {
            const [a, b] = [...this.pointers.values()];
            this.gesture = "pinch";
            this.pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
            this.grabPoint = this.groundAt((a.x + b.x) / 2, (a.y + b.y) / 2);
        } else if (e.button === 2 || e.button === 1 || e.ctrlKey) {
            this.gesture = "orbit";
        } else {
            this.gesture = "pan";
            this.grabPoint = this.groundAt(e.clientX, e.clientY);
        }
        this.easing = false;
    };

    private readonly onPointerUp = (e: PointerEvent) => {
        this.pointers.delete(e.pointerId);
        const wasTap = this.movedSincePress < 5 && this.gesture !== "pinch";
        if (this.pointers.size === 0) {
            const g = this.gesture;
            this.gesture = null;
            this.grabPoint = null;
            if (wasTap && g === "pan") this.pick(e, true);
        } else if (this.pointers.size === 1) {
            const [a] = [...this.pointers.values()];
            this.gesture = "pan";
            this.grabPoint = this.groundAt(a.x, a.y);
        }
    };

    private readonly onPointerLeave = () => {
        this.cb.onHover?.(null);
    };

    private readonly onPointerMove = (e: PointerEvent) => {
        const prev = this.pointers.get(e.pointerId);
        if (prev) {
            this.movedSincePress += Math.hypot(e.clientX - prev.x, e.clientY - prev.y);
            this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        }

        if (this.gesture === "pinch" && this.pointers.size === 2) {
            const [a, b] = [...this.pointers.values()];
            const dist = Math.hypot(a.x - b.x, a.y - b.y);
            if (this.pinchDist > 0 && dist > 0) {
                this.radius *= this.pinchDist / dist;
            }
            this.pinchDist = dist;
            const mid = this.groundAt((a.x + b.x) / 2, (a.y + b.y) / 2);
            if (mid && this.grabPoint) {
                this.target.add(new Vector3().subVectors(this.grabPoint, mid));
            }
            this.clampView();
            this.updateCamera();
            this.invalidate();
            return;
        }
        if (this.gesture === "orbit" && prev) {
            const mdx = e.clientX - prev.x;
            const mdy = e.clientY - prev.y;
            this.theta -= mdx * 0.005;
            this.phi -= mdy * 0.005;
            this.clampView();
            this.updateCamera();
            this.invalidate();
            return;
        }
        if (this.gesture === "pan" && this.grabPoint) {
            const now = this.groundAt(e.clientX, e.clientY);
            if (now) {
                this.target.add(new Vector3().subVectors(this.grabPoint, now));
                this.clampView();
                this.updateCamera();
            }
            this.invalidate();
            return;
        }
        if (!this.gesture) this.pick(e, false);
    };

    private readonly onWheel = (e: WheelEvent) => {
        e.preventDefault();
        const anchor = this.groundAt(e.clientX, e.clientY);
        const factor = 1 + Math.sign(e.deltaY) * 0.09;
        this.radius *= factor;
        if (anchor) {
            // Keep the point under the cursor stationary (Google-Earth zoom).
            this.target.copy(anchor.clone().add(this.target.clone().sub(anchor).multiplyScalar(factor)));
        }
        this.easing = false;
        this.clampView();
        this.updateCamera();
        this.invalidate();
    };

    private readonly onDblClick = (e: MouseEvent) => {
        const anchor = this.groundAt(e.clientX, e.clientY);
        if (!anchor) return;
        this.targetWanted.copy(anchor);
        this.radiusWanted = Math.max(60, this.radius * 0.5);
        if (this.opts.reducedMotion) {
            this.target.copy(this.targetWanted);
            this.radius = this.radiusWanted;
            this.clampView();
            this.updateCamera();
        } else {
            this.easing = true;
        }
        this.invalidate();
    };

    private readonly onKeyDown = (e: KeyboardEvent) => {
        const step = this.radius * 0.1;
        // Screen-aligned ground axes.
        const fwd = new Vector3().subVectors(this.target, this.camera.position);
        fwd.y = 0;
        if (fwd.lengthSq() < 1e-6) fwd.set(0, 0, -1);
        fwd.normalize();
        const right = new Vector3(-fwd.z, 0, fwd.x);
        let handled = true;
        switch (e.key) {
            case "ArrowUp": this.target.addScaledVector(fwd, step); break;
            case "ArrowDown": this.target.addScaledVector(fwd, -step); break;
            case "ArrowLeft": this.target.addScaledVector(right, step); break;
            case "ArrowRight": this.target.addScaledVector(right, -step); break;
            case "+": case "=": this.radius *= 0.88; break;
            case "-": case "_": this.radius *= 1.14; break;
            case "Home": this.focusZone(null); return;
            default: handled = false;
        }
        if (handled) {
            e.preventDefault();
            this.easing = false;
            this.clampView();
            this.updateCamera();
            this.invalidate();
        }
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
        const hx = e.clientX - rect.left;
        const hy = e.clientY - rect.top;

        if (this.opts.layers.meters && this.meterMarkers.length > 0) {
            const objs = this.meterMarkers.flatMap((m) => [m.pole, m.head]);
            const hit = this.raycaster.intersectObjects(objs, false)[0];
            if (hit) {
                const ud = hit.object.userData as { id?: string; account?: string };
                const m = snap?.meters.find((x) => x.key === ud.id || x.account === ud.account);
                if (select) this.cb.onSelect?.({ kind: "meter", id: ud.id ?? ud.account ?? "" });
                else if (m) this.cb.onHover?.({ kind: "meter", label: m.name, value: `${fmt(m.value)} m³`, x: hx, y: hy });
                return;
            }
        }
        if (this.propMarkers.length > 0) {
            const hit = this.raycaster.intersectObjects(this.propMarkers.map((p) => p.mesh), false)[0];
            if (hit) {
                const pm = this.propMarkers.find((p) => p.mesh === hit.object);
                if (pm) {
                    const m = snap?.meters.find((x) => (pm.key && x.key === pm.key) || (pm.account && x.account === pm.account));
                    if (select) {
                        if (m) this.cb.onSelect?.({ kind: "meter", id: m.key });
                    } else {
                        this.cb.onHover?.({
                            kind: "meter",
                            label: `${pm.label} · ${m?.name ?? pm.name}`,
                            value: m ? `${fmt(m.value)} m³` : "no meter match",
                            x: hx,
                            y: hy,
                        });
                    }
                    return;
                }
            }
        }
        const zoneObjs = this.zoneMarkers.flatMap((z) => [z.pole, z.head, z.pick, z.ring]);
        const zoneHit = this.raycaster.intersectObjects(zoneObjs, false)[0];
        if (zoneHit) {
            const id = (zoneHit.object.userData as { id?: string }).id as MapZoneId | undefined;
            const z = id ? snap?.zones.find((x) => x.id === id) : undefined;
            if (id) {
                if (select) this.cb.onSelect?.({ kind: "zone", id });
                else if (z) this.cb.onHover?.({ kind: "zone", label: z.name, value: `${fmt(z.bulk)} m³ · ${z.lossPct.toFixed(1)}% loss`, x: hx, y: hy });
                return;
            }
        }
        if (select) this.cb.onSelect?.({ kind: "none", id: "" });
        else this.cb.onHover?.(null);
    }

    /* ── Loop ─────────────────────────────────────────────────────────────── */

    private updateFlows(time: number): void {
        for (const f of this.pipeFlows) {
            const attr = f.points.geometry.getAttribute("position");
            for (let i = 0; i < f.count; i++) {
                // Positive wrap + clamp — CatmullRom getPoint reads past the
                // array for t outside [0, 1) (negative t indexes points[-1]).
                const cyc = ((i / f.count + time * 0.045) % 1 + 1) % 1;
                const p = f.curve.getPoint(Math.min(0.9995, cyc));
                attr.setXYZ(i, p.x, p.y + 0.6, p.z);
            }
            attr.needsUpdate = true;
        }
    }

    private get flowing(): boolean {
        return this.opts.layers.pipes && !this.opts.reducedMotion && this.pipeFlows.length > 0;
    }

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
        // rAF timestamps can be a few ms BEHIND the performance.now() captured
        // when the loop (re)started — clamp so elapsed never goes negative.
        const delta = Math.min(Math.max((now - this.lastTime) / 1000, 0), 0.05);
        this.lastTime = now;
        this.elapsed += delta;

        if (this.easing) {
            const damp = 1 - Math.exp(-6 * delta);
            this.target.lerp(this.targetWanted, damp);
            this.radius += (this.radiusWanted - this.radius) * damp;
            this.clampView();
            this.updateCamera();
            if (this.target.distanceTo(this.targetWanted) < 0.4 && Math.abs(this.radius - this.radiusWanted) < 0.4) {
                this.easing = false;
            }
        }

        if (this.flowing) this.updateFlows(this.elapsed);

        this.updateLabels();
        this.renderer.render(this.scene, this.camera);
        if (!this.easing && !this.gesture && !this.flowing) this.stopLoop();
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

    private disposeMesh(m: Mesh | Line | Points | null, keepGeometry = false): void {
        if (!m) return;
        this.scene.remove(m);
        if (!keepGeometry) m.geometry.dispose();
        const mat = m.material;
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
        else mat.dispose();
    }

    private clearContent(): void {
        if (this.ground) {
            (this.ground.material as MeshBasicMaterial).map = null;
            this.disposeMesh(this.ground);
            this.ground = null;
        }
        this.disposeMesh(this.surround);
        this.surround = null;
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
        // Prop meshes share geometry + severity materials — remove only.
        for (const p of this.propMarkers) this.scene.remove(p.mesh);
        this.propMarkers = [];
        this.buildingGeo?.dispose();
        this.buildingGeo = null;
        this.villaGeo?.dispose();
        this.villaGeo = null;
        for (const line of this.pipeLines) this.disposeMesh(line);
        this.pipeLines = [];
        for (const f of this.pipeFlows) this.disposeMesh(f.points);
        this.pipeFlows = [];
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
            el.removeEventListener("pointercancel", this.onPointerUp);
            el.removeEventListener("pointerleave", this.onPointerLeave);
            el.removeEventListener("wheel", this.onWheel);
            el.removeEventListener("keydown", this.onKeyDown);
            el.removeEventListener("contextmenu", this.onContextMenu);
            el.removeEventListener("dblclick", this.onDblClick);
        }
        this.clearContent();
        for (const mat of this.severityMaterial.values()) mat.dispose();
        this.severityMaterial.clear();
        for (const tex of this.textures.values()) tex.dispose();
        this.textures.clear();
        this.labelLayer.remove();
        this.renderer?.dispose();
        this.renderer?.domElement.remove();
        this.renderer = null;
    }
}
