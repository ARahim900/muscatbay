import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchSatelliteDailyMonth,
  useSatelliteDaily,
} from "@/components/water/satellite/useSatelliteDaily";
const { getClient, queryResult, filters } = vi.hoisted(() => ({
  getClient: vi.fn(),
  queryResult: vi.fn(),
  filters: new Map<string, unknown>(),
}));
vi.mock("@/functions/supabase-client", () => ({
  getSupabaseClient: getClient,
}));
vi.mock("@/hooks/useSupabaseRealtime", () => ({
  useSupabaseRealtime: vi.fn(),
}));
const sample = {
  account_number: "a",
  year: 2026,
  month: "Sep-26",
  day_13: "1.32",
};
function configure() {
  filters.clear();
  const query = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn((key: string, value: unknown) => {
      filters.set(key, value);
      return query;
    }),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    abortSignal: vi.fn((signal: AbortSignal) => queryResult(signal)),
  };
  getClient.mockReturnValue({ from: () => query });
  return query;
}
afterEach(() => {
  vi.clearAllMocks();
});
describe("satellite daily source", () => {
  it("queries the exact month and year with explicit columns, paginating every row", async () => {
    const query = configure();
    queryResult
      .mockResolvedValueOnce({
        data: Array.from({ length: 1000 }, (_, i) => ({
          ...sample,
          account_number: String(i),
        })),
        error: null,
      })
      .mockResolvedValueOnce({
        data: [{ ...sample, account_number: "1000" }],
        error: null,
      });
    const rows = await fetchSatelliteDailyMonth(
      "2026-09-13",
      new AbortController().signal,
    );
    expect(rows).toHaveLength(1001);
    expect(rows[0].day_13).toBe(1.32);
    expect(query.range.mock.calls).toEqual([
      [0, 999],
      [1000, 1999],
    ]);
    expect(filters.get("month")).toBe("Sep-26");
    expect(filters.get("year")).toBe(2026);
    expect(query.select.mock.calls[0][0]).not.toContain("*");
  });
  it("surfaces database and configuration errors instead of pretending an empty period", async () => {
    configure();
    queryResult.mockResolvedValueOnce({
      data: null,
      error: { message: "Permission denied" },
    });
    await expect(
      fetchSatelliteDailyMonth("2026-09-13", new AbortController().signal),
    ).rejects.toThrow("Permission denied");
    getClient.mockReturnValueOnce(null);
    await expect(
      fetchSatelliteDailyMonth("2026-09-13", new AbortController().signal),
    ).rejects.toThrow("not configured");
  });
  // Two reads per month view — the month and the one before it (spike baseline,
  // and the opening day while a new month is still empty) — and none per day.
  it("does not refetch for day changes and visibly retains stale rows on refresh failure", async () => {
    configure();
    queryResult.mockResolvedValue({ data: [sample], error: null });
    const view = renderHook(({ date }) => useSatelliteDaily(date), {
      initialProps: { date: "2026-09-13" },
    });
    await waitFor(() => expect(view.result.current.loading).toBe(false));
    view.rerender({ date: "2026-09-14" });
    expect(queryResult).toHaveBeenCalledTimes(2);
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    queryResult.mockResolvedValueOnce({
      data: null,
      error: { message: "Offline" },
    });
    act(() => view.result.current.refresh());
    await waitFor(() => expect(view.result.current.error).toBe("Offline"));
    expect(view.result.current.stale).toBe(true);
    expect(view.result.current.rows[0].day_13).toBe(1.32);
    log.mockRestore();
  });
  it("rejects a late response from an abandoned month and clears the old month's values immediately", async () => {
    configure();
    let resolveOld: (value: unknown) => void = () => {};
    queryResult.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveOld = resolve;
        }),
    );
    const view = renderHook(({ date }) => useSatelliteDaily(date), {
      initialProps: { date: "2026-08-13" },
    });
    queryResult.mockResolvedValueOnce({ data: [sample], error: null });
    view.rerender({ date: "2026-09-13" });
    expect(view.result.current.rows).toEqual([]);
    await waitFor(() =>
      expect(view.result.current.rows[0]?.month).toBe("Sep-26"),
    );
    await act(async () => {
      resolveOld({ data: [{ ...sample, month: "Aug-26" }], error: null });
    });
    expect(view.result.current.rows[0].month).toBe("Sep-26");
  });
});
