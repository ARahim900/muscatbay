"use client";

import React, { useRef, useCallback, type KeyboardEvent } from 'react';

interface ZoneTabsProps {
    zones: { code: string; name: string }[];
    selectedZone: string;
    onZoneChange: (zone: string) => void;
}

export function ZoneTabs({ zones, selectedZone, onZoneChange }: ZoneTabsProps) {
    const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);

    const handleKeyDown = useCallback((e: KeyboardEvent<HTMLButtonElement>, index: number) => {
        let nextIndex: number | null = null;

        if (e.key === 'ArrowRight') {
            nextIndex = (index + 1) % zones.length;
        } else if (e.key === 'ArrowLeft') {
            nextIndex = (index - 1 + zones.length) % zones.length;
        } else if (e.key === 'Home') {
            nextIndex = 0;
        } else if (e.key === 'End') {
            nextIndex = zones.length - 1;
        }

        if (nextIndex !== null) {
            e.preventDefault();
            tabsRef.current[nextIndex]?.focus();
            onZoneChange(zones[nextIndex].code);
        }
    }, [zones, onZoneChange]);

    return (
        <div
            role="tablist"
            aria-label="Zone selection"
            aria-orientation="horizontal"
            className="flex flex-wrap gap-2"
        >
            {zones.map((zone, index) => {
                const isSelected = zone.code === selectedZone;
                return (
                    <button
                        key={zone.code}
                        ref={el => { tabsRef.current[index] = el; }}
                        role="tab"
                        aria-selected={isSelected}
                        aria-controls={`zone-panel-${zone.code}`}
                        id={`zone-tab-${zone.code}`}
                        tabIndex={isSelected ? 0 : -1}
                        onClick={() => onZoneChange(zone.code)}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        className={`px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg text-sm font-medium transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-secondary/50 focus-visible:outline-none ${isSelected
                                ? 'bg-secondary text-white shadow-md'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                    >
                        {zone.name}
                    </button>
                );
            })}
        </div>
    );
}
