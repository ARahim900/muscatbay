"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { Info, Link2, MapPin, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/mb-button";
import { SectionCard } from "@/components/ui/section-card";
import type { WaterMeter } from "@/lib/water-data";
import { SatelliteMap } from "./SatelliteMap";
import { MeterDetails } from "./MeterDetails";
import { SatelliteFilters } from "./SatelliteFilters";
import { summariseZoneBalance, summariseZoneLosses } from "./zoneBalance";
import { UnmappedMeters } from "./UnmappedMeters";
import { SatelliteSummary } from "./SatelliteSummary";
import { MeterRanking } from "./MeterRanking";
import { useSatelliteDaily } from "./useSatelliteDaily";
import {
  formatDay,
  latestRecordedDay,
  shiftDay,
  validDate,
} from "./dailyModel";
import {
  STATUSES,
  STATUS_LABELS,
  buildConsumptionMeters,
  formatMapVolume,
  readSatelliteState,
  satelliteUrl,
  summariseMeters,
  zoneName,
  type MeterLocation,
  type MeterStatus,
  type SatelliteState,
} from "./consumptionModel";

// Legend swatches — the same status tokens the map's dots use.
const STATUS_DOTS: Record<MeterStatus, string> = {
  normal: "bg-accent",
  high: "bg-danger",
  zero: "bg-warning",
  missing: "bg-card",
};
/** True when the link names its own day; otherwise the page opens on the latest recorded one. */
const linkHasDate = () =>
  typeof window !== "undefined" &&
  validDate(new URLSearchParams(window.location.search).get("date") ?? "");

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
  const [villaLink, setVillaLink] = useState("");
  // Until the operator picks a day, the page follows the latest recorded one —
  // yesterday is often not entered yet, and an empty map reads as broken.
  const [followLatest, setFollowLatest] = useState(() => !linkHasDate());
  const daily = useSatelliteDaily(state.date, lastUpdated);
  // Open on the latest recorded day (this month, else the one before). State is
  // adjusted while rendering — React's pattern for state that follows loaded
  // data — and the URL is left without a date, so the link keeps following.
  if (followLatest && !daily.loading && !daily.error) {
    const accounts = new Set(waterMeters.map((m) => m.accountNumber));
    const latest =
      latestRecordedDay(daily.rows, accounts, state.date) ??
      latestRecordedDay(
        daily.rows,
        accounts,
        shiftDay(`${state.date.slice(0, 7)}-01`, -1),
      );
    setFollowLatest(false);
    if (latest && latest !== state.date) setState({ ...state, date: latest });
  }
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
  // The map always carries the selected zone's bulk meter (water in) beside the
  // meters of the chosen level, and keeps the zone's individual meters in view
  // while the bulk itself is selected. Tables and totals still follow `scope`.
  // The status filter narrows the map and the table; totals stay on `scope`.
  const visible = useMemo(
    () => (state.status ? scope.filter((m) => m.status === state.status) : scope),
    [scope, state.status],
  );
  const mapMeters = useMemo(() => {
    if (!state.zone) return visible;
    const extra = meters.filter(
      (m) =>
        m.zone === state.zone &&
        (m.level === "L2" ||
          (state.level === "L2" &&
            m.level === "L3" &&
            (!state.status || m.status === state.status))),
    );
    return [...new Set([...extra, ...visible])];
  }, [meters, visible, state.zone, state.level, state.status]);
  const statusCounts = useMemo(() => {
    const counts = Object.fromEntries(STATUSES.map((s) => [s, 0])) as Record<
      MeterStatus,
      number
    >;
    for (const meter of scope) counts[meter.status] += 1;
    return counts;
  }, [scope]);
  const zoneLosses = useMemo(() => summariseZoneLosses(meters), [meters]);
  const summary = useMemo(() => summariseMeters(scope), [scope]);
  const balance = useMemo(
    () => summariseZoneBalance(meters, state.zone),
    [meters, state.zone],
  );
  const zones = useMemo(
    () => [...new Set(waterMeters.map((m) => m.zone).filter(Boolean))].sort(),
    [waterMeters],
  );
  const zoneChips = useMemo(
    () => zones.map((id) => ({ id, name: zoneName(id) })),
    [zones],
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
    : visible;
  const selected = meters.find((m) => m.account === state.meter);
  const panelOnMap = selected?.location && !mapUnavailable;
  useEffect(() => {
    const restore = () => {
      setState(readSatelliteState(window.location.search, waterMeters));
      setFollowLatest(!linkHasDate());
      setShowAll(false);
    };
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, [waterMeters]);
  const change = useCallback(
    (patch: Partial<SatelliteState>, replace = false) => {
      if (patch.date !== undefined && !validDate(patch.date)) return;
      if (patch.date !== undefined) setFollowLatest(false);
      const next = { ...state, ...patch };
      window.history[replace ? "replaceState" : "pushState"](
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
  const stepDay = useCallback(
    (date: string) => change({ date }, true),
    [change],
  );
  const selectZone = useCallback(
    (zone: string) => {
      change({
        zone,
        meter: "",
        ...(zone === "Zone_01_(FM)" ? { level: "L3" as const } : {}),
      });
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
  const reportingLine = daily.loading
    ? "Refreshing daily readings…"
    : daily.error
      ? "Refresh failed · data may be stale"
      : `${summary.reporting} of ${scope.length} reporting${summary.partial ? " · partial" : ""}`;
  // Meter details: a sheet docked to the map's bottom edge on a phone (also in
  // full screen), a card in the map's corner on wider screens.
  const meterSheet = selected && (
    <div
      className={
        panelOnMap
          ? "absolute inset-x-0 bottom-0 z-30 max-h-3/5 overflow-auto rounded-t-card border border-line bg-primary text-on-primary shadow-card sm:inset-x-auto sm:bottom-3 sm:right-3 sm:w-80 sm:rounded-card"
          : "m-3 rounded-card border border-line bg-primary text-on-primary"
      }
    >
      <div className="flex items-center justify-between gap-2 px-3 pt-2">
        <div className="min-w-0">
          <p className="truncate text-label font-semibold">
            {selected.name} · {formatMapVolume(selected.value)} m³
          </p>
          <p className="text-caption text-on-primary">
            {formatDay(state.date)} · {STATUS_LABELS[selected.status]}
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
      <p className="px-3 text-caption text-on-primary">{selected.statusNote}</p>
      {villaLink && (
        <p className="px-3 pt-1 text-caption text-on-primary">{villaLink}</p>
      )}
      <details>
        <summary className="min-h-11 cursor-pointer content-center px-3 text-label">
          Daily trend and meter details
        </summary>
        <div className="max-h-60 overflow-auto rounded-b-card bg-card text-fg">
          <MeterDetails meter={selected} date={state.date} />
        </div>
      </details>
    </div>
  );
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
        statusCounts={statusCounts}
        latestDay={latestDay}
        loading={daily.loading}
        onChange={change}
        onDay={stepDay}
        onZone={selectZone}
        onQuery={(value) => {
          setQuery(value);
          setShowAll(false);
        }}
      />
      {state.zone === "Zone_01_(FM)" && (
        <div className="flex flex-wrap items-center gap-3 text-label">
          <label htmlFor="fm-building">FM building</label>
          <select
            id="fm-building"
            aria-label="FM building"
            className="min-h-11 max-w-full rounded-control border border-line bg-card px-3 py-2 text-body text-fg focus-visible:outline-3 focus-visible:outline-accent"
            value={selected?.level === "L3" ? state.meter : ""}
            onChange={(event) =>
              event.target.value
                ? selectMeter(event.target.value)
                : change({ meter: "", level: "L3" })
            }
          >
            <option value="">All FM buildings</option>
            {meters
              .filter(
                (meter) =>
                  meter.zone === "Zone_01_(FM)" && meter.level === "L3",
              )
              .map((meter) => (
                <option key={meter.account} value={meter.account}>
                  {meter.name}
                </option>
              ))}
          </select>
          {state.level !== "L3" && (
            <Button onClick={() => change({ level: "L3", meter: "" })}>
              Show building meters
            </Button>
          )}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3 text-caption text-muted">
        <span>Daily records · Oman dates · missing readings stay —</span>
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
            action={
              <p className="text-right text-caption text-muted">
                <span className="block text-label tabular-nums text-fg">
                  {formatMapVolume(summary.total)} m³
                </span>
                {reportingLine}
              </p>
            }
          />
          <SectionCard.Body flush className="relative">
            <SatelliteMap
              onUnavailable={setMapUnavailable}
              meters={mapMeters}
              zone={state.zone}
              zones={zoneChips}
              zoneLosses={zoneLosses}
              selected={state.meter}
              date={state.date}
              summary={`${formatDay(state.date)} · ${formatMapVolume(summary.total)} m³ · ${reportingLine}`}
              onLocations={setLocations}
              onZone={selectZone}
              onMeter={selectMeter}
              onVillaLink={setVillaLink}
            >
              {panelOnMap && meterSheet}
            </SatelliteMap>
            {!panelOnMap && meterSheet}
          </SectionCard.Body>
        </SectionCard>
      </div>
      <div className="space-y-2 text-caption text-muted">
        <ul className="flex flex-wrap gap-x-5 gap-y-2">
          <li>Circle size = daily m³</li>
          <li className="flex flex-wrap items-center gap-x-3 gap-y-1">
            Colour = status:
            {STATUSES.map((status) => (
              <span key={status} className="inline-flex items-center gap-1.5">
                <span
                  aria-hidden
                  className={`h-2.5 w-2.5 rounded-pill border border-neutral ${STATUS_DOTS[status]}`}
                />
                {STATUS_LABELS[status]}
              </span>
            ))}
          </li>
          <li>White ring = zone bulk meter</li>
        </ul>
        <details>
          <summary className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 focus-visible:outline-3 focus-visible:outline-accent">
            <Info size={16} strokeWidth={2} aria-hidden />
            About this map
          </summary>
          <p>
            High usage follows the Daily report&apos;s rule: at least twice the
            meter&apos;s recent daily average and 5 m³ above it. Solid lines:
            existing drawing network (includes previously adjusted road
            alignments). Positions include building and zone reference points;
            exact meter chambers may be unverified. Satellite imagery is not
            live. Missing readings stay —, never 0.
            {state.zone === "Zone_01_(FM)" &&
              " Dashed FM links are schematic building connections, not surveyed pipe routes or measured flow."}
          </p>
        </details>
      </div>
      <UnmappedMeters meters={scope} ready={locations !== null} />
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
