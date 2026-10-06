import { beforeEach, describe, expect, it, vi } from "vitest";

const rpc = vi.fn();
vi.mock("@supabase/supabase-js", () => ({ createClient: () => ({ rpc }) }));

const KEY = "a".repeat(64);

async function call(authorization?: string) {
    const { GET } = await import("@/app/api/widget/water/route");
    const headers = authorization ? { authorization } : undefined;
    return GET(new Request("https://www.muscatbay.work/api/widget/water", { headers }));
}

describe("GET /api/widget/water", () => {
    beforeEach(() => {
        rpc.mockReset();
        vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
        vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "eyJtest");
    });

    it("refuses a request without a well-formed key, without asking the database", async () => {
        expect((await call()).status).toBe(401);
        expect((await call("Bearer short")).status).toBe(401);
        expect(rpc).not.toHaveBeenCalled();
    });

    it("refuses a key the database does not recognise", async () => {
        rpc.mockResolvedValue({ data: null, error: null });
        const response = await call(`Bearer ${KEY}`);
        expect(response.status).toBe(401);
        expect(rpc).toHaveBeenCalledWith("widget_water_latest", { p_token: KEY });
    });

    it("reports the database being unavailable as 503, never as data", async () => {
        rpc.mockResolvedValue({ data: null, error: { message: "boom" } });
        expect((await call(`Bearer ${KEY}`)).status).toBe(503);
    });

    it("returns no summary when no month holds a reading", async () => {
        rpc.mockResolvedValue({ data: { month: null, year: null, rows: [] }, error: null });
        const response = await call(`Bearer ${KEY}`);
        expect(response.status).toBe(200);
        expect(response.headers.get("cache-control")).toBe("no-store");
        expect((await response.json()).summary).toBeNull();
    });

    it("summarises the rows the database returns", async () => {
        rpc.mockResolvedValue({
            data: { month: "Oct-26", year: 2026, rows: [{ account_number: "4300343", day_3: 50 }] },
            error: null,
        });
        const body = await (await call(`Bearer ${KEY}`)).json();
        expect(body.summary.date).toBe("2026-10-03");
        expect(body.summary.supplyM3).toBe(50);
        expect(body.summary.partial).toBe(true);
    });
});
