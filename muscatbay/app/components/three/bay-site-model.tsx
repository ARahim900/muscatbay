"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
    BoxGeometry,
    CanvasTexture,
    Color,
    DirectionalLight,
    Group,
    HemisphereLight,
    Mesh,
    MeshStandardMaterial,
    type Object3D,
    PerspectiveCamera,
    PlaneGeometry,
    Raycaster,
    Scene,
    Sprite,
    SpriteMaterial,
    Vector2,
    WebGLRenderer,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";
import type { StatItem } from "@/components/shared/stats-grid";
import { prefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * Live Site Model — the dashboard's interactive 3D centerpiece.
 *
 * A stylized model of the Muscat Bay site sitting in the teal bay: each utility
 * system is a "district" block whose status colour is derived from the same
 * cross-module KPIs the command deck shows. Calm by default — only districts in
 * warning/alarm carry colour and a soft beacon pulse. Hover lifts a district and
 * surfaces its reading; clicking opens that module.
 *
 * Discipline matches the other three/ components: brand tokens only (no hex),
 * reduced-motion aware, paused off-screen, theme-reactive, fully disposed on
 * unmount, with a graceful, still-clickable non-WebGL fallback.
 */

type Status = "normal" | "warning" | "danger";

interface District {
    id: string;
    name: string;
    value: string;
    href?: string;
    status: Status;
    icon: LucideIcon;
    trend?: "up" | "down" | "neutral";
    trendValue?: string;
}

interface BaySiteModelProps {
    stats: StatItem[];
    className?: string;
}

interface Palette {
    teal: string;
    primary: string;
    sidebar: string;
    block: string;
    text: string;
    card: string;
    normal: string;
    warning: string;
    danger: string;
}

function readPalette(): Palette {
    const cs = getComputedStyle(document.documentElement);
    const get = (token: string, fallback: string) => cs.getPropertyValue(token).trim() || fallback;
    return {
        teal: get("--secondary", "#A1D1D5"),
        primary: get("--primary", "#4E4456"),
        sidebar: get("--sidebar", "#2a2533"),
        block: get("--mb-primary-light", "#6B5F73"),
        text: get("--foreground", "#e7e7ea"),
        card: get("--card", "#16141B"),
        normal: get("--status-normal", "#22c55e"),
        warning: get("--status-warning", "#f59e0b"),
        danger: get("--status-danger", "#ef4444"),
    };
}

function statusColor(p: Palette, s: Status): string {
    return s === "danger" ? p.danger : s === "warning" ? p.warning : p.teal;
}

function hexToRgba(hex: string, alpha: number): string {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
    if (!m) return hex;
    const n = parseInt(m[1], 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

const NAME_MAP: [string, string][] = [
    ["WATER", "Water"],
    ["ELECTRIC", "Electricity"],
    ["TSE", "TSE"],
    ["STP", "STP"],
    ["ECONOMIC", "Economic"],
    ["ASSET", "Assets"],
    ["CONTRACTOR", "Contractors"],
    ["HVAC", "HVAC"],
    ["PEST", "Pest"],
    ["FIRE", "Fire"],
];

function shortName(label: string): string {
    const u = label.toUpperCase();
    for (const [key, name] of NAME_MAP) if (u.includes(key)) return name;
    const w = label.split(" ")[0];
    return w.charAt(0) + w.slice(1).toLowerCase();
}

/** Derive a district (incl. status) from each KPI, mirroring the deck's trend logic. */
function deriveDistricts(stats: StatItem[]): District[] {
    return stats.map((stat, i) => {
        const isBad =
            stat.trend === "neutral" || !stat.trend
                ? false
                : stat.invertTrend
                  ? stat.trend === "up"
                  : stat.trend === "down";
        const status: Status = stat.variant === "danger" ? "danger" : isBad ? "warning" : "normal";
        return {
            id: `${stat.label}-${i}`,
            name: shortName(stat.label),
            value: stat.value,
            href: stat.href,
            status,
            icon: stat.icon,
            trend: stat.trend,
            trendValue: stat.trendValue,
        };
    });
}

/** Footprint grid positions, centered on the origin. */
function gridPositions(n: number, spacing: number): [number, number][] {
    const cols = Math.max(1, Math.ceil(Math.sqrt(n)));
    const rows = Math.ceil(n / cols);
    const out: [number, number][] = [];
    for (let i = 0; i < n; i++) {
        const c = i % cols;
        const r = Math.floor(i / cols);
        out.push([(c - (cols - 1) / 2) * spacing, (r - (rows - 1) / 2) * spacing]);
    }
    return out;
}

interface BlockObj {
    group: Group;
    baseMat: MeshStandardMaterial;
    capMat: MeshStandardMaterial;
    beacon: Mesh;
    beaconMat: MeshStandardMaterial;
    canvas: HTMLCanvasElement;
    texture: CanvasTexture;
    baseY: number;
    status: Status;
}

export default function BaySiteModel({ stats, className }: BaySiteModelProps) {
    const hostRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const [hovered, setHovered] = useState<string | null>(null);
    const [webglFailed] = useState(() => {
        if (typeof document === "undefined") return false;
        try {
            const c = document.createElement("canvas");
            return !(c.getContext("webgl2") || c.getContext("webgl"));
        } catch {
            return true;
        }
    });

    const districts = useMemo(() => deriveDistricts(stats), [stats]);
    const districtsRef = useRef(districts);
    const applyRef = useRef<((d: District[]) => void) | null>(null);
    const hoverRef = useRef<string | null>(null);

    // Navigation handler kept in a ref so the build effect never depends on router.
    const navRef = useRef<(href: string) => void>(() => {});
    useEffect(() => {
        navRef.current = (href: string) => router.push(href);
    }, [router]);

    // Mirror hover into a ref the render loop can read (no ref writes during render).
    useEffect(() => {
        hoverRef.current = hovered;
    }, [hovered]);

    const districtCount = districts.length;

    useEffect(() => {
        const host = hostRef.current;
        if (!host || districtCount === 0) return;

        let palette = readPalette();
        const reduce = prefersReducedMotion();

        let renderer: WebGLRenderer;
        try {
            renderer = new WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
        } catch {
            return; // fallback chips render instead
        }

        const disposables: { dispose: () => void }[] = [];
        const track = <T extends { dispose: () => void }>(o: T): T => {
            disposables.push(o);
            return o;
        };

        const dpr = () => Math.min(window.devicePixelRatio || 1, 2);
        renderer.setPixelRatio(dpr());
        renderer.setClearColor(0x000000, 0);
        const el = renderer.domElement;
        el.style.position = "absolute";
        el.style.inset = "0";
        el.style.width = "100%";
        el.style.height = "100%";
        host.appendChild(el);

        const scene = new Scene();
        const data = districtsRef.current;
        const positions = gridPositions(data.length, 2.6);
        const extentX = Math.max(...positions.map((p) => Math.abs(p[0]))) + 2;
        const extentZ = Math.max(...positions.map((p) => Math.abs(p[1]))) + 2;
        const radius = Math.hypot(extentX, extentZ);

        const camera = new PerspectiveCamera(40, 1, 0.1, 100);
        camera.position.set(radius * 0.9, radius * 1.0, radius * 1.25);

        scene.add(new HemisphereLight(new Color(palette.teal), new Color("#0a090c"), 0.55));
        const keyLight = new DirectionalLight(0xffffff, 0.85);
        keyLight.position.set(6, 10, 6);
        scene.add(keyLight);
        const rimLight = new DirectionalLight(new Color(palette.teal), 0.3);
        rimLight.position.set(-8, 3, -5);
        scene.add(rimLight);

        // The bay — a gently waving teal plane the site sits in.
        const waterGeo = track(new PlaneGeometry(extentX * 2 + 6, extentZ * 2 + 6, 24, 24));
        waterGeo.rotateX(-Math.PI / 2);
        const waterMat = track(
            new MeshStandardMaterial({
                color: new Color(palette.teal),
                transparent: true,
                opacity: 0.32,
                roughness: 0.4,
                metalness: 0.1,
            })
        );
        const water = new Mesh(waterGeo, waterMat);
        water.position.y = -0.35;
        scene.add(water);
        const waterPos = waterGeo.attributes.position;
        const waterBaseX = Float32Array.from({ length: waterPos.count }, (_, i) => waterPos.getX(i));
        const waterBaseZ = Float32Array.from({ length: waterPos.count }, (_, i) => waterPos.getZ(i));

        // Site platform.
        const padMat = track(new MeshStandardMaterial({ color: new Color(palette.sidebar), roughness: 0.9 }));
        const pad = new Mesh(track(new BoxGeometry(extentX * 2, 0.3, extentZ * 2)), padMat);
        pad.position.y = -0.15;
        scene.add(pad);

        function paintLabel(b: BlockObj, name: string, value: string, accent: string) {
            const c = b.canvas;
            const x = c.getContext("2d");
            if (!x) return;
            x.clearRect(0, 0, c.width, c.height);
            const rr = (a: number, bb: number, w: number, h: number, r: number) => {
                x.beginPath();
                x.moveTo(a + r, bb);
                x.arcTo(a + w, bb, a + w, bb + h, r);
                x.arcTo(a + w, bb + h, a, bb + h, r);
                x.arcTo(a, bb + h, a, bb, r);
                x.arcTo(a, bb, a + w, bb, r);
                x.closePath();
            };
            x.fillStyle = hexToRgba(palette.card, 0.9);
            rr(8, 8, c.width - 16, c.height - 16, 20);
            x.fill();
            x.lineWidth = 4;
            x.strokeStyle = accent;
            rr(8, 8, c.width - 16, c.height - 16, 20);
            x.stroke();
            x.textAlign = "center";
            x.fillStyle = palette.text;
            x.font = "600 30px Inter, system-ui, sans-serif";
            x.fillText(name, c.width / 2, 58);
            x.font = "700 38px Inter, system-ui, sans-serif";
            x.fillText(value, c.width / 2, 108);
            b.texture.needsUpdate = true;
        }

        // District blocks
        const blocks: BlockObj[] = [];
        data.forEach((d, i) => {
            const [px, pz] = positions[i];
            const group = new Group();
            group.position.set(px, 0, pz);
            group.userData = { districtId: d.id, href: d.href };

            const h = 1.0 + (i % 3) * 0.28;
            const baseMat = track(new MeshStandardMaterial({ color: new Color(palette.block), roughness: 0.55, metalness: 0.05 }));
            const base = new Mesh(track(new BoxGeometry(1.4, h, 1.4)), baseMat);
            base.position.y = h / 2;
            group.add(base);

            const capMat = track(new MeshStandardMaterial({ color: new Color(palette.teal), emissive: new Color(palette.teal), emissiveIntensity: 0.25, roughness: 0.4 }));
            const cap = new Mesh(track(new BoxGeometry(1.46, 0.12, 1.46)), capMat);
            cap.position.y = h + 0.06;
            group.add(cap);

            // Alarm beacon — invisible until a district earns it.
            const beaconMat = track(new MeshStandardMaterial({ color: new Color(palette.warning), emissive: new Color(palette.warning), emissiveIntensity: 0.8, transparent: true, opacity: 0 }));
            const beacon = new Mesh(track(new BoxGeometry(0.12, 1.6, 0.12)), beaconMat);
            beacon.position.y = h + 0.9;
            group.add(beacon);

            const canvas = document.createElement("canvas");
            canvas.width = 320;
            canvas.height = 140;
            const texture = track(new CanvasTexture(canvas));
            texture.anisotropy = 4;
            const spriteMat = track(new SpriteMaterial({ map: texture, transparent: true, depthTest: false }));
            const sprite = new Sprite(spriteMat);
            sprite.scale.set(2.0, 0.875, 1);
            sprite.position.set(0, h + 1.5, 0);
            sprite.renderOrder = 10;
            group.add(sprite);

            scene.add(group);
            blocks.push({ group, baseMat, capMat, beacon, beaconMat, canvas, texture, baseY: 0, status: "normal" });
        });

        const applyDistricts = (list: District[]) => {
            list.forEach((d, i) => {
                const b = blocks[i];
                if (!b) return;
                b.status = d.status;
                const accent = statusColor(palette, d.status);
                b.capMat.color.set(accent);
                b.capMat.emissive.set(accent);
                b.beaconMat.color.set(accent);
                b.beaconMat.emissive.set(accent);
                b.beaconMat.opacity = d.status === "normal" ? 0 : 0.6;
                paintLabel(b, d.name, d.value, accent);
            });
            renderOnce();
        };
        applyRef.current = applyDistricts;

        // Interaction
        const raycaster = new Raycaster();
        const pointer = new Vector2();
        const pickables = blocks.map((b) => b.group);
        const pick = (e: PointerEvent): { id: string | null; href?: string } => {
            const rect = el.getBoundingClientRect();
            pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
            raycaster.setFromCamera(pointer, camera);
            const hits = raycaster.intersectObjects(pickables, true);
            if (hits.length === 0) return { id: null };
            let o: Object3D | null = hits[0].object;
            while (o && !(o.userData as { districtId?: string }).districtId) o = o.parent;
            const ud = (o?.userData ?? {}) as { districtId?: string; href?: string };
            return { id: ud.districtId ?? null, href: ud.href };
        };
        const onMove = (e: PointerEvent) => {
            const { id } = pick(e);
            if (id !== hoverRef.current) setHovered(id);
            el.style.cursor = id ? "pointer" : "grab";
        };
        const onDown = (e: PointerEvent) => {
            const { href } = pick(e);
            if (href) navRef.current(href);
        };
        el.addEventListener("pointermove", onMove);
        el.addEventListener("pointerdown", onDown);
        el.addEventListener("pointerleave", () => setHovered(null));

        const controls = new OrbitControls(camera, el);
        controls.target.set(0, 0.6, 0);
        controls.enablePan = false;
        controls.minDistance = radius * 0.8;
        controls.maxDistance = radius * 2.2;
        controls.minPolarAngle = 0.45;
        controls.maxPolarAngle = 1.35;
        controls.enableDamping = !reduce;
        controls.autoRotate = !reduce;
        controls.autoRotateSpeed = 0.45;
        controls.addEventListener("start", () => {
            controls.autoRotate = false;
        });

        const renderOnce = () => renderer.render(scene, camera);

        const resize = () => {
            const w = host.clientWidth;
            const hgt = host.clientHeight;
            if (w === 0 || hgt === 0) return;
            renderer.setPixelRatio(dpr());
            renderer.setSize(w, hgt, false);
            camera.aspect = w / hgt;
            camera.updateProjectionMatrix();
            renderOnce();
        };
        resize();
        const resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(host);

        applyDistricts(districtsRef.current);

        let elapsed = 0;
        let running = false;
        const tick = () => {
            elapsed += 0.016;
            // Bay ripple
            for (let i = 0; i < waterPos.count; i++) {
                const bx = waterBaseX[i];
                const bz = waterBaseZ[i];
                waterPos.setY(i, Math.sin(bx * 0.35 + elapsed) * 0.08 + Math.cos(bz * 0.4 - elapsed * 0.8) * 0.06);
            }
            waterPos.needsUpdate = true;

            blocks.forEach((b, idx) => {
                const isHover = hoverRef.current === districtsRef.current[idx]?.id;
                const targetY = isHover ? 0.18 : 0;
                b.group.position.y += (targetY - b.group.position.y) * 0.15;
                b.baseMat.emissiveIntensity = isHover ? 0.18 : 0;
                if (isHover) b.baseMat.emissive.set(palette.teal);
                if (b.status !== "normal") {
                    const pulse = 0.5 + Math.sin(elapsed * 3) * 0.35;
                    b.beaconMat.emissiveIntensity = pulse;
                    b.capMat.emissiveIntensity = 0.3 + Math.sin(elapsed * 3) * 0.2;
                } else {
                    b.capMat.emissiveIntensity = 0.22;
                }
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

        const applyTheme = () => {
            palette = readPalette();
            padMat.color.set(palette.sidebar);
            waterMat.color.set(palette.teal);
            rimLight.color.set(palette.teal);
            blocks.forEach((b) => b.baseMat.color.set(palette.block));
            applyDistricts(districtsRef.current);
        };
        const themeObserver = new MutationObserver(applyTheme);
        themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme", "style"] });

        const onContextLost = (e: Event) => {
            e.preventDefault();
            stop();
        };
        const onContextRestored = () => (reduce ? renderOnce() : start());
        el.addEventListener("webglcontextlost", onContextLost);
        el.addEventListener("webglcontextrestored", onContextRestored);

        return () => {
            stop();
            applyRef.current = null;
            visibility.disconnect();
            resizeObserver.disconnect();
            themeObserver.disconnect();
            controls.removeEventListener("change", renderOnce);
            el.removeEventListener("pointermove", onMove);
            el.removeEventListener("pointerdown", onDown);
            el.removeEventListener("webglcontextlost", onContextLost);
            el.removeEventListener("webglcontextrestored", onContextRestored);
            controls.dispose();
            disposables.forEach((d) => d.dispose());
            renderer.dispose();
            el.remove();
        };
    }, [districtCount]);

    // Push live data into the running scene without rebuilding.
    useEffect(() => {
        districtsRef.current = districts;
        applyRef.current?.(districts);
    }, [districts]);

    const hoveredDistrict = hovered ? districts.find((d) => d.id === hovered) ?? null : null;

    if (webglFailed) {
        return (
            <div className={cn("grid grid-cols-2 gap-2 sm:grid-cols-3", className)}>
                {districts.map((d) => {
                    const inner = (
                        <>
                            <span className="size-2 rounded-full" style={{ background: `var(--status-${d.status === "normal" ? "normal" : d.status})` }} aria-hidden />
                            <d.icon className="h-3.5 w-3.5 text-white/70" aria-hidden />
                            <span className="truncate text-xs font-medium text-white/90">{d.name}</span>
                        </>
                    );
                    return d.href ? (
                        <a key={d.id} href={d.href} className="flex items-center gap-1.5 rounded-md bg-white/5 px-2 py-1.5 hover:bg-white/10">
                            {inner}
                        </a>
                    ) : (
                        <div key={d.id} className="flex items-center gap-1.5 rounded-md bg-white/5 px-2 py-1.5">
                            {inner}
                        </div>
                    );
                })}
            </div>
        );
    }

    return (
        <div className={cn("relative", className)}>
            <div
                ref={hostRef}
                className="relative h-[300px] w-full overflow-hidden rounded-lg sm:h-[400px] lg:h-[440px]"
                aria-hidden="true"
            />

            {/* Legend — status paired with a label, never colour alone. */}
            <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-white/65">
                {(["normal", "warning", "danger"] as Status[]).map((s) => (
                    <span key={s} className="flex items-center gap-1.5">
                        <span className="size-2 rounded-full" style={{ background: s === "normal" ? "var(--secondary)" : `var(--status-${s})` }} aria-hidden />
                        <span className="capitalize">{s === "normal" ? "nominal" : s}</span>
                    </span>
                ))}
            </div>

            {/* Hovered district detail. */}
            {hoveredDistrict ? (
                <div className="pointer-events-none absolute right-3 top-3 min-w-[150px] rounded-lg border border-white/15 bg-black/40 px-3 py-2 backdrop-blur">
                    <div className="flex items-center gap-1.5">
                        <hoveredDistrict.icon className="h-3.5 w-3.5 text-white/80" aria-hidden />
                        <p className="text-xs font-semibold text-white">{hoveredDistrict.name}</p>
                    </div>
                    <p className="mt-0.5 text-lg font-bold tabular-nums text-white">{hoveredDistrict.value}</p>
                    {hoveredDistrict.href && (
                        <p className="flex items-center gap-0.5 text-[11px] text-white/60">
                            Open module <ArrowUpRight className="h-3 w-3" />
                        </p>
                    )}
                </div>
            ) : (
                <p className="pointer-events-none absolute bottom-3 left-3 text-xs text-white/55">
                    Drag to orbit · click a district to open its module
                </p>
            )}

            {/* Keyboard/screen-reader path to the same destinations. */}
            <ul className="sr-only">
                {districts.map((d) =>
                    d.href ? (
                        <li key={d.id}>
                            <a href={d.href}>{`${d.name}: ${d.value}, status ${d.status}`}</a>
                        </li>
                    ) : null
                )}
            </ul>
        </div>
    );
}
