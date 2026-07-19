/**
 * @fileoverview Water 3D Map — the Three.js scene (framework-free class).
 *
 * Renders a `MapSnapshot` as a 3D operational board: a ground plane, one
 * platform + magnitude pillar per zone (coloured by loss severity), instanced
 * meter nodes, trunk links from the main bulk to each zone, and pausable flow
 * particles. Self-contained HTML zone callouts are projected each frame.
 *
 * Discipline mirrors `components/three/ambient-bay.tsx`: token-resolved colours
 * that re-resolve on theme change, WebGL created in try/catch (graceful failure
 * → caller shows the table fallback), on-demand rendering that idles to zero
 * work, paused off-screen and when the tab is hidden, honours reduced-motion,
 * and fully disposes on teardown.
 *
 * @module components/water/map3d/water-3d-scene
 */

import {
    AmbientLight,
    BoxGeometry,
    BufferGeometry,
    Color,
    CylinderGeometry,
    DirectionalLight,
    Float32BufferAttribute,
    GridHelper,
    Group,
    HemisphereLight,
    InstancedMesh,
    LineBasicMaterial,
    LineSegments,
    Mesh,
    MeshLambertMaterial,
    Object3D,
    PerspectiveCamera,
    PlaneGeometry,
    Points,
    PointsMaterial,
    Raycaster,
    RingGeometry,
    Scene,
    Vector2,
    Vector3,
    WebGLRenderer,
} from "three";
import type { MapSnapshot, MapMeterDatum, MapSeverity, MapZoneDatum } from "@/lib/water-map-data";
import type { MapZoneId } from "@/lib/water-map-config";

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
    links: boolean;
    flow: boolean;
    labels: boolean;
}
export interface SceneOptions {
    reducedMotion: boolean;
    animateFlow: boolean;
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

export class Water3DScene {
    private container: HTMLElement;
    private cb: SceneCallbacks;
    private opts: SceneOptions;

    private renderer: WebGLRenderer | null = null;
    private scene = new Scene();
    private camera: PerspectiveCamera;
    private labelLayer: HTMLDivElement;

    private ok_ = false;
    private disposed = false;

    // Camera orbit state (spherical around `target`).
    private target = new Vector3(0, 0, 0);
    private theta = -0.6;
    private phi = 0.9;
    private radius = 760;
    private targetWanted = new Vector3(0, 0, 0);
    private radiusWanted = 760;
    private easing = false;

    // Interaction
    private dragging = false;
    private lastPointer = new Vector2();
    private raycaster = new Raycaster();
    private pointerNdc = new Vector2();

    // Rendering loop control
    private running = false;
    private onScreen = true;
    private visible = true;
    private elapsed = 0;
    private lastTime = 0;

    // Colour cache (re-resolved on theme change)
    private severityColor = new Map<MapSeverity, Color>();
    private accentColor = new Color(SEVERITY_FALLBACK.good);
    private mutedColor = new Color("#64748b");

    // Scene content (rebuilt per snapshot)
    private content = new Group();
    private zonePillars: Mesh[] = [];
    private zonePlatforms: Mesh[] = [];
    private zoneById = new Map<MapZoneId, MapZoneDatum>();
    private meterMesh: InstancedMesh | null = null;
    private meterList: MapMeterDatum[] = [];
    private trunkLines: LineSegments | null = null;
    private flow: Points | null = null;
    private flowSegments: { a: Vector3; b: Vector3; speed: number; offset: number }[] = [];
    private mainMarker: Mesh | null = null;
    private selectionRing: Mesh | null = null;

    private selection: SceneSelection = { kind: "none", id: "" };

    // Observers / listeners kept for disposal.
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
        this.camera = new PerspectiveCamera(50, 1, 1, 8000);
        this.labelLayer = document.createElement("div");

        try {
            this.renderer = new WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
        } catch {
            this.ok_ = false;
            return;
        }
        this.init();
    }

    /** Whether WebGL is available and the scene mounted. */
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
        el.style.outline = "none";
        this.container.appendChild(el);

        this.labelLayer.style.position = "absolute";
        this.labelLayer.style.inset = "0";
        this.labelLayer.style.pointerEvents = "none";
        this.labelLayer.style.overflow = "hidden";
        this.container.appendChild(this.labelLayer);

        this.resolveColors();

        // Lighting — soft, non-dramatic (calm by default).
        this.scene.add(new AmbientLight(0xffffff, 0.75));
        const hemi = new HemisphereLight(0xffffff, 0x202028, 0.55);
        this.scene.add(hemi);
        const dir = new DirectionalLight(0xffffff, 0.7);
        dir.position.set(300, 600, 200);
        this.scene.add(dir);

        // Ground grid (provisional base).
        const grid = new GridHelper(1600, 32, this.mutedColor.getHex(), this.mutedColor.getHex());
        const gridMat = grid.material as LineBasicMaterial | LineBasicMaterial[];
        if (Array.isArray(gridMat)) gridMat.forEach((m) => (m.opacity = 0.14));
        else {
            gridMat.opacity = 0.14;
            gridMat.transparent = true;
        }
        this.scene.add(grid);

        const plane = new Mesh(
            new PlaneGeometry(1600, 1600),
            new MeshLambertMaterial({ color: this.mutedColor, transparent: true, opacity: 0.06 }),
        );
        plane.rotation.x = -Math.PI / 2;
        plane.position.y = -0.5;
        this.scene.add(plane);

        this.scene.add(this.content);

        this.updateCamera();

        // Observers
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
            this.applySeverityColors();
            this.invalidate();
        });
        this.themeObserver.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["class", "data-theme", "style"],
        });
        document.addEventListener("visibilitychange", this.onVisibility);

        // Pointer interaction
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
        this.mutedColor = token("--muted-foreground", "#64748b");
    }

    private colorFor(sev: MapSeverity): Color {
        return this.severityColor.get(sev) ?? new Color(SEVERITY_FALLBACK[sev]);
    }

    // ── Snapshot → geometry ────────────────────────────────────────────────
    setSnapshot(snapshot: MapSnapshot): void {
        if (!this.ok_) return;
        this.clearContent();
        this.zoneById.clear();

        const maxBulk = Math.max(1, ...snapshot.zones.map((z) => z.bulk));

        // Zones: platform + magnitude pillar.
        for (const z of snapshot.zones) {
            this.zoneById.set(z.id, z);
            const color = this.colorFor(z.severity);

            const platform = new Mesh(
                new BoxGeometry(z.footprint.w, 4, z.footprint.d),
                new MeshLambertMaterial({ color, transparent: true, opacity: z.hasData ? 0.28 : 0.12 }),
            );
            platform.position.set(z.local.x, 2, z.local.z);
            platform.userData = { kind: "zone", id: z.id };
            this.content.add(platform);
            this.zonePlatforms.push(platform);

            const h = 12 + (z.bulk / maxBulk) * 150;
            const pillar = new Mesh(
                new BoxGeometry(26, h, 26),
                new MeshLambertMaterial({ color, emissive: new Color(0x000000) }),
            );
            pillar.position.set(z.local.x, h / 2 + 4, z.local.z);
            pillar.userData = { kind: "zone", id: z.id };
            this.content.add(pillar);
            this.zonePillars.push(pillar);
        }

        // Meter nodes (roles meter/building/dc) — one InstancedMesh.
        this.meterList = snapshot.meters.filter((m) => m.role === "meter" || m.role === "building" || m.role === "dc");
        if (this.meterList.length > 0) {
            const geo = new CylinderGeometry(4.5, 4.5, 10, 8);
            const mat = new MeshLambertMaterial({});
            const inst = new InstancedMesh(geo, mat, this.meterList.length);
            const dummy = new Object3D();
            this.meterList.forEach((m, i) => {
                const size = m.role === "building" ? 1.7 : m.role === "dc" ? 1.3 : 1;
                dummy.position.set(m.local.x, 6 * size, m.local.z);
                dummy.scale.set(size, size, size);
                dummy.updateMatrix();
                inst.setMatrixAt(i, dummy.matrix);
                inst.setColorAt(i, this.colorFor(m.severity));
            });
            inst.instanceMatrix.needsUpdate = true;
            if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
            inst.userData = { kind: "meters" };
            inst.visible = this.opts.layers.meters;
            this.content.add(inst);
            this.meterMesh = inst;
        }

        // Main bulk marker.
        if (snapshot.mainBulk) {
            const marker = new Mesh(
                new CylinderGeometry(16, 20, 44, 6),
                new MeshLambertMaterial({ color: this.accentColor }),
            );
            marker.position.set(snapshot.mainBulk.local.x, 22, snapshot.mainBulk.local.z);
            marker.userData = { kind: "main", id: snapshot.mainBulk.account };
            this.content.add(marker);
            this.mainMarker = marker;
        }

        // Trunk links main → zone pillars.
        const main = snapshot.mainBulk?.local ?? { x: 0, z: 0 };
        const linkPts: number[] = [];
        this.flowSegments = [];
        for (const z of snapshot.zones) {
            linkPts.push(main.x, 6, main.z, z.local.x, 6, z.local.z);
            const intensity = Math.max(0.2, z.bulk / maxBulk);
            this.flowSegments.push({
                a: new Vector3(main.x, 8, main.z),
                b: new Vector3(z.local.x, 8, z.local.z),
                speed: 0.15 + intensity * 0.4,
                offset: Math.abs((z.local.x + z.local.z) % 100) / 100,
            });
        }
        if (linkPts.length > 0) {
            const lg = new BufferGeometry();
            lg.setAttribute("position", new Float32BufferAttribute(linkPts, 3));
            const lines = new LineSegments(lg, new LineBasicMaterial({ color: this.mutedColor, transparent: true, opacity: 0.35 }));
            lines.visible = this.opts.layers.links;
            this.content.add(lines);
            this.trunkLines = lines;
        }

        // Flow particles distributed across the trunk links.
        this.buildFlow();

        // Zone callouts (HTML overlay).
        this.buildLabels(snapshot);

        this.applySelectionVisual();
        this.invalidate();
    }

    private buildFlow(): void {
        if (this.flowSegments.length === 0) return;
        const perSeg = 6;
        const total = this.flowSegments.length * perSeg;
        const positions = new Float32Array(total * 3);
        const geo = new BufferGeometry();
        geo.setAttribute("position", new Float32BufferAttribute(positions, 3));
        const mat = new PointsMaterial({
            color: this.accentColor,
            size: 7,
            sizeAttenuation: true,
            transparent: true,
            opacity: 0.9,
            depthWrite: false,
        });
        const pts = new Points(geo, mat);
        pts.visible = this.opts.layers.flow && this.opts.animateFlow && !this.opts.reducedMotion;
        this.content.add(pts);
        this.flow = pts;
        this.updateFlow(0);
    }

    private updateFlow(time: number): void {
        if (!this.flow) return;
        const attr = this.flow.geometry.getAttribute("position");
        const perSeg = 6;
        let idx = 0;
        for (const seg of this.flowSegments) {
            for (let k = 0; k < perSeg; k++) {
                const base = (k / perSeg + seg.offset + time * seg.speed) % 1;
                const x = seg.a.x + (seg.b.x - seg.a.x) * base;
                const y = seg.a.y + (seg.b.y - seg.a.y) * base + Math.sin(base * Math.PI) * 6;
                const z = seg.a.z + (seg.b.z - seg.a.z) * base;
                attr.setXYZ(idx++, x, y, z);
            }
        }
        attr.needsUpdate = true;
    }

    private buildLabels(snapshot: MapSnapshot): void {
        this.labelLayer.replaceChildren();
        const mk = (id: string, title: string, value: string, sev: MapSeverity) => {
            const el = document.createElement("div");
            el.dataset.labelId = id;
            el.style.position = "absolute";
            el.style.transform = "translate(-50%, -120%)";
            el.style.padding = "3px 8px";
            el.style.borderRadius = "7px";
            el.style.font = "600 11px/1.25 var(--font-sans, system-ui), sans-serif";
            el.style.whiteSpace = "nowrap";
            el.style.color = "var(--card-foreground, #111)";
            el.style.background = "color-mix(in srgb, var(--card, #fff) 92%, transparent)";
            el.style.border = "1px solid var(--border, #e5e7eb)";
            el.style.boxShadow = "0 2px 8px rgba(0,0,0,0.14)";
            el.style.visibility = "hidden";
            const dot = `<span style="display:inline-block;width:7px;height:7px;border-radius:9999px;background:${this.colorFor(sev).getStyle()};margin-inline-end:5px;vertical-align:middle"></span>`;
            el.innerHTML = `${dot}<span style="vertical-align:middle">${title}</span> <span style="opacity:.7;vertical-align:middle">${value}</span>`;
            this.labelLayer.appendChild(el);
        };
        for (const z of snapshot.zones) {
            mk(`zone:${z.id}`, z.short, z.hasData ? `${fmt(z.bulk)} m³` : "no data", z.severity);
        }
        if (snapshot.mainBulk) {
            mk(`main:${snapshot.mainBulk.account}`, "Main Bulk", `${fmt(snapshot.mainBulk.value)} m³`, "good");
        }
        this.labelLayer.style.display = this.opts.layers.labels ? "block" : "none";
    }

    private updateLabels(): void {
        if (!this.renderer || this.opts.layers.labels === false) return;
        const { width, height } = this.renderer.domElement;
        const dpr = this.renderer.getPixelRatio();
        const w = width / dpr;
        const h = height / dpr;
        const v = new Vector3();
        const place = (id: string, world: Vector3) => {
            const el = this.labelLayer.querySelector<HTMLElement>(`[data-label-id="${CSS.escape(id)}"]`);
            if (!el) return;
            v.copy(world).project(this.camera);
            const behind = v.z > 1;
            if (behind) {
                el.style.visibility = "hidden";
                return;
            }
            el.style.left = `${((v.x + 1) / 2) * w}px`;
            el.style.top = `${((-v.y + 1) / 2) * h}px`;
            el.style.visibility = "visible";
        };
        this.zoneById.forEach((z) => {
            const hgt = 12 + (z.bulk / Math.max(1, ...[...this.zoneById.values()].map((d) => d.bulk))) * 150;
            place(`zone:${z.id}`, new Vector3(z.local.x, hgt + 18, z.local.z));
        });
        if (this.mainMarker) {
            const id = (this.mainMarker.userData as { id?: string }).id ?? "";
            place(`main:${id}`, new Vector3(this.mainMarker.position.x, 54, this.mainMarker.position.z));
        }
    }

    // ── Selection ──────────────────────────────────────────────────────────
    setSelection(sel: SceneSelection): void {
        this.selection = sel;
        this.applySelectionVisual();
        this.invalidate();
    }

    private applySelectionVisual(): void {
        // Zone emphasis via emissive on the pillar.
        for (const pillar of this.zonePillars) {
            const id = (pillar.userData as { id?: string }).id;
            const mat = pillar.material as MeshLambertMaterial;
            const on = this.selection.kind === "zone" && this.selection.id === id;
            mat.emissive.copy(on ? this.accentColor : new Color(0x000000));
            mat.emissiveIntensity = on ? 0.5 : 0;
        }
        // Meter selection ring.
        if (this.selection.kind === "meter" && this.meterMesh) {
            const meter = this.meterList.find((m) => m.key === this.selection.id);
            if (meter) {
                if (!this.selectionRing) {
                    this.selectionRing = new Mesh(
                        new RingGeometry(9, 12, 24),
                        new MeshLambertMaterial({ color: this.accentColor, transparent: true, opacity: 0.95 }),
                    );
                    this.selectionRing.rotation.x = -Math.PI / 2;
                    this.content.add(this.selectionRing);
                }
                this.selectionRing.position.set(meter.local.x, 1, meter.local.z);
                this.selectionRing.visible = true;
            }
        } else if (this.selectionRing) {
            this.selectionRing.visible = false;
        }
    }

    private applySeverityColors(): void {
        // Re-tint existing geometry after a theme change.
        for (const pillar of this.zonePillars) {
            const id = (pillar.userData as { id?: string }).id as MapZoneId | undefined;
            const z = id ? this.zoneById.get(id) : undefined;
            if (z) (pillar.material as MeshLambertMaterial).color.copy(this.colorFor(z.severity));
        }
        for (const platform of this.zonePlatforms) {
            const id = (platform.userData as { id?: string }).id as MapZoneId | undefined;
            const z = id ? this.zoneById.get(id) : undefined;
            if (z) (platform.material as MeshLambertMaterial).color.copy(this.colorFor(z.severity));
        }
        if (this.meterMesh) {
            this.meterList.forEach((m, i) => this.meterMesh?.setColorAt(i, this.colorFor(m.severity)));
            if (this.meterMesh.instanceColor) this.meterMesh.instanceColor.needsUpdate = true;
        }
    }

    // ── Camera ────────────────────────────────────────────────────────────
    focusZone(zoneId: MapZoneId | null): void {
        if (zoneId) {
            const z = this.zoneById.get(zoneId);
            if (z) {
                this.targetWanted.set(z.local.x, 0, z.local.z);
                this.radiusWanted = 320;
            }
        } else {
            this.targetWanted.set(0, 0, 0);
            this.radiusWanted = 760;
        }
        this.easing = true;
        this.invalidate();
    }

    private updateCamera(): void {
        const x = this.target.x + this.radius * Math.sin(this.phi) * Math.sin(this.theta);
        const y = this.target.y + this.radius * Math.cos(this.phi);
        const z = this.target.z + this.radius * Math.sin(this.phi) * Math.cos(this.theta);
        this.camera.position.set(x, y, z);
        this.camera.lookAt(this.target);
    }

    setAnimateFlow(on: boolean): void {
        this.opts.animateFlow = on;
        if (this.flow) this.flow.visible = on && this.opts.layers.flow && !this.opts.reducedMotion;
        this.invalidate();
    }

    setLayers(partial: Partial<SceneLayers>): void {
        this.opts.layers = { ...this.opts.layers, ...partial };
        if (this.meterMesh) this.meterMesh.visible = this.opts.layers.meters;
        if (this.trunkLines) this.trunkLines.visible = this.opts.layers.links;
        if (this.flow) this.flow.visible = this.opts.layers.flow && this.opts.animateFlow && !this.opts.reducedMotion;
        this.labelLayer.style.display = this.opts.layers.labels ? "block" : "none";
        this.invalidate();
    }

    // ── Pointer handlers ────────────────────────────────────────────────────
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
            this.phi = Math.min(1.45, Math.max(0.18, this.phi - dy * 0.005));
            this.easing = false;
            this.updateCamera();
            this.invalidate();
        } else {
            this.pick(e, false);
        }
    };
    private readonly onWheel = (e: WheelEvent) => {
        e.preventDefault();
        this.radius = Math.min(1500, Math.max(140, this.radius * (1 + Math.sign(e.deltaY) * 0.08)));
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

        // Meters first (they sit on top), then zone pillars, then main.
        if (this.meterMesh && this.opts.layers.meters) {
            const hit = this.raycaster.intersectObject(this.meterMesh, false)[0];
            if (hit && hit.instanceId != null) {
                const m = this.meterList[hit.instanceId];
                if (m) {
                    if (select) this.cb.onSelect?.({ kind: "meter", id: m.key });
                    else this.cb.onHover?.({ kind: "meter", label: m.name, value: `${fmt(m.value)} m³`, x: e.clientX - rect.left, y: e.clientY - rect.top });
                    return;
                }
            }
        }
        const zoneHit = this.raycaster.intersectObjects([...this.zonePillars, ...this.zonePlatforms], false)[0];
        if (zoneHit) {
            const id = (zoneHit.object.userData as { id?: string }).id;
            const z = id ? this.zoneById.get(id as MapZoneId) : undefined;
            if (z) {
                if (select) this.cb.onSelect?.({ kind: "zone", id: z.id });
                else this.cb.onHover?.({ kind: "zone", label: z.name, value: `${fmt(z.bulk)} m³ · ${z.lossPct.toFixed(1)}% loss`, x: e.clientX - rect.left, y: e.clientY - rect.top });
                return;
            }
        }
        if (this.mainMarker) {
            const mainHit = this.raycaster.intersectObject(this.mainMarker, false)[0];
            if (mainHit) {
                const id = (this.mainMarker.userData as { id?: string }).id ?? "";
                if (select) this.cb.onSelect?.({ kind: "main", id });
                else this.cb.onHover?.(null);
                return;
            }
        }
        if (select) this.cb.onSelect?.({ kind: "none", id: "" });
        else this.cb.onHover?.(null);
    }

    // ── Render loop (on-demand) ─────────────────────────────────────────────
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
        this.elapsed += delta;

        // Ease the camera toward a focus target.
        if (this.easing) {
            const damp = 1 - Math.exp(-6 * delta);
            this.target.lerp(this.targetWanted, damp);
            this.radius += (this.radiusWanted - this.radius) * damp;
            this.updateCamera();
            if (this.target.distanceTo(this.targetWanted) < 0.5 && Math.abs(this.radius - this.radiusWanted) < 0.5) {
                this.easing = false;
            }
        }

        const flowing = this.opts.animateFlow && !this.opts.reducedMotion && this.flow?.visible;
        if (flowing) this.updateFlow(this.elapsed);

        this.updateLabels();
        this.renderer.render(this.scene, this.camera);

        // Idle to zero work when nothing needs animating.
        if (!this.easing && !flowing && !this.dragging) this.stopLoop();
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

    private clearContent(): void {
        for (const child of [...this.content.children]) {
            this.content.remove(child);
            if (child instanceof Mesh || child instanceof LineSegments || child instanceof Points || child instanceof InstancedMesh) {
                child.geometry.dispose();
                const mat = child.material;
                if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
                else mat.dispose();
            }
        }
        this.zonePillars = [];
        this.zonePlatforms = [];
        this.meterMesh = null;
        this.meterList = [];
        this.trunkLines = null;
        this.flow = null;
        this.mainMarker = null;
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
        this.scene.traverse((obj) => {
            if (obj instanceof Mesh || obj instanceof LineSegments || obj instanceof Points) {
                obj.geometry?.dispose();
                const mat = obj.material;
                if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
                else mat?.dispose();
            }
        });
        this.labelLayer.remove();
        this.renderer?.dispose();
        this.renderer?.domElement.remove();
        this.renderer = null;
    }
}
