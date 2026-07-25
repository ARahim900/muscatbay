/**
 * Centralized status mapping for consistent status presentation across pages.
 * Used by contractors, assets, and other data pages.
 *
 * WCAG 1.4.1 (Use of Colour): status must never be carried by colour alone.
 * `getStatusPresentation()` returns the colour **together with** an icon and a
 * text label so every consumer (desktop table, mobile card, chip) can render a
 * triple-coded indicator. Prefer it over the colour-only helpers below.
 */

import {
    AlertTriangle,
    CheckCircle2,
    Circle,
    Info,
    XCircle,
    type LucideIcon,
} from 'lucide-react';

export type StatusDotColor = 'green' | 'red' | 'orange' | 'blue' | 'slate';

/** Map a general status string to a dot color for StatusBadge */
export function getGeneralStatusColor(status: string | null): StatusDotColor {
    const s = (status || '').toLowerCase();
    if (s.includes('active') || s.includes('done') || s.includes('completed')) return 'green';
    if (s.includes('expired') || s.includes('decommissioned') || s.includes('fault') || s.includes('critical')) return 'red';
    if (s.includes('maintenance') || s.includes('retain') || s.includes('warning') || s.includes('in_progress') || s.includes('in progress')) return 'orange';
    if (s.includes('storage') || s.includes('not_started') || s.includes('not started') || s.includes('inactive')) return 'slate';
    return 'blue';
}

/** Everything a consumer needs to render a status without relying on colour. */
export interface StatusPresentation {
    /** Dot colour key — feeds StatusBadge's `color` prop. */
    color: StatusDotColor;
    /** Shape-distinct lucide icon. Always render it alongside the label. */
    icon: LucideIcon;
    /**
     * Generic severity word for the colour bucket ("Active", "Attention", …).
     * Use as a fallback / screen-reader prefix when the raw status string is
     * absent; when you have the raw value, show that as the visible label and
     * keep this as the `aria-label` qualifier.
     */
    severityLabel: string;
    /** Tailwind class for the inline-start accent border on mobile cards. */
    borderClass: string;
    /** Tailwind class for the icon colour. */
    iconClass: string;
    /** Tailwind class for a subtle tinted background (chips, icon wells). */
    tintClass: string;
}

/**
 * Colour → presentation. Colours come from the `--status-*` tokens (never raw
 * palette hexes) so both themes stay in sync with globals.css.
 */
const PRESENTATION: Record<StatusDotColor, Omit<StatusPresentation, 'color'>> = {
    green: {
        icon: CheckCircle2,
        severityLabel: 'Normal',
        borderClass: 'border-s-[var(--status-normal)]',
        iconClass: 'text-[var(--status-normal)]',
        tintClass: 'bg-[var(--status-normal-bg)]',
    },
    red: {
        icon: XCircle,
        severityLabel: 'Critical',
        borderClass: 'border-s-[var(--status-danger)]',
        iconClass: 'text-[var(--status-danger)]',
        tintClass: 'bg-[var(--status-danger-bg)]',
    },
    orange: {
        icon: AlertTriangle,
        severityLabel: 'Attention',
        borderClass: 'border-s-[var(--status-warning)]',
        iconClass: 'text-[var(--status-warning)]',
        tintClass: 'bg-[var(--status-warning-bg)]',
    },
    blue: {
        icon: Info,
        severityLabel: 'Information',
        borderClass: 'border-s-[var(--status-info)]',
        iconClass: 'text-[var(--status-info)]',
        tintClass: 'bg-[var(--status-info-bg)]',
    },
    slate: {
        icon: Circle,
        severityLabel: 'Inactive',
        borderClass: 'border-s-[var(--status-missing)]',
        iconClass: 'text-[var(--status-missing)]',
        tintClass: 'bg-[var(--status-missing-bg)]',
    },
};

/**
 * Resolve a raw status string into colour + icon + label.
 *
 * ```tsx
 * const { icon: Icon, iconClass, borderClass, severityLabel } = getStatusPresentation(item.status);
 * <article className={cn("border-s-4", borderClass)}>
 *     <Icon className={cn("h-4 w-4", iconClass)} aria-hidden="true" />
 *     <span>{item.status ?? severityLabel}</span>
 * </article>
 * ```
 *
 * Prefer the shared `<StatusIndicator />` component
 * (`components/shared/status-indicator.tsx`), which renders exactly this.
 */
export function getStatusPresentation(status: string | null): StatusPresentation {
    const color = getGeneralStatusColor(status);
    return { color, ...PRESENTATION[color] };
}

/**
 * Map a status to a Tailwind border-start colour class for mobile cards.
 *
 * ⚠️ Colour-only — on its own this fails WCAG 1.4.1. Only use it for the card's
 * accent stripe, and always render `getStatusPresentation()`'s icon + label
 * inside the card as well.
 */
export function getStatusBorderClass(status: string | null): string {
    return getStatusPresentation(status).borderClass;
}
