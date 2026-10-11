"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { getSupabaseClient } from "@/functions/supabase-client";

/**
 * Connects the iOS Home Screen widget to this account — inside the app only.
 *
 * The widget runs outside the web view and cannot use this page's session, so
 * the app asks for a per-device read-only key once: the app announces itself
 * as `window.MuscatBayNative.widget` (with `paired` and a device `label`), and
 * a signed-in page issues a key with `create_widget_token` and posts it to the
 * app, which keeps it where the widget can read it. Signing out tells the app
 * to forget the key. In a normal browser `MuscatBayNative` is absent and
 * nothing happens.
 *
 * Spec: docs/superpowers/specs/2026-10-06-ios-home-widget-design.md
 */

interface NativeWidgetBridge {
    paired: boolean;
    label: string;
}

declare global {
    interface Window {
        MuscatBayNative?: { widget?: Partial<NativeWidgetBridge> };
        ReactNativeWebView?: { postMessage: (message: string) => void };
    }
}

export const WIDGET_KEY_MESSAGE = "mb-widget-key";

/** The app's widget bridge, or null outside the app (or in an older build). */
export function nativeWidgetBridge(win: Window): NativeWidgetBridge | null {
    const widget = win.MuscatBayNative?.widget;
    if (!widget || typeof win.ReactNativeWebView?.postMessage !== "function") return null;
    const label = typeof widget.label === "string" ? widget.label.trim().slice(0, 60) : "";
    return { paired: widget.paired === true, label: label || "iOS widget" };
}

function postKey(win: Window, key: string | null) {
    win.ReactNativeWebView?.postMessage(JSON.stringify({ type: WIDGET_KEY_MESSAGE, key }));
}

export function WidgetPairing() {
    const { user, loading, isDevMode } = useAuth();
    const userId = user?.id ?? null;
    // The user a key was asked for, kept until sign-out. The auth provider
    // publishes the same user several times as a page opens; the request is
    // never abandoned and re-sent for those, because an abandoned request
    // still creates a key on the server.
    const requestedFor = useRef<string | null>(null);
    // Who is signed in now, read when the key arrives.
    const currentUser = useRef<string | null>(userId);
    useEffect(() => {
        currentUser.current = userId;
    }, [userId]);

    useEffect(() => {
        if (loading || isDevMode) return;
        const bridge = nativeWidgetBridge(window);
        if (!bridge) return;

        if (!userId) {
            if (bridge.paired) postKey(window, null);
            requestedFor.current = null;
            return;
        }
        if (bridge.paired || requestedFor.current === userId) return;

        const client = getSupabaseClient();
        if (!client) return;
        requestedFor.current = userId;
        void (async () => {
            const { data, error } = await client.rpc("create_widget_token", {
                p_label: bridge.label,
            });
            // Signed out (or switched account) while the key was on its way.
            if (currentUser.current !== userId) return;
            if (error || typeof data !== "string" || !/^[0-9a-f]{64}$/.test(data)) {
                // Not fatal: the widget keeps asking to be connected, and the
                // next app launch tries again.
                console.warn("[widget] could not connect the Home Screen widget", error?.message);
                return;
            }
            postKey(window, data);
        })();
    }, [userId, loading, isDevMode]);

    return null;
}
