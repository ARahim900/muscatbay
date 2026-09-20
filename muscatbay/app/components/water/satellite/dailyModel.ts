import type { SupabaseDailyWaterConsumption } from "@/entities/water";

export type DailyMeterRow = Pick<
  SupabaseDailyWaterConsumption,
  "account_number" | "month" | "year" | "updated_at"
> &
  Partial<Record<`day_${number}`, number | null>>;
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
export const dayColumns = Array.from({ length: 31 }, (_, i) => `day_${i + 1}`);
export function omanToday(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Muscat",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
export function shiftDay(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}
export function validDate(date: string, today = omanToday()): boolean {
  if (!/^20\d{2}-\d{2}-\d{2}$/.test(date)) return false;
  const value = new Date(`${date}T00:00:00Z`);
  return (
    Number.isFinite(value.getTime()) &&
    value.toISOString().slice(0, 10) === date &&
    date <= today
  );
}
export function dailyMonth(date: string): string {
  return `${MONTHS[Number(date.slice(5, 7)) - 1]}-${date.slice(2, 4)}`;
}
export function formatDay(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", {
    timeZone: "UTC",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
export function dailyValue(
  row: DailyMeterRow | undefined,
  date: string,
): number | null {
  if (
    !row ||
    row.month !== dailyMonth(date) ||
    row.year !== Number(date.slice(0, 4))
  )
    return null;
  const value = row[`day_${Number(date.slice(8, 10))}`];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
export function parseDailyRows(raw: unknown): DailyMeterRow[] {
  if (!Array.isArray(raw))
    throw new Error("Daily readings response is invalid.");
  const keys = new Set<string>();
  return raw.map((item: unknown) => {
    if (!item || typeof item !== "object")
      throw new Error("Daily reading record is invalid.");
    const r = item as Record<string, unknown>;
    if (
      typeof r.account_number !== "string" ||
      typeof r.month !== "string" ||
      !Number.isInteger(r.year)
    )
      throw new Error("Daily reading identity is invalid.");
    const key = `${r.account_number}:${r.month}:${r.year}`;
    if (keys.has(key))
      throw new Error("Duplicate daily meter records require a source check.");
    keys.add(key);
    const row: DailyMeterRow = {
      account_number: r.account_number,
      month: r.month,
      year: r.year as number,
      updated_at: typeof r.updated_at === "string" ? r.updated_at : undefined,
    };
    for (let day = 1; day <= 31; day++) {
      const raw = r[`day_${day}`];
      const value =
        typeof raw === "string" && /^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(raw.trim())
          ? Number(raw)
          : raw;
      if (
        value != null &&
        (typeof value !== "number" || !Number.isFinite(value))
      )
        throw new Error("A daily reading is not a valid number.");
      row[`day_${day}`] = value == null ? null : (value as number);
    }
    return row;
  });
}
/**
 * The latest day of `monthDate`'s month with readings, newest first.
 *
 * `minShare` is what makes this usable as the page's opening day: a single
 * meter entered early for tomorrow must not pin the whole view to a day where
 * nothing else is recorded — the map would look broken, which is exactly the
 * fault this default was added to fix. Left at 0 it means "any reading at all",
 * which is what the "Latest recorded" button reports for the meters in view.
 */
export function latestRecordedDay(
  rows: DailyMeterRow[],
  accounts: Set<string>,
  monthDate: string,
  minShare = 0,
): string | null {
  const end = new Date(
    Date.UTC(Number(monthDate.slice(0, 4)), Number(monthDate.slice(5, 7)), 0),
  ).getUTCDate();
  for (let day = end; day >= 1; day--) {
    const date = `${monthDate.slice(0, 7)}-${String(day).padStart(2, "0")}`;
    if (date > omanToday()) continue;
    const reporting = rows.filter(
      (r) => accounts.has(r.account_number) && dailyValue(r, date) !== null,
    ).length;
    if (reporting > 0 && reporting >= accounts.size * minShare) return date;
  }
  return null;
}
