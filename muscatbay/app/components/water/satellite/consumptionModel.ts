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
}
export interface SatelliteState {
  date: string;
  zone: string;
  meter: string;
  level: WaterMeter["level"];
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
export const zoneName = (zone: string): string =>
  ZONE_CONFIG.find((z) => z.code === zone)?.name ?? zone.replaceAll("_", " ");
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
  return meters.map((m) => ({
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
