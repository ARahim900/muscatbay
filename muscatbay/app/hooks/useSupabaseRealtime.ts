/**
 * @fileoverview Reusable Supabase Real-Time Subscription Hook
 * 
 * Wraps Supabase Realtime channel subscriptions into a simple React hook.
 * Handles channel creation, status tracking, and cleanup on unmount.
 * 
 * @module hooks/useSupabaseRealtime
 * 
 * @example
 * ```tsx
 * useSupabaseRealtime({
 *   table: 'Water System',
 *   channelName: 'water-system-rt',
 *   onChanged: () => refetchData(),
 * });
 * ```
 *
 * @example
 * ```tsx
 * // Multiple tables share ONE channel (one listener per table)
 * useSupabaseRealtime({
 *   table: ['stp_operations', 'Water System'],
 *   channelName: 'dashboard-rt',
 *   onChanged: () => refetchData(),
 * });
 * ```
 */

import { useEffect, useState, useRef } from 'react';
import { getSupabaseClient } from '@/functions/supabase-client';

export interface UseSupabaseRealtimeOptions {
    /**
     * The Supabase table name(s) to listen for changes on.
     * Pass an array to attach several `postgres_changes` listeners
     * to a single shared channel instead of one channel per table.
     */
    table: string | string[];
    /** Unique channel name — used to avoid duplicate subscriptions */
    channelName: string;
    /** Called whenever an INSERT, UPDATE, or DELETE is received */
    onChanged: () => void;
    /** Postgres filter expression, e.g. `month=eq.Feb-26` (optional) */
    filter?: string;
    /** Set to false to disable the subscription (default: true) */
    enabled?: boolean;
    /**
     * Quiet period in ms before `onChanged` fires (default 750). A sync that
     * writes 300 rows sends 300 events; they collapse into one refetch instead
     * of 300, each of which used to fan out into a dozen requests per tablet.
     */
    debounceMs?: number;
    /**
     * Longest a pending refetch may be postponed (default 5000). Under a
     * steady event stream the quiet period never arrives; this bound still
     * refreshes the page at least this often.
     */
    maxWaitMs?: number;
}

export interface UseSupabaseRealtimeResult {
    /** Whether the channel is actively subscribed and receiving events */
    isLive: boolean;
}

/**
 * Subscribe to real-time Postgres changes on one or more Supabase tables.
 *
 * All tables share a single realtime channel — supabase-js supports
 * chaining several `.on('postgres_changes', …)` listeners on one channel
 * before calling `.subscribe()`.
 *
 * The hook automatically cleans up the channel when:
 * - the component unmounts
 * - any dependency (table, channelName, filter, enabled) changes
 */
export function useSupabaseRealtime({
    table,
    channelName,
    onChanged,
    filter,
    enabled = true,
    debounceMs = 750,
    maxWaitMs = 5000,
}: UseSupabaseRealtimeOptions): UseSupabaseRealtimeResult {
    const [isLive, setIsLive] = useState(false);

    // Keep a stable reference to the callback to avoid re-subscribing
    // every time the caller's callback identity changes. The ref is
    // updated in an effect (not during render) so concurrent rendering
    // cannot observe an inconsistent value.
    const onChangedRef = useRef(onChanged);
    useEffect(() => {
        onChangedRef.current = onChanged;
    }, [onChanged]);

    // Serialize the table list into a stable key so callers passing a new
    // array instance with the same contents do not re-subscribe every render.
    const tablesKey = JSON.stringify(Array.isArray(table) ? table : [table]);

    // A change received but not yet delivered. It outlives a re-subscribe
    // (filter, tables or timing changed) so that change is not lost; on
    // unmount no new subscription starts, so it is simply dropped.
    const pendingRef = useRef(false);

    // isLive is external-world state (Supabase subscription status), not
    // derivable from props alone; guard clauses must reset it when
    // prerequisites change.
    useEffect(() => {
        if (!enabled) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setIsLive(false);
            return;
        }

        const client = getSupabaseClient();
        if (!client) {

            setIsLive(false);
            return;
        }

        const tables = JSON.parse(tablesKey) as string[];

        // Trailing debounce: a burst of row events becomes one onChanged call,
        // but a steady stream can never postpone it past maxWaitMs.
        let timer: ReturnType<typeof setTimeout> | null = null;
        let firstPendingAt: number | null = null;
        const fire = () => {
            if (timer) clearTimeout(timer);
            timer = null;
            firstPendingAt = null;
            pendingRef.current = false;
            onChangedRef.current();
        };
        const notify = () => {
            pendingRef.current = true;
            const now = Date.now();
            if (firstPendingAt === null) firstPendingAt = now;
            const waited = now - firstPendingAt;
            if (waited >= maxWaitMs) {
                fire();
                return;
            }
            if (timer) clearTimeout(timer);
            timer = setTimeout(fire, Math.min(debounceMs, maxWaitMs - waited));
        };

        // ONE channel for all tables — one postgres_changes listener per table.
        // A unique suffix per subscription: re-subscribing under the same name
        // while the previous channel is still leaving could leave this one dead.
        let channel = client.channel(`${channelName}-${Math.random().toString(36).slice(2, 10)}`);
        for (const tableName of tables) {
            const channelConfig: {
                event: '*';
                schema: string;
                table: string;
                filter?: string;
            } = {
                event: '*',
                schema: 'public',
                table: tableName,
            };

            if (filter) {
                channelConfig.filter = filter;
            }

            channel = channel.on('postgres_changes', channelConfig, notify);
        }

        channel.subscribe((status) => {
            setIsLive(status === 'SUBSCRIBED');
        });

        // Deliver a change carried over from the previous subscription.
        if (pendingRef.current) notify();

        return () => {
            if (timer) clearTimeout(timer);
            setIsLive(false);
            client.removeChannel(channel);
        };
    }, [tablesKey, channelName, filter, enabled, debounceMs, maxWaitMs]);

    return { isLive };
}
