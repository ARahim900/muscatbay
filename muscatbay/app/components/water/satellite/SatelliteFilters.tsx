"use client";
import { useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/mb-button";
import { Slider } from "@/components/ui/slider";
import { formatDay, omanToday } from "./dailyModel";
import type { SatelliteState } from "./consumptionModel";
const control =
  "h-9 pointer-coarse:min-h-11 w-full rounded-control border border-line bg-card px-3 text-label text-fg shadow-card focus-visible:outline-3 focus-visible:outline-accent";

interface SatelliteFiltersProps {
  state: SatelliteState;
  latestDay: string | null;
  loading: boolean;
  onChange: (patch: Partial<SatelliteState>) => void;
  /** Day steps replace the URL entry, so dragging does not flood Back. */
  onDay: (date: string) => void;
}
export function SatelliteFilters({
  state,
  latestDay,
  loading,
  onChange,
  onDay,
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
    <div>
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
    </div>
  );
}
