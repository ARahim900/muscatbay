"use client";

/**
 * Filter Preferences Utility
 * Saves and loads user filter preferences to/from localStorage
 */

const STORAGE_PREFIX = "mb_filters_";

export interface FilterPreferences {
    [key: string]: string | number | boolean | [number, number] | null;
}

/**
 * Save filter preferences to localStorage
 * @param pageKey - Unique key for the page (e.g., 'water', 'electricity', 'stp')
 * @param preferences - Object containing filter state
 */
export function saveFilterPreferences(pageKey: string, preferences: FilterPreferences): void {
    if (typeof window === "undefined") return;

    try {
        const key = `${STORAGE_PREFIX}${pageKey}`;
        localStorage.setItem(key, JSON.stringify(preferences));
    } catch (error) {
        console.warn("Failed to save filter preferences:", error);
    }
}

/**
 * Load filter preferences from localStorage
 * @param pageKey - Unique key for the page
 * @returns Saved preferences or null if not found
 */
export function loadFilterPreferences<T extends FilterPreferences>(pageKey: string): T | null {
    if (typeof window === "undefined") return null;

    try {
        const key = `${STORAGE_PREFIX}${pageKey}`;
        const stored = localStorage.getItem(key);
        if (stored) {
            return JSON.parse(stored) as T;
        }
    } catch (error) {
        console.warn("Failed to load filter preferences:", error);
    }
    return null;
}

/**
 * Clear filter preferences for a specific page
 * @param pageKey - Unique key for the page
 */
export function clearFilterPreferences(pageKey: string): void {
    if (typeof window === "undefined") return;

    try {
        const key = `${STORAGE_PREFIX}${pageKey}`;
        localStorage.removeItem(key);
    } catch (error) {
        console.warn("Failed to clear filter preferences:", error);
    }
}

/**
 * Clear all Muscat Bay filter preferences
 */
export function clearAllFilterPreferences(): void {
    if (typeof window === "undefined") return;

    try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith(STORAGE_PREFIX)) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach((key) => localStorage.removeItem(key));
    } catch (error) {
        console.warn("Failed to clear all filter preferences:", error);
    }
}
