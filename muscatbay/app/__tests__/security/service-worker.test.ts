import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const serviceWorker = readFileSync(resolve(process.cwd(), "public/sw.js"), "utf8");

describe("service worker privacy boundary", () => {
    it("does not create or serve a page cache for authenticated navigations", () => {
        expect(serviceWorker).not.toContain("const PAGES_CACHE");
        expect(serviceWorker).not.toContain("cachedPage");
        expect(serviceWorker).toContain("const offline = await caches.match(OFFLINE_URL)");
    });

    it("caches only immutable or explicitly public static assets", () => {
        expect(serviceWorker).toContain("if (isImmutableAsset(url))");
        expect(serviceWorker).toContain("if (isPublicStaticAsset(url))");
        expect(serviceWorker).toContain("private|no-store");
    });

    it("supports removing page caches left by an older worker", () => {
        expect(serviceWorker).toContain('event.data?.type === "PURGE_PRIVATE_CACHES"');
        expect(serviceWorker).toContain('key.startsWith("muscatbay-pages-")');
    });
});
