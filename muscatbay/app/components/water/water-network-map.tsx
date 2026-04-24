"use client";

/* eslint-disable @typescript-eslint/no-explicit-any --
 *   Cesium.js is loaded from CDN at runtime, not npm, so we don't pull in
 *   @types/cesium (~10 MB). Cesium primitives (Viewer, Cartesian3, Material…)
 *   are inherently untyped in this integration and must be `any`.
 */
/* eslint-disable no-restricted-syntax --
 *   Arbitrary hex colors (#4E4456, #00D2B3, #85B7EB, #EF9F27, #AFA9EC, #97C459,
 *   hologram canvas colours (#00D2B3 glows, rgba variants) are intentional
 *   3D visualization art-direction and must NOT be changed to brand tokens.
 */

/**
 * @fileoverview 3D Water Meter Network Map — Cesium + Google Photorealistic 3D Tiles
 *
 * A full-screen interactive map of every meter in the Muscat Bay network with
 *   • 6-level hierarchy (L1 / L2 / DC / L3 / L4 / IRR)
 *   • Animated flow along pipeline polylines
 *   • Zone polygons colored by water-loss %
 *   • Per-zone analytics (Bulk − Distributed = Loss / NRW)
 *   • Alerts for faulty meters and high-loss zones
 *   • Live read/write to Supabase (`water_meters` table)
 *
 * @module components/water/water-network-map
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import {
    Droplets, Plus, Search, Target, Trash2, X, AlertTriangle,
    Zap, Square, Wifi, WifiOff, ArrowLeft, Pencil, Layers, Database,
} from 'lucide-react';

import {
    fetchAllWaterMeters,
    upsertWaterMeter,
    deleteWaterMeter,
    type WaterMeterRow,
    type WaterMeterType,
    type WaterMeterStatus,
} from '@/lib/water-meters-db';
import { isSupabaseConfigured } from '@/functions/supabase-client';
import {
    ZONES, PIPELINES, INFRA_POINTS, SEED_METERS,
    pipeColor, pipeWidth, infraMeta,
} from '@/lib/water-network-data';

// ────────────────────────────────────────────────────────────────────────────
// Config
// ────────────────────────────────────────────────────────────────────────────

const CESIUM_ION_TOKEN = process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN
    || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJkMWVjMmNkNC0xODFhLTRlMzYtOWU5Mi01YTQwODBjNmVlNWQiLCJpZCI6NDIxMzk5LCJpYXQiOjE3NzY4NjUyNTR9.apuRZjGpIGP9jXSZaa6tZnt9W49zpxocQZkTvlMq1PU';

// Set NEXT_PUBLIC_GOOGLE_MAPS_KEY in Vercel/env to enable Google Photorealistic
// 3D Tiles. Key must have "Map Tiles API" enabled in Google Cloud Console with
// billing active. Without it the map falls back to Bing satellite.
const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? '';

const LOSS_WARN_PCT  = 10;
const LOSS_ALERT_PCT = 20;

const DEFAULT_VIEW = { lon: 58.5510, lat: 23.5995, alt: 1800 };

// ────────────────────────────────────────────────────────────────────────────
// Type hierarchy — size + Muscat Bay palette per level
// ────────────────────────────────────────────────────────────────────────────

interface TypeMeta {
    level:   string;
    label:   string;
    short:   string;
    size:    number;      // pin diameter in px
    color:   string;      // hex
    parents: WaterMeterType[];
}

const TYPE_META: Record<WaterMeterType, TypeMeta> = {
    l1:  { level: 'L1',  label: 'Main Bulk (Source)',     short: 'L1',  size: 40, color: '#4E4456', parents: [] },
    l2:  { level: 'L2',  label: 'Zone Bulk',              short: 'L2',  size: 34, color: '#A1D1D5', parents: ['l1'] },
    dc:  { level: 'DC',  label: 'Direct Connection',      short: 'DC',  size: 32, color: '#EF9F27', parents: ['l1'] },
    l3:  { level: 'L3',  label: 'L3 Property',            short: 'L3',  size: 26, color: '#85B7EB', parents: ['l2', 'dc'] },
    l4:  { level: 'L4',  label: 'L4 Apartment / Common',  short: 'L4',  size: 20, color: '#AFA9EC', parents: ['l3'] },
    irr: { level: 'IRR', label: 'Irrigation Tank',        short: 'IRR', size: 28, color: '#97C459', parents: ['l2', 'dc', 'l1'] },
};

// ────────────────────────────────────────────────────────────────────────────
// Runtime meter shape — DB row + Cesium handles (handles are non-serialisable)
// ────────────────────────────────────────────────────────────────────────────

interface MeterRuntime extends WaterMeterRow {
    _billboard?: unknown;
    _label?:     unknown;
    _cylinder?:  unknown;
    _beam?:      unknown;
    _halo?:      unknown;
    _canvas?:    HTMLCanvasElement;
}

type TabKey     = 'meters' | 'analytics' | 'alerts';
type FilterKey  = 'all' | 'working' | 'faulty' | WaterMeterType;

// ────────────────────────────────────────────────────────────────────────────
// Cesium ambient type — we load Cesium.js from CDN, not npm
// ────────────────────────────────────────────────────────────────────────────

declare global {
    interface Window {
        // Cesium is loaded from CDN at runtime — typed loosely on purpose so
        // we don't need the 10 MB @types/cesium package.
        Cesium?: Record<string, unknown> & {
            Ion: { defaultAccessToken: string };
            Viewer: new (el: HTMLElement, opts: Record<string, unknown>) => unknown;
        };
    }
}

// ════════════════════════════════════════════════════════════════════════════
// HOLOGRAPHIC DATA CYLINDER  (canvas HUD billboard + Cesium 3-D entities)
// Each meter renders as a polished chrome bollard with a translucent
// holographic projection above it: flow-rate readout, bar chart, status LED.
// ════════════════════════════════════════════════════════════════════════════

const HOLOGRAM_W      = 200;
const HOLOGRAM_H      = 178;
const CYLINDER_HEIGHT = 1.8;   // physical bollard height (metres)
const BEAM_TOP        = 11.0;  // hologram billboard elevation above ground (metres)

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);          ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y,     x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h,     x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y,         x + r, y);
    ctx.closePath();
}

function buildHologramCanvas(meter: WaterMeterRow, scanY: number, existing?: HTMLCanvasElement): HTMLCanvasElement {
    const meta = TYPE_META[meter.type] ?? TYPE_META.l3;
    const W = HOLOGRAM_W, H = HOLOGRAM_H;
    const DPR = Math.min(window.devicePixelRatio || 2, 2);

    const canvas = existing ?? document.createElement('canvas');
    if (!existing) { canvas.width = W * DPR; canvas.height = H * DPR; }
    const ctx = canvas.getContext('2d')!;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, W, H);

    // ── Panel background ─────────────────────────────────────────────────────
    roundRect(ctx, 4, 4, W - 8, H - 8, 9);
    ctx.fillStyle = 'rgba(2, 10, 26, 0.78)';
    ctx.fill();

    const panelGrad = ctx.createLinearGradient(0, 0, W, H);
    panelGrad.addColorStop(0, 'rgba(0, 90, 160, 0.22)');
    panelGrad.addColorStop(1, 'rgba(0, 20, 55, 0.04)');
    roundRect(ctx, 4, 4, W - 8, H - 8, 9);
    ctx.fillStyle = panelGrad; ctx.fill();

    // ── Subtle holographic grid ───────────────────────────────────────────────
    ctx.strokeStyle = 'rgba(0, 190, 230, 0.055)';
    ctx.lineWidth   = 0.5;
    for (let gx = 16; gx < W - 4; gx += 18) {
        ctx.beginPath(); ctx.moveTo(gx, 8); ctx.lineTo(gx, H - 8); ctx.stroke();
    }
    for (let gy = 20; gy < H - 4; gy += 14) {
        ctx.beginPath(); ctx.moveTo(8, gy); ctx.lineTo(W - 8, gy); ctx.stroke();
    }

    // ── Corner bracket accents (holographic frame) ────────────────────────────
    const cL = 12, cP = 7;
    ctx.strokeStyle = 'rgba(0, 210, 179, 0.95)';
    ctx.lineWidth   = 1.6;
    ([ [cP, cP, 1, 1], [W - cP, cP, -1, 1], [cP, H - cP, 1, -1], [W - cP, H - cP, -1, -1] ] as [number, number, number, number][])
        .forEach(([ox, oy, dx, dy]) => {
            ctx.beginPath();
            ctx.moveTo(ox + dx * cL, oy); ctx.lineTo(ox, oy); ctx.lineTo(ox, oy + dy * cL);
            ctx.stroke();
        });

    // ── Panel border ─────────────────────────────────────────────────────────
    roundRect(ctx, 4, 4, W - 8, H - 8, 9);
    ctx.strokeStyle = 'rgba(0, 210, 179, 0.42)'; ctx.lineWidth = 1; ctx.stroke();

    // ── Type badge ────────────────────────────────────────────────────────────
    roundRect(ctx, 10, 11, 28, 16, 4);
    ctx.fillStyle = meta.color; ctx.fill();
    ctx.font = 'bold 8px "Segoe UI", monospace';
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillStyle = meta.color === '#4E4456' ? '#ffffff' : '#000000';
    ctx.fillText(meta.short, 14, 19.5);

    // ── Meter ID (truncated) ──────────────────────────────────────────────────
    const idTxt = meter.id.length > 14 ? meter.id.slice(0, 14) + '…' : meter.id;
    ctx.font = '8px "Segoe UI", monospace';
    ctx.fillStyle = 'rgba(161, 209, 213, 0.9)';
    ctx.textAlign = 'right';
    ctx.fillText(idTxt, W - 24, 19.5);

    // ── Status LED ────────────────────────────────────────────────────────────
    const isFaulty  = meter.status === 'faulty';
    const statusCol = isFaulty ? '#ff3555' : '#22c55e';
    ctx.shadowColor = statusCol; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(W - 13, 19, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = statusCol; ctx.fill();
    ctx.shadowBlur = 0;
    // LED highlight
    ctx.beginPath(); ctx.arc(W - 14.5, 17.5, 1.8, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.fill();

    // ── Separator ─────────────────────────────────────────────────────────────
    ctx.beginPath(); ctx.moveTo(10, 33); ctx.lineTo(W - 10, 33);
    ctx.strokeStyle = 'rgba(0, 210, 179, 0.22)'; ctx.lineWidth = 0.5; ctx.stroke();

    // ── Consumption number (large, glowing cyan) ──────────────────────────────
    const cons    = meter.consumption ?? 0;
    const consStr = cons >= 10000 ? (cons / 1000).toFixed(1) + 'K'
                  : cons >= 1000  ? (cons / 1000).toFixed(2) + 'K'
                  : cons.toFixed(0);

    ctx.shadowColor = '#00D2B3'; ctx.shadowBlur = 18;
    ctx.font = 'bold 38px "Segoe UI", system-ui, monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#00e8d0';
    ctx.fillText(consStr, W / 2, 70);
    ctx.shadowBlur = 0;

    // "m³" unit suffix
    ctx.font = 'bold 11px "Segoe UI", monospace';
    ctx.fillStyle = 'rgba(161, 209, 213, 0.72)';
    ctx.textAlign = 'right';
    ctx.fillText('m³', W - 10, 86);

    // "FLOW RATE" sub-label
    ctx.font = '7px "Segoe UI", monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.textAlign = 'center';
    ctx.fillText('CONSUMPTION', W / 2, 97);

    // ── Mini bar chart (6-month simulated trend) ───────────────────────────────
    const BAR_N = 6, BW = 17, BG = 5;
    const bLeft  = (W - (BW * BAR_N + BG * (BAR_N - 1))) / 2;
    const bBot   = H - 20;
    const bMaxH  = 28;

    // Seeded pseudo-random bar heights from meter ID
    let seed = 0;
    for (let i = 0; i < meter.id.length; i++) seed = ((seed * 31) + meter.id.charCodeAt(i)) >>> 0;
    const bHts = Array.from({ length: BAR_N }, (_, i) => {
        const s = (seed * (i + 1) * 1664525 + 1013904223) >>> 0;
        return 0.22 + (s % 1000) / 1000 * 0.78;
    });
    bHts[BAR_N - 1] = Math.max(...bHts); // current period = tallest

    for (let i = 0; i < BAR_N; i++) {
        const bx   = bLeft + i * (BW + BG);
        const bh   = bMaxH * bHts[i];
        const by   = bBot - bh;
        const isNow = i === BAR_N - 1;
        const grad  = ctx.createLinearGradient(bx, by, bx, bBot);
        grad.addColorStop(0, isNow ? 'rgba(0,210,179,0.95)' : 'rgba(0,155,215,0.58)');
        grad.addColorStop(1, 'rgba(0,60,110,0.15)');
        ctx.fillStyle = grad;
        roundRect(ctx, bx, by, BW, bh, 2);
        ctx.fill();
        // Top glow cap on current bar
        if (isNow) {
            ctx.shadowColor = '#00D2B3'; ctx.shadowBlur = 6;
            ctx.fillStyle = 'rgba(0,220,190,0.9)';
            roundRect(ctx, bx, by, BW, 2, 1); ctx.fill();
            ctx.shadowBlur = 0;
        }
    }

    ctx.font = '7px "Segoe UI", monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.20)';
    ctx.textAlign = 'left';
    ctx.fillText('6-MONTH TREND', bLeft, H - 10);
    ctx.textAlign = 'right';
    ctx.fillText('NOW', W - 10, H - 10);

    // ── Animated scan line ────────────────────────────────────────────────────
    const sy       = 10 + scanY * (H - 20);
    const scanGrad = ctx.createLinearGradient(0, sy - 2.5, 0, sy + 2.5);
    const scanAlpha = 0.28 + Math.abs(scanY - 0.5) * 0.12;
    scanGrad.addColorStop(0,   'rgba(0,220,190,0)');
    scanGrad.addColorStop(0.5, `rgba(0,220,190,${scanAlpha})`);
    scanGrad.addColorStop(1,   'rgba(0,220,190,0)');
    ctx.fillStyle = scanGrad;
    ctx.fillRect(8, sy - 2.5, W - 16, 5);

    return canvas;
}

// ════════════════════════════════════════════════════════════════════════════
// GEOMETRY HELPERS
// ════════════════════════════════════════════════════════════════════════════

function convexHull(pts: { x: number; y: number }[]): { x: number; y: number }[] {
    if (pts.length < 3) return pts.slice();
    const P = pts.slice().sort((a, b) => a.x === b.x ? a.y - b.y : a.x - b.x);
    type Pt = { x: number; y: number };
    const cross = (O: Pt, A: Pt, B: Pt) => (A.x - O.x) * (B.y - O.y) - (A.y - O.y) * (B.x - O.x);
    const lo: Pt[] = [];
    for (const p of P) {
        while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop();
        lo.push(p);
    }
    const up: Pt[] = [];
    for (let i = P.length - 1; i >= 0; i--) {
        const p = P[i];
        while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop();
        up.push(p);
    }
    lo.pop(); up.pop();
    return lo.concat(up);
}

function padHull(hull: { x: number; y: number }[], factor: number) {
    if (hull.length === 0) return hull;
    const cx = hull.reduce((s, p) => s + p.x, 0) / hull.length;
    const cy = hull.reduce((s, p) => s + p.y, 0) / hull.length;
    return hull.map(p => ({ x: cx + (p.x - cx) * factor, y: cy + (p.y - cy) * factor }));
}

// ════════════════════════════════════════════════════════════════════════════
// ANALYTICS  (consumption + loss per zone)
// ════════════════════════════════════════════════════════════════════════════

interface ZoneAnalytics {
    id: string; name: string; type: WaterMeterType;
    lat: number; lon: number;
    bulk: number; distributed: number; loss: number; lossPct: number;
    status: 'ok' | 'warn' | 'critical';
    childCount: number;
}

interface SystemAnalytics {
    zones:    ZoneAnalytics[];
    sysBulk:  number;
    sysDist:  number;
    sysLoss:  number;
    sysPct:   number;
}

function computeAnalytics(meters: Map<string, MeterRuntime>): SystemAnalytics {
    const zones: ZoneAnalytics[] = [];
    let sysBulk = 0, sysDist = 0;

    for (const m of meters.values()) if (m.type === 'l1') sysBulk += m.consumption ?? 0;

    for (const m of meters.values()) {
        if (m.type !== 'l2' && m.type !== 'dc') continue;
        const children = Array.from(meters.values()).filter(c => c.parent_id === m.id);
        const bulk = m.consumption ?? 0;
        const dist = children.reduce((s, c) => s + (c.consumption ?? 0), 0);
        const loss = Math.max(0, bulk - dist);
        const pct  = bulk > 0 ? (loss / bulk) * 100 : 0;

        const status: ZoneAnalytics['status'] =
            pct >= LOSS_ALERT_PCT ? 'critical' :
            pct >= LOSS_WARN_PCT  ? 'warn' : 'ok';

        zones.push({
            id: m.id, name: m.zone, type: m.type,
            lon: m.lon, lat: m.lat,
            bulk, distributed: dist, loss, lossPct: pct, status,
            childCount: children.length,
        });
        sysDist += dist;
    }

    zones.sort((a, b) => b.lossPct - a.lossPct);
    const sysLoss = Math.max(0, sysBulk - sysDist);
    const sysPct  = sysBulk > 0 ? (sysLoss / sysBulk) * 100 : 0;

    return { zones, sysBulk, sysDist, sysLoss, sysPct };
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default function WaterNetworkMap() {
    // ── UI state (triggers re-renders) ─────────────────────────────────────
    // Lazy init — if Cesium is already on window (HMR / re-mount), start ready
    const [cesiumReady, setCesiumReady]   = useState<boolean>(
        () => typeof window !== 'undefined' && !!(window as { Cesium?: unknown }).Cesium,
    );
    // Lazy init — evaluate isSupabaseConfigured() once on first render rather
    // than inside useEffect (which React 19 lints against as a cascading render)
    const [dbConfigured] = useState<boolean>(() => isSupabaseConfigured());
    const [meterCount,  setMeterCount]    = useState(0);
    const [workingCount,setWorkingCount]  = useState(0);
    const [selected,    setSelected]      = useState<MeterRuntime | null>(null);
    const [activeTab,   setActiveTab]     = useState<TabKey>('meters');
    const [filter,      setFilter]        = useState<FilterKey>('all');
    const [search,      setSearch]        = useState('');
    const [pipelinesOn, setPipelinesOn]   = useState(true);
    const [zonesOn,     setZonesOn]       = useState(true);
    const [infraOn,     setInfraOn]       = useState(true);
    const [addMode,     setAddMode]       = useState(false);
    const [showModal,   setShowModal]     = useState(false);
    const [editingId,   setEditingId]     = useState<string | null>(null);   // edit mode target
    const [pendingCoords, setPendingCoords] = useState<{ lat: number; lon: number; height: number } | null>(null);
    const [analytics, setAnalytics]       = useState<SystemAnalytics>({ zones: [], sysBulk: 0, sysDist: 0, sysLoss: 0, sysPct: 0 });
    const [mapError,   setMapError]       = useState<string | null>(null);   // fatal — map not usable
    const [mapWarning, setMapWarning]     = useState<string | null>(null);   // soft — map works, feature degraded
    // Reactive snapshot of every meter for render-time reads. The ref below
    // stays authoritative for Cesium-callback lookups (synchronous access).
    const [metersList, setMetersList]     = useState<MeterRuntime[]>([]);

    // ── Cesium handles (refs — don't trigger re-renders) ───────────────────
    const containerRef       = useRef<HTMLDivElement | null>(null);
    const viewerRef          = useRef<any>(null);
    const billboardColRef    = useRef<any>(null);
    const labelColRef        = useRef<any>(null);
    const pipelineColRef     = useRef<any>(null);
    const pipelineMaterialsRef  = useRef<any[]>([]);
    const zoneEntitiesRef       = useRef<any[]>([]);
    const staticColRef          = useRef<any>(null);
    const staticZoneEntitiesRef = useRef<any[]>([]);
    const metersMapRef          = useRef<Map<string, MeterRuntime>>(new Map());
    const cylinderEntitiesRef   = useRef<Map<string, unknown>>(new Map());
    const beamEntitiesRef       = useRef<Map<string, unknown>>(new Map());
    const haloEntitiesRef       = useRef<Map<string, unknown>>(new Map());
    const frameCountRef         = useRef(0);
    const addModeRef         = useRef(false);
    const pipelinesVisibleRef = useRef(true);
    const zonesVisibleRef     = useRef(true);

    // Keep refs in sync with state for handlers that live outside React
    useEffect(() => { addModeRef.current = addMode; }, [addMode]);
    useEffect(() => { pipelinesVisibleRef.current = pipelinesOn; }, [pipelinesOn]);
    useEffect(() => { zonesVisibleRef.current = zonesOn; }, [zonesOn]);

    // ─────────────────────────────────────────────────────────────────────
    // Load Cesium from the same origin (/public/cesium/) — avoids CDN blocks,
    // ad-blockers, and CSP issues entirely. Files are vendored at build time.
    // ─────────────────────────────────────────────────────────────────────
    useEffect(() => {
        // Already available (HMR re-mount or second Strict Mode render)
        if ((window as { Cesium?: unknown }).Cesium) return;

        // Inject CSS once — served from same origin, no CSP concerns
        if (!document.getElementById('cesium-cdn-css')) {
            const css = document.createElement('link');
            css.id    = 'cesium-cdn-css';
            css.rel   = 'stylesheet';
            css.href  = '/cesium/Widgets/widgets.css';
            document.head.appendChild(css);
        }

        // Reuse an in-flight script tag if one already exists (Strict Mode double-invoke)
        const existing = document.getElementById('cesium-cdn-js') as HTMLScriptElement | null;
        if (existing) {
            const poll = window.setInterval(() => {
                if ((window as { Cesium?: unknown }).Cesium) {
                    window.clearInterval(poll);
                    setCesiumReady(true);
                }
            }, 100);
            window.setTimeout(() => window.clearInterval(poll), 15_000);
            return () => window.clearInterval(poll);
        }

        const script   = document.createElement('script');
        script.id      = 'cesium-cdn-js';
        script.src     = '/cesium/Cesium.js';
        script.async   = true;
        script.onload  = () => {
            if ((window as { Cesium?: unknown }).Cesium) setCesiumReady(true);
            else setMapError('Cesium loaded but window.Cesium was not set — check browser console for errors');
        };
        script.onerror = () => setMapError('Failed to load /public/cesium/Cesium.js — file may be missing from the deployment');
        document.head.appendChild(script);
    }, []);

    // ─────────────────────────────────────────────────────────────────────
    // Counter refresh
    // Auto-dismiss soft warnings after 7 s — map is still functional
    useEffect(() => {
        if (!mapWarning) return;
        const t = setTimeout(() => setMapWarning(null), 7000);
        return () => clearTimeout(t);
    }, [mapWarning]);

    // ─────────────────────────────────────────────────────────────────────
    const refreshCounts = useCallback(() => {
        const all = Array.from(metersMapRef.current.values());
        setMetersList(all);
        setMeterCount(all.length);
        setWorkingCount(all.filter(m => m.status === 'working').length);
        setAnalytics(computeAnalytics(metersMapRef.current));
    }, []);

    // ─────────────────────────────────────────────────────────────────────
    // ADD meter to Cesium — holographic data cylinder:
    //   • Chrome/glass bollard (cylinder entity)
    //   • Glowing projection beam (polyline entity)
    //   • Pulsing halo ring at ground level (ellipse entity)
    //   • Holographic HUD billboard (canvas with flow rate + bar chart)
    // ─────────────────────────────────────────────────────────────────────
    const addMeterToScene = useCallback((meter: WaterMeterRow) => {
        const Cesium = window.Cesium as any;
        const viewer = viewerRef.current;
        if (!Cesium || !billboardColRef.current || !viewer || metersMapRef.current.has(meter.id)) return;

        const ground = meter.height ?? 0;
        const meta   = TYPE_META[meter.type] ?? TYPE_META.l3;
        const SHOW_DIST = new Cesium.DistanceDisplayCondition(0, 500);

        // ── Physical chrome/glass bollard ─────────────────────────────────────
        const cylinder = viewer.entities.add({
            id:       'cyl_' + meter.id,
            position: Cesium.Cartesian3.fromDegrees(meter.lon, meter.lat, ground + CYLINDER_HEIGHT / 2),
            cylinder: {
                length:        CYLINDER_HEIGHT,
                topRadius:     0.10,
                bottomRadius:  0.14,
                material:      new Cesium.ColorMaterialProperty(
                    Cesium.Color.fromCssColorString('#D4E8F2').withAlpha(0.92),
                ),
                outline:       true,
                outlineColor:  new Cesium.ConstantProperty(
                    Cesium.Color.fromCssColorString('#A1D1D5').withAlpha(0.8),
                ),
                outlineWidth:  1,
                distanceDisplayCondition: SHOW_DIST,
            },
        });
        cylinderEntitiesRef.current.set(meter.id, cylinder);

        // ── Projection beam (glow polyline from bollard top → hologram) ─────────
        const beam = viewer.entities.add({
            id: 'beam_' + meter.id,
            polyline: {
                positions: [
                    Cesium.Cartesian3.fromDegrees(meter.lon, meter.lat, ground + CYLINDER_HEIGHT),
                    Cesium.Cartesian3.fromDegrees(meter.lon, meter.lat, ground + BEAM_TOP),
                ],
                width:    2.5,
                material: new Cesium.PolylineGlowMaterialProperty({
                    glowPower:  0.40,
                    taperPower: 0.65,
                    color:      Cesium.Color.fromCssColorString('#00D2B3').withAlpha(0.60),
                }),
                distanceDisplayCondition: SHOW_DIST,
            },
        });
        beamEntitiesRef.current.set(meter.id, beam);

        // ── Ground halo ring (pulsing ellipse) ─────────────────────────────────
        const halo = viewer.entities.add({
            id:       'halo_' + meter.id,
            position: Cesium.Cartesian3.fromDegrees(meter.lon, meter.lat, ground + 0.06),
            ellipse: {
                semiMajorAxis: 2.4,
                semiMinorAxis: 2.4,
                height:        ground + 0.06,
                material: new Cesium.ColorMaterialProperty(
                    new Cesium.CallbackProperty(
                        () => Cesium.Color.fromCssColorString('#00D2B3').withAlpha(
                            0.06 + Math.abs(Math.sin(performance.now() / 1300)) * 0.13,
                        ),
                        false,
                    ),
                ),
                outline:      true,
                outlineColor: new Cesium.ConstantProperty(
                    Cesium.Color.fromCssColorString('#00D2B3').withAlpha(0.45),
                ),
                outlineWidth: 1.5,
                distanceDisplayCondition: SHOW_DIST,
            },
        });
        haloEntitiesRef.current.set(meter.id, halo);

        // ── Holographic HUD billboard ─────────────────────────────────────────
        // Use toDataURL() for the initial image so Cesium creates a proper WebGL
        // texture from the drawn pixels rather than trying to reference the live canvas.
        const canvas    = buildHologramCanvas(meter, 0);
        const billboard = billboardColRef.current.add({
            position:  Cesium.Cartesian3.fromDegrees(meter.lon, meter.lat, ground + BEAM_TOP),
            image:     canvas.toDataURL('image/png'),
            width:     HOLOGRAM_W,
            height:    HOLOGRAM_H,
            verticalOrigin:   Cesium.VerticalOrigin.BOTTOM,
            horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
            id:               meter.id,
            scaleByDistance:          new Cesium.NearFarScalar(30, 1.4, 600, 0.0),
            translucencyByDistance:   new Cesium.NearFarScalar(50, 1.0, 580, 0.0),
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
        });

        // ── Native Cesium label — always-visible fallback that guarantees data ──
        // Positioned at beam top so it sits inside / above the hologram panel.
        const isFaulty   = meter.status === 'faulty';
        const labelColor = Cesium.Color.fromCssColorString(
            isFaulty ? '#ff4444' : meta.color === '#4E4456' ? '#ffffff' : meta.color,
        );
        const consVal    = (meter.consumption ?? 0).toLocaleString('en-US', { maximumFractionDigits: 0 });
        const idShort    = meter.id.length > 14 ? meter.id.slice(0, 14) + '…' : meter.id;
        const label      = labelColRef.current.add({
            position: Cesium.Cartesian3.fromDegrees(meter.lon, meter.lat, ground + BEAM_TOP + 0.5),
            text:     `${meta.short}  ·  ${idShort}\n${consVal} m³`,
            font:     'bold 13px "Segoe UI", system-ui, sans-serif',
            fillColor:    labelColor,
            outlineColor: Cesium.Color.BLACK.withAlpha(0.85),
            outlineWidth: 2,
            style:    Cesium.LabelStyle.FILL_AND_OUTLINE,
            verticalOrigin:   Cesium.VerticalOrigin.BOTTOM,
            horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
            showBackground:   true,
            backgroundColor:  new Cesium.Color(
                isFaulty ? 0.25 : 0.02,
                0.04,
                isFaulty ? 0.04 : 0.12,
                0.88,
            ),
            backgroundPadding: new Cesium.Cartesian2(7, 5),
            scaleByDistance:          new Cesium.NearFarScalar(50, 1.2, 700, 0.25),
            translucencyByDistance:   new Cesium.NearFarScalar(50, 1.0, 700, 0.0),
            pixelOffset: new Cesium.Cartesian2(0, 0),
        });

        metersMapRef.current.set(meter.id, { ...meter, _billboard: billboard, _canvas: canvas, _label: label });
    }, []);

    // ─────────────────────────────────────────────────────────────────────
    // REMOVE meter visuals from Cesium scene (billboard + 3D entities)
    // Called by both removeMeter and onSaveEditMeter.
    // ─────────────────────────────────────────────────────────────────────
    const cleanupMeterScene = useCallback((id: string) => {
        const entry  = metersMapRef.current.get(id);
        const viewer = viewerRef.current;
        if (entry?._billboard) billboardColRef.current?.remove(entry._billboard);
        if (entry?._label)     labelColRef.current?.remove(entry._label);
        if (viewer) {
            const cyl  = cylinderEntitiesRef.current.get(id);
            const beam = beamEntitiesRef.current.get(id);
            const halo = haloEntitiesRef.current.get(id);
            if (cyl)  viewer.entities.remove(cyl);
            if (beam) viewer.entities.remove(beam);
            if (halo) viewer.entities.remove(halo);
        }
        cylinderEntitiesRef.current.delete(id);
        beamEntitiesRef.current.delete(id);
        haloEntitiesRef.current.delete(id);
    }, []);

    // ─────────────────────────────────────────────────────────────────────
    // PIPELINES  (animated flowing-water shader polylines)
    // ─────────────────────────────────────────────────────────────────────
    const createFlowMaterial = useCallback((color: any, speed: number) => {
        const Cesium = window.Cesium as any;
        return new Cesium.Material({
            fabric: {
                uniforms: { color, time: 0.0, speed },
                source:
                    'czm_material czm_getMaterial(czm_materialInput materialInput){' +
                    '  czm_material m=czm_getDefaultMaterial(materialInput);' +
                    '  float p=fract(materialInput.st.s*1.8-time*speed*0.35);' +
                    '  float pulse=smoothstep(0.0,0.35,p)*(1.0-smoothstep(0.45,0.85,p));' +
                    '  m.diffuse=color.rgb;' +
                    '  m.emission=color.rgb*pulse*2.2;' +
                    '  m.alpha=color.a*(0.3+pulse*0.7);' +
                    '  return m;' +
                    '}',
            },
            translucent: true,
        });
    }, []);

    /**
     * Builds pipelines using a trunk-and-branch pattern instead of direct
     * parent→child lines for every child. For each meter with ≥ 2 children:
     *   1. One THICK TRUNK pipe runs from the parent to the children's centroid
     *   2. Short THIN BRANCH pipes fan out from the centroid to each child
     * This looks like a real distribution manifold instead of a spider web.
     * Single-child families still draw a single direct pipe.
     */
    const rebuildPipelines = useCallback(() => {
        const Cesium = window.Cesium as any;
        const col    = pipelineColRef.current;
        if (!Cesium || !col) return;

        col.removeAll();
        pipelineMaterialsRef.current = [];

        // Group children by parent id in a single pass
        const childrenByParent = new Map<string, MeterRuntime[]>();
        for (const m of metersMapRef.current.values()) {
            if (!m.parent_id) continue;
            const bucket = childrenByParent.get(m.parent_id);
            if (bucket) bucket.push(m);
            else childrenByParent.set(m.parent_id, [m]);
        }

        const drawPipe = (
            fromLon: number, fromLat: number, fromH: number,
            toLon:   number, toLat:   number, toH:   number,
            width: number, colorHex: string, speed: number,
        ) => {
            const color    = Cesium.Color.fromCssColorString(colorHex);
            const material = createFlowMaterial(color, speed);
            pipelineMaterialsRef.current.push(material);
            col.add({
                positions: [
                    Cesium.Cartesian3.fromDegrees(fromLon, fromLat, fromH + 3),
                    Cesium.Cartesian3.fromDegrees(toLon,   toLat,   toH   + 3),
                ],
                width, material, show: pipelinesVisibleRef.current,
            });
        };

        // Pipe sizing rule: trunk width depends on parent's hierarchy level
        const trunkWidth = (parentLevel: string): number => {
            if (parentLevel === 'L1')                              return 7;
            if (parentLevel === 'L2' || parentLevel === 'DC')      return 5;
            if (parentLevel === 'L3')                              return 3.2;
            return 2.5;
        };

        for (const [parentId, children] of childrenByParent) {
            const parent = metersMapRef.current.get(parentId);
            if (!parent) continue;

            const parentMeta   = TYPE_META[parent.type] ?? TYPE_META.l3;
            const parentFaulty = parent.status === 'faulty';

            if (children.length === 1) {
                // Single child: one direct pipe, no manifold
                const c = children[0];
                const faulty = parentFaulty || c.status === 'faulty';
                drawPipe(
                    parent.lon, parent.lat, parent.height ?? 0,
                    c.lon,      c.lat,      c.height      ?? 0,
                    trunkWidth(parentMeta.level),
                    faulty ? '#ff3555' : parentMeta.color,
                    faulty ? 2.8 : 1.5,
                );
                continue;
            }

            // Multi-child: trunk + branches meeting at the children's centroid
            const cx = children.reduce((s, c) => s + c.lon, 0) / children.length;
            const cy = children.reduce((s, c) => s + c.lat, 0) / children.length;
            const ch = children.reduce((s, c) => s + (c.height ?? 0), 0) / children.length;

            // Trunk: parent → centroid (thicker; faulty if parent OR any child is faulty)
            const anyChildFaulty = children.some(c => c.status === 'faulty');
            const trunkFaulty = parentFaulty || anyChildFaulty;
            drawPipe(
                parent.lon, parent.lat, parent.height ?? 0,
                cx, cy, ch,
                trunkWidth(parentMeta.level),
                trunkFaulty ? '#ff3555' : parentMeta.color,
                trunkFaulty ? 2.5 : 1.3,
            );

            // Branches: centroid → each child (thinner; only red if THAT child is faulty)
            const branchW = Math.max(1.8, trunkWidth(parentMeta.level) - 2);
            for (const c of children) {
                const faulty = parentFaulty || c.status === 'faulty';
                drawPipe(
                    cx, cy, ch,
                    c.lon, c.lat, c.height ?? 0,
                    branchW,
                    faulty ? '#ff3555' : parentMeta.color,
                    faulty ? 2.8 : 1.5,
                );
            }
        }
    }, [createFlowMaterial]);

    // ─────────────────────────────────────────────────────────────────────
    // ZONE POLYGONS  (colored by loss %)
    // ─────────────────────────────────────────────────────────────────────
    const rebuildZonePolygons = useCallback(() => {
        const Cesium = window.Cesium as any;
        const viewer = viewerRef.current;
        if (!Cesium || !viewer) return;

        zoneEntitiesRef.current.forEach(e => viewer.entities.remove(e));
        zoneEntitiesRef.current = [];

        const a = computeAnalytics(metersMapRef.current);
        for (const zone of a.zones) {
            const descendants: MeterRuntime[] = [];
            for (const m of metersMapRef.current.values()) {
                let cur: MeterRuntime | undefined = m;
                while (cur && cur.parent_id) {
                    if (cur.parent_id === zone.id) { descendants.push(m); break; }
                    cur = metersMapRef.current.get(cur.parent_id);
                }
            }
            const pts = [{ x: zone.lon, y: zone.lat }, ...descendants.map(c => ({ x: c.lon, y: c.lat }))];
            if (pts.length < 3) continue;

            const hull = padHull(convexHull(pts), 1.15);
            const flat: number[] = [];
            for (const p of hull) flat.push(p.x, p.y);

            const col =
                zone.status === 'critical' ? '#ef4444' :
                zone.status === 'warn'     ? '#f59e0b' : '#22c55e';

            const entity = viewer.entities.add({
                polygon: {
                    hierarchy:      Cesium.Cartesian3.fromDegreesArray(flat),
                    material:       Cesium.Color.fromCssColorString(col).withAlpha(0.12),
                    outline:        true,
                    outlineColor:   Cesium.Color.fromCssColorString(col).withAlpha(0.7),
                    outlineWidth:   2,
                    height:         0,
                    extrudedHeight: 0,
                    show:           zonesVisibleRef.current,
                },
            });
            zoneEntitiesRef.current.push(entity);
        }
    }, []);

    // ─────────────────────────────────────────────────────────────────────
    // STATIC INFRASTRUCTURE LAYER  (as-built pipe routes + zone outlines)
    // Drawn once after Cesium initialises; re-drawn on infra toggle.
    // Data sourced from: COO87-CA-AB-PL-PW-01..PW-08, PW-23A/B/C,
    //   "Main PAW Entry water line.pdf" — WGS84 coordinates.
    // ─────────────────────────────────────────────────────────────────────
    const drawStaticBackground = useCallback(() => {
        const Cesium = window.Cesium as any;
        const viewer = viewerRef.current;
        const col    = staticColRef.current;
        if (!Cesium || !viewer || !col) return;

        // Clear previous
        col.removeAll();
        staticZoneEntitiesRef.current.forEach(e => viewer.entities.remove(e));
        staticZoneEntitiesRef.current = [];

        // ── 1. Trunk + sub-main pipeline routes (from drawings PW-01..08) ──
        for (const pipe of PIPELINES) {
            const positions = pipe.points.map(([lon, lat]) =>
                Cesium.Cartesian3.fromDegrees(lon, lat, 3),
            );
            const color = Cesium.Color.fromCssColorString(pipeColor(pipe.dia, pipe.material)).withAlpha(0.75);
            col.add({
                positions,
                width:    pipeWidth(pipe.dia),
                material: new Cesium.Material({
                    fabric: { type: 'Color', uniforms: { color } },
                }),
                show: true,
            });
        }

        // ── 2. Zone boundary outlines with labels ──
        for (const zone of ZONES) {
            const flat: number[] = [];
            for (const [lon, lat] of zone.polygon) { flat.push(lon, lat); }

            const zoneCol = Cesium.Color.fromCssColorString(zone.color);
            const entity = viewer.entities.add({
                position: Cesium.Cartesian3.fromDegrees(zone.center[0], zone.center[1], 20),
                polygon: {
                    hierarchy:    Cesium.Cartesian3.fromDegreesArray(flat),
                    material:     zoneCol.withAlpha(0.06),
                    outline:      true,
                    outlineColor: zoneCol.withAlpha(0.50),
                    outlineWidth: 2,
                    height:       0,
                },
                label: {
                    text:       zone.name,
                    font:       'bold 13px "Segoe UI", system-ui, sans-serif',
                    fillColor:  Cesium.Color.WHITE.withAlpha(0.95),
                    outlineColor: Cesium.Color.BLACK,
                    outlineWidth: 2,
                    style:      Cesium.LabelStyle.FILL_AND_OUTLINE,
                    scaleByDistance: new Cesium.NearFarScalar(200, 1.2, 4500, 0.0),
                    disableDepthTestDistance: Number.POSITIVE_INFINITY,
                    pixelOffset: new Cesium.Cartesian2(0, 0),
                },
            });
            staticZoneEntitiesRef.current.push(entity);
        }

        // ── 3. Infrastructure point markers (PRV, flow meter, pump room…) ──
        for (const infra of INFRA_POINTS) {
            const { color: ic } = infraMeta(infra.type);
            const isMain = infra.type === 'paw_entry' || infra.type === 'terminal_box';
            const entity = viewer.entities.add({
                position: Cesium.Cartesian3.fromDegrees(infra.lon, infra.lat, 5),
                point: {
                    pixelSize:   isMain ? 14 : 9,
                    color:       Cesium.Color.fromCssColorString(ic),
                    outlineColor: Cesium.Color.WHITE.withAlpha(0.9),
                    outlineWidth: isMain ? 2.5 : 1.5,
                    scaleByDistance: new Cesium.NearFarScalar(100, 1.2, 4000, 0.0),
                    disableDepthTestDistance: Number.POSITIVE_INFINITY,
                    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                },
                label: {
                    text:        infra.label,
                    font:        `${isMain ? 'bold' : ''} 10px "Segoe UI", sans-serif`,
                    fillColor:   Cesium.Color.fromCssColorString(ic),
                    outlineColor: Cesium.Color.BLACK,
                    outlineWidth: 2,
                    style:       Cesium.LabelStyle.FILL_AND_OUTLINE,
                    pixelOffset: new Cesium.Cartesian2(0, isMain ? -18 : -14),
                    scaleByDistance: new Cesium.NearFarScalar(100, 1.0, 1800, 0.0),
                    disableDepthTestDistance: Number.POSITIVE_INFINITY,
                    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                },
            });
            staticZoneEntitiesRef.current.push(entity);
        }
    }, []);

    // ─────────────────────────────────────────────────────────────────────
    // Per-frame animation
    //   • Pipeline flow shader uniforms (every frame)
    //   • Hologram scan-line canvas redraw (every 3 frames ≈ 50 ms @ 60 fps)
    //   • Faulty-meter billboard scale pulse (every frame)
    // ─────────────────────────────────────────────────────────────────────
    const animate = useCallback(() => {
        const t = performance.now() / 1000;

        // Pipeline flow shader uniforms
        const mats = pipelineMaterialsRef.current as Array<{ uniforms: { time: number } }>;
        for (let i = 0; i < mats.length; i++) mats[i].uniforms.time = t;

        // Hologram scan-line: redraw every 20 frames (~333 ms) for visible billboards only.
        // Use toDataURL() so Cesium creates a fresh WebGL texture from the redrawn canvas
        // instead of caching by canvas-object reference (which skips the upload).
        frameCountRef.current++;
        if (frameCountRef.current % 20 === 0) {
            const scan = (t * 0.45) % 1.0;
            for (const m of metersMapRef.current.values()) {
                const bb  = m._billboard as any;
                const cvs = m._canvas as HTMLCanvasElement | undefined;
                if (!bb || !cvs) continue;
                if (typeof bb._actualScale === 'number' && bb._actualScale < 0.05) continue;
                buildHologramCanvas(m, scan, cvs);
                try { bb.image = cvs.toDataURL('image/png'); } catch { /* billboard removed */ }
            }
        }

        // Faulty-meter billboard scale pulse
        const pulse = 1.0 + Math.sin(t * 3.5) * 0.14;
        for (const m of metersMapRef.current.values()) {
            const bb = m._billboard as { scale?: number } | undefined;
            if (!bb) continue;
            bb.scale = m.status === 'faulty' ? pulse : 1.0;
        }
    }, []);

    // ─────────────────────────────────────────────────────────────────────
    // REMOVE meter
    // ─────────────────────────────────────────────────────────────────────
    const removeMeter = useCallback(async (id: string) => {
        if (!metersMapRef.current.has(id)) return;

        cleanupMeterScene(id);
        metersMapRef.current.delete(id);

        for (const child of metersMapRef.current.values()) {
            if (child.parent_id === id) child.parent_id = null;
        }

        await deleteWaterMeter(id);
        rebuildPipelines();
        rebuildZonePolygons();
        refreshCounts();

        if (selected?.id === id) setSelected(null);
    }, [cleanupMeterScene, rebuildPipelines, rebuildZonePolygons, refreshCounts, selected]);

    // ─────────────────────────────────────────────────────────────────────
    // FLY to meter (click a list item / analytics card / alert)
    // ─────────────────────────────────────────────────────────────────────
    const flyToMeter = useCallback((id: string) => {
        const Cesium = window.Cesium as any;
        const viewer = viewerRef.current;
        const m      = metersMapRef.current.get(id);
        if (!Cesium || !viewer || !m) return;
        setSelected(m);
        const center = Cesium.Cartesian3.fromDegrees(m.lon, m.lat, m.height ?? 0);
        const sphere = new Cesium.BoundingSphere(center, 1);
        viewer.camera.flyToBoundingSphere(sphere, {
            duration: 1.5,
            offset:   new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-45), 250),
        });
    }, []);

    // ─────────────────────────────────────────────────────────────────────
    // Initialise Cesium ONCE after the script has loaded
    // ─────────────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!cesiumReady || !containerRef.current) return;
        if (viewerRef.current) return;            // guard against StrictMode double-run

        let cancelled = false;
        let removeTicker: (() => void) | null  = null;
        let removePicker: (() => void) | null  = null;
        let keydownHandler: ((e: KeyboardEvent) => void) | null = null;

        (async () => {
            const Cesium = window.Cesium as any;
            if (!Cesium) { setMapError('Cesium runtime unavailable — refresh the page'); return; }

            try {
                Cesium.Ion.defaultAccessToken = CESIUM_ION_TOKEN;

                // Resolve the base imagery layer independently so a Cesium Ion
                // auth failure does NOT prevent the Viewer from initialising.
                // Google 3D tiles (loaded below) hide the globe entirely when
                // available, so this layer only matters as a last-resort fallback.
                let imageryProvider: unknown;
                try {
                    imageryProvider = await Cesium.IonImageryProvider.fromAssetId(2);
                } catch {
                    // Ion unavailable (invalid token, rate limit, network) —
                    // use free OSM tiles so the globe still renders.
                    imageryProvider = new Cesium.UrlTemplateImageryProvider({
                        url:    'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                        credit: 'Map tiles by OpenStreetMap contributors',
                    });
                }

                const viewer = new Cesium.Viewer(containerRef.current!, {
                    baseLayerPicker:      false,
                    geocoder:             false,
                    homeButton:           false,
                    sceneModePicker:      false,
                    navigationHelpButton: false,
                    animation:            false,
                    timeline:             false,
                    fullscreenButton:     false,
                    infoBox:              false,
                    selectionIndicator:   false,
                    imageryProvider,
                });

                try { viewer.terrainProvider = await Cesium.createWorldTerrainAsync(); } catch {}

                try {
                    const tiles = await Cesium.Cesium3DTileset.fromUrl(
                        `https://tile.googleapis.com/v1/3dtiles/root.json?key=${GOOGLE_MAPS_KEY}`,
                        { showCreditsOnScreen: true, maximumScreenSpaceError: 2, dynamicScreenSpaceError: true },
                    );
                    viewer.scene.primitives.add(tiles);
                    viewer.scene.globe.show         = false;
                    viewer.scene.skyBox.show        = false;
                    viewer.scene.sun.show           = false;
                    viewer.scene.moon.show          = false;
                    viewer.scene.skyAtmosphere.show = false;
                    viewer.scene.backgroundColor    = Cesium.Color.BLACK;
                } catch (err) {
                    console.warn('[water-network] Google 3D tiles failed:', err);
                    setMapWarning('Google 3D tiles unavailable — displaying Bing satellite. Set NEXT_PUBLIC_GOOGLE_MAPS_KEY to enable photorealistic view.');
                }

                if (cancelled) { viewer.destroy(); return; }

                viewerRef.current         = viewer;
                staticColRef.current      = viewer.scene.primitives.add(new Cesium.PolylineCollection());
                pipelineColRef.current    = viewer.scene.primitives.add(new Cesium.PolylineCollection());
                billboardColRef.current   = viewer.scene.primitives.add(new Cesium.BillboardCollection());
                labelColRef.current       = viewer.scene.primitives.add(new Cesium.LabelCollection());

                viewer.scene.preRender.addEventListener(animate);
                removeTicker = () => viewer.scene.preRender.removeEventListener(animate);

                // Click handler — pick existing meter OR capture a new-meter location
                const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
                handler.setInputAction((evt: any) => {
                    if (addModeRef.current) {
                        const worldPos = viewer.scene.pickPosition(evt.position);
                        if (!Cesium.defined(worldPos)) return;
                        const carto = Cesium.Cartographic.fromCartesian(worldPos);
                        setPendingCoords({
                            lon:    Cesium.Math.toDegrees(carto.longitude),
                            lat:    Cesium.Math.toDegrees(carto.latitude),
                            height: carto.height,
                        });
                        setShowModal(true);
                    } else {
                        const picked = viewer.scene.pick(evt.position);
                        if (Cesium.defined(picked)) {
                            // Billboard pick — id is the raw string we assigned
                            if (typeof picked.id === 'string' && metersMapRef.current.has(picked.id)) {
                                const hit = metersMapRef.current.get(picked.id);
                                if (hit) setSelected(hit);
                            // Entity pick — cylinder / beam / halo have prefixed id strings
                            } else if (picked.id && typeof (picked.id as any)?.id === 'string') {
                                const eid = (picked.id as any).id as string;
                                const mid =
                                    eid.startsWith('cyl_')  ? eid.slice(4) :
                                    eid.startsWith('beam_') ? eid.slice(5) :
                                    eid.startsWith('halo_') ? eid.slice(5) : null;
                                if (mid) {
                                    const hit = metersMapRef.current.get(mid);
                                    if (hit) setSelected(hit);
                                } else { setSelected(null); }
                            } else { setSelected(null); }
                        } else { setSelected(null); }
                    }
                }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
                removePicker = () => handler.destroy();

                keydownHandler = (e: KeyboardEvent) => {
                    if (e.key === 'Escape') {
                        setAddMode(false);
                        setShowModal(false);
                        setPendingCoords(null);
                    }
                };
                document.addEventListener('keydown', keydownHandler);

                // Static as-built infrastructure layer (always shown)
                drawStaticBackground();

                // Load meters — auto-seed as-built network on first run if the table is empty
                const rows = await fetchAllWaterMeters();
                if (cancelled) return;
                if (rows.length === 0) {
                    const seedRows: WaterMeterRow[] = SEED_METERS.map(s => ({
                        id: s.id, parent_id: s.parent_id, zone: s.zone,
                        type: s.type as WaterMeterType, status: s.status as WaterMeterStatus,
                        consumption: s.consumption, lat: s.lat, lon: s.lon, height: s.height ?? null,
                    }));
                    for (const row of seedRows) {
                        addMeterToScene(row);
                        if (dbConfigured) upsertWaterMeter(row); // fire-and-forget
                    }
                } else {
                    for (const r of rows) addMeterToScene(r);
                }
                rebuildPipelines();
                rebuildZonePolygons();
                refreshCounts();

                viewer.camera.flyTo({
                    destination: Cesium.Cartesian3.fromDegrees(DEFAULT_VIEW.lon, DEFAULT_VIEW.lat, DEFAULT_VIEW.alt),
                    orientation: { heading: 0, pitch: Cesium.Math.toRadians(-50), roll: 0 },
                    duration:    2,
                });
            } catch (err) {
                console.error('[water-network] init failed:', err);
                setMapError(String(err));
            }
        })();

        return () => {
            cancelled = true;
            if (keydownHandler) document.removeEventListener('keydown', keydownHandler);
            if (removePicker) removePicker();
            if (removeTicker) removeTicker();
            if (viewerRef.current) {
                try { viewerRef.current.destroy(); } catch {}
                viewerRef.current = null;
            }
        };
    }, [cesiumReady, addMeterToScene, animate, rebuildPipelines, rebuildZonePolygons, refreshCounts, drawStaticBackground]);

    // ─────────────────────────────────────────────────────────────────────
    // Toggle handlers (state + ref)
    // ─────────────────────────────────────────────────────────────────────
    const togglePipelines = useCallback(() => {
        setPipelinesOn(v => {
            const next = !v;
            const col = pipelineColRef.current;
            if (col) for (let i = 0; i < col.length; i++) col.get(i).show = next;
            return next;
        });
    }, []);

    const toggleZones = useCallback(() => {
        setZonesOn(v => {
            const next = !v;
            zoneEntitiesRef.current.forEach(e => { e.polygon.show = next; });
            return next;
        });
    }, []);

    const toggleInfra = useCallback(() => {
        setInfraOn(v => {
            const next = !v;
            staticZoneEntitiesRef.current.forEach(e => { e.show = next; });
            const col = staticColRef.current;
            if (col) for (let i = 0; i < col.length; i++) col.get(i).show = next;
            return next;
        });
    }, []);

    // ─────────────────────────────────────────────────────────────────────
    // Seed as-built network — pre-populates L1 + 8×L2 + 3×IRR from drawings
    // ─────────────────────────────────────────────────────────────────────
    const seedNetwork = useCallback(async () => {
        const existing = metersMapRef.current.size;
        if (existing > 0) {
            if (!window.confirm(
                `Add ${SEED_METERS.length} as-built meters (L1 + Zone bulks + Irrigation tanks) ` +
                `alongside your existing ${existing} meter(s)?`,
            )) return;
        }
        for (const s of SEED_METERS) {
            if (metersMapRef.current.has(s.id)) continue;
            const row: WaterMeterRow = {
                id: s.id, parent_id: s.parent_id, zone: s.zone,
                type: s.type as WaterMeterType, status: s.status,
                consumption: s.consumption, lat: s.lat, lon: s.lon, height: s.height,
            };
            addMeterToScene(row);
            await upsertWaterMeter(row);
        }
        rebuildPipelines();
        rebuildZonePolygons();
        refreshCounts();
    }, [addMeterToScene, rebuildPipelines, rebuildZonePolygons, refreshCounts]);

    // ─────────────────────────────────────────────────────────────────────
    // Add-meter flow
    // ─────────────────────────────────────────────────────────────────────
    const onSaveNewMeter = useCallback(async (form: {
        id: string; zone: string; type: WaterMeterType;
        parent_id: string | null; consumption: number; status: WaterMeterStatus;
    }) => {
        if (!pendingCoords) return;
        if (metersMapRef.current.has(form.id)) {
            alert('Meter ID "' + form.id + '" already exists');
            return;
        }

        const row: WaterMeterRow = {
            id:          form.id,
            parent_id:   form.type === 'l1' ? null : form.parent_id,
            zone:        form.zone,
            type:        form.type,
            status:      form.status,
            consumption: form.consumption,
            lat:         pendingCoords.lat,
            lon:         pendingCoords.lon,
            height:      pendingCoords.height,
        };

        addMeterToScene(row);
        await upsertWaterMeter(row);
        rebuildPipelines();
        rebuildZonePolygons();
        refreshCounts();
        setShowModal(false);
        setAddMode(false);
        setPendingCoords(null);
        flyToMeter(form.id);
    }, [pendingCoords, addMeterToScene, rebuildPipelines, rebuildZonePolygons, refreshCounts, flyToMeter]);

    // ─────────────────────────────────────────────────────────────────────
    // EDIT existing meter — fields can change (zone, type, parent, status,
    // consumption) but ID and location stay pinned.
    // ─────────────────────────────────────────────────────────────────────
    const onSaveEditMeter = useCallback(async (form: {
        id: string; zone: string; type: WaterMeterType;
        parent_id: string | null; consumption: number; status: WaterMeterStatus;
    }) => {
        const existing = metersMapRef.current.get(form.id);
        if (!existing) return;

        // Guard: can't be its own ancestor (prevent cycles)
        let cur: MeterRuntime | undefined = form.parent_id ? metersMapRef.current.get(form.parent_id) : undefined;
        while (cur) {
            if (cur.id === form.id) { alert('That parent would create a cycle — pick a different upstream meter.'); return; }
            cur = cur.parent_id ? metersMapRef.current.get(cur.parent_id) : undefined;
        }

        // Remove old billboard + 3D entities from scene
        cleanupMeterScene(form.id);
        metersMapRef.current.delete(form.id);

        // Re-add with updated metadata (reuses existing lat/lon/height)
        const row: WaterMeterRow = {
            id:          form.id,
            parent_id:   form.type === 'l1' ? null : form.parent_id,
            zone:        form.zone,
            type:        form.type,
            status:      form.status,
            consumption: form.consumption,
            lat:         existing.lat,
            lon:         existing.lon,
            height:      existing.height,
        };
        addMeterToScene(row);
        await upsertWaterMeter(row);
        rebuildPipelines();
        rebuildZonePolygons();
        refreshCounts();

        setShowModal(false);
        setEditingId(null);
        setSelected(metersMapRef.current.get(form.id) ?? null);
    }, [cleanupMeterScene, addMeterToScene, rebuildPipelines, rebuildZonePolygons, refreshCounts]);

    // ─────────────────────────────────────────────────────────────────────
    // Derived: filtered meter list (from reactive `metersList` snapshot)
    // ─────────────────────────────────────────────────────────────────────
    const filteredMeters = metersList.filter(m => {
        const okFilter =
            filter === 'all'     ? true :
            filter === 'working' ? m.status === 'working' :
            filter === 'faulty'  ? m.status === 'faulty'  :
            TYPE_META[filter]    ? m.type   === filter    : true;
        const term = search.trim().toLowerCase();
        const okSearch = !term || m.id.toLowerCase().includes(term) || m.zone.toLowerCase().includes(term);
        return okFilter && okSearch;
    });

    const faultyMeters = metersList.filter(m => m.status === 'faulty');
    const hotZones = analytics.zones.filter(z => z.status !== 'ok');
    const alertCount = faultyMeters.length + hotZones.length;
    const selectedParent = selected?.parent_id ? metersList.find(m => m.id === selected.parent_id) : undefined;

    const fmt = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 1 });

    // ════════════════════════════════════════════════════════════════════
    // RENDER
    // ════════════════════════════════════════════════════════════════════
    return (
        <>
            <div className="flex h-dvh bg-[var(--background,#0A090C)] text-white/85 overflow-hidden font-sans">

                {/* ═══ Sidebar — unified with the app's primary sidebar ═══ */}
                <aside className="w-[340px] min-w-[340px] bg-[var(--sidebar,#3B3240)] border-r border-white/10 flex flex-col overflow-hidden text-[var(--sidebar-foreground,#E4E4E7)]">

                    {/* Header — matches main sidebar brand lockup */}
                    <div className="h-16 flex items-center flex-shrink-0 border-b border-white/10 px-3">
                        <Link href="/water" className="flex items-center gap-2.5 group flex-1 min-w-0" aria-label="Back to Water">
                            <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center bg-white/10 ring-1 ring-white/15 shadow-md group-hover:bg-white/20 group-hover:ring-[#A1D1D5]/30 transition-colors duration-150">
                                <Droplets className="w-5 h-5 text-[#A1D1D5]" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-bold tracking-tight leading-none">
                                    <span className="text-white">MUSCAT </span>
                                    <span className="text-[#A1D1D5]">BAY</span>
                                </p>
                                <p className="text-[10px] uppercase tracking-[0.13em] text-white/50 mt-0.5 truncate">Water Network Map</p>
                            </div>
                        </Link>
                        <Link href="/" title="Dashboard" className="w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-md hover:bg-white/10 text-white/45 hover:text-white transition-colors duration-150">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </div>

                    {/* DB status bar */}
                    <div className="flex items-center justify-between px-3 py-1.5 bg-black/20 border-b border-white/10">
                        <p className="text-[11px] text-white/40">3D Meter Network · Muscat Bay</p>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${dbConfigured ? 'bg-green-500/15 text-green-300' : 'bg-amber-500/15 text-amber-300'}`}>
                            {dbConfigured ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                            {dbConfigured ? 'LIVE' : 'LOCAL'}
                        </span>
                    </div>

                    {/* Stat cards */}
                    <div className="grid grid-cols-3 gap-2 p-2.5 bg-black/20 border-b border-white/10">
                        <StatCard value={meterCount} label="Total"   color="#A1D1D5" />
                        <StatCard value={workingCount} label="Working" color="#3fb950" />
                        <StatCard value={meterCount - workingCount} label="Faulty"  color="#f85149" />
                    </div>

                    {/* Color legend */}
                    <div className="flex gap-2 items-center justify-between px-3 py-1.5 bg-black/20 border-b border-white/10 text-[11px] font-semibold">
                        {(Object.keys(TYPE_META) as WaterMeterType[]).map(t => (
                            <div key={t} className="flex items-center gap-1 text-white/70">
                                <span className="w-2.5 h-2.5 rounded-full border border-white/15 inline-block" style={{ backgroundColor: TYPE_META[t].color }} />
                                {TYPE_META[t].short}
                            </div>
                        ))}
                    </div>

                    {/* Tabs */}
                    <div className="flex bg-black/20 border-b border-white/10">
                        <TabBtn label="Meters"    active={activeTab === 'meters'}    onClick={() => setActiveTab('meters')}    count={meterCount} />
                        <TabBtn label="Analytics" active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} />
                        <TabBtn label="Alerts"    active={activeTab === 'alerts'}    onClick={() => setActiveTab('alerts')}    count={alertCount} alert={alertCount > 0} />
                    </div>

                    {/* Tab content */}
                    <div className="flex-1 overflow-hidden flex flex-col">
                        {activeTab === 'meters' && (
                            <MetersTab
                                filter={filter} setFilter={setFilter}
                                search={search} setSearch={setSearch}
                                pipelinesOn={pipelinesOn} onTogglePipelines={togglePipelines}
                                zonesOn={zonesOn} onToggleZones={toggleZones}
                                infraOn={infraOn} onToggleInfra={toggleInfra}
                                onSeedNetwork={seedNetwork}
                                addMode={addMode} onStartAdd={() => setAddMode(v => !v)}
                                filtered={filteredMeters}
                                selectedId={selected?.id ?? null}
                                onPickMeter={(id) => flyToMeter(id)}
                            />
                        )}
                        {activeTab === 'analytics' && (
                            <AnalyticsTab analytics={analytics} onPick={flyToMeter} fmt={fmt} />
                        )}
                        {activeTab === 'alerts' && (
                            <AlertsTab zones={hotZones} faulty={faultyMeters} onPick={flyToMeter} />
                        )}
                    </div>
                </aside>

                {/* ═══ Map ═══ */}
                <main className="flex-1 relative">
                    <div ref={containerRef} className="w-full h-full" />

                    {/* Loading / error */}
                    {!cesiumReady && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 text-white/55 text-sm">
                            Loading 3D map…
                        </div>
                    )}
                    {/* Fatal error — map not usable */}
                    {mapError && (
                        <div className="absolute top-0 left-0 right-0 bg-red-700 text-white text-xs px-4 py-2 text-center">
                            ⚠ {mapError}
                        </div>
                    )}
                    {/* Soft warning — map works, feature degraded; auto-dismisses after 7 s */}
                    {mapWarning && !mapError && (
                        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-amber-600/90 text-white text-xs px-4 py-2 rounded-lg shadow-lg max-w-[90vw] text-center">
                            ⚠ {mapWarning}
                            <button
                                onClick={() => setMapWarning(null)}
                                className="ms-1 opacity-70 hover:opacity-100 font-bold leading-none"
                                aria-label="Dismiss warning"
                            >✕</button>
                        </div>
                    )}

                    {/* Placement hint */}
                    {addMode && (
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-orange-600/95 text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-2xl pointer-events-none">
                            📍 Click anywhere on the map to place the meter&nbsp;&nbsp;|&nbsp;&nbsp;<em>ESC to cancel</em>
                        </div>
                    )}

                    {/* Info panel */}
                    {selected && (
                        <InfoPanel
                            meter={selected}
                            parent={selectedParent}
                            onClose={() => setSelected(null)}
                            onFly={() => flyToMeter(selected.id)}
                            onEdit={() => { setEditingId(selected.id); setShowModal(true); }}
                            onDelete={() => {
                                if (window.confirm('Delete meter "' + selected.id + '"? This cannot be undone.')) {
                                    removeMeter(selected.id);
                                }
                            }}
                        />
                    )}
                </main>

                {/* Meter modal — new placement OR edit of an existing meter */}
                {showModal && (editingId || pendingCoords) && (
                    <MeterModal
                        editing={editingId ? metersList.find(m => m.id === editingId) ?? null : null}
                        coords={editingId
                            ? (() => {
                                const m = metersList.find(x => x.id === editingId);
                                return m ? { lat: m.lat, lon: m.lon, height: m.height ?? 0 } : pendingCoords!;
                              })()
                            : pendingCoords!
                        }
                        existing={metersList}
                        onSave={editingId ? onSaveEditMeter : onSaveNewMeter}
                        onCancel={() => { setShowModal(false); setAddMode(false); setPendingCoords(null); setEditingId(null); }}
                    />
                )}
            </div>
        </>
    );
}

// ════════════════════════════════════════════════════════════════════════════
// Sub-components (kept in this file for proximity — matches /water page style)
// ════════════════════════════════════════════════════════════════════════════

function StatCard({ value, label, color }: { value: number; label: string; color: string }) {
    return (
        <div className="bg-black/25 border border-white/10 rounded-md py-2 px-1 text-center">
            <div className="text-xl font-bold leading-none" style={{ color }}>{value}</div>
            <div className="text-[10px] uppercase tracking-wider text-white/55 mt-1">{label}</div>
        </div>
    );
}

function TabBtn({ label, active, onClick, count, alert }: {
    label: string; active: boolean; onClick: () => void; count?: number; alert?: boolean;
}) {
    return (
        <button
            onClick={onClick}
            className={`flex-1 py-2 text-xs font-semibold tracking-wide border-b-2 transition-colors ${
                active ? 'text-[#A1D1D5] border-[#A1D1D5]' : 'text-white/55 border-transparent hover:text-white/85'
            }`}
        >
            {label}
            {typeof count === 'number' && count > 0 && (
                <span className={`ml-1.5 inline-block px-1.5 py-0.5 rounded-full text-[10px] ${
                    active
                        ? (alert ? 'bg-red-500 text-white' : 'bg-[#A1D1D5] text-[#0f172a]')
                        : (alert ? 'bg-red-500/70 text-white' : 'bg-white/15 text-white/85')
                }`}>
                    {count}
                </span>
            )}
        </button>
    );
}

function MetersTab(props: {
    filter: FilterKey; setFilter: (f: FilterKey) => void;
    search: string; setSearch: (s: string) => void;
    pipelinesOn: boolean; onTogglePipelines: () => void;
    zonesOn: boolean; onToggleZones: () => void;
    infraOn: boolean; onToggleInfra: () => void;
    onSeedNetwork: () => void;
    addMode: boolean; onStartAdd: () => void;
    filtered: MeterRuntime[];
    selectedId: string | null;
    onPickMeter: (id: string) => void;
}) {
    const { filter, setFilter, search, setSearch, pipelinesOn, onTogglePipelines, zonesOn, onToggleZones,
            infraOn, onToggleInfra, onSeedNetwork,
            addMode, onStartAdd, filtered, selectedId, onPickMeter } = props;

    const statusFilters: FilterKey[] = ['all', 'working', 'faulty'];
    const levelFilters:  WaterMeterType[] = ['l1', 'l2', 'dc', 'l3', 'l4', 'irr'];

    return (
        <>
            {/* Controls */}
            <div className="p-2.5 space-y-2 border-b border-white/10 shrink-0">
                {/* Search */}
                <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-white/55 pointer-events-none" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search ID or zone…"
                        className="w-full pl-8 pr-3 py-1.5 bg-black/25 border border-white/10 rounded-md text-xs outline-none focus:border-[#A1D1D5] text-white/85"
                    />
                </div>

                {/* Status filter row */}
                <div className="flex gap-1">
                    {statusFilters.map(f => (
                        <FilterBtn key={f} label={f === 'all' ? 'All' : f === 'working' ? 'Working' : 'Faulty'}
                            active={filter === f}
                            red={f === 'faulty'}
                            onClick={() => setFilter(f)} />
                    ))}
                </div>

                {/* Level filter row */}
                <div className="flex gap-1">
                    {levelFilters.map(t => (
                        <FilterBtn key={t} label={TYPE_META[t].short}
                            active={filter === t}
                            bg={TYPE_META[t].color}
                            onClick={() => setFilter(t)} />
                    ))}
                </div>

                {/* Toggle buttons */}
                <button
                    onClick={onTogglePipelines}
                    className={`w-full py-1.5 rounded-md text-xs font-semibold border transition-colors flex items-center justify-center gap-1.5 ${
                        pipelinesOn
                            ? 'bg-cyan-400/15 border-cyan-400 text-cyan-300'
                            : 'bg-black/20 border-white/10 text-white/55'
                    }`}
                >
                    <Zap className="w-3.5 h-3.5" /> Pipelines {pipelinesOn ? 'ON' : 'OFF'}
                </button>
                <button
                    onClick={onToggleZones}
                    className={`w-full py-1.5 rounded-md text-xs font-semibold border transition-colors flex items-center justify-center gap-1.5 ${
                        zonesOn
                            ? 'bg-orange-500/15 border-orange-500 text-orange-300'
                            : 'bg-black/20 border-white/10 text-white/55'
                    }`}
                >
                    <Square className="w-3.5 h-3.5" /> Zone Polygons {zonesOn ? 'ON' : 'OFF'}
                </button>
                <button
                    onClick={onToggleInfra}
                    className={`w-full py-1.5 rounded-md text-xs font-semibold border transition-colors flex items-center justify-center gap-1.5 ${
                        infraOn
                            ? 'bg-[#A1D1D5]/15 border-[#A1D1D5] text-[#A1D1D5]'
                            : 'bg-black/20 border-white/10 text-white/55'
                    }`}
                >
                    <Layers className="w-3.5 h-3.5" /> As-Built Layer {infraOn ? 'ON' : 'OFF'}
                </button>
                <button
                    onClick={onSeedNetwork}
                    className="w-full py-1.5 rounded-md text-xs font-semibold border border-dashed border-[#A1D1D5]/50 text-[#A1D1D5]/70 bg-[#A1D1D5]/05 hover:border-[#A1D1D5] hover:text-[#A1D1D5] hover:bg-[#A1D1D5]/10 transition-colors flex items-center justify-center gap-1.5"
                >
                    <Database className="w-3.5 h-3.5" /> Seed As-Built Meters
                </button>

                {/* Add button */}
                <button
                    onClick={onStartAdd}
                    className={`w-full py-2 rounded-md text-xs font-semibold text-white transition-colors flex items-center justify-center gap-1.5 ${
                        addMode ? 'animate-pulse' : ''
                    }`}
                    style={{
                        background: addMode
                            ? 'linear-gradient(135deg, #b94a08, #e66000)'
                            : 'linear-gradient(135deg, #4E4456, #7b5ea7)',
                    }}
                >
                    {addMode ? <><X className="w-3.5 h-3.5" /> Cancel Placement</> : <><Plus className="w-3.5 h-3.5" /> Add New Meter</>}
                </button>
            </div>

            {/* List count */}
            <div className="px-3 py-1 text-[11px] text-white/55 shrink-0">
                {filtered.length} meter{filtered.length === 1 ? '' : 's'}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-2">
                {filtered.length === 0 ? (
                    <div className="text-center text-white/55 text-xs py-8">
                        {selectedId === null && 'No meters yet. Click "+ Add New Meter" to start.'}
                    </div>
                ) : filtered.slice(0, 500).map(m => (
                    <MeterRow key={m.id} meter={m} selected={m.id === selectedId} onClick={() => onPickMeter(m.id)} />
                ))}
            </div>
        </>
    );
}

function FilterBtn({ label, active, onClick, red, bg }: {
    label: string; active: boolean; onClick: () => void; red?: boolean; bg?: string;
}) {
    const style = active && bg ? { backgroundColor: bg, borderColor: bg, color: '#000' } : undefined;
    const cls = active
        ? (red ? 'bg-red-500 border-red-500 text-white' : 'bg-[#A1D1D5] border-[#A1D1D5] text-[#0f172a]')
        : 'bg-black/20 border-white/10 text-white/55 hover:text-white/85';
    return (
        <button
            onClick={onClick}
            style={style}
            className={`flex-1 py-1 px-1 rounded-md text-[11px] font-semibold border transition-colors ${!style ? cls : ''}`}
        >
            {label}
        </button>
    );
}

function MeterRow({ meter, selected, onClick }: { meter: MeterRuntime; selected: boolean; onClick: () => void }) {
    const meta = TYPE_META[meter.type] ?? TYPE_META.l3;
    return (
        <div
            onClick={onClick}
            className={`flex items-center gap-2 p-2 mb-1 rounded-md cursor-pointer border transition-colors ${
                selected ? 'border-[#A1D1D5] bg-white/10' : 'border-white/10 bg-black/20 hover:border-[#A1D1D5]'
            }`}
        >
            <div className={`w-2.5 h-2.5 rounded-full border-2 border-white/25 shrink-0 ${meter.status === 'working' ? 'bg-green-500' : 'bg-red-500'}`} />
            <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-white truncate">{meter.id}</div>
                <div className="text-[10px] text-white/55 truncate">{meter.zone}</div>
            </div>
            <div className="flex flex-col items-end gap-0.5 shrink-0">
                <div className="text-[11px] font-semibold text-[#A1D1D5] font-mono">{(meter.consumption ?? 0).toLocaleString()} m³</div>
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold tracking-wider" style={{ backgroundColor: meta.color, color: meta.color === '#4E4456' ? '#fff' : '#000' }}>
                    {meta.short}
                </span>
            </div>
        </div>
    );
}

function InfoPanel(props: {
    meter: MeterRuntime; parent?: MeterRuntime;
    onClose: () => void; onFly: () => void; onEdit: () => void; onDelete: () => void;
}) {
    const { meter, parent, onClose, onFly, onEdit, onDelete } = props;
    const meta = TYPE_META[meter.type] ?? TYPE_META.l3;
    return (
        <div className="absolute top-4 right-4 w-72 bg-[var(--card,#16141b)]/95 backdrop-blur border border-[#A1D1D5] rounded-xl p-4 shadow-2xl z-50">
            <div className="flex justify-between items-start mb-2">
                <div className="font-bold text-white">{meter.id}</div>
                <button onClick={onClose} className="text-white/60 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold mb-3 border ${
                meter.status === 'working' ? 'bg-[#84B59F]/20 border-[#84B59F] text-[#84B59F]' : 'bg-[#D67A7A]/20 border-[#D67A7A] text-[#D67A7A]'
            }`}>● {meter.status === 'working' ? 'Working' : 'Faulty'}</div>

            <InfoRow label="Zone / Area"  value={meter.zone} />
            <InfoRow label="Type" value={<span className="inline-flex items-center gap-1.5">{meta.label}<span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold" style={{ backgroundColor: meta.color, color: meta.color === '#4E4456' ? '#fff' : '#000' }}>{meta.short}</span></span>} />
            <InfoRow label="Upstream" value={parent ? `${parent.zone} (${parent.id})` : '— top of chain —'} />
            <InfoRow label="Consumption" value={<span className="text-lg font-bold text-[#A1D1D5]">{(meter.consumption ?? 0).toLocaleString()} m³</span>} />
            <InfoRow label="Coordinates" value={<span className="font-mono text-[10px]">{meter.lat.toFixed(5)}, {meter.lon.toFixed(5)}</span>} />

            <div className="flex gap-1.5 mt-3">
                <button onClick={onFly} className="flex-1 py-1.5 bg-[#A1D1D5]/10 border border-[#A1D1D5] text-[#A1D1D5] rounded-md text-xs font-semibold hover:bg-[#A1D1D5]/25 flex items-center justify-center gap-1"><Target className="w-3.5 h-3.5" /> Fly To</button>
                <button onClick={onEdit} className="flex-1 py-1.5 bg-[#A1D1D5]/15 border border-[#A1D1D5] text-[#A1D1D5] rounded-md text-xs font-semibold hover:bg-[#A1D1D5]/30 flex items-center justify-center gap-1"><Pencil className="w-3.5 h-3.5" /> Edit</button>
                <button onClick={onDelete} className="px-3 py-1.5 bg-[#D67A7A]/15 border border-[#D67A7A] text-[#D67A7A] rounded-md text-xs font-semibold hover:bg-[#D67A7A]/30"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
        </div>
    );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex justify-between items-center py-1.5 border-b border-white/10 last:border-b-0 text-xs">
            <span className="text-white/55">{label}</span>
            <span className="text-white font-medium text-right max-w-[60%]">{value}</span>
        </div>
    );
}

function AnalyticsTab({ analytics, onPick, fmt }: { analytics: SystemAnalytics; onPick: (id: string) => void; fmt: (n: number) => string }) {
    const sysCls = analytics.sysPct >= LOSS_ALERT_PCT ? 'critical' : analytics.sysPct >= LOSS_WARN_PCT ? 'warn' : 'ok';
    if (analytics.zones.length === 0) return <div className="p-6 text-center text-white/55 text-xs">No L2/DC meters yet to analyse.<br />Add zone bulks to see loss metrics.</div>;

    return (
        <div className="flex-1 overflow-y-auto p-2.5">
            {/* System summary */}
            <div className="rounded-xl border border-[#A1D1D5]/40 p-3 mb-3" style={{ background: 'linear-gradient(135deg, rgba(78,68,86,0.35), rgba(22,20,27,0.8))' }}>
                <h3 className="text-xs font-bold text-[#A1D1D5] uppercase tracking-wider mb-2">System Overview</h3>
                <KpiRow label="Total Bulk Inflow (L1)" value={`${fmt(analytics.sysBulk)} m³`} />
                <KpiRow label="Total Distributed"      value={`${fmt(analytics.sysDist)} m³`} />
                <KpiRow label="Total Loss (NRW)"       value={`${fmt(analytics.sysLoss)} m³ (${analytics.sysPct.toFixed(1)}%)`} status={sysCls as 'ok' | 'warn' | 'critical'} />
                <div className="h-1.5 bg-white/10 rounded-sm mt-2 overflow-hidden">
                    <div className={`h-full rounded-sm transition-[width] duration-300 ease-out ${sysCls === 'critical' ? 'bg-gradient-to-r from-red-500 to-red-400' : sysCls === 'warn' ? 'bg-gradient-to-r from-amber-500 to-yellow-300' : 'bg-gradient-to-r from-green-500 to-green-400'}`} style={{ width: `${Math.min(100, analytics.sysPct * 3)}%` }} />
                </div>
            </div>

            <div className="text-[11px] text-white/55 uppercase tracking-wider font-bold px-1 mb-1.5">Per-Zone Loss Analysis</div>
            {analytics.zones.map(z => (
                <ZoneCard key={z.id} zone={z} onClick={() => onPick(z.id)} fmt={fmt} />
            ))}
        </div>
    );
}

function KpiRow({ label, value, status }: { label: string; value: string; status?: 'ok' | 'warn' | 'critical' }) {
    const color = status === 'critical' ? '#f85149' : status === 'warn' ? '#fbbf24' : status === 'ok' ? '#3fb950' : undefined;
    return (
        <div className="flex justify-between items-center py-1 text-xs">
            <span className="text-white/55">{label}</span>
            <span className="font-semibold font-mono" style={color ? { color } : undefined}>{value}</span>
        </div>
    );
}

function ZoneCard({ zone, onClick, fmt }: { zone: ZoneAnalytics; onClick: () => void; fmt: (n: number) => string }) {
    const pMeta = TYPE_META[zone.type] ?? TYPE_META.l2;
    const border = zone.status === 'critical' ? 'border-l-red-500' : zone.status === 'warn' ? 'border-l-amber-500' : 'border-l-green-500';
    const pillCls = zone.status === 'critical' ? 'bg-red-500/20 text-red-400' : zone.status === 'warn' ? 'bg-amber-500/20 text-amber-300' : 'bg-green-500/20 text-green-400';
    return (
        <div onClick={onClick} className={`bg-black/20 border border-white/10 border-l-[3px] ${border} rounded-lg p-3 mb-2 cursor-pointer hover:border-[#A1D1D5]`}>
            <div className="flex justify-between items-start mb-2">
                <div>
                    <div className="text-sm font-bold text-white">{zone.name}</div>
                    <div className="text-[10px] text-white/55 font-mono">{pMeta.short} · {zone.id} · {zone.childCount} children</div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${pillCls}`}>{zone.lossPct.toFixed(1)}%</span>
            </div>
            <KpiRow label="Bulk Reading" value={`${fmt(zone.bulk)} m³`} />
            <KpiRow label="Distributed"  value={`${fmt(zone.distributed)} m³`} />
            <KpiRow label="Loss (NRW)"   value={`${fmt(zone.loss)} m³`} />
            <KpiRow label="Efficiency"   value={`${(100 - zone.lossPct).toFixed(1)}%`} />
            <div className="h-1.5 bg-white/10 rounded-sm mt-2 overflow-hidden">
                <div className={`h-full rounded-sm transition-[width] duration-300 ease-out ${zone.status === 'critical' ? 'bg-gradient-to-r from-red-500 to-red-400' : zone.status === 'warn' ? 'bg-gradient-to-r from-amber-500 to-yellow-300' : 'bg-gradient-to-r from-green-500 to-green-400'}`} style={{ width: `${Math.min(100, zone.lossPct * 3)}%` }} />
            </div>
        </div>
    );
}

function AlertsTab({ zones, faulty, onPick }: { zones: ZoneAnalytics[]; faulty: MeterRuntime[]; onPick: (id: string) => void }) {
    if (zones.length === 0 && faulty.length === 0) {
        return <div className="p-10 text-center text-white/55 text-sm"><div className="text-2xl mb-2">✅</div>All clear.<br /><br /><span className="text-[11px]">No faulty meters, no high-loss zones.</span></div>;
    }
    return (
        <div className="flex-1 overflow-y-auto p-2.5">
            {zones.length > 0 && (<>
                <div className="text-[11px] text-white/55 uppercase tracking-wider font-bold px-1 py-1">⚠ High-Loss Zones</div>
                {zones.map(z => (
                    <div key={z.id} onClick={() => onPick(z.id)} className={`flex items-center gap-2 p-2.5 mb-1 rounded-md cursor-pointer border border-white/10 border-l-[3px] ${z.status === 'critical' ? 'border-l-red-500' : 'border-l-amber-500'} bg-black/20 hover:border-[#A1D1D5]`}>
                        <span className="text-base">{z.status === 'critical' ? '🔴' : '🟡'}</span>
                        <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-white truncate">{z.name}</div>
                            <div className="text-[10px] text-white/55">Loss: {z.loss.toLocaleString()} m³ of {z.bulk.toLocaleString()} m³</div>
                        </div>
                        <div className={`text-xs font-bold font-mono ${z.status === 'critical' ? 'text-red-400' : 'text-amber-400'}`}>{z.lossPct.toFixed(1)}%</div>
                    </div>
                ))}
            </>)}
            {faulty.length > 0 && (<>
                <div className="text-[11px] text-white/55 uppercase tracking-wider font-bold px-1 py-1 mt-3">🔧 Faulty Meters</div>
                {faulty.map(m => {
                    const meta = TYPE_META[m.type] ?? TYPE_META.l3;
                    return (
                        <div key={m.id} onClick={() => onPick(m.id)} className="flex items-center gap-2 p-2.5 mb-1 rounded-md cursor-pointer border border-white/10 border-l-[3px] border-l-red-500 bg-black/20 hover:border-[#A1D1D5]">
                            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <div className="text-xs font-semibold text-white truncate">{m.zone}</div>
                                <div className="text-[10px] text-white/55 font-mono">{meta.short} · {m.id}</div>
                            </div>
                            <div className="text-[11px] font-bold text-red-400">FAULT</div>
                        </div>
                    );
                })}
            </>)}
        </div>
    );
}

function MeterModal(props: {
    coords: { lat: number; lon: number; height: number };
    existing: MeterRuntime[];
    editing?: MeterRuntime | null;
    onSave: (form: { id: string; zone: string; type: WaterMeterType; parent_id: string | null; consumption: number; status: WaterMeterStatus }) => void;
    onCancel: () => void;
}) {
    const { coords, existing, editing, onSave, onCancel } = props;
    const isEdit = !!editing;

    // Pre-fill from `editing` when in edit mode
    const [id,   setId]   = useState(editing?.id   ?? '');
    const [zone, setZone] = useState(editing?.zone ?? '');
    const [type, setType] = useState<WaterMeterType>(editing?.type ?? 'l3');
    const [pid,  setPid]  = useState(editing?.parent_id ?? '');
    const [cons, setCons] = useState(editing?.consumption != null ? String(editing.consumption) : '');
    const [stat, setStat] = useState<WaterMeterStatus>(editing?.status ?? 'working');

    const meta = TYPE_META[type];
    // Exclude self and descendants from parent options (prevent cycles)
    const isDescendantOfEditing = (candidate: MeterRuntime): boolean => {
        if (!isEdit || !editing) return false;
        let cur: MeterRuntime | undefined = candidate;
        while (cur) {
            if (cur.id === editing.id) return true;
            cur = cur.parent_id ? existing.find(x => x.id === cur!.parent_id) : undefined;
        }
        return false;
    };
    const parentOptions = existing.filter(m => meta.parents.includes(m.type) && !isDescendantOfEditing(m));

    return (
        <div onClick={onCancel} className="fixed inset-0 bg-black/65 z-[200] flex items-center justify-center">
            <div onClick={e => e.stopPropagation()} className="bg-[var(--card,#16141b)] border border-white/10 rounded-xl p-5 w-[400px] max-w-[92vw] max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="text-base font-bold text-white mb-3">
                    {isEdit ? <><Pencil className="w-4 h-4 inline mb-0.5" /> Edit Meter</> : <>📍 Register New Meter</>}
                </div>

                <FormField label="Location">
                    <div className="px-2.5 py-1.5 bg-black/25 border border-white/10 rounded-md text-xs text-[#A1D1D5] font-mono">
                        Lat: {coords.lat.toFixed(6)}   Lon: {coords.lon.toFixed(6)}
                    </div>
                </FormField>

                <div className="grid grid-cols-2 gap-2.5">
                    <FormField label="Meter ID / Account #">
                        <input
                            value={id}
                            onChange={e => setId(e.target.value)}
                            placeholder="e.g. 4300346"
                            className="modal-input"
                            maxLength={30}
                            disabled={isEdit}
                            style={isEdit ? { opacity: 0.6, cursor: 'not-allowed' } : undefined}
                        />
                    </FormField>
                    <FormField label="Type">
                        <select value={type} onChange={e => { setType(e.target.value as WaterMeterType); setPid(''); }} className="modal-input">
                            {(Object.keys(TYPE_META) as WaterMeterType[]).map(t => (
                                <option key={t} value={t}>{TYPE_META[t].short} — {TYPE_META[t].label}</option>
                            ))}
                        </select>
                    </FormField>
                </div>

                <FormField label="Zone / Area Name">
                    <input value={zone} onChange={e => setZone(e.target.value)} placeholder="e.g. Zone 3A — D-75 Building" className="modal-input" maxLength={80} />
                </FormField>

                {meta.parents.length > 0 && (
                    <FormField label="Upstream Meter (feeds this one)">
                        <select value={pid} onChange={e => setPid(e.target.value)} className="modal-input">
                            <option value="">— none (independent) —</option>
                            {parentOptions.map(p => (
                                <option key={p.id} value={p.id}>[{TYPE_META[p.type].short}] {p.id} — {p.zone}</option>
                            ))}
                        </select>
                    </FormField>
                )}

                <div className="grid grid-cols-2 gap-2.5">
                    <FormField label="Consumption (m³)">
                        <input type="number" value={cons} onChange={e => setCons(e.target.value)} placeholder="245.5" min={0} step={0.1} className="modal-input" />
                    </FormField>
                    <FormField label="Status">
                        <select value={stat} onChange={e => setStat(e.target.value as WaterMeterStatus)} className="modal-input">
                            <option value="working">✓ Working</option>
                            <option value="faulty">✗ Faulty</option>
                        </select>
                    </FormField>
                </div>

                <div className="flex gap-2 mt-4">
                    <button onClick={onCancel} className="px-4 py-2 bg-black/25 border border-white/10 rounded-md text-xs text-white/70 hover:text-white hover:border-white/30">Cancel</button>
                    <button
                        onClick={() => {
                            if (!id.trim())   { alert('Meter ID is required'); return; }
                            if (!zone.trim()) { alert('Zone / Area is required'); return; }
                            onSave({
                                id: id.trim(), zone: zone.trim(), type,
                                parent_id: type === 'l1' ? null : (pid || null),
                                consumption: parseFloat(cons) || 0,
                                status: stat,
                            });
                        }}
                        className="flex-1 py-2 rounded-md text-xs font-bold text-black"
                        style={{ background: 'linear-gradient(135deg, #A1D1D5, #7ab8bc)' }}
                    >
                        {isEdit ? 'Save Changes' : 'Save Meter'}
                    </button>
                </div>

                <style jsx>{`
                    .modal-input {
                        width: 100%; padding: 8px 10px;
                        background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.1);
                        border-radius: 6px; color: #ffffff; font-size: 13px;
                        outline: none;
                    }
                    .modal-input:focus { border-color: #A1D1D5; }
                    .modal-input option { background: var(--card, #16141b); }
                `}</style>
            </div>
        </div>
    );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="mb-2.5">
            <label className="block text-[10px] text-white/55 uppercase tracking-wider mb-1 font-semibold">{label}</label>
            {children}
        </div>
    );
}
