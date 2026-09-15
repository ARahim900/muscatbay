import { omanToday } from "./dailyModel";
import type { WaterMeter } from "@/lib/water-data";
import {
  LEVELS,
  LEVEL_LABELS,
  zoneName,
  type SatelliteState,
} from "./consumptionModel";
const control =
  "h-9 pointer-coarse:min-h-11 w-full rounded-control border border-line bg-card px-3 text-label text-fg shadow-card focus-visible:outline-3 focus-visible:outline-accent";

interface SatelliteFiltersProps {
  state: SatelliteState;
  zones: string[];
  query: string;
  onChange: (patch: Partial<SatelliteState>) => void;
  onZone: (zone: string) => void;
  onQuery: (query: string) => void;
}
export function SatelliteFilters({
  state,
  zones,
  query,
  onChange,
  onZone,
  onQuery,
}: SatelliteFiltersProps) {
  return (
    <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
      <label className="space-y-1 text-label">
        Reading day
        <input
          type="date"
          aria-label="Reading day"
          value={state.date}
          max={omanToday()}
          onChange={(event) => onChange({ date: event.target.value })}
          className={control}
        />
      </label>
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
  );
}
