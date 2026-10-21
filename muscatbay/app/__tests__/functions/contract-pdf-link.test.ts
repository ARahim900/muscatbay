import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * The contract-PDF dialog asks for a Drive share link, and Drive's Share button
 * gives `/view?usp=…`. The database only accepts `/preview`
 * (contractor_contract_pdf_url_approved), so every save from the dialog was
 * refused. Links are now converted before the write.
 */

const { getClient } = vi.hoisted(() => ({ getClient: vi.fn() }));
vi.mock("@/functions/supabase-client", () => ({ getSupabaseClient: getClient }));

const { toDrivePreviewUrl, updateContractPdfUrl } = await import("@/functions/api/contractors");

/** The CHECK constraint on contractor_contracts.contract_pdf_url, verbatim. */
const DB_RULE = /^https:\/\/drive[.]google[.]com\/file\/d\/[A-Za-z0-9_-]{10,200}\/preview([?]resourcekey=[A-Za-z0-9_-]{1,200})?$/;
const ID = "1AbCdEfGhIjKlMnOpQrStUvWxYz012345";

afterEach(() => vi.clearAllMocks());

describe("toDrivePreviewUrl", () => {
    it.each([
        [`https://drive.google.com/file/d/${ID}/view?usp=sharing`],
        [`https://drive.google.com/file/d/${ID}/view?usp=drive_link`],
        [`https://drive.google.com/file/d/${ID}/view`],
        [`https://drive.google.com/file/d/${ID}/edit`],
        [`https://drive.google.com/file/d/${ID}/preview`],
        [`https://drive.google.com/file/d/${ID}`],
        [`  https://drive.google.com/file/d/${ID}/view?usp=sharing  `],
    ])("turns %s into the stored /preview form", (input) => {
        const out = toDrivePreviewUrl(input);
        expect(out).toBe(`https://drive.google.com/file/d/${ID}/preview`);
        expect(out).toMatch(DB_RULE);
    });

    it("keeps the resource key and drops other parameters", () => {
        const out = toDrivePreviewUrl(`https://drive.google.com/file/d/${ID}/view?usp=sharing&resourcekey=0-AbC_d`);
        expect(out).toBe(`https://drive.google.com/file/d/${ID}/preview?resourcekey=0-AbC_d`);
        expect(out).toMatch(DB_RULE);
    });

    it.each([
        ["a non-Drive link", "https://example.com/contract.pdf"],
        ["a Drive folder", `https://drive.google.com/drive/folders/${ID}`],
        ["plain http", `http://drive.google.com/file/d/${ID}/view`],
        ["a look-alike host", `https://drive.google.com.evil.example/file/d/${ID}/view`],
        ["an id that is too short", "https://drive.google.com/file/d/abc/view"],
    ])("rejects %s", (_label, input) => {
        expect(toDrivePreviewUrl(input)).toBeNull();
    });
});

describe("updateContractPdfUrl", () => {
    function client() {
        const q: Record<string, ReturnType<typeof vi.fn>> = {};
        for (const m of ["from", "update", "eq"]) q[m] = vi.fn(() => q);
        (q as unknown as { then: unknown }).then = (resolve: (r: unknown) => unknown) => Promise.resolve({ error: null }).then(resolve);
        return q;
    }

    it("stores a share link in /preview form and returns what it stored", async () => {
        const q = client();
        getClient.mockReturnValue(q);
        const res = await updateContractPdfUrl(7, `https://drive.google.com/file/d/${ID}/view?usp=sharing`);
        expect(q.update).toHaveBeenCalledWith({ contract_pdf_url: `https://drive.google.com/file/d/${ID}/preview` });
        expect(res).toEqual({ ok: true, url: `https://drive.google.com/file/d/${ID}/preview` });
    });

    it("refuses a non-Drive link without writing", async () => {
        const q = client();
        getClient.mockReturnValue(q);
        const res = await updateContractPdfUrl(7, "https://example.com/contract.pdf");
        expect(res.ok).toBe(false);
        expect(res.error).toMatch(/Google Drive/);
        expect(q.update).not.toHaveBeenCalled();
    });

    it("still clears a link with null", async () => {
        const q = client();
        getClient.mockReturnValue(q);
        const res = await updateContractPdfUrl(7, null);
        expect(q.update).toHaveBeenCalledWith({ contract_pdf_url: null });
        expect(res).toEqual({ ok: true, url: null });
    });
});
