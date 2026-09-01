import { describe, expect, it } from "vitest";

import {
    canonicalizeApprovedEmbedUrl,
    EMBED_SANDBOX,
    isApprovedEmbedUrl,
} from "@/lib/embed-security";

const ORIGIN = "https://dashboard.muscatbay.test";

describe("canonicalizeApprovedEmbedUrl", () => {
    it("allows only the two approved AITable shares", () => {
        expect(canonicalizeApprovedEmbedUrl("https://aitable.ai/share/shripyzrlnlQ91WRSyCLF")?.kind).toBe("aitable");
        expect(canonicalizeApprovedEmbedUrl("https://aitable.ai/share/shrRV9Fp15zCH50ZFTWtb?theme=dark")?.url)
            .toBe("https://aitable.ai/share/shrRV9Fp15zCH50ZFTWtb?theme=dark");
        expect(isApprovedEmbedUrl("https://aitable.ai/share/shrNotApproved000000000")).toBe(false);
        expect(isApprovedEmbedUrl("https://sub.aitable.ai/share/shripyzrlnlQ91WRSyCLF")).toBe(false);
    });

    it("normalizes strict Google Drive file links to preview URLs", () => {
        const result = canonicalizeApprovedEmbedUrl(
            "https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUvWxYz/view?usp=sharing",
        );
        expect(result).toEqual({
            kind: "google-drive",
            url: "https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUvWxYz/preview",
            sandbox: EMBED_SANDBOX.googleDrive,
        });
    });

    it("allows only the same-origin satellite document", () => {
        expect(canonicalizeApprovedEmbedUrl("/satellite/index.html?embed=1", ORIGIN)).toEqual({
            kind: "satellite",
            url: `${ORIGIN}/satellite/index.html?embed=1`,
            sandbox: EMBED_SANDBOX.satellite,
        });
        expect(isApprovedEmbedUrl("https://other.example/satellite/index.html?embed=1", ORIGIN)).toBe(false);
    });

    it.each([
        "http://aitable.ai/share/shripyzrlnlQ91WRSyCLF",
        "https://user@aitable.ai/share/shripyzrlnlQ91WRSyCLF",
        "https://aitable.ai.evil.test/share/shripyzrlnlQ91WRSyCLF",
        "https://aitable.ai/share/shripyzrlnlQ91WRSyCLF?theme=dark&redirect=https://evil.test",
        "https://drive.google.com/open?id=1AbCdEfGhIjKlMnOpQrStUvWxYz",
        "https://drive.google.com/file/d/../../evil/preview",
        "javascript:alert(1)",
    ])("rejects unsafe or unapproved input: %s", (input) => {
        expect(canonicalizeApprovedEmbedUrl(input, ORIGIN)).toBeNull();
    });
});
