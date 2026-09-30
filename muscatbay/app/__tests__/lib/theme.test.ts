import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
    THEME_INIT_SCRIPT,
    THEME_STORAGE_KEY,
    effectivePreference,
    isInAppShell,
    nextPreference,
    parseStoredPreference,
    resolveTheme,
} from "@/lib/theme";

const APP_UA =
    "Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MuscatBayApp/1.0";
const SAFARI_UA =
    "Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1";

describe("isInAppShell", () => {
    it("detects the iOS app by its user-agent suffix", () => {
        expect(isInAppShell(APP_UA)).toBe(true);
    });
    it("is false in Safari and on the desktop", () => {
        expect(isInAppShell(SAFARI_UA)).toBe(false);
        expect(isInAppShell("")).toBe(false);
    });
});

describe("parseStoredPreference", () => {
    it("keeps valid values", () => {
        expect(parseStoredPreference("light")).toBe("light");
        expect(parseStoredPreference("dark")).toBe("dark");
        expect(parseStoredPreference("system")).toBe("system");
    });
    it("falls back to system for missing or unknown values", () => {
        expect(parseStoredPreference(null)).toBe("system");
        expect(parseStoredPreference("")).toBe("system");
        expect(parseStoredPreference("sepia")).toBe("system");
    });
});

describe("effectivePreference", () => {
    it("always follows the phone inside the app, even after an old manual choice", () => {
        expect(effectivePreference("light", true)).toBe("system");
        expect(effectivePreference("dark", true)).toBe("system");
    });
    it("honours the saved choice in a browser", () => {
        expect(effectivePreference("light", false)).toBe("light");
        expect(effectivePreference("system", false)).toBe("system");
    });
});

describe("resolveTheme", () => {
    it("maps system to the device appearance", () => {
        expect(resolveTheme("system", true)).toBe("dark");
        expect(resolveTheme("system", false)).toBe("light");
    });
    it("uses a fixed choice regardless of the device", () => {
        expect(resolveTheme("light", true)).toBe("light");
        expect(resolveTheme("dark", false)).toBe("dark");
    });
});

describe("nextPreference", () => {
    it("cycles System → Light → Dark → System", () => {
        expect(nextPreference("system")).toBe("light");
        expect(nextPreference("light")).toBe("dark");
        expect(nextPreference("dark")).toBe("system");
    });
});

/** In-memory localStorage — Node's own experimental global shadows jsdom's here. */
function memoryStorage(): Storage {
    const store = new Map<string, string>();
    return {
        get length() { return store.size; },
        clear: () => store.clear(),
        getItem: (k: string) => store.get(k) ?? null,
        key: (i: number) => Array.from(store.keys())[i] ?? null,
        removeItem: (k: string) => { store.delete(k); },
        setItem: (k: string, v: string) => { store.set(k, String(v)); },
    };
}

describe("THEME_INIT_SCRIPT (runs in <head> before first paint)", () => {
    function run(opts: { stored: string | null; ua: string; systemDark: boolean }) {
        const root = document.documentElement;
        root.className = "";
        root.style.colorScheme = "";
        localStorage.clear();
        if (opts.stored !== null) localStorage.setItem(THEME_STORAGE_KEY, opts.stored);
        Object.defineProperty(window.navigator, "userAgent", { value: opts.ua, configurable: true });
        window.matchMedia = ((q: string) => ({ matches: opts.systemDark && q.includes("dark") })) as typeof window.matchMedia;
        new Function(THEME_INIT_SCRIPT)();
        return { cls: root.className, scheme: root.style.colorScheme };
    }

    beforeEach(() => {
        vi.stubGlobal("localStorage", memoryStorage());
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("paints dark on a dark-mode phone with no saved choice", () => {
        expect(run({ stored: null, ua: SAFARI_UA, systemDark: true })).toEqual({ cls: "dark", scheme: "dark" });
    });
    it("ignores an old manual Light choice inside the app", () => {
        expect(run({ stored: "light", ua: APP_UA, systemDark: true })).toEqual({ cls: "dark", scheme: "dark" });
    });
    it("honours a manual choice in a browser", () => {
        expect(run({ stored: "light", ua: SAFARI_UA, systemDark: true })).toEqual({ cls: "light", scheme: "light" });
    });
    it("never throws when storage is blocked", () => {
        vi.stubGlobal("localStorage", {
            getItem() {
                throw new Error("SecurityError");
            },
        });
        document.documentElement.className = "";
        window.matchMedia = (() => ({ matches: false })) as unknown as typeof window.matchMedia;
        expect(() => new Function(THEME_INIT_SCRIPT)()).not.toThrow();
        expect(document.documentElement.className).toBe("light");
    });
});
