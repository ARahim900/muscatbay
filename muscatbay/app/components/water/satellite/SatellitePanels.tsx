"use client";
// The fixed panels either side of the map. The map shows where; these show
// what — every figure lives here, never in a box floating over the imagery.
import { useEffect, useRef } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity, Droplets, Gauge, ListFilter, MapPin, X } from "lucide-react";
import { Badge, Button, ChartFrame, SectionCard, chartTheme } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { WaterMeter } from "@/lib/water-data";
import { formatDay } from "./dailyModel";
import { MeterDetails } from "./MeterDetails";
import {
  LEVELS,
  LEVEL_LABELS,
  STATUSES,
  STATUS_LABELS,
  formatMapVolume,
  type ConsumptionMeter,
  type MeterStatus,
} from "./consumptionModel";
import type { ZoneLoss } from "./zoneBalance";

const STATUS_TONES = {
  normal: "success",
  elevated: "warning",
  high: "danger",
  zero: "warning",
  missing: "neutral",
} as const;
export const STATUS_STROKE: Record<MeterStatus, string> = {
  normal: "var(--color-success)",
  elevated: "var(--color-warning)",
  high: "var(--color-danger)",
  zero: "var(--color-warning)",
  missing: "var(--color-muted)",
};
/**
 * The map's marker, in miniature: a ring filled to the day's share of the
 * meter's own recent average (full at twice it), coloured by band. A zero
 * reading is an empty ring marked 0; a meter with no reading, or with too few
 * recorded days to have an average, carries a dashed ring.
 */
export function RingGauge({
  status,
  ratio,
  size = 20,
}: {
  status: MeterStatus;
  ratio: number | null;
  size?: number;
}) {
  const circumference = 2 * Math.PI * 14;
  const filled = ratio === null ? 0 : Math.min(ratio / 2, 1) * circumference;
  const dashed = status === "missing" || ratio === null;
  return (
    <svg
      aria-hidden
      viewBox="0 0 40 40"
      style={{ width: size, height: size }}
      className="shrink-0"
    >
      <circle cx="20" cy="20" r="18" fill="var(--color-card)" stroke="var(--color-line)" strokeWidth="1.5" />
      <circle
        cx="20"
        cy="20"
        r="14"
        fill="none"
        stroke={dashed ? STATUS_STROKE[status] : "var(--color-component)"}
        strokeWidth={dashed ? 3 : 5}
        strokeDasharray={dashed ? "4 4" : undefined}
      />
      {!dashed && filled > 0 && (
        <circle
          cx="20"
          cy="20"
          r="14"
          fill="none"
          stroke={STATUS_STROKE[status]}
          strokeWidth="5"
          strokeDasharray={`${filled} ${circumference}`}
          transform="rotate(-90 20 20)"
        />
      )}
      {status === "zero" && (
        <text x="20" y="25" textAnchor="middle" fontSize="15" fontWeight="600" fill="var(--color-warning)">
          0
        </text>
      )}
    </svg>
  );
}
const StatusDot = ({ status }: { status: MeterStatus }) => (
  <RingGauge status={status} ratio={status === "normal" ? 1 : status === "elevated" ? 1.5 : status === "high" ? 2 : null} />
);
const rowButton =
  "w-full min-h-11 px-5 py-2 text-left focus-visible:outline-3 focus-visible:-outline-offset-3 focus-visible:outline-accent hover:bg-component";
const field =
  "h-9 pointer-coarse:min-h-11 w-full rounded-control border border-line bg-card px-3 text-label text-fg focus-visible:outline-3 focus-visible:outline-accent";

/** Zones ranked by unaccounted water; choosing one flies the map to it. */
export function ZonesPanel({
  zones,
  selected,
  date,
  onZone,
}: {
  zones: ZoneLoss[];
  selected: string;
  date: string;
  onZone: (zone: string) => void;
}) {
  const ranked = [...zones].sort(
    (a, b) => (b.loss ?? -Infinity) - (a.loss ?? -Infinity),
  );
  const top = Math.max(1, ...ranked.map((z) => Math.max(0, z.loss ?? 0)));
  return (
    <SectionCard className="h-auto">
      <SectionCard.Header
        icon={Gauge}
        title="Zones"
        description={`Unaccounted water · ${formatDay(date)}`}
      />
      <SectionCard.Body flush>
        <ul>
          {ranked.map((zone) => (
            <li key={zone.id} className="border-b border-line last:border-b-0">
              <button
                type="button"
                aria-pressed={zone.id === selected}
                onClick={() => onZone(zone.id === selected ? "" : zone.id)}
                className={cn(rowButton, zone.id === selected && "bg-accent-tint")}
              >
                <span className="flex items-baseline justify-between gap-3 text-label tabular-nums text-fg">
                  <span className={cn(zone.id === selected && "font-semibold")}>
                    {zone.name}
                  </span>
                  <span>
                    {zone.loss === null
                      ? "—"
                      : `${formatMapVolume(zone.loss)} m³${zone.lossPct === null ? "" : ` · ${Math.round(zone.lossPct)}%`}`}
                  </span>
                </span>
                {zone.loss !== null && zone.loss > 0 && (
                  <span
                    aria-hidden
                    className="mt-1 block h-1 rounded-pill bg-component"
                  >
                    <span
                      className="block h-full rounded-pill bg-primary dark:bg-accent"
                      style={{ width: `${(zone.loss / top) * 100}%` }}
                    />
                  </span>
                )}
                <span className="mt-0.5 block text-caption text-muted">
                  {zone.reason ||
                    `${zone.reporting} of ${zone.count} reporting${zone.partial ? " · partial" : ""}`}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </SectionCard.Body>
    </SectionCard>
  );
}

/** Meter counts by status; a row narrows the map and the list to that status. */
export function StatusPanel({
  counts,
  selected,
  onStatus,
}: {
  counts: Record<MeterStatus, number>;
  selected: MeterStatus | "";
  onStatus: (status: MeterStatus | "") => void;
}) {
  return (
    <SectionCard className="h-auto">
      <SectionCard.Header
        icon={ListFilter}
        title="Meter status"
        description="Select one to filter the map"
      />
      <SectionCard.Body flush>
        <ul>
          {STATUSES.map((status) => (
            <li key={status} className="border-b border-line last:border-b-0">
              <button
                type="button"
                aria-pressed={status === selected}
                onClick={() => onStatus(status === selected ? "" : status)}
                className={cn(
                  rowButton,
                  "flex items-center gap-2.5 text-label text-fg",
                  status === selected && "bg-accent-tint font-semibold",
                )}
              >
                <StatusDot status={status} />
                <span className="flex-1">{STATUS_LABELS[status]}</span>
                <span className="tabular-nums">{counts[status]}</span>
              </button>
            </li>
          ))}
        </ul>
      </SectionCard.Body>
    </SectionCard>
  );
}

const STATUS_ORDER: Record<MeterStatus, number> = {
  high: 0,
  zero: 1,
  missing: 2,
  elevated: 3,
  normal: 4,
};
/** The meters on the map, findings first. A row and its dot select each other. */
export function MetersPanel({
  meters,
  selected,
  level,
  query,
  onMeter,
  onLevel,
  onQuery,
}: {
  meters: ConsumptionMeter[];
  selected: string;
  level: WaterMeter["level"];
  query: string;
  onMeter: (account: string) => void;
  onLevel: (level: WaterMeter["level"]) => void;
  onQuery: (query: string) => void;
}) {
  const list = useRef<HTMLUListElement>(null);
  const ranked = [...meters].sort(
    (a, b) =>
      STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
      (b.value ?? -Infinity) - (a.value ?? -Infinity),
  );
  // A dot tapped on the map brings its row into view, inside the list only.
  useEffect(() => {
    const row = list.current?.querySelector<HTMLElement>('[aria-pressed="true"]');
    const box = list.current;
    if (!row || !box) return;
    if (row.offsetTop < box.scrollTop || row.offsetTop + row.offsetHeight > box.scrollTop + box.clientHeight)
      box.scrollTop = row.offsetTop - box.clientHeight / 2 + row.offsetHeight / 2;
  }, [selected]);
  return (
    <SectionCard className="h-auto">
      <SectionCard.Header
        icon={Droplets}
        title="Meters"
        description={`Findings first · ${meters.length}`}
      />
      <SectionCard.Body flush>
        <div className="grid grid-cols-2 gap-2 border-b border-line p-3">
          <input
            type="search"
            value={query}
            aria-label="Search every meter"
            placeholder="Name or account"
            onChange={(event) => onQuery(event.target.value)}
            className={field}
          />
          <select
            aria-label="Meter level"
            value={level}
            onChange={(event) => onLevel(event.target.value as WaterMeter["level"])}
            className={field}
          >
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {l} · {LEVEL_LABELS[l]}
              </option>
            ))}
          </select>
        </div>
        {ranked.length === 0 ? (
          <p className="p-5 text-body text-muted">No meter matches this view.</p>
        ) : (
          <ul ref={list} className="relative max-h-80 overflow-y-auto">
            {ranked.map((meter) => (
              <li key={meter.account} className="border-b border-line last:border-b-0">
                <button
                  type="button"
                  aria-pressed={meter.account === selected}
                  onClick={() => onMeter(meter.account)}
                  className={cn(
                    rowButton,
                    "flex items-center gap-2.5 text-label text-fg",
                    meter.account === selected && "bg-accent-tint font-semibold",
                  )}
                >
                  <RingGauge status={meter.status} ratio={meter.ratio} />
                  <span className="min-w-0 flex-1 truncate">
                    {meter.name}
                    {!meter.location && (
                      <span className="text-caption font-normal text-muted"> · unmapped</span>
                    )}
                  </span>
                  {meter.status === "normal" ? (
                    <span className="shrink-0 tabular-nums">
                      {formatMapVolume(meter.value)} m³
                    </span>
                  ) : (
                    <Badge tone={STATUS_TONES[meter.status]} className="shrink-0">
                      {meter.status === "missing"
                        ? STATUS_LABELS.missing
                        : `${formatMapVolume(meter.value)} m³ · ${meter.ratio === null ? STATUS_LABELS[meter.status].toLowerCase() : `${Math.round(meter.ratio * 100)}%`}`}
                    </Badge>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </SectionCard.Body>
    </SectionCard>
  );
}

/** Bulk in against metered for the week ending on the day on screen. */
export function TrendPanel({
  bulk,
  metered,
  scope,
}: {
  /** The zone bulk (or the main supply at the All zones level); null if none. */
  bulk: ConsumptionMeter | null;
  metered: ConsumptionMeter[];
  scope: string;
}) {
  const days = (bulk ?? metered[0])?.trend.map((p) => p.date) ?? [];
  const rows = days.map((date, index) => {
    const read = metered
      .map((m) => m.trend[index]?.value ?? null)
      .filter((v): v is number => v !== null && v >= 0);
    return {
      day: formatDay(date).slice(0, 6),
      bulk: bulk?.trend[index]?.value ?? null,
      metered: read.length ? read.reduce((a, b) => a + b, 0) : null,
    };
  });
  return (
    <SectionCard className="h-auto">
      <SectionCard.Header
        icon={Activity}
        title="Last 7 days"
        description={`${scope} · bulk in against metered, m³`}
      />
      <SectionCard.Body>
        {rows.every((r) => r.bulk === null && r.metered === null) ? (
          <p className="text-body text-muted">No readings recorded in this week.</p>
        ) : (
          <ChartFrame
            series={2}
            legend={[
              { label: "Bulk in", color: chartTheme.series[0] },
              { label: "Metered (L3)", color: chartTheme.series[1] },
            ]}
          >
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 1, height: 1 }}>
              <LineChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
                <CartesianGrid {...chartTheme.grid} />
                <XAxis dataKey="day" {...chartTheme.axis} />
                <YAxis {...chartTheme.axis} />
                <Tooltip {...chartTheme.tooltip} />
                {/* Gaps are never joined: a day with no reading breaks the line. */}
                <Line dataKey="bulk" name="Bulk in" stroke={chartTheme.series[0]} connectNulls={false} {...chartTheme.line} />
                <Line dataKey="metered" name="Metered (L3)" stroke={chartTheme.series[1]} connectNulls={false} {...chartTheme.line} />
              </LineChart>
            </ResponsiveContainer>
          </ChartFrame>
        )}
      </SectionCard.Body>
    </SectionCard>
  );
}

/** The selected meter: reading, status, week and house connection in one place. */
export function SelectedMeterPanel({
  meter,
  date,
  villaLink,
  onClose,
}: {
  meter: ConsumptionMeter | undefined;
  date: string;
  villaLink: string;
  onClose: () => void;
}) {
  return (
    <SectionCard className="h-auto">
      <SectionCard.Header
        icon={MapPin}
        title="Selected meter"
        description={meter ? meter.name : "Select a dot or a row"}
        action={
          meter && (
            <Button variant="ghost" icon={X} aria-label="Close meter details" onClick={onClose} />
          )
        }
      />
      {meter && (
        <SectionCard.Body flush>
          <div className="flex flex-wrap items-center gap-2 border-b border-line px-5 py-3">
            <RingGauge status={meter.status} ratio={meter.ratio} size={28} />
            <Badge tone={STATUS_TONES[meter.status]}>
              {STATUS_LABELS[meter.status]}
            </Badge>
            <span className="text-caption text-muted">{meter.statusNote}</span>
          </div>
          {villaLink && (
            <p className="border-b border-line px-5 py-3 text-caption text-muted">
              {villaLink}
            </p>
          )}
          <MeterDetails meter={meter} date={date} />
        </SectionCard.Body>
      )}
    </SectionCard>
  );
}
