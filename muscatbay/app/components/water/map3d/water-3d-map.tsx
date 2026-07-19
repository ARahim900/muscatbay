"use client";

/**
 * @fileoverview Water 3D Map — the subsection wrapper (default export).
 *
 * Owns the map's UI state, mounts the Three.js scene, and wires the toolbar,
 * search/filters, panels and accessible table together. Monthly data comes from
 * the `waterMeters` the page already fetched; daily data is fetched here.
 * Reduced-motion, tab/off-screen pausing and WebGL-failure fallback are honoured
 * (a table view is always available, and becomes primary when WebGL is absent).
 *
 * @module components/water/map3d/water-3d-map
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Boxes, Table2, Info } from "lucide-react";
import type { WaterMeter } from "@/lib/water-data";
import { prefersReducedMotion } from "@/lib/motion";
import { saveFilterPreferences, loadFilterPreferences, type FilterPreferences } from "@/lib/filter-preferences";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/shared/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { useWaterMapData, type WaterMapQuery } from "@/components/water/map3d/use-water-map-data";
import { Water3DScene, type SceneSelection, type SceneHover, type SceneLayers } from "@/components/water/map3d/water-3d-scene";
import {
    NetworkKpis, ZoneSummaryPanel, ZoneDetailPanel, MeterDetailPanel, MapLegend, ProvisionalNotice,
} from "@/components/water/map3d/map-panels";
import {
    ModeToggle, MonthlyDateControl, DailyDateControl, LayerToggles, SceneSwitcher, MapSearch, MapFilters,
    DEFAULT_FILTERS, type MapFilterState,
} from "@/components/water/map3d/map-controls";
import { ZoneTable, MeterTable } from "@/components/water/map3d/map-table";
import type { MapMode, MapSnapshot } from "@/lib/water-map-data";
import type { MapZoneId } from "@/lib/water-map-config";
import { WATER_MAP_SCENES, SCENE_FOR_ZONE, SCENE_ORDER, type WaterMapSceneId } from "@/lib/water-map-scenes";

const PREFS_KEY = "water-map3d";

export function Water3DMap({ waterMeters }: { waterMeters: WaterMeter[] }) {
    const raw = useMemo<FilterPreferences>(() => loadFilterPreferences<FilterPreferences>(PREFS_KEY) ?? {}, []);
    const [reducedMotion] = useState(() => prefersReducedMotion());

    // ── UI state ─────────────────────────────────────────────────────────────
    const [mode, setMode] = useState<MapMode>(raw.mode === "daily" ? "daily" : "monthly");
    const [monthlyKey, setMonthlyKey] = useState<string | null>(typeof raw.monthlyKey === "string" ? raw.monthlyKey : null);
    const [dailyMonth, setDailyMonth] = useState<string | null>(null);
    const [dailyYear, setDailyYear] = useState<number | null>(null);
    const [dailyDay, setDailyDay] = useState(0); // 0 = auto → latest day of month
    const [selection, setSelection] = useState<SceneSelection>({ kind: "none", id: "" });
    const [filters, setFilters] = useState<MapFilterState>(DEFAULT_FILTERS);
    const [sceneId, setSceneId] = useState<WaterMapSceneId>("core");
    const [layers, setLayers] = useState<SceneLayers>({
        meters: raw.layerMeters !== false,
        labels: raw.layerLabels !== false,
    });
    const [view, setView] = useState<"map" | "table">("map");
    const [hover, setHover] = useState<SceneHover | null>(null);
    const [sceneReady, setSceneReady] = useState(false);
    const [sceneFailed, setSceneFailed] = useState(false);

    const query: WaterMapQuery = useMemo(
        () => ({ mode, monthlyKey, dailyMonth, dailyYear, dailyDay }),
        [mode, monthlyKey, dailyMonth, dailyYear, dailyDay],
    );
    const { snapshot, monthlyPeriods, dailyMonths, latestDailyDay, loadingDaily, error } = useWaterMapData(waterMeters, query);

    const snapshotRef = useRef<MapSnapshot | null>(snapshot);
    snapshotRef.current = snapshot;

    // ── Default selections once data is available ─────────────────────────────
    useEffect(() => {
        if (!monthlyKey && monthlyPeriods.length > 0) {
            setMonthlyKey(monthlyPeriods[monthlyPeriods.length - 1].periodKey);
        }
    }, [monthlyKey, monthlyPeriods]);

    useEffect(() => {
        if (!dailyMonth && dailyMonths.length > 0) {
            setDailyMonth(dailyMonths[0].month);
            setDailyYear(dailyMonths[0].year);
        }
    }, [dailyMonth, dailyMonths]);

    useEffect(() => {
        if (latestDailyDay > 0 && (dailyDay === 0 || dailyDay > latestDailyDay)) {
            setDailyDay(latestDailyDay);
        }
    }, [latestDailyDay, dailyDay]);

    // ── Persist prefs ─────────────────────────────────────────────────────────
    useEffect(() => {
        saveFilterPreferences(PREFS_KEY, {
            mode,
            monthlyKey: monthlyKey ?? null,
            layerMeters: layers.meters,
            layerLabels: layers.labels,
        });
    }, [mode, monthlyKey, layers]);

    // ── Scene lifecycle (create once) ─────────────────────────────────────────
    const containerRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<Water3DScene | null>(null);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const scene = new Water3DScene(
            el,
            { onSelect: (s) => setSelection(s), onHover: (h) => setHover(h) },
            { reducedMotion, layers },
        );
        sceneRef.current = scene;
        if (scene.ok) {
            setSceneReady(true);
        } else {
            setSceneFailed(true);
            setView("table");
        }
        return () => {
            scene.dispose();
            sceneRef.current = null;
            setSceneReady(false);
        };
        // Create once; subsequent updates flow through the effects below.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Active aerial scene.
    useEffect(() => {
        const s = sceneRef.current;
        if (!s || !sceneReady) return;
        s.setScene(sceneId);
    }, [sceneId, sceneReady]);

    // Snapshot → scene geometry.
    useEffect(() => {
        const s = sceneRef.current;
        if (!s || !sceneReady || !snapshot) return;
        s.setSnapshot(snapshot);
        s.setSelection(selection);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [snapshot, sceneReady]);

    // Selection → scene highlight + camera focus.
    useEffect(() => {
        const s = sceneRef.current;
        if (!s || !sceneReady) return;
        s.setSelection(selection);
        if (selection.kind === "zone") {
            s.focusZone(selection.id as MapZoneId);
        } else if (selection.kind === "meter") {
            const m = snapshotRef.current?.meters.find((x) => x.key === selection.id);
            s.focusZone((m?.zoneId ?? null) as MapZoneId | null);
        } else {
            s.focusZone(null);
        }
    }, [selection, sceneReady]);

    useEffect(() => {
        sceneRef.current?.setLayers(layers);
    }, [layers]);

    // ── Derived ────────────────────────────────────────────────────────────────
    const selectedZone = useMemo(
        () => (selection.kind === "zone" && snapshot ? snapshot.zones.find((z) => z.id === selection.id) ?? null : null),
        [selection, snapshot],
    );
    const selectedMeter = useMemo(
        () => (selection.kind === "meter" && snapshot ? snapshot.meters.find((m) => m.key === selection.id) ?? null : null),
        [selection, snapshot],
    );

    const filteredMeters = useMemo(() => {
        if (!snapshot) return [];
        return snapshot.meters.filter((m) => {
            if (filters.zoneId !== "all" && m.zoneId !== filters.zoneId) return false;
            if (filters.severity !== "all" && m.severity !== filters.severity) return false;
            if (filters.level !== "all" && m.level !== filters.level) return false;
            if (filters.issue === "missing" && m.value !== null) return false;
            if (filters.issue === "abnormal" && !m.flags.some((f) => f !== "Normal" && f !== "Missing reading")) return false;
            return true;
        });
    }, [snapshot, filters]);

    const selectZone = (id: string) => {
        const scene = SCENE_FOR_ZONE[id as MapZoneId];
        if (scene) setSceneId(scene);
        setSelection((prev) => (prev.kind === "zone" && prev.id === id ? { kind: "none", id: "" } : { kind: "zone", id }));
    };
    const selectMeter = (key: string) => {
        const m = snapshot?.meters.find((x) => x.key === key);
        if (m?.zoneId && SCENE_FOR_ZONE[m.zoneId]) {
            setSceneId(SCENE_FOR_ZONE[m.zoneId]);
        } else if (m) {
            for (const id of SCENE_ORDER) {
                if (WATER_MAP_SCENES[id].meterPoints.some((p) => p.account === m.account)) {
                    setSceneId(id);
                    break;
                }
            }
        }
        setSelection({ kind: "meter", id: key });
    };
    const clearSelection = () => setSelection({ kind: "none", id: "" });

    const detailNode = selectedMeter ? (
        <MeterDetailPanel meter={selectedMeter} onClose={clearSelection} />
    ) : selectedZone ? (
        <ZoneDetailPanel zone={selectedZone} onClose={clearSelection} />
    ) : null;

    const showMap = !sceneFailed && view === "map";
    const showTable = sceneFailed || view === "table";

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                    <ModeToggle mode={mode} onChange={setMode} />
                    {mode === "monthly" ? (
                        <MonthlyDateControl periods={monthlyPeriods} value={monthlyKey} onChange={setMonthlyKey} />
                    ) : (
                        <DailyDateControl
                            months={dailyMonths}
                            month={dailyMonth}
                            year={dailyYear}
                            day={dailyDay || latestDailyDay || 1}
                            latestDay={latestDailyDay || 31}
                            onMonthChange={(m, y) => {
                                setDailyMonth(m);
                                setDailyYear(y);
                                setDailyDay(0);
                            }}
                            onDayChange={setDailyDay}
                        />
                    )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {!sceneFailed && view === "map" && (
                        <SceneSwitcher
                            order={SCENE_ORDER}
                            labels={Object.fromEntries(SCENE_ORDER.map((id) => [id, WATER_MAP_SCENES[id].label]))}
                            active={sceneId}
                            onChange={(id) => {
                                setSceneId(id as WaterMapSceneId);
                                setSelection((prev) => {
                                    if (prev.kind === "zone" && SCENE_FOR_ZONE[prev.id as MapZoneId] !== id) return { kind: "none", id: "" };
                                    return prev;
                                });
                            }}
                        />
                    )}
                    {!sceneFailed && (
                        <LayerToggles
                            layers={layers}
                            onLayersChange={(p) => setLayers((prev) => ({ ...prev, ...p }))}
                        />
                    )}
                    <div role="group" aria-label="View" className="inline-flex rounded-[7px] border border-border bg-card p-0.5">
                        <button
                            type="button"
                            aria-pressed={showMap}
                            disabled={sceneFailed}
                            onClick={() => setView("map")}
                            className={cn(
                                "inline-flex items-center gap-1.5 rounded-[5px] px-2.5 py-1.5 text-[13px] font-semibold transition-colors disabled:opacity-40",
                                showMap ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                            )}
                        >
                            <Boxes className="h-3.5 w-3.5" aria-hidden="true" /> 3D
                        </button>
                        <button
                            type="button"
                            aria-pressed={showTable}
                            onClick={() => setView("table")}
                            className={cn(
                                "inline-flex items-center gap-1.5 rounded-[5px] px-2.5 py-1.5 text-[13px] font-semibold transition-colors",
                                showTable ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                            )}
                        >
                            <Table2 className="h-3.5 w-3.5" aria-hidden="true" /> Table
                        </button>
                    </div>
                </div>
            </div>

            {/* Search + filters */}
            {snapshot && (
                <div className="flex flex-wrap items-center gap-2">
                    <MapSearch meters={snapshot.meters} onPick={selectMeter} />
                    <MapFilters snapshot={snapshot} filters={filters} onChange={setFilters} />
                </div>
            )}

            {/* Network KPIs */}
            {snapshot && <NetworkKpis snapshot={snapshot} />}

            {sceneFailed && (
                <div className="flex items-start gap-2 rounded-[7px] border border-border/60 bg-muted/40 px-3 py-2 text-[12px] text-muted-foreground">
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-secondary" aria-hidden="true" />
                    <p>3D rendering is unavailable in this browser — showing the data as a table instead.</p>
                </div>
            )}

            {/* Main area */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className={cn("lg:col-span-2", showTable && "lg:col-span-3")}>
                    {/* Map (kept mounted so the scene persists; hidden in table view) */}
                    <div className={cn("space-y-2", !showMap && "hidden")}>
                        <div className="relative h-[440px] w-full overflow-hidden rounded-[10.5px] border border-border bg-card sm:h-[520px] lg:h-[600px]">
                            <div ref={containerRef} className="absolute inset-0" />
                            {loadingDaily && mode === "daily" && (
                                <div className="absolute inset-0 flex items-center justify-center bg-card/60 backdrop-blur-[1px]">
                                    <Skeleton className="h-24 w-64 rounded-xl" />
                                </div>
                            )}
                            {hover && (
                                <div
                                    className="pointer-events-none absolute z-10 max-w-[220px] -translate-x-1/2 -translate-y-full rounded-[7px] border border-border bg-card px-2.5 py-1.5 text-[12px] shadow-lg"
                                    style={{ left: hover.x, top: hover.y - 8 }}
                                    role="status"
                                >
                                    <p className="truncate font-semibold text-foreground">{hover.label}</p>
                                    <p className="truncate text-muted-foreground">{hover.value}</p>
                                </div>
                            )}
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <MapLegend />
                        </div>
                        <ProvisionalNotice />
                    </div>

                    {/* Table view */}
                    {showTable && snapshot && (
                        <div className="space-y-4">
                            <ZoneTable zones={snapshot.zones} periodLabel={snapshot.periodLabel} onSelect={selectZone} />
                            <MeterTable meters={filteredMeters} selectedKey={selectedMeter?.key ?? null} onSelect={selectMeter} />
                            <ProvisionalNotice />
                        </div>
                    )}

                    {!snapshot && !loadingDaily && (
                        <EmptyState
                            title="No water data for this period"
                            description="Pick another month or day, or check that the sync has run."
                        />
                    )}
                    {error && (
                        <p className="mt-2 text-[12px] text-mb-danger-text">{error}</p>
                    )}
                </div>

                {/* Sidebar (desktop) */}
                {!showTable && (
                    <div className="hidden lg:block">
                        {detailNode ?? (
                            snapshot && (
                                <ZoneSummaryPanel
                                    snapshot={snapshot}
                                    selectedZoneId={selection.kind === "zone" ? selection.id : null}
                                    onSelectZone={selectZone}
                                />
                            )
                        )}
                    </div>
                )}
            </div>

            {/* Zone summary below the map on mobile (map view) */}
            {!showTable && snapshot && (
                <div className="lg:hidden">
                    <ZoneSummaryPanel
                        snapshot={snapshot}
                        selectedZoneId={selection.kind === "zone" ? selection.id : null}
                        onSelectZone={selectZone}
                    />
                </div>
            )}

            {/* Detail as a bottom sheet on mobile */}
            {detailNode && (
                <div className="fixed inset-x-0 bottom-0 z-40 max-h-[70vh] overflow-auto border-t border-border bg-background p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-2xl lg:hidden">
                    {detailNode}
                </div>
            )}
        </div>
    );
}

export default Water3DMap;
