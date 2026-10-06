import { describe, expect, it } from "vitest";
import { nativeWidgetBridge } from "@/components/providers/widget-pairing";

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
