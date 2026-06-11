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

        // ONE channel for all tables — one postgres_changes listener per table
        let channel = client.channel(channelName);
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

            channel = channel.on('postgres_changes', channelConfig, () => {
                onChangedRef.current();
            });
        }

        channel.subscribe((status) => {
            setIsLive(status === 'SUBSCRIBED');
        });

        return () => {
            setIsLive(false);
            client.removeChannel(channel);
        };
    }, [tablesKey, channelName, filter, enabled]);

    return { isLive };
}
