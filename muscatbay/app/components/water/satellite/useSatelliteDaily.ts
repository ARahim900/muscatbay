"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { getSupabaseClient } from "@/functions/supabase-client";
import { useSupabaseRealtime } from "@/hooks/useSupabaseRealtime";
import {
  dailyMonth,
  dayColumns,
  parseDailyRows,
  shiftDay,
  type DailyMeterRow,
} from "./dailyModel";

export async function fetchSatelliteDailyMonth(
  date: string,
  signal: AbortSignal,
): Promise<DailyMeterRow[]> {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase is not configured.");
  const rows: unknown[] = [];
  for (let start = 0; ; start += 1000) {
    const { data, error } = await client
      .from("water_daily_consumption")
      .select(
        ["account_number", "month", "year", "updated_at", ...dayColumns].join(
          ",",
        ),
      )
      .eq("month", dailyMonth(date))
      .eq("year", Number(date.slice(0, 4)))
      .order("id")
      .range(start, start + 999)
      .abortSignal(signal);
    if (error) throw new Error(error.message);
    rows.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  return parseDailyRows(rows);
}
interface DailySnapshot {
  key: string;
  rows: DailyMeterRow[];
  refreshed: Date;
}
const EMPTY: DailyMeterRow[] = [];
export function useSatelliteDaily(date: string, parentRefresh?: Date | null) {
  const month = date.slice(0, 7);
  const previousMonth = shiftDay(`${month}-01`, -1).slice(0, 7);
  const key = `${month}:${Number(date.slice(8)) < 7 ? previousMonth : ""}`;
  const [revision, setRevision] = useState(0);
  const [snapshot, setSnapshot] = useState<DailySnapshot | null>(null);
  const [request, setRequest] = useState({ token: "", error: "" });
  const cache = useRef(
    new Map<
      string,
      { rows: DailyMeterRow[]; refreshed: Date; stamp: string }
    >(),
  );
  const stamp = `${revision}:${parentRefresh?.getTime() ?? 0}`;
  const token = `${key}:${stamp}`;
  const refresh = useCallback(() => {
    setRevision((n) => n + 1);
  }, []);
  useSupabaseRealtime({
    table: "water_daily_consumption",
    channelName: "satellite-daily",
    onChanged: refresh,
  });
  useEffect(() => {
    const controller = new AbortController();
    const requestedMonths = key.split(":").filter(Boolean);
    Promise.all(
      requestedMonths.map(async (m) => {
        const cached = cache.current.get(m);
        if (cached?.stamp === stamp) return cached;
        const rows = await fetchSatelliteDailyMonth(
          `${m}-01`,
          controller.signal,
        );
        const entry = { rows, stamp, refreshed: new Date() };
        if (!controller.signal.aborted) cache.current.set(m, entry);
        return entry;
      }),
    )
      .then((pages) => {
        if (controller.signal.aborted) return;
        setSnapshot({
          key,
          rows: pages.flatMap((p) => p.rows),
          refreshed: new Date(
            Math.min(...pages.map((p) => p.refreshed.getTime())),
          ),
        });
        setRequest({ token, error: "" });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        console.error("Satellite daily readings failed", error);
        setRequest({
          token,
          error:
            error instanceof Error
              ? error.message
              : "Daily readings could not be loaded.",
        });
      });
    return () => controller.abort();
  }, [key, token, stamp]);
  const current = snapshot?.key === key;
  return {
    rows: current ? snapshot.rows : EMPTY,
    refreshed: current ? snapshot.refreshed : null,
    loading: request.token !== token,
    error: request.token === token ? request.error : "",
    stale: current && request.token === token && Boolean(request.error),
    refresh,
  };
}
