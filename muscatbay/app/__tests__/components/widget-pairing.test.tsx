import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render } from "@testing-library/react";

const auth = vi.hoisted(() => ({
    value: { user: null as { id: string } | null, loading: false, isDevMode: false },
}));
const rpc = vi.hoisted(() => vi.fn());
vi.mock("@/components/auth/auth-provider", () => ({ useAuth: () => auth.value }));
vi.mock("@/functions/supabase-client", () => ({ getSupabaseClient: () => ({ rpc }) }));

import { nativeWidgetBridge, WidgetPairing } from "@/components/providers/widget-pairing";

const win = (extra: Record<string, unknown>) => extra as unknown as Window;

describe("nativeWidgetBridge", () => {
    it("is absent in a normal browser and in app builds without the widget", () => {
        expect(nativeWidgetBridge(win({}))).toBeNull();
        expect(nativeWidgetBridge(win({ MuscatBayNative: { widget: { paired: false } } }))).toBeNull();
    });

    it("reads the app's pairing state and device label", () => {
        const bridge = nativeWidgetBridge(
            win({
                MuscatBayNative: { widget: { paired: false, label: "iPhone widget" } },
                ReactNativeWebView: { postMessage: () => undefined },
            }),
        );
        expect(bridge).toEqual({ paired: false, label: "iPhone widget" });
    });

    it("falls back to a generic label", () => {
        const bridge = nativeWidgetBridge(
            win({ MuscatBayNative: { widget: { paired: true } }, ReactNativeWebView: { postMessage: () => undefined } }),
        );
        expect(bridge).toEqual({ paired: true, label: "iOS widget" });
    });
});

// ── Pairing runs once per sign-in ────────────────────────────────────────────
// The auth provider publishes the same signed-in user two or three times as a
// page opens (session read, INITIAL_SESSION, SIGNED_IN), each as a new object.
// Each publish used to cancel the request in flight and start another, and the
// abandoned requests still created keys — three live keys per pairing.

const KEY = "a".repeat(64);

describe("WidgetPairing", () => {
    const posted: string[] = [];
    beforeEach(() => {
        posted.length = 0;
        rpc.mockReset();
        Object.assign(window, {
            MuscatBayNative: { widget: { paired: false, label: "iPhone widget" } },
            ReactNativeWebView: { postMessage: (message: string) => posted.push(message) },
        });
    });
    afterEach(() => {
        delete (window as { MuscatBayNative?: unknown }).MuscatBayNative;
        delete (window as { ReactNativeWebView?: unknown }).ReactNativeWebView;
    });

    it("issues one key however often the same user is re-published", async () => {
        let resolve: (value: { data: string; error: null }) => void = () => {};
        rpc.mockReturnValue(new Promise((r) => { resolve = r; }));

        auth.value = { user: { id: "u1" }, loading: false, isDevMode: false };
        const view = render(<WidgetPairing />);
        for (let i = 0; i < 2; i++) {
            auth.value = { user: { id: "u1" }, loading: false, isDevMode: false };
            view.rerender(<WidgetPairing />);
        }
        await act(async () => { resolve({ data: KEY, error: null }); });

        expect(rpc).toHaveBeenCalledTimes(1);
        expect(posted).toEqual([JSON.stringify({ type: "mb-widget-key", key: KEY })]);
    });

    it("does not hand a key to the app once the user has signed out", async () => {
        let resolve: (value: { data: string; error: null }) => void = () => {};
        rpc.mockReturnValue(new Promise((r) => { resolve = r; }));

        auth.value = { user: { id: "u1" }, loading: false, isDevMode: false };
        const view = render(<WidgetPairing />);
        auth.value = { user: null, loading: false, isDevMode: false };
        view.rerender(<WidgetPairing />);
        await act(async () => { resolve({ data: KEY, error: null }); });

        expect(posted).toEqual([]);
    });
});
