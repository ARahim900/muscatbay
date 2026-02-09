"use client";

import { createContext, useContext, useCallback, useRef, ReactNode } from "react";

/**
 * Lightweight context that tracks when section data was last updated.
 * When a section page loads fresh data, it calls `notifyUpdate(sectionKey)`.
 * The dashboard can check `getLastUpdate(sectionKey)` to know if it needs to re-fetch.
 */

interface DataRefreshContextType {
    /** Call this when a section finishes loading/refreshing data */
    notifyUpdate: (section: string) => void;
    /** Returns the timestamp of the last update for a section, or 0 if never */
    getLastUpdate: (section: string) => number;
    /** Returns true if ANY section was updated after the given timestamp */
    hasUpdatedSince: (timestamp: number) => boolean;
}

const DataRefreshContext = createContext<DataRefreshContextType>({
    notifyUpdate: () => {},
    getLastUpdate: () => 0,
    hasUpdatedSince: () => false,
});

export function DataRefreshProvider({ children }: { children: ReactNode }) {
    const updatesRef = useRef<Record<string, number>>({});

    const notifyUpdate = useCallback((section: string) => {
        updatesRef.current[section] = Date.now();
    }, []);

    const getLastUpdate = useCallback((section: string) => {
        return updatesRef.current[section] || 0;
    }, []);

    const hasUpdatedSince = useCallback((timestamp: number) => {
        return Object.values(updatesRef.current).some(t => t > timestamp);
    }, []);

    return (
        <DataRefreshContext.Provider value={{ notifyUpdate, getLastUpdate, hasUpdatedSince }}>
            {children}
        </DataRefreshContext.Provider>
    );
}

export function useDataRefresh() {
    return useContext(DataRefreshContext);
}
