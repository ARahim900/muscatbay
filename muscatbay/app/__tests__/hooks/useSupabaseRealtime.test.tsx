import { afterEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";

/**
 * A burst of realtime row events must become one refetch. Every event used to
 * call onChanged directly, so a 300-row sync triggered 300 full page refetches.
 */

const handlers: Array<() => void> = [];
const channel = {
    on: vi.fn((_type: string, _config: unknown, cb: () => void) => { handlers.push(cb); return channel; }),
    subscribe: vi.fn(() => channel),
};
const client = { channel: vi.fn(() => channel), removeChannel: vi.fn() };
vi.mock("@/functions/supabase-client", () => ({ getSupabaseClient: () => client }));

const { useSupabaseRealtime } = await import("@/hooks/useSupabaseRealtime");

afterEach(() => {
    handlers.length = 0;
    vi.clearAllMocks();
    vi.useRealTimers();
});

describe("useSupabaseRealtime", () => {
    it("collapses a burst of events into one onChanged call", () => {
        vi.useFakeTimers();
        const onChanged = vi.fn();
        renderHook(() => useSupabaseRealtime({ table: "stp_operations", channelName: "t", onChanged, debounceMs: 500 }));

        for (let i = 0; i < 300; i++) handlers[0]();
        expect(onChanged).not.toHaveBeenCalled();

        vi.advanceTimersByTime(500);
        expect(onChanged).toHaveBeenCalledTimes(1);
    });

    it("still refreshes during a steady stream that never goes quiet", () => {
        vi.useFakeTimers();
        const onChanged = vi.fn();
        renderHook(() => useSupabaseRealtime({ table: "t", channelName: "t", onChanged, debounceMs: 750, maxWaitMs: 5000 }));

        // One event every 500 ms for 12 s — the 750 ms quiet period never arrives.
        for (let t = 0; t < 12000; t += 500) {
            handlers[0]();
            vi.advanceTimersByTime(500);
        }
        expect(onChanged.mock.calls.length).toBeGreaterThanOrEqual(2);

        // Once the stream stops, the trailing call still lands.
        const before = onChanged.mock.calls.length;
        vi.advanceTimersByTime(1000);
        expect(onChanged.mock.calls.length).toBe(before + 1);
    });

    it("keeps a pending change across a re-subscribe", () => {
        vi.useFakeTimers();
        const onChanged = vi.fn();
        const { rerender } = renderHook(
            ({ filter }: { filter: string }) => useSupabaseRealtime({ table: "t", channelName: "t", onChanged, filter }),
            { initialProps: { filter: "month=eq.Sep-26" } },
        );

        handlers[0]();
        rerender({ filter: "month=eq.Oct-26" }); // tears down the old channel mid-debounce
        vi.advanceTimersByTime(1000);
        expect(onChanged).toHaveBeenCalledTimes(1);
    });

    it("drops a pending call when the component unmounts", () => {
        vi.useFakeTimers();
        const onChanged = vi.fn();
        const { unmount } = renderHook(() => useSupabaseRealtime({ table: "t", channelName: "t", onChanged }));

        handlers[0]();
        const removedBefore = client.removeChannel.mock.calls.length;
        unmount();
        vi.advanceTimersByTime(5000);
        expect(onChanged).not.toHaveBeenCalled();
        expect(client.removeChannel.mock.calls.length).toBe(removedBefore + 1);
    });

    it("gives each subscription its own channel name", () => {
        renderHook(() => useSupabaseRealtime({ table: "t", channelName: "water-rt", onChanged: vi.fn() }));
        renderHook(() => useSupabaseRealtime({ table: "t", channelName: "water-rt", onChanged: vi.fn() }));
        const [first, second] = client.channel.mock.calls.map((c) => (c as unknown as [string])[0]);
        expect(first).toMatch(/^water-rt-/);
        expect(first).not.toBe(second);
    });
});
