import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * Asset search text is matched literally. It used to be spliced raw into the
 * PostgREST `or` filter, so a comma or bracket — "Pump, Zone 3", "AHU (Main)" —
 * broke the filter and replaced the register with an error banner.
 */

const { getClient } = vi.hoisted(() => ({ getClient: vi.fn() }));
vi.mock("@/functions/supabase-client", () => ({ getSupabaseClient: getClient }));

const { buildAssetSearchFilter, getAssetsFromSupabase, MAX_ASSET_PAGE_SIZE } = await import("@/functions/api/assets");

afterEach(() => vi.clearAllMocks());

describe("buildAssetSearchFilter", () => {
    it("quotes the value so commas and brackets are search text, not filter syntax", () => {
        const filter = buildAssetSearchFilter("AHU (Main), Zone 3");
        expect(filter).toContain('asset_name.ilike."%AHU (Main), Zone 3%"');
        // Eight searched columns, separated by the seven commas outside the quotes.
        expect(filter.split('.ilike.').length - 1).toBe(8);
    });

    it("escapes LIKE wildcards and quote characters", () => {
        expect(buildAssetSearchFilter("50%_off")).toContain('asset_tag.ilike."%50\\\\%\\\\_off%"');
        expect(buildAssetSearchFilter('6" pipe')).toContain('zone.ilike."%6\\" pipe%"');
    });
});

describe("getAssetsFromSupabase", () => {
    function client() {
        const q: Record<string, ReturnType<typeof vi.fn> | unknown> = {};
        for (const m of ["from", "select", "or", "in", "order", "range"]) q[m] = vi.fn(() => q);
        q.then = (resolve: (r: unknown) => unknown) => Promise.resolve({ data: [], error: null, count: 0 }).then(resolve);
        return q as Record<string, ReturnType<typeof vi.fn>>;
    }

    it("falls back to asset_name for a sort column it does not know", async () => {
        const q = client();
        await getAssetsFromSupabase(1, 25, "", "asset_name; drop", "asc", undefined, undefined, q as never);
        expect(q.order).toHaveBeenCalledWith("asset_name", { ascending: true });
    });

    it("caps the page size", async () => {
        const q = client();
        await getAssetsFromSupabase(1, 100000, "", "asset_name", "asc", undefined, undefined, q as never);
        expect(q.range).toHaveBeenCalledWith(0, MAX_ASSET_PAGE_SIZE - 1);
    });

    it("does not filter on blank search text", async () => {
        const q = client();
        await getAssetsFromSupabase(1, 25, "   ", "asset_name", "asc", undefined, undefined, q as never);
        expect(q.or).not.toHaveBeenCalled();
    });
});
