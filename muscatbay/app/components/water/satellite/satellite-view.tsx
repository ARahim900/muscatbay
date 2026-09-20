"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { Info, Link2, MapPin, RefreshCw, X } from "lucide-react";
import { Badge, Button, SectionCard, SegmentedControl } from "@/components/ui";
import type { WaterMeter } from "@/lib/water-data";
import { SatelliteMap } from "./SatelliteMap";
import {
  StatusBar,
  MetersPanel,
  SelectedMeterPanel,
  StatusPanel,
  TrendPanel,
  ZonesPanel,
} from "./SatellitePanels";
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

// Legend: one bar per band, each at a reading typical of it.
const RING_LEGEND: Record<MeterStatus, number | null> = {
  normal: 1,
  elevated: 1.5,
  high: 2,
  zero: 0,
  missing: null,
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
    () =>
      state.status ? scope.filter((m) => m.status === state.status) : scope,
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
  const zoneRow = zoneLosses.find((z) => z.id === state.zone) ?? null;
  // Week chart: the zone's bulk against its L3 meters; at the All zones level,
  // the main supply against every L3 meter on site.
  const trendBulk =
    (state.zone
      ? meters.find(
          (m) => m.account === balance.bulkAccount && m.level === "L2",
        )
      : meters.filter((m) => m.level === "L1").length === 1
        ? meters.find((m) => m.level === "L1")
        : undefined) ?? null;
  const trendMetered = meters.filter(
    (m) => m.level === "L3" && (!state.zone || m.zone === state.zone),
  );
  // Three levels, one frame: All zones → Zone → Meter. "Zone" with none chosen
  // opens the zone losing the most; "Meter" opens the first finding in view.
  const level = selected ? "meter" : state.zone ? "zone" : "all";
  const topZone = [...zoneLosses].sort(
    (a, b) => (b.loss ?? -Infinity) - (a.loss ?? -Infinity),
  )[0];
  const firstMeter =
    visible.find((m) => m.status !== "normal" && m.location) ??
    [...visible]
      .filter((m) => m.location)
      .sort((a, b) => (b.value ?? -Infinity) - (a.value ?? -Infinity))[0];
  const changeLevel = (next: "all" | "zone" | "meter") => {
    if (next === "all") selectZone("");
    else if (next === "zone") {
      if (state.zone) change({ meter: "" });
      else if (topZone) selectZone(topZone.id);
    } else if (!selected && firstMeter) selectMeter(firstMeter.account);
  };
  // Shown over the map in full screen only, where the panels are out of view.
  const meterSheet = selected && (
    <div className="absolute inset-x-0 bottom-0 z-30 border-t border-line bg-card px-4 py-3 text-fg shadow-card sm:inset-x-auto sm:bottom-3 sm:right-3 sm:w-80 sm:rounded-card sm:border">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-label font-semibold tabular-nums">
            {selected.name} · {formatMapVolume(selected.value)} m³
          </p>
          <p className="text-caption text-muted">
            {STATUS_LABELS[selected.status]} · {selected.statusNote}
          </p>
          {villaLink && <p className="text-caption text-muted">{villaLink}</p>}
        </div>
        <Button
          variant="ghost"
          icon={X}
          aria-label="Close meter details"
          onClick={() => change({ meter: "" })}
        />
      </div>
    </div>
  );
  return (
    <section
      aria-label="Satellite daily consumption"
      className="space-y-3.5 text-fg"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SegmentedControl
          aria-label="Map level"
          className="w-auto"
          value={level}
          onChange={changeLevel}
          options={[
            { value: "all", label: "All zones" },
            {
              value: "zone",
              label: state.zone ? zoneName(state.zone) : "Zone",
            },
            { value: "meter", label: selected ? selected.name : "Meter" },
          ]}
        />
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            dot
            tone={
              daily.error ? "danger" : summary.partial ? "warning" : "success"
            }
          >
            {reportingLine}
          </Badge>
          <Button
            icon={RefreshCw}
            loading={daily.loading}
            onClick={daily.refresh}
          >
            Refresh
          </Button>
          <Button variant="primary" icon={Link2} onClick={copyLink}>
            Copy view link
          </Button>
        </div>
      </div>
      {copyStatus && (
        <p role="status" className="break-all text-body">
          {copyStatus}
        </p>
      )}
      <SatelliteFilters
        state={state}
        latestDay={latestDay}
        loading={daily.loading}
        onChange={change}
        onDay={stepDay}
      />
      {daily.error && (
        <p role="alert" className="text-body">
          Daily readings could not be refreshed: {daily.error}.{" "}
          {daily.stale
            ? "Last fetched values remain visible."
            : "Values are unavailable."}
        </p>
      )}
      {/* One frame at every level: KPI strip, then panels · map · panels. On a
          phone the same blocks stack — map, KPIs, meters, week, zones — and
          nothing is ever laid over the map. */}
      <div className="grid gap-3.5 xl:grid-cols-[16rem_minmax(0,1fr)_19rem] 2xl:grid-cols-[18rem_minmax(0,1fr)_22rem]">
        <div className="contents xl:col-start-2 xl:row-start-2 xl:block xl:min-w-0 xl:space-y-3.5">
          <div ref={mapRef} className="order-1 min-w-0 space-y-2">
            <SectionCard className="h-auto">
              <SectionCard.Header
                icon={MapPin}
                title="Satellite map"
                description={`${formatDay(state.date)} · ${state.zone ? zoneName(state.zone) : "All zones"} · ${state.level}`}
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
                  {meterSheet}
                </SatelliteMap>
              </SectionCard.Body>
            </SectionCard>
            <div className="space-y-1 text-caption text-muted">
              <ul className="flex flex-wrap items-center gap-x-5 gap-y-1">
                {STATUSES.map((status) => (
                  <li key={status} className="inline-flex items-center gap-1.5">
                    <StatusBar status={status} ratio={RING_LEGEND[status]} width={44} />
                    {STATUS_LABELS[status]}
                  </li>
                ))}
                <li>
                  One segment per 40% of that meter&apos;s usual — all five
                  from twice it
                </li>
              </ul>
              <details>
                <summary className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 focus-visible:outline-3 focus-visible:outline-accent">
                  <Info size={16} strokeWidth={2} aria-hidden />
                  About this map
                </summary>
                <p>
                  Each meter is judged against its own average over its last
                  recorded days (up to 7, at least 3): elevated from 130% of
                  that average, high usage from 200%. Too few recorded days and
                  the ring is dashed, with no verdict. Unaccounted water is the
                  zone bulk minus its L3 meters for the same day; when some
                  meters have not reported it is marked partial and can only
                  overstate the loss. It may include leakage, unmetered use or
                  reading-time differences; it is not a confirmed leak
                  measurement. Solid lines: existing drawing network (includes
                  previously adjusted road alignments). Positions include
                  building and zone reference points; exact meter chambers may
                  be unverified. Satellite imagery is not live. Missing readings
                  stay —, never 0.
                  {state.zone === "Zone_01_(FM)" &&
                    " Dashed FM links are schematic building connections, not surveyed pipe routes or measured flow."}
                </p>
              </details>
            </div>
          </div>
          <div className="order-4 min-w-0">
            <TrendPanel
              bulk={trendBulk}
              metered={trendMetered}
              scope={state.zone ? zoneName(state.zone) : "Whole site"}
            />
          </div>
        </div>
        <div className="order-2 min-w-0 xl:col-span-3 xl:row-start-1">
          <SatelliteSummary
            zone={zoneRow}
            zones={zoneLosses}
            meters={meters}
            statusCounts={statusCounts}
          />
        </div>
        <div className="order-3 min-w-0 space-y-3.5 xl:col-start-3 xl:row-start-2">
          <MetersPanel
            meters={ranked}
            selected={state.meter}
            level={state.level}
            query={query}
            onMeter={selectMeter}
            onLevel={(next) => change({ level: next, meter: "" })}
            onQuery={(value) => {
              setQuery(value);
              setShowAll(false);
            }}
          />
          <SelectedMeterPanel
            meter={selected}
            date={state.date}
            villaLink={villaLink}
            onClose={() => change({ meter: "" })}
          />
        </div>
        <div className="order-5 min-w-0 space-y-3.5 xl:col-start-1 xl:row-start-2">
          <ZonesPanel
            zones={zoneLosses}
            selected={state.zone}
            date={state.date}
            onZone={selectZone}
          />
          <StatusPanel
            counts={statusCounts}
            selected={state.status}
            onStatus={(status) => change({ status, meter: "" })}
          />
        </div>
      </div>
      <p className="text-caption text-muted">
        Daily records · Oman dates · last refreshed{" "}
        {daily.refreshed
          ? daily.refreshed.toLocaleString("en-GB", {
              timeZone: "Asia/Muscat",
              dateStyle: "medium",
              timeStyle: "short",
            }) + " · Oman"
          : "unknown"}
        .
      </p>
      <UnmappedMeters meters={scope} ready={locations !== null} />
      <details
        id="satellite-meter-list"
        open={mapUnavailable}
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
