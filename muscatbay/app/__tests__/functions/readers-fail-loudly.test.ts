import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * A failed read must reach the page as an error. These readers used to turn a
 * failure into [] or {0, 0}, which the dashboard and module pages rendered as
 * "no operations", "0 meters", "0 contracts" — plausible wrong numbers.
 */

const { getClient } = vi.hoisted(() => ({ getClient: vi.fn() }));
vi.mock("@/functions/supabase-client", () => ({ getSupabaseClient: getClient }));

const { getSTPOperationsFromSupabase } = await import("@/functions/api/stp");
const { getElectricityMetersFromSupabase } = await import("@/functions/api/electricity");
const { getContractorCounts } = await import("@/functions/api/contractors");

type Result = { data?: unknown; error: { message: string } | null; count?: number | null };

/** A query builder whose every link chains and whose await yields `next()`. */
function builder(next: () => Result) {
    const q: Record<string, unknown> = {};
    for (const m of ["select", "order", "range", "ilike", "eq"]) q[m] = vi.fn(() => q);
    q.then = (resolve: (r: Result) => unknown, reject: (e: unknown) => unknown) =>
        Promise.resolve().then(next).then(resolve, reject);
    return q;
}

afterEach(() => vi.clearAllMocks());

describe("getSTPOperationsFromSupabase", () => {
    it("throws on a failed read instead of returning an empty log", async () => {
        getClient.mockReturnValue({ from: () => builder(() => ({ data: null, error: { message: "permission denied" } })) });
        await expect(getSTPOperationsFromSupabase()).rejects.toThrow(/permission denied/);
    });

    it("pages past PostgREST's 1,000-row cap", async () => {
        const page = (n: number, from: number) =>
            Array.from({ length: n }, (_, i) => ({ id: from + i, date: "2026-07-12", inlet_sewage: 1, tse_for_irrigation: 1, tanker_trips: 1 }));
        const pages = [page(1000, 0), page(250, 1000)];
        getClient.mockReturnValue({ from: () => builder(() => ({ data: pages.shift() ?? [], error: null })) });
        await expect(getSTPOperationsFromSupabase()).resolves.toHaveLength(1250);
    });

    it("returns [] only when Supabase is not configured", async () => {
        getClient.mockReturnValue(null);
        await expect(getSTPOperationsFromSupabase()).resolves.toEqual([]);
    });
});

describe("getElectricityMetersFromSupabase", () => {
    it("throws when the meters read fails", async () => {
        getClient.mockReturnValue({ from: () => builder(() => ({ data: null, error: { message: "timeout" } })) });
        await expect(getElectricityMetersFromSupabase()).rejects.toThrow(/timeout/);
    });

    it("throws when a readings page fails, rather than returning meters with no readings", async () => {
        getClient.mockReturnValue({
            from: (table: string) => table === "electricity_meters"
                ? builder(() => ({ data: [{ id: "m1", name: "DB-01", account_number: "1", meter_type: "DB" }], error: null }))
                : builder(() => ({ data: null, error: { message: "readings unavailable" } })),
        });
        await expect(getElectricityMetersFromSupabase()).rejects.toThrow(/readings unavailable/);
    });
});

describe("getContractorCounts", () => {
    it("throws on a failed count instead of reporting 0 contracts", async () => {
        getClient.mockReturnValue({ from: () => builder(() => ({ count: null, error: { message: "denied" } })) });
        await expect(getContractorCounts()).rejects.toThrow(/denied/);
    });

    it("returns the counts when both reads succeed", async () => {
        const counts = [12, 9];
        getClient.mockReturnValue({ from: () => builder(() => ({ count: counts.shift() ?? null, error: null })) });
        await expect(getContractorCounts()).resolves.toEqual({ total: 12, active: 9 });
    });
});
