/**
 * @fileoverview Window-Scroll Row Virtualizer for Plain <table> Markup
 *
 * Wraps `useWindowVirtualizer` from @tanstack/react-virtual with the
 * SPACER-ROW technique: instead of absolutely positioning rows (which breaks
 * table semantics, sticky headers, and sticky columns), callers render a
 * padding `<tr><td colSpan={N} style={{ height, padding: 0, border: 0 }} /></tr>`
 * above and below the visible window. Rows stay in normal table flow.
 *
 * Tables in this app scroll with the window (no fixed-height container);
 * horizontal overflow lives inside `.ops-table-shell`, so the window is the
 * vertical scroll element.
 *
 * @module hooks/useVirtualTableRows
 *
 * @example
 * ```tsx
 * const { bodyRef, virtualItems, paddingTop, paddingBottom } = useVirtualTableRows({
 *     count: rows.length,
 *     enabled: rows.length > 100,
 * });
 *
 * <tbody ref={bodyRef}>
 *     {paddingTop > 0 && (
 *         <tr aria-hidden="true"><td colSpan={COLS} style={{ height: paddingTop, padding: 0, border: 0 }} /></tr>
 *     )}
 *     {virtualItems.map(vi => renderRow(rows[vi.index], vi.index))}
 *     {paddingBottom > 0 && (
 *         <tr aria-hidden="true"><td colSpan={COLS} style={{ height: paddingBottom, padding: 0, border: 0 }} /></tr>
 *     )}
 * </tbody>
 * ```
 */

import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { useWindowVirtualizer } from '@tanstack/react-virtual';

export interface UseVirtualTableRowsOptions {
    /** Total number of rows in the full list (not the visible slice). */
    count: number;
    /** Estimated row height in px — matches the 52px `.ops-table` row (default 52). */
    estimateSize?: number;
    /** Extra rows rendered beyond the viewport on each side (default 10). */
    overscan?: number;
    /** Row count above which virtualization activates when `enabled` is omitted (default 100). */
    threshold?: number;
    /**
     * Explicit override — when false, every row renders normally with zero
     * padding. Defaults to `count > threshold`.
     */
    enabled?: boolean;
}

export interface VirtualTableRow {
    /** Index into the caller's full row list. */
    index: number;
}

export interface UseVirtualTableRowsResult<TElement extends HTMLElement> {
    /** Attach to the `<tbody>` (or shell div) whose document offset anchors the virtualizer. */
    bodyRef: RefObject<TElement | null>;
    /** Rows to render — every row when below threshold, the visible window otherwise. */
    virtualItems: VirtualTableRow[];
    /** Height (px) of the spacer row before the first rendered row. */
    paddingTop: number;
    /** Height (px) of the spacer row after the last rendered row. */
    paddingBottom: number;
    /** True when the spacer-row window is active. */
    isVirtualized: boolean;
}

/**
 * Virtualize table rows against window scroll while keeping plain `<table>`
 * markup intact. SSR-safe: `window` is only touched inside effects and the
 * virtualizer's own mount-time internals.
 */
export function useVirtualTableRows<TElement extends HTMLElement = HTMLTableSectionElement>({
    count,
    estimateSize = 52,
    overscan = 10,
    threshold = 100,
    enabled,
}: UseVirtualTableRowsOptions): UseVirtualTableRowsResult<TElement> {
    const isVirtualized = enabled ?? count > threshold;
    const bodyRef = useRef<TElement | null>(null);

    // Document-relative top of the table body. Measured in an effect (never
    // during SSR/render) and re-measured when content above the table changes
    // height (filter pills, toolbars, tab switches, …).
    const [scrollMargin, setScrollMargin] = useState(0);
    useEffect(() => {
        if (!isVirtualized) return;
        const measure = () => {
            const el = bodyRef.current;
            if (!el) return;
            setScrollMargin(el.getBoundingClientRect().top + window.scrollY);
        };
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(document.body);
        return () => observer.disconnect();
    }, [isVirtualized, count]);

    const virtualizer = useWindowVirtualizer({
        count,
        estimateSize: () => estimateSize,
        overscan,
        scrollMargin,
        enabled: isVirtualized,
    });

    // With `scrollMargin`, item offsets are document-relative while
    // `getTotalSize()` is list-relative — subtract the margin to convert.
    const items = virtualizer.getVirtualItems();
    const paddingTop = isVirtualized && items.length > 0
        ? Math.max(0, items[0].start - scrollMargin)
        : 0;
    const paddingBottom = isVirtualized && items.length > 0
        ? Math.max(0, virtualizer.getTotalSize() - (items[items.length - 1].end - scrollMargin))
        : 0;

    const virtualItems = useMemo<VirtualTableRow[]>(() => {
        if (!isVirtualized) {
            // Below the threshold: hand back every index so callers render normally.
            return Array.from({ length: count }, (_, index) => ({ index }));
        }
        return items.map(item => ({ index: item.index }));
    }, [isVirtualized, count, items]);

    return { bodyRef, virtualItems, paddingTop, paddingBottom, isVirtualized };
}
