import { ZONE_CONFIG, type WaterMeter } from "@/lib/water-data";
import {
  dailyMonth,
  dailyValue,
  shiftDay,
  validDate,
  omanToday,
  type DailyMeterRow,
} from "./dailyModel";

export interface MeterLocation {
  account: string;
  coordinates: [number, number];
  precision: string;
}
/**
 * What a day's reading says about the meter, judged against that meter's own
 * recent daily average — the only measure that means the same thing for a villa
 * and for a building bulk. Owner bands, 2026-09-20.
 */
export type MeterStatus = "normal" | "elevated" | "high" | "zero" | "missing";
export const STATUS_LABELS: Record<MeterStatus, string> = {
  normal: "Normal",
  elevated: "Elevated",
  high: "High usage",
  zero: "Zero reading",
  missing: "No reading",
};
/** Ratio of the day's reading to the meter's recent daily average. */
export const STATUS_BANDS = { elevated: 1.3, high: 2 };
/** Recorded days needed before a meter can be judged at all. */
export const BASELINE_DAYS = 3;
/** The marker's bar: 5 segments, each a 40% step of the meter's usual. */
export const SEGMENTS = 5;
export const SEGMENT_STEP = 0.4;
/** Segments lit for a ratio — 1 at the least, all 5 from twice the usual. */
export const litSegments = (ratio: number | null): number =>
  ratio === null || ratio <= 0
    ? 0
    : Math.min(SEGMENTS, Math.max(1, Math.ceil(ratio / SEGMENT_STEP)));
export const STATUSES = Object.keys(STATUS_LABELS) as MeterStatus[];
/** Days of history read for the spike baseline (it uses up to 7 recorded days). */
const HISTORY_DAYS = 14;
export interface ConsumptionMeter {
  account: string;
  name: string;
  zone: string;
  level: WaterMeter["level"];
  zoneName: string;
  parent: string;
  value: number | null;
  previous: number | null;
  trend: { date: string; value: number | null }[];
  updatedAt: string | null;
  location: MeterLocation | null;
  status: MeterStatus;
  /** Why the meter carries its status, in words — shown beside the colour. */
  statusNote: string;
  baseline: number | null;
  ratio: number | null;
}
export interface SatelliteState {
  date: string;
  zone: string;
  meter: string;
  level: WaterMeter["level"];
  /** "" = every status. */
  status: MeterStatus | "";
}
export const LEVELS: WaterMeter["level"][] = [
  "L1",
  "L2",
  "L3",
  "L4",
  "DC",
  "N/A",
];
export const formatVolume = (value: number | null): string =>
  value === null
    ? "—"
    : value.toLocaleString("en-GB", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
/** Map figures: whole numbers, one decimal below 10, never a false "0". */
export const formatMapVolume = (value: number | null): string => {
  if (value === null) return "—";
  const size = Math.abs(value);
  if (size > 0 && size < 0.05) return "<0.1";
  return value.toLocaleString("en-GB", {
    maximumFractionDigits: size < 10 ? 1 : 0,
  });
};
/**
 * The ring's share of a meter's usual, in words. Beyond ten times over, a
 * percentage stops being readable ("1085%"), so the multiple is shown instead.
 */
export const formatRatio = (ratio: number | null): string => {
  if (ratio === null) return "";
  if (ratio === 0) return "zero";
  if (ratio >= 10) return `×${Math.round(ratio)}`;
  return `${Math.round(ratio * 100)}%`;
};
export function meterStatus(
  value: number | null,
  history: (number | null)[],
): {
  status: MeterStatus;
  statusNote: string;
  /** The meter's own mean over its last recorded days; null when too few. */
  baseline: number | null;
  /** value ÷ baseline — what the ring on the map fills to. */
  ratio: number | null;
} {
  // The baseline is the meter's own mean over its last recorded days, newest
  // first. Missing days are skipped, never counted as zero.
  const recorded: number[] = [];
  for (let i = history.length - 1; i >= 0 && recorded.length < 7; i--) {
    const day = history[i];
    if (day !== null && day >= 0) recorded.push(day);
  }
  const baseline =
    recorded.length >= BASELINE_DAYS
      ? recorded.reduce((a, b) => a + b, 0) / recorded.length
      : null;
  const against =
    baseline === null
      ? ""
      : ` against a ${formatMapVolume(baseline)} m³ average over its last ${recorded.length} recorded days`;
  if (value === null)
    return { status: "missing", statusNote: "No reading recorded for this day", baseline, ratio: null };
  if (value < 0)
    return { status: "missing", statusNote: "Negative reading · check the source", baseline, ratio: null };
  if (value === 0)
    return {
      status: "zero",
      statusNote: `Recorded as 0 m³${against} · check the meter if the unit is in use`,
      baseline,
      ratio: 0,
    };
  if (baseline === null || baseline <= 0)
    return {
      status: "normal",
      statusNote: `No average yet: fewer than ${BASELINE_DAYS} recorded days before this one`,
      baseline,
      ratio: null,
    };
  const ratio = value / baseline;
  const percent =
    ratio >= 10
      ? `${formatRatio(ratio)} its usual`
      : `${formatRatio(ratio)} of its usual`;
  if (ratio >= STATUS_BANDS.high)
    return { status: "high", statusNote: `${percent}${against}`, baseline, ratio };
  if (ratio >= STATUS_BANDS.elevated)
    return { status: "elevated", statusNote: `${percent}${against}`, baseline, ratio };
  return { status: "normal", statusNote: `${percent}${against}`, baseline, ratio };
}
export const zoneName = (zone: string): string =>
  ZONE_CONFIG.find((z) => z.code === zone)?.name ?? zone.split("_").join(" ");
export function parseLocations(raw: unknown): MeterLocation[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item: unknown) => {
    if (!item || typeof item !== "object") return [];
    const p = item as Record<string, unknown>;
    const c = p.coordinates;
    if (
      typeof p.account !== "string" ||
      !Array.isArray(c) ||
      c.length !== 2 ||
      typeof c[0] !== "number" ||
      typeof c[1] !== "number" ||
      !Number.isFinite(c[0]) ||
      !Number.isFinite(c[1]) ||
      Math.abs(c[0]) > 180 ||
      Math.abs(c[1]) > 90
    )
      return [];
    return [
      {
        account: p.account,
        coordinates: [c[0], c[1]] as [number, number],
        precision:
          typeof p.precision === "string" ? p.precision : "Plot position",
      },
    ];
  });
}
export function buildConsumptionMeters(
  meters: WaterMeter[],
  date: string,
  locations: MeterLocation[],
  dailyRows: DailyMeterRow[] = [],
): ConsumptionMeter[] {
  const byAccount = new Map(locations.map((l) => [l.account, l]));
  const daily = new Map(
    dailyRows.map((r) => [`${r.account_number}:${r.month}:${r.year}`, r]),
  );
  const find = (account: string, day: string) =>
    daily.get(`${account}:${dailyMonth(day)}:${day.slice(0, 4)}`);
  const days = Array.from({ length: 7 }, (_, i) => shiftDay(date, i - 6));
  const history = Array.from({ length: HISTORY_DAYS }, (_, i) =>
    shiftDay(date, i - HISTORY_DAYS),
  );
  return meters.map((m) => ({
    ...meterStatus(
      dailyValue(find(m.accountNumber, date), date),
      history.map((day) => dailyValue(find(m.accountNumber, day), day)),
    ),
    account: m.accountNumber,
    name: m.label,
    zone: m.zone || "Unassigned",
    zoneName: zoneName(m.zone || "Unassigned"),
    level: m.level,
    parent: m.parentMeter || "Not recorded",
    value: dailyValue(find(m.accountNumber, date), date),
    previous: dailyValue(
      find(m.accountNumber, shiftDay(date, -1)),
      shiftDay(date, -1),
    ),
    trend: days.map((day) => ({
      date: day,
      value: dailyValue(find(m.accountNumber, day), day),
    })),
    updatedAt: find(m.accountNumber, date)?.updated_at ?? null,
    location: byAccount.get(m.accountNumber) ?? null,
  }));
}
export function summariseMeters(meters: ConsumptionMeter[]) {
  const recorded = meters.filter((m) => m.value !== null);
  return {
    reporting: recorded.length,
    total: recorded.length
      ? recorded.reduce((sum, m) => sum + m.value!, 0)
      : null,
    mapped: meters.filter((m) => m.location).length,
    invalid: recorded.filter((m) => m.value! < 0).length,
    partial: recorded.length < meters.length,
  };
}
export function readSatelliteState(
  search: string,
  meters: WaterMeter[],
): SatelliteState {
  const query = new URLSearchParams(search);

  const selected = meters.find((m) => m.accountNumber === query.get("meter"));
  const level = LEVELS.find((l) => l === query.get("level")) ?? "L3";
  return {
    status: STATUSES.find((value) => value === query.get("status")) ?? "",
    date: validDate(query.get("date") ?? "")
      ? query.get("date")!
      : shiftDay(omanToday(), -1),
    zone:
      selected?.zone ||
      (meters.some((m) => m.zone === query.get("zone"))
        ? query.get("zone")!
        : ""),
    meter: selected?.accountNumber ?? "",
    level: selected?.level ?? level,
  };
}
export function satelliteUrl(current: string, state: SatelliteState): string {
  const url = new URL(current);
  url.searchParams.set("view", "satellite");
  url.searchParams.delete("period");
  for (const [key, value] of Object.entries(state)) {
    if (value) url.searchParams.set(key, value);
    else url.searchParams.delete(key);
  }
  return url.pathname + url.search + url.hash;
}

export const LEVEL_LABELS: Record<WaterMeter["level"], string> = {
  L1: "Main supply",
  L2: "Zone bulk",
  L3: "Individual / building bulk",
  L4: "Apartment submeters",
  DC: "Direct connections",
  "N/A": "Unclassified",
};
