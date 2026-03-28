/**
 * Centralized status color mapping for consistent color usage across pages.
 * Used by contractors, assets, and other data pages.
 */

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

/** Map a status to a Tailwind border-start color class for mobile cards */
export function getStatusBorderClass(status: string | null): string {
    const color = getGeneralStatusColor(status);
    const map: Record<StatusDotColor, string> = {
        green: 'border-s-emerald-500',
        red: 'border-s-red-400',
        orange: 'border-s-amber-500',
        blue: 'border-s-blue-400',
        slate: 'border-s-slate-400',
    };
    return map[color];
}
