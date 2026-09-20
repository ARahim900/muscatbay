"use client";
import { useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/mb-button";
import { Slider } from "@/components/ui/slider";
import { formatDay, omanToday } from "./dailyModel";
import type { WaterMeter } from "@/lib/water-data";
import {
  LEVELS,
  LEVEL_LABELS,
  STATUSES,
  STATUS_LABELS,
  zoneName,
  type MeterStatus,
  type SatelliteState,
} from "./consumptionModel";
const control =
  "h-9 pointer-coarse:min-h-11 w-full rounded-control border border-line bg-card px-3 text-label text-fg shadow-card focus-visible:outline-3 focus-visible:outline-accent";

interface SatelliteFiltersProps {
  state: SatelliteState;
  zones: string[];
  query: string;
  /** Meters per status in the current zone and level, for the Status options. */
  statusCounts: Record<MeterStatus, number>;
  latestDay: string | null;
  loading: boolean;
  onChange: (patch: Partial<SatelliteState>) => void;
  /** Day steps replace the URL entry, so dragging does not flood Back. */
  onDay: (date: string) => void;
  onZone: (zone: string) => void;
  onQuery: (query: string) => void;
}
export function SatelliteFilters({
  state,
  zones,
  query,
  statusCounts,
  latestDay,
  loading,
  onChange,
  onDay,
  onZone,
  onQuery,
}: SatelliteFiltersProps) {
  const month = state.date.slice(0, 7);
  const day = Number(state.date.slice(8, 10));
  const today = omanToday();
  const monthEnd = new Date(
    Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0),
  ).getUTCDate();
  // A day that has not happened yet cannot be selected.
  const maxDay = today.startsWith(month) ? Number(today.slice(8, 10)) : monthEnd;
  const setDay = useCallback(
    (value: number) => onDay(`${month}-${String(value).padStart(2, "0")}`),
    [month, onDay],
  );
  // Stable handler: an inline arrow makes the Radix slider re-fire in a loop
  // (same guard as the Daily report's day slider).
  const slide = useCallback((values: number[]) => setDay(values[0]), [setDay]);
  return (
    <div className="space-y-3.5">
      {/* Reading day — the Daily report's control: month, chevrons, day slider. */}
      <div className="flex flex-wrap items-center gap-3 rounded-card border border-line bg-card px-4 py-3 shadow-card">
        <label className="flex items-center gap-2 text-label text-fg">
          Reading day
          <input
            type="date"
            aria-label="Reading day"
            value={state.date}
            max={today}
            onChange={(event) => onChange({ date: event.target.value })}
            className={`${control} w-auto`}
          />
        </label>
        <div className="flex w-full items-center gap-2 sm:w-auto sm:min-w-64 sm:flex-1 sm:gap-3">
          <Button
            variant="secondary"
            icon={ChevronLeft}
            onClick={() => setDay(Math.max(1, day - 1))}
            disabled={day <= 1}
            aria-label="Previous day"
          />
          <div className="min-w-0 flex-1 sm:max-w-72">
            <Slider
              value={[Math.min(day, maxDay)]}
              onValueChange={slide}
              min={1}
              max={Math.max(maxDay, 2)}
              step={1}
              disabled={maxDay < 2}
              aria-label={`Day of ${formatDay(state.date).slice(3)}`}
            />
          </div>
          <Button
            variant="secondary"
            icon={ChevronRight}
            onClick={() => setDay(Math.min(maxDay, day + 1))}
            disabled={day >= maxDay}
            aria-label="Next day"
          />
          <span className="min-w-20 text-right text-label tabular-nums text-fg">
            Day {day}
            <span className="text-muted"> / {maxDay}</span>
          </span>
        </div>
        {latestDay && latestDay !== state.date ? (
          <Button onClick={() => onChange({ date: latestDay })}>
            Latest recorded · {formatDay(latestDay)}
          </Button>
        ) : (
          <span className="text-caption text-muted">
            {loading
              ? "Reading daily records…"
              : latestDay
                ? "Latest recorded day"
                : "No readings recorded this month"}
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <label className="space-y-1 text-label">
          Zone
          <select
            aria-label="Zone"
            value={state.zone}
            onChange={(event) => onZone(event.target.value)}
            className={control}
          >
            <option value="">All zones</option>
            {zones.map((z) => (
              <option key={z} value={z}>
                {zoneName(z)}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-label">
          Meter level
          <select
            aria-label="Meter level"
            value={state.level}
            onChange={(event) =>
              onChange({
                level: event.target.value as WaterMeter["level"],
                meter: "",
              })
            }
            className={control}
          >
            {LEVELS.map((level) => (
              <option key={level} value={level}>
                {level} · {LEVEL_LABELS[level]}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-label">
          Status
          <select
            aria-label="Status"
            value={state.status}
            onChange={(event) =>
              onChange({
                status: event.target.value as MeterStatus | "",
                meter: "",
              })
            }
            className={control}
          >
            <option value="">Every status</option>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]} · {statusCounts[status]}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-label">
          Search every meter
          <input
            type="search"
            value={query}
            onChange={(event) => {
              onQuery(event.target.value);
            }}
            placeholder="Name, account or zone"
            className={control}
          />
        </label>
      </div>
    </div>
  );
}
