"use client";

import { useEffect, useRef } from "react";
import {
    AdditiveBlending,
    BufferAttribute,
    BufferGeometry,
    Color,
    PerspectiveCamera,
    Points,
    Scene,
    ShaderMaterial,
    WebGLRenderer,
} from "three";
import { prefersReducedMotion } from "@/lib/motion";

interface AmbientBayProps {
    /** "subtle" for in-app surfaces (dashboard hero), "bold" for the login backdrop */
    intensity?: "subtle" | "bold";
    className?: string;
}

// Grid resolution of the water field — ~8k points renders in well under 1ms
// of GPU time on integrated graphics.
const COLS = 150;
const ROWS = 54;

const VERTEX_SHADER = /* glsl */ `
    uniform float uTime;
    uniform float uPixelRatio;
    uniform float uPointScale;
    attribute float aRand;
    varying float vElev;
    varying float vFade;

    void main() {
        vec3 p = position;
        float t = uTime * 0.45;

        // Three long swells + one fine ripple = believable calm water
        float w1 = sin(p.x * 0.85 + t * 1.15) * 0.16;
        float w2 = sin(p.x * 0.42 + p.z * 1.35 + t * 0.75) * 0.19;
        float w3 = cos(p.z * 2.05 - p.x * 0.32 - t * 1.55) * 0.07;
        float w4 = sin(p.x * 3.6 + p.z * 2.8 + t * 2.1 + aRand * 6.2831) * 0.028;
        p.y += w1 + w2 + w3 + w4;

        vElev = (w1 + w2 + w3) / 0.42;

        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = (uPointScale * uPixelRatio) / -mv.z * (0.7 + 0.6 * aRand);

        // Dissolve toward the edges so the field never shows a hard boundary
        float fx = 1.0 - smoothstep(4.8, 7.4, abs(position.x));
        float fz = 1.0 - smoothstep(1.6, 3.3, abs(position.z + 0.6));
        vFade = fx * fz;
    }
`;

const FRAGMENT_SHADER = /* glsl */ `
    precision mediump float;
    uniform vec3 uColorA;
    uniform vec3 uColorB;
    uniform float uOpacity;
    varying float vElev;
    varying float vFade;

    void main() {
        float d = length(gl_PointCoord - 0.5);
        float disc = smoothstep(0.5, 0.16, d);
        vec3 col = mix(uColorB, uColorA, clamp(vElev * 0.5 + 0.55, 0.0, 1.0));
        float crest = 0.55 + 0.45 * clamp(vElev, 0.0, 1.0);
        float a = disc * vFade * uOpacity * crest;
        if (a < 0.004) discard;
        gl_FragColor = vec4(col, a);
    }
`;

/** Read a CSS custom property as a THREE color; returns null when unresolvable. */
function readTokenColor(token: string): Color | null {
    const raw = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
    if (!raw) return null;
    try {
        return new Color(raw);
    } catch {
        return null;
    }
}

/**
 * The "bay" — a calm, slowly breathing field of light points, shaped like
 * water seen from the shore. It sits behind brand-purple chrome (dashboard
 * hero band, login panel) and exists to give the operations brand literal
 * depth, not to decorate: teal crests = the brand accent, the swell = the bay
 * every one of these utility systems serves.
 *
 * Discipline: lazy-mounted by next/dynamic, DPR-capped, paused off-screen,
 * single static frame under prefers-reduced-motion, fully disposed on unmount,
 * and silently absent when WebGL is unavailable (the CSS gradient behind it
 * stands alone).
 */
export default function AmbientBay({ intensity = "subtle", className }: AmbientBayProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // Brand tokens only — the scene must restyle itself if the palette does.
        const teal = readTokenColor("--secondary");
        const lavender = readTokenColor("--mb-primary-light");
        if (!teal || !lavender) return;

        let renderer: WebGLRenderer;
        try {
            renderer = new WebGLRenderer({ alpha: true, antialias: false, powerPreference: "low-power" });
        } catch {
            return; // No WebGL — the gradient backdrop carries the design alone
        }

        const reduceMotion = prefersReducedMotion();
        const bold = intensity === "bold";

        const dpr = () => Math.min(window.devicePixelRatio || 1, 1.75);
        renderer.setPixelRatio(dpr());
        renderer.setClearColor(0x000000, 0);
        renderer.domElement.style.position = "absolute";
        renderer.domElement.style.inset = "0";
        renderer.domElement.style.width = "100%";
        renderer.domElement.style.height = "100%";
        container.appendChild(renderer.domElement);

        const scene = new Scene();
        const camera = new PerspectiveCamera(55, 1, 0.1, 50);
        const baseCam = { x: 0, y: 1.15, z: 4.4 };
        camera.position.set(baseCam.x, baseCam.y, baseCam.z);
        camera.lookAt(0, 0, -0.6);

        const count = COLS * ROWS;
        const positions = new Float32Array(count * 3);
        const rand = new Float32Array(count);
        let i = 0;
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                positions[i * 3] = (c / (COLS - 1) - 0.5) * 15;
                positions[i * 3 + 1] = 0;
                positions[i * 3 + 2] = (r / (ROWS - 1) - 0.5) * 5.6;
                rand[i] = Math.random();
                i++;
            }
        }
        const geometry = new BufferGeometry();
        geometry.setAttribute("position", new BufferAttribute(positions, 3));
        geometry.setAttribute("aRand", new BufferAttribute(rand, 1));

        const material = new ShaderMaterial({
            vertexShader: VERTEX_SHADER,
            fragmentShader: FRAGMENT_SHADER,
            transparent: true,
            depthWrite: false,
            blending: AdditiveBlending,
            uniforms: {
                uTime: { value: 4.0 },
                uPixelRatio: { value: dpr() },
                uPointScale: { value: bold ? 30.0 : 24.0 },
                uColorA: { value: teal },
                uColorB: { value: lavender },
                uOpacity: { value: bold ? 0.55 : 0.35 },
            },
        });

        const points = new Points(geometry, material);
        scene.add(points);

        const resize = () => {
            const { width, height } = container.getBoundingClientRect();
            if (width === 0 || height === 0) return;
            renderer.setPixelRatio(dpr());
            material.uniforms.uPixelRatio.value = dpr();
            renderer.setSize(width, height, false);
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            if (reduceMotion) renderer.render(scene, camera);
        };
        resize();

        const resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(container);

        // Reduced motion: one beautiful still of the bay, zero ongoing work.
        if (reduceMotion) {
            renderer.render(scene, camera);
            return () => {
                resizeObserver.disconnect();
                geometry.dispose();
                material.dispose();
                renderer.dispose();
                renderer.domElement.remove();
            };
        }

        // Gentle parallax: the camera leans a few degrees toward the pointer.
        const pointerTarget = { x: 0, y: 0 };
        const hasHover = window.matchMedia("(hover: hover)").matches;
        const onPointerMove = (e: PointerEvent) => {
            pointerTarget.x = (e.clientX / window.innerWidth - 0.5) * 2;
            pointerTarget.y = (e.clientY / window.innerHeight - 0.5) * 2;
        };
        if (hasHover) window.addEventListener("pointermove", onPointerMove, { passive: true });

        let elapsed = 4.0;
        let last = performance.now();
        const tick = (now: number) => {
            const delta = Math.min((now - last) / 1000, 0.05);
            last = now;
            elapsed += delta;
            material.uniforms.uTime.value = elapsed;

            const damp = 1 - Math.exp(-3 * delta);
            camera.position.x += (pointerTarget.x * 0.35 - camera.position.x + baseCam.x) * damp;
            camera.position.y += (baseCam.y - pointerTarget.y * 0.12 - camera.position.y) * damp;
            camera.lookAt(0, 0, -0.6);

            renderer.render(scene, camera);
        };

        let running = false;
        const start = () => {
            if (running) return;
            running = true;
            last = performance.now();
            renderer.setAnimationLoop(tick);
        };
        const stop = () => {
            if (!running) return;
            running = false;
            renderer.setAnimationLoop(null);
        };

        // Only animate while the band is actually on screen.
        const visibility = new IntersectionObserver(
            (entries) => {
                if (entries.some((e) => e.isIntersecting)) start();
                else stop();
            },
            { threshold: 0.01 }
        );
        visibility.observe(container);

        const onContextLost = (e: Event) => {
            e.preventDefault();
            stop();
        };
        const onContextRestored = () => start();
        renderer.domElement.addEventListener("webglcontextlost", onContextLost);
        renderer.domElement.addEventListener("webglcontextrestored", onContextRestored);

        return () => {
            stop();
            visibility.disconnect();
            resizeObserver.disconnect();
            if (hasHover) window.removeEventListener("pointermove", onPointerMove);
            renderer.domElement.removeEventListener("webglcontextlost", onContextLost);
            renderer.domElement.removeEventListener("webglcontextrestored", onContextRestored);
            geometry.dispose();
            material.dispose();
            renderer.dispose();
            renderer.domElement.remove();
        };
    }, [intensity]);

    return <div ref={containerRef} className={className} aria-hidden="true" />;
}
