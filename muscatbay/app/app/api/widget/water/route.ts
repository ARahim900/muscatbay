/**
 * Home Screen widget feed — the day's water figures for the iOS widget.
 *
 * The widget sends its per-device key (issued by `create_widget_token` when the
 * app pairs) as a bearer token. The database checks the key and returns the
 * latest month's raw daily rows; the figures are computed here with the Daily
 * page's own functions (lib/widget/water-summary.ts).
 *
 * Spec: docs/superpowers/specs/2026-10-06-ios-home-widget-design.md
 */

import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import {
    summariseWidgetWater,
    type WidgetWaterRow,
} from "@/lib/widget/water-summary";

export const dynamic = "force-dynamic";

const KEY_PATTERN = /^Bearer ([0-9a-f]{64})$/;

interface FeedPayload {
    month: string | null;
    year: number | null;
    rows: WidgetWaterRow[];
}

function respond(body: Record<string, unknown>, status: number) {
    return NextResponse.json(body, {
        status,
        headers: { "Cache-Control": "no-store" },
    });
}

function isFeedPayload(value: unknown): value is FeedPayload {
    if (!value || typeof value !== "object") return false;
    const payload = value as Record<string, unknown>;
    return (
        (payload.month === null || typeof payload.month === "string") &&
        (payload.year === null || typeof payload.year === "number") &&
        Array.isArray(payload.rows) &&
        payload.rows.every(
            (row) =>
                row !== null &&
                typeof row === "object" &&
                typeof (row as Record<string, unknown>).account_number === "string",
        )
    );
}

export async function GET(request: Request) {
    const key = KEY_PATTERN.exec(request.headers.get("authorization") ?? "")?.[1];
    if (!key) return respond({ error: "unauthorised" }, 401);

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) return respond({ error: "unavailable" }, 503);

    const supabase = createClient(url, anonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await supabase.rpc("widget_water_latest", { p_token: key });
    if (error) {
        console.error("[widget/water] feed query failed", error.message);
        return respond({ error: "unavailable" }, 503);
    }
    // The database answers null for an unknown, revoked or unauthorised key.
    if (data === null) return respond({ error: "unauthorised" }, 401);
    if (!isFeedPayload(data)) {
        console.error("[widget/water] unexpected feed shape");
        return respond({ error: "unavailable" }, 503);
    }

    const summary =
        data.month && data.year !== null
            ? summariseWidgetWater(data.rows, data.month, data.year)
            : null;
    return respond({ summary, generatedAt: new Date().toISOString() }, 200);
}
