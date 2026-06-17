"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
    Color,
    CylinderGeometry,
    DirectionalLight,
    DoubleSide,
    Group,
    HemisphereLight,
    Mesh,
    MeshStandardMaterial,
    type Object3D,
    PerspectiveCamera,
    Raycaster,
    Scene,
    SphereGeometry,
    Sprite,
    SpriteMaterial,
    CanvasTexture,
    TorusGeometry,
    Vector2,
    WebGLRenderer,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { prefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * STP Plant Process Twin — a live, data-bound 3D view of the treatment plant.
 *
 * Unlike the ambient "bay" backdrop, every element here maps to a real number:
 *  • tank liquid height  = stage level (inlet load, treatment efficiency, TSE)
 *  • rim / liquid tint   = operational status, from the same thresholds the
 *                          page already alerts on (inlet > 4,800 m³/day, etc.)
 *  • flow dots           = process throughput (paused under reduced motion)
 *  • click a tank        = inspect that stage's reading in the side panel
 *
 * Discipline mirrors ambient-bay.tsx: brand tokens only (no hex), reduced-motion
 * aware, paused off-screen, fully disposed on unmount, theme-reactive, and
 * silently absent when WebGL is unavailable.
 */

type StageId = "inlet" | "process" | "tse";
type Status = "normal" | "warning" | "danger";

export interface StpTwinMetrics {
    totalInlet: number;
    totalTSE: number;
    totalTrips: number;
    dailyAvgInlet: number;
    /** Treatment efficiency, percent (TSE / inlet). */
    efficiency: number;
    days: number;
}

interface StageDatum {
    id: StageId;
    name: string;
    value: string;
    detail: string;
    /** 0..1 — drives liquid column height. */
    fill: number;
    status: Status;
}

interface StpPlantTwinProps {
    metrics: StpTwinMetrics;
    isLive?: boolean;
    className?: string;
}

/** Plant design inlet capacity (m³/day). Tune to the real plant spec. */
const DESIGN_CAPACITY_M3_DAY = 5000;
/** Daily inlet above this is "high load" — same threshold the page alerts on. */
const HIGH_INLET_M3_DAY = 4800;

const STAGE_X: Record<StageId, number> = { inlet: -3.2, process: 0, tse: 3.2 };
const TANK_H = 2.2;
const TANK_R = 0.95;

interface Palette {
    teal: string;
    purple: string;
    card: string;
    text: string;
    normal: string;
    warning: string;
    danger: string;
}

function readPalette(): Palette {
    const cs = getComputedStyle(document.documentElement);
    const get = (token: string, fallback: string) => cs.getPropertyValue(token).trim() || fallback;
    return {
        teal: get("--secondary", "#A1D1D5"),
        purple: get("--primary", "#4E4456"),
        card: get("--card", "#16141B"),
        text: get("--foreground", "#e7e7ea"),
        normal: get("--status-normal", "#22c55e"),
        warning: get("--status-warning", "#f59e0b"),
        danger: get("--status-danger", "#ef4444"),
    };
}

function statusColor(p: Palette, status: Status): string {
    return status === "danger" ? p.danger : status === "warning" ? p.warning : p.normal;
}

/** #RRGGBB → rgba() string; passes through any non-hex CSS color untouched. */
function hexToRgba(hex: string, alpha: number): string {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
    if (!m) return hex;
    const n = parseInt(m[1], 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

const clamp01 = (n: number) => Math.max(0.05, Math.min(1, n));

/** Derive the three stage readouts from the live metrics. */
function deriveStages(m: StpTwinMetrics): StageDatum[] {
    const inletStatus: Status = m.dailyAvgInlet > HIGH_INLET_M3_DAY ? "warning" : "normal";
    const processStatus: Status =
        m.efficiency >= 92 ? "normal" : m.efficiency >= 85 ? "warning" : "danger";
    const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

    return [
        {
            id: "inlet",
            name: "Inlet Sewage",
            value: `${fmt(m.dailyAvgInlet)} m³/d`,
            detail: `${fmt(m.totalInlet)} m³ over ${m.days} day${m.days === 1 ? "" : "s"}`,
            fill: clamp01(m.dailyAvgInlet / DESIGN_CAPACITY_M3_DAY),
            status: inletStatus,
        },
        {
            id: "process",
            name: "Treatment",
            value: `${m.efficiency.toFixed(1)}%`,
            detail: `Treatment efficiency (TSE ÷ inlet)`,
            fill: clamp01(m.efficiency / 100),
            status: processStatus,
        },
        {
            id: "tse",
            name: "TSE Output",
            value: `${fmt(m.totalTSE)} m³`,
            detail: `Recycled water sent to irrigation`,
            fill: clamp01(m.efficiency / 100),
            status: "normal",
        },
    ];
}

interface TankObj {
    group: Group;
    liquid: Mesh;
    liquidMat: MeshStandardMaterial;
    ringMat: MeshStandardMaterial;
    shellMat: MeshStandardMaterial;
    canvas: HTMLCanvasElement;
    texture: CanvasTexture;
    targetFill: number;
    status: Status;
}

export default function StpPlantTwin({ metrics, isLive = false, className }: StpPlantTwinProps) {
    const hostRef = useRef<HTMLDivElement>(null);
    const [selected, setSelected] = useState<StageId | null>(null);
    // Decide WebGL support once, at init — no setState-in-effect, no SSR access.
    const [webglFailed] = useState(() => {
        if (typeof document === "undefined") return false;
        try {
            const c = document.createElement("canvas");
            return !(c.getContext("webgl2") || c.getContext("webgl"));
        } catch {
            return true;
        }
    });

    const stages = useMemo(() => deriveStages(metrics), [metrics]);
    const stagesRef = useRef(stages);

    // Imperative bridge so live data updates without rebuilding the scene.
    const applyRef = useRef<((s: StageDatum[]) => void) | null>(null);

    useEffect(() => {
        const host = hostRef.current;
        if (!host) return;

        let palette = readPalette();
        const reduce = prefersReducedMotion();

        let renderer: WebGLRenderer;
        try {
            renderer = new WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
        } catch {
            return; // WebGL unavailable — the fallback readouts already render in place.
        }

        const disposables: { dispose: () => void }[] = [];
        const track = <T extends { dispose: () => void }>(o: T): T => {
            disposables.push(o);
            return o;
        };

        const dpr = () => Math.min(window.devicePixelRatio || 1, 2);
        renderer.setPixelRatio(dpr());
        renderer.setClearColor(0x000000, 0); // transparent — blends with the host card
        const el = renderer.domElement;
        el.style.position = "absolute";
        el.style.inset = "0";
        el.style.width = "100%";
        el.style.height = "100%";
        el.style.cursor = "grab";
        host.appendChild(el);

        const scene = new Scene();
        const camera = new PerspectiveCamera(42, 1, 0.1, 100);
        camera.position.set(0.4, 3.6, 9);

        scene.add(new HemisphereLight(new Color(palette.teal), new Color("#0a090c"), 0.5));
        const keyLight = new DirectionalLight(0xffffff, 0.85);
        keyLight.position.set(6, 9, 5);
        scene.add(keyLight);
        const rimLight = new DirectionalLight(new Color(palette.teal), 0.3);
        rimLight.position.set(-7, 3, -4);
        scene.add(rimLight);

        // Base pad
        const padMat = new MeshStandardMaterial({ color: new Color(palette.purple), roughness: 0.95 });
        const pad = new Mesh(track(new CylinderGeometry(6.2, 6.2, 0.3, 64)), track(padMat));
        pad.position.y = -0.15;
        scene.add(pad);

        // Process pipe + flowing throughput dots
        const pipeMat = new MeshStandardMaterial({
            color: new Color(palette.purple).multiplyScalar(0.8),
            roughness: 0.6,
        });
        const pipe = new Mesh(track(new CylinderGeometry(0.09, 0.09, 9, 16)), track(pipeMat));
        pipe.rotation.z = Math.PI / 2;
        pipe.position.y = 0.5;
        scene.add(pipe);

        const dotGeo = track(new SphereGeometry(0.08, 10, 10));
        const dots: Mesh[] = [];
        for (let i = 0; i < 14; i++) {
            const dotMat = track(
                new MeshStandardMaterial({
                    color: new Color(palette.teal),
                    emissive: new Color(palette.teal),
                    emissiveIntensity: 0.7,
                })
            );
            const dot = new Mesh(dotGeo, dotMat);
            dot.position.set(-4.5 + i * 0.66, 0.5, 0);
            scene.add(dot);
            dots.push(dot);
        }

        // Floating KPI label as a canvas sprite, repainted when data changes.
        function paintLabel(tank: TankObj, title: string, value: string, accent: string) {
            const c = tank.canvas;
            const x = c.getContext("2d");
            if (!x) return;
            x.clearRect(0, 0, c.width, c.height);
            const rr = (a: number, b: number, w: number, h: number, r: number) => {
                x.beginPath();
                x.moveTo(a + r, b);
                x.arcTo(a + w, b, a + w, b + h, r);
                x.arcTo(a + w, b + h, a, b + h, r);
                x.arcTo(a, b + h, a, b, r);
                x.arcTo(a, b, a + w, b, r);
                x.closePath();
            };
            x.fillStyle = hexToRgba(palette.card, 0.9);
            rr(8, 8, c.width - 16, c.height - 16, 22);
            x.fill();
            x.lineWidth = 4;
            x.strokeStyle = accent;
            rr(8, 8, c.width - 16, c.height - 16, 22);
            x.stroke();
            x.textAlign = "center";
            x.fillStyle = palette.text;
            x.font = "600 28px Inter, system-ui, sans-serif";
            x.fillText(title, c.width / 2, 62);
            x.font = "700 42px Inter, system-ui, sans-serif";
            x.fillText(value, c.width / 2, 116);
            tank.texture.needsUpdate = true;
        }

        // Build the three tanks
        const tanks: Record<StageId, TankObj> = {} as Record<StageId, TankObj>;
        (Object.keys(STAGE_X) as StageId[]).forEach((id) => {
            const group = new Group();
            group.position.x = STAGE_X[id];
            group.userData = { stageId: id };

            const shellMat = new MeshStandardMaterial({
                color: new Color(palette.teal),
                roughness: 0.15,
                metalness: 0.1,
                transparent: true,
                opacity: 0.12,
                side: DoubleSide,
            });
            const shell = new Mesh(track(new CylinderGeometry(TANK_R, TANK_R, TANK_H, 48, 1, true)), track(shellMat));
            shell.position.y = TANK_H / 2;
            group.add(shell);

            const liquidMat = new MeshStandardMaterial({
                color: new Color(palette.teal),
                emissive: new Color(palette.teal),
                emissiveIntensity: 0.14,
                roughness: 0.35,
            });
            const liquid = new Mesh(track(new CylinderGeometry(TANK_R * 0.93, TANK_R * 0.93, TANK_H, 48)), track(liquidMat));
            liquid.scale.y = 0.05;
            liquid.position.y = (TANK_H * 0.05) / 2;
            group.add(liquid);

            const ringMat = new MeshStandardMaterial({
                color: new Color(palette.teal),
                emissive: new Color(palette.teal),
                emissiveIntensity: 0.55,
            });
            const ring = new Mesh(track(new TorusGeometry(TANK_R, 0.05, 12, 48)), track(ringMat));
            ring.rotation.x = Math.PI / 2;
            ring.position.y = TANK_H;
            group.add(ring);

            const canvas = document.createElement("canvas");
            canvas.width = 340;
            canvas.height = 150;
            const texture = track(new CanvasTexture(canvas));
            texture.anisotropy = 4;
            const spriteMat = track(new SpriteMaterial({ map: texture, transparent: true, depthTest: false }));
            const sprite = new Sprite(spriteMat);
            sprite.scale.set(2.1, 0.93, 1);
            sprite.position.set(0, TANK_H + 1.0, 0);
            sprite.renderOrder = 10;
            group.add(sprite);

            scene.add(group);
            tanks[id] = { group, liquid, liquidMat, ringMat, shellMat, canvas, texture, targetFill: 0.05, status: "normal" };
        });

        // Push live data into the scene (called on mount and whenever metrics change)
        const applyStages = (data: StageDatum[]) => {
            data.forEach((s) => {
                const t = tanks[s.id];
                if (!t) return;
                t.targetFill = clamp01(s.fill);
                t.status = s.status;
                const accent = statusColor(palette, s.status);
                const liquidColor = s.status === "normal" ? palette.teal : accent;
                t.liquidMat.color.set(liquidColor);
                t.liquidMat.emissive.set(liquidColor);
                t.ringMat.color.set(accent);
                t.ringMat.emissive.set(accent);
                paintLabel(t, s.name, s.value, accent);
            });
            renderOnce();
        };
        applyRef.current = applyStages;

        // Click-to-inspect via raycasting
        const raycaster = new Raycaster();
        const pointer = new Vector2();
        const pickables = (Object.values(tanks) as TankObj[]).map((t) => t.group);
        const onPointerDown = (e: PointerEvent) => {
            const rect = el.getBoundingClientRect();
            pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
            raycaster.setFromCamera(pointer, camera);
            const hits = raycaster.intersectObjects(pickables, true);
            if (hits.length > 0) {
                let o: Object3D | null = hits[0].object;
                while (o && !(o.userData as { stageId?: StageId }).stageId) o = o.parent;
                const id = (o?.userData as { stageId?: StageId } | undefined)?.stageId ?? null;
                setSelected(id);
            } else {
                setSelected(null);
            }
        };
        el.addEventListener("pointerdown", onPointerDown);

        const controls = new OrbitControls(camera, el);
        controls.target.set(0, 1.0, 0);
        controls.enablePan = false;
        controls.minDistance = 6;
        controls.maxDistance = 16;
        controls.minPolarAngle = 0.5;
        controls.maxPolarAngle = 1.5;
        controls.enableDamping = !reduce;
        controls.autoRotate = !reduce;
        controls.autoRotateSpeed = 0.5;
        controls.addEventListener("start", () => {
            controls.autoRotate = false;
        });

        const renderOnce = () => renderer.render(scene, camera);

        const resize = () => {
            const w = host.clientWidth;
            const h = host.clientHeight;
            if (w === 0 || h === 0) return;
            renderer.setPixelRatio(dpr());
            renderer.setSize(w, h, false);
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderOnce();
        };
        resize();
        const resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(host);

        applyStages(stagesRef.current);

        // Animation: continuous only when motion is allowed and the card is on-screen.
        let elapsed = 0;
        let running = false;
        const tick = () => {
            elapsed += 0.016;
            (Object.values(tanks) as TankObj[]).forEach((t) => {
                const next = t.liquid.scale.y + (t.targetFill - t.liquid.scale.y) * 0.08;
                t.liquid.scale.y = next;
                t.liquid.position.y = (TANK_H * next) / 2;
                if (t.status !== "normal") {
                    const pulse = 0.4 + Math.sin(elapsed * 3) * 0.25;
                    t.liquidMat.emissiveIntensity = pulse;
                    t.ringMat.emissiveIntensity = 0.6 + Math.sin(elapsed * 3) * 0.3;
                } else {
                    t.liquidMat.emissiveIntensity = 0.14;
                    t.ringMat.emissiveIntensity = 0.55;
                }
            });
            dots.forEach((d) => {
                d.position.x += 0.035;
                if (d.position.x > 4.5) d.position.x = -4.5;
            });
            controls.update();
            renderer.render(scene, camera);
        };
        const start = () => {
            if (running) return;
            running = true;
            renderer.setAnimationLoop(tick);
        };
        const stop = () => {
            if (!running) return;
            running = false;
            renderer.setAnimationLoop(null);
        };

        if (reduce) {
            // Reduced motion: settle fills instantly, then render only on interaction.
            (Object.values(tanks) as TankObj[]).forEach((t) => {
                t.liquid.scale.y = t.targetFill;
                t.liquid.position.y = (TANK_H * t.targetFill) / 2;
            });
            controls.addEventListener("change", renderOnce);
            renderOnce();
        }

        const visibility = new IntersectionObserver(
            (entries) => {
                if (reduce) return;
                if (entries.some((e) => e.isIntersecting)) start();
                else stop();
            },
            { threshold: 0.01 }
        );
        visibility.observe(host);

        // Re-theme without tearing down WebGL (operators flip light/dark mid-shift).
        const applyTheme = () => {
            palette = readPalette();
            padMat.color.set(palette.purple);
            pipeMat.color.set(new Color(palette.purple).multiplyScalar(0.8));
            rimLight.color.set(palette.teal);
            dots.forEach((d) => {
                const mat = d.material as MeshStandardMaterial;
                mat.color.set(palette.teal);
                mat.emissive.set(palette.teal);
            });
            (Object.values(tanks) as TankObj[]).forEach((t) => t.shellMat.color.set(palette.teal));
            applyStages(stagesRef.current);
        };
        const themeObserver = new MutationObserver(applyTheme);
        themeObserver.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["class", "data-theme", "style"],
        });

        const onContextLost = (e: Event) => {
            e.preventDefault();
            stop();
        };
        const onContextRestored = () => {
            if (!reduce) start();
            else renderOnce();
        };
        el.addEventListener("webglcontextlost", onContextLost);
        el.addEventListener("webglcontextrestored", onContextRestored);

        return () => {
            stop();
            applyRef.current = null;
            visibility.disconnect();
            resizeObserver.disconnect();
            themeObserver.disconnect();
            controls.removeEventListener("change", renderOnce);
            el.removeEventListener("pointerdown", onPointerDown);
            el.removeEventListener("webglcontextlost", onContextLost);
            el.removeEventListener("webglcontextrestored", onContextRestored);
            controls.dispose();
            disposables.forEach((d) => d.dispose());
            renderer.dispose();
            el.remove();
        };
    }, []);

    // Feed live metric changes into the running scene (no rebuild).
    useEffect(() => {
        stagesRef.current = stages;
        applyRef.current?.(stages);
    }, [stages]);

    const selectedStage = selected ? stages.find((s) => s.id === selected) ?? null : null;

    if (webglFailed) {
        // Graceful fallback: the readouts still convey everything, just flat.
        return (
            <div className={cn("grid gap-3 sm:grid-cols-3", className)}>
                {stages.map((s) => (
                    <div key={s.id} className="rounded-lg border border-border bg-card p-4">
                        <div className="flex items-center gap-2">
                            <span
                                className="size-2.5 rounded-full"
                                style={{ background: `var(--status-${s.status})` }}
                                aria-hidden
                            />
                            <p className="text-sm font-medium text-muted-foreground">{s.name}</p>
                        </div>
                        <p className="mt-1 text-2xl font-bold text-foreground">{s.value}</p>
                        <p className="text-xs text-muted-foreground">{s.detail}</p>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className={cn("relative", className)}>
            <div
                ref={hostRef}
                className="relative h-[340px] w-full overflow-hidden rounded-lg sm:h-[420px]"
                role="img"
                aria-label={`3D plant twin. Inlet ${stages[0].value}, treatment ${stages[1].value}, TSE output ${stages[2].value}.`}
            />

            {/* Legend — status is never colour-only: each dot is labelled. */}
            <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                {(["normal", "warning", "danger"] as Status[]).map((s) => (
                    <span key={s} className="flex items-center gap-1.5">
                        <span className="size-2 rounded-full" style={{ background: `var(--status-${s})` }} aria-hidden />
                        <span className="capitalize">{s}</span>
                    </span>
                ))}
            </div>

            <span className="pointer-events-none absolute right-3 top-3 rounded-full border border-border bg-card/80 px-2.5 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
                {isLive ? "Live" : "Sample"} · {metrics.efficiency.toFixed(1)}% reuse
            </span>

            {/* Click-to-inspect detail — the 3D view as a navigation surface. */}
            {selectedStage ? (
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-3 rounded-lg border border-border bg-card/90 px-4 py-3 backdrop-blur sm:right-auto sm:min-w-[280px]">
                    <div>
                        <div className="flex items-center gap-2">
                            <span
                                className="size-2.5 rounded-full"
                                style={{ background: `var(--status-${selectedStage.status})` }}
                                aria-hidden
                            />
                            <p className="text-sm font-semibold text-foreground">{selectedStage.name}</p>
                            <span className="text-xs capitalize text-muted-foreground">· {selectedStage.status}</span>
                        </div>
                        <p className="mt-0.5 text-xl font-bold text-foreground">{selectedStage.value}</p>
                        <p className="text-xs text-muted-foreground">{selectedStage.detail}</p>
                    </div>
                    <button
                        onClick={() => setSelected(null)}
                        className="shrink-0 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                        aria-label="Close stage detail"
                    >
                        Close
                    </button>
                </div>
            ) : (
                <p className="pointer-events-none absolute bottom-3 left-3 text-xs text-muted-foreground">
                    Drag to orbit · click a tank to inspect
                </p>
            )}
        </div>
    );
}
