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
 */

import { useEffect, useState, useRef } from 'react';
import { getSupabaseClient } from '@/functions/supabase-client';

export interface UseSupabaseRealtimeOptions {
    /** The Supabase table name to listen for changes on */
    table: string;
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
 * Subscribe to real-time Postgres changes on a Supabase table.
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
    // every time the caller's callback identity changes.
    const onChangedRef = useRef(onChanged);
    onChangedRef.current = onChanged;

    useEffect(() => {
        if (!enabled) {
            setIsLive(false);
            return;
        }

        const client = getSupabaseClient();
        if (!client) {
            setIsLive(false);
            return;
        }

        const channelConfig: {
            event: '*';
            schema: string;
            table: string;
            filter?: string;
        } = {
            event: '*',
            schema: 'public',
            table,
        };

        if (filter) {
            channelConfig.filter = filter;
        }

        const channel = client
            .channel(channelName)
            .on('postgres_changes', channelConfig, () => {
                onChangedRef.current();
            })
            .subscribe((status) => {
                setIsLive(status === 'SUBSCRIBED');
            });

        return () => {
            setIsLive(false);
            client.removeChannel(channel);
        };
    }, [table, channelName, filter, enabled]);

    return { isLive };
}
