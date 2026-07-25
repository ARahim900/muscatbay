import { cn } from "@/lib/utils";
import { getStatusPresentation } from "@/lib/status-colors";

interface StatusIndicatorProps {
    /** Raw status string from the record (e.g. "Active", "Under Maintenance"). */
    status: string | null;
    /** Override the visible text. Defaults to the raw status, then the severity word. */
    label?: string;
    /** `inline` for table cells / card headers, `stripe` prepends nothing extra. */
    className?: string;
    /** Hide the text label (icon + colour only). Adds an accessible name instead. */
    iconOnly?: boolean;
}

/**
 * Triple-coded status: colour + icon + text, so status never depends on colour
 * alone (WCAG 1.4.1). Pair with `getStatusBorderClass()` for the card stripe.
 */
export function StatusIndicator({ status, label, className, iconOnly = false }: StatusIndicatorProps) {
    const { icon: Icon, iconClass, severityLabel } = getStatusPresentation(status);
    const text = label ?? status ?? severityLabel;

    return (
        <span
            className={cn("inline-flex items-center gap-1.5 text-xs font-medium text-foreground", className)}
            title={iconOnly ? text : undefined}
        >
            <Icon className={cn("h-3.5 w-3.5 shrink-0", iconClass)} aria-hidden="true" strokeWidth={2.25} />
            {iconOnly ? <span className="sr-only">{`${severityLabel}: ${text}`}</span> : text}
        </span>
    );
}
