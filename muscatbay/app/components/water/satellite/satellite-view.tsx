"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { Link2, MapPin, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/mb-button";
import { SectionCard } from "@/components/ui/section-card";
import type { WaterMeter } from "@/lib/water-data";
import { SatelliteMap } from "./SatelliteMap";
import { MeterDetails } from "./MeterDetails";
import { SatelliteFilters } from "./SatelliteFilters";
import { summariseZoneBalance } from "./zoneBalance";
import { SatelliteSummary } from "./SatelliteSummary";
import { MeterRanking } from "./MeterRanking";
import { useSatelliteDaily } from "./useSatelliteDaily";
import { formatDay, latestRecordedDay, validDate } from "./dailyModel";
import {
  buildConsumptionMeters,
  formatVolume,
  readSatelliteState,
  satelliteUrl,
  summariseMeters,
  zoneName,
  type MeterLocation,
  type SatelliteState,
} from "./consumptionModel";

interface SatelliteViewProps {
  waterMeters: WaterMeter[];
  lastUpdated?: Date | null;
}
export function SatelliteView({
  waterMeters,
  lastUpdated,
}: SatelliteViewProps) {
  const [state, setState] = useState<SatelliteState>(() =>
    readSatelliteState(
      typeof window === "undefined" ? "" : window.location.search,
      waterMeters,
    ),
  );
  const [locations, setLocations] = useState<MeterLocation[] | null>(null);
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapUnavailable, setMapUnavailable] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");
  const daily = useSatelliteDaily(state.date, lastUpdated);
  const meters = useMemo(
    () =>
      buildConsumptionMeters(
        waterMeters,
        state.date,
        locations ?? [],
        daily.rows,
      ),
    [waterMeters, state.date, locations, daily.rows],
  );
  const scope = useMemo(
    () =>
      meters.filter(
        (m) =>
          m.level === state.level && (!state.zone || m.zone === state.zone),
      ),
    [meters, state.level, state.zone],
  );
  const summary = useMemo(() => summariseMeters(scope), [scope]);
  const balance = useMemo(
    () => summariseZoneBalance(meters, state.zone),
    [meters, state.zone],
  );
  const zones = useMemo(
    () => [...new Set(waterMeters.map((m) => m.zone).filter(Boolean))].sort(),
    [waterMeters],
  );
  const latestDay = useMemo(
    () =>
      latestRecordedDay(
        daily.rows,
        new Set(scope.map((m) => m.account)),
        state.date,
      ),
    [daily.rows, scope, state.date],
  );
  const search = query.trim().toLowerCase();
  const ranked = search
    ? meters.filter((m) =>
        `${m.name} ${m.account} ${m.zone}`.toLowerCase().includes(search),
      )
    : scope;
  const selected = meters.find((m) => m.account === state.meter);
  const panelOnMap = selected?.location && !mapUnavailable;
  useEffect(() => {
    const restore = () => {
      setState(readSatelliteState(window.location.search, waterMeters));
      setShowAll(false);
    };
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, [waterMeters]);
  const change = useCallback(
    (patch: Partial<SatelliteState>) => {
      if (patch.date !== undefined && !validDate(patch.date)) return;
      const next = { ...state, ...patch };
      window.history.pushState(
        null,
        "",
        satelliteUrl(window.location.href, next),
      );
      setState(next);
      setShowAll(false);
      setCopyStatus("");
    },
    [state],
  );
  const selectZone = useCallback(
    (zone: string) => {
      change({ zone, meter: "" });
      setQuery("");
    },
    [change],
  );
  const selectMeter = useCallback(
    (account: string) => {
      const meter = waterMeters.find((m) => m.accountNumber === account);
      if (!meter) return;
      change({ meter: account, zone: meter.zone, level: meter.level });
      setQuery("");
      requestAnimationFrame(() =>
        mapRef.current?.scrollIntoView({
          block: "nearest",
          behavior: "instant",
        }),
      );
    },
    [waterMeters, change],
  );
  const copyLink = async () => {
    const url = new URL(
      satelliteUrl(window.location.href, state),
      window.location.origin,
    ).href;
    try {
      await navigator.clipboard.writeText(url);
      setCopyStatus("View link copied.");
    } catch (error) {
      console.error("Could not copy satellite view link", error);
      setCopyStatus(`Copy this view link: ${url}`);
    }
  };
  return (
    <section
      aria-label="Satellite daily consumption"
      className="space-y-3.5 text-fg"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-title text-primary dark:text-fg">
            Daily consumption on the map
          </h2>
          <p className="text-body text-muted">
            Select a day and zone. Tap a labelled meter for details.
          </p>
        </div>
        <Button variant="primary" icon={Link2} onClick={copyLink}>
          Copy view link
        </Button>
      </div>
      {copyStatus && (
        <p role="status" className="break-all text-body">
          {copyStatus}
        </p>
      )}
      <SatelliteFilters
        state={state}
        zones={zones}
        query={query}
        onChange={change}
        onZone={selectZone}
        onQuery={(value) => {
          setQuery(value);
          setShowAll(false);
        }}
      />
      <div className="flex flex-wrap items-center gap-3 text-caption text-muted">
        <span>Daily records · Oman dates · missing readings stay —</span>
        {latestDay && latestDay !== state.date && (
          <Button onClick={() => change({ date: latestDay })}>
            Latest recorded day · {formatDay(latestDay)}
          </Button>
        )}
        <Button
          icon={RefreshCw}
          loading={daily.loading}
          onClick={daily.refresh}
        >
          Refresh readings
        </Button>
      </div>
      {daily.error && (
        <p role="alert" className="text-body">
          Daily readings could not be refreshed: {daily.error}.{" "}
          {daily.stale
            ? "Last fetched values remain visible."
            : "Values are unavailable."}
        </p>
      )}
      <div ref={mapRef}>
        <SectionCard>
          <SectionCard.Header
            icon={MapPin}
            title="Satellite map"
            description={`${formatDay(state.date)} · ${state.zone ? zoneName(state.zone) : "All zones"} · ${state.level}`}
          />
          <SectionCard.Body flush className="relative">
            <SatelliteMap
              onUnavailable={setMapUnavailable}
              meters={scope}
              zone={state.zone}
              selected={state.meter}
              date={state.date}
              onLocations={setLocations}
              onZone={selectZone}
              onMeter={selectMeter}
            />
            {!mapUnavailable && (
              <div className="pointer-events-none absolute left-3 top-3 z-10 max-w-xs rounded-control border border-line bg-primary px-3 py-2 text-caption text-on-primary shadow-card">
                <p className="font-semibold">
                  {formatDay(state.date)} · {formatVolume(summary.total)} m³
                  recorded
                </p>
                <p>
                  {daily.loading
                    ? "Refreshing daily readings…"
                    : daily.error
                      ? "Refresh failed · data may be stale"
                      : `${summary.reporting} of ${scope.length} reporting${summary.partial ? " · Partial data" : ""}`}
                </p>
                <p>Circle size = daily m³ · zoom in for labels</p>
              </div>
            )}
            {selected && (
              <div
                className={
                  panelOnMap
                    ? "absolute bottom-12 left-3 right-3 z-10 rounded-card border border-line bg-primary text-on-primary shadow-card sm:left-auto sm:w-80"
                    : "m-3 rounded-card border border-line bg-primary text-on-primary"
                }
              >
                <div className="flex items-center justify-between gap-2 px-3 pt-2">
                  <div>
                    <p className="text-label font-semibold">
                      {selected.name} · {formatVolume(selected.value)} m³
                    </p>
                    <p className="text-caption text-on-primary">
                      {formatDay(state.date)} ·{" "}
                      {selected.value === null
                        ? "No recorded reading"
                        : "Daily consumption"}
                      {!selected.location ? " · Unmapped" : ""}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    icon={X}
                    className="text-on-primary hover:bg-primary-hover hover:text-on-primary"
                    aria-label="Close meter details"
                    onClick={() => change({ meter: "" })}
                  />
                </div>
                <details>
                  <summary className="cursor-pointer px-3 py-2 text-label">
                    Daily trend and meter details
                  </summary>
                  <div className="max-h-60 overflow-auto rounded-b-card bg-card text-fg">
                    <MeterDetails meter={selected} date={state.date} />
                  </div>
                </details>
              </div>
            )}
          </SectionCard.Body>
        </SectionCard>
      </div>
      <p className="text-caption text-muted">
        Sage circles: recorded · hollow: missing or invalid · purple outline:
        selected. Labels show daily m³. Positions come from the drawing
        register;{" "}
        {locations === null
          ? "map register loading"
          : `${scope.length - summary.mapped} meters have no mapped position`}
        . Satellite imagery is not live.
      </p>
      <SatelliteSummary
        state={state}
        balance={balance}
        locationsKnown={locations !== null}
        lastUpdated={daily.refreshed}
      />
      <details
        id="satellite-meter-list"
        open={mapUnavailable || Boolean(search)}
        className="scroll-mt-4 rounded-card border border-line bg-card shadow-card"
      >
        <summary className="min-h-11 cursor-pointer p-4 text-title">
          Meter table · {ranked.length} meters
        </summary>
        {search && (
          <p role="status" className="p-3 text-caption">
            Search results across all levels and zones. Map totals retain their
            selected scope.
          </p>
        )}
        <MeterRanking
          locationsReady={locations !== null}
          meters={ranked}
          selected={state.meter}
          onSelect={selectMeter}
          showAll={showAll}
          onShowAll={() => setShowAll(true)}
        />
      </details>
    </section>
  );
}
