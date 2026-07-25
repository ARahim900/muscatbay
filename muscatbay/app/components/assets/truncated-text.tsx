"use client";

/**
 * Truncated free-text cell with a touch-accessible full view.
 *
 * `truncate` + `title=` is unreadable on a tablet — there is no hover. Any text
 * long enough to be clipped therefore becomes a real button that opens a dialog
 * containing the complete text, so the content is reachable by touch, mouse and
 * keyboard alike.
 */

import { useState } from "react";
import { Maximize2 } from "lucide-react";
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/** Below this length the text is short enough to never clip — render it plain. */
const CLIP_THRESHOLD = 48;

interface TruncatedTextProps {
    text: string | null | undefined;
    /** Accessible name for the dialog, e.g. "AMC notes — Chiller 01". */
    label: string;
    /** Number of lines shown inline before clamping (default 2). */
    lines?: 1 | 2;
    className?: string;
    /** Rendered when there is no text at all. */
    fallback?: string;
}

export function TruncatedText({
    text,
    label,
    lines = 2,
    className,
    fallback = "-",
}: TruncatedTextProps) {
    const [open, setOpen] = useState(false);
    const value = (text ?? "").trim();

    if (!value) {
        return <span className="text-muted-foreground/70 dark:text-muted-foreground">{fallback}</span>;
    }

    if (value.length <= CLIP_THRESHOLD) {
        return <span className={className}>{value}</span>;
    }

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                aria-label={`Read full ${label}`}
                className={cn(
                    "group/tt flex w-full items-start gap-1 rounded-md text-start text-inherit",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    className,
                )}
            >
                <span className={lines === 1 ? "line-clamp-1" : "line-clamp-2"}>{value}</span>
                <Maximize2
                    className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground opacity-70 transition-opacity group-hover/tt:opacity-100"
                    aria-hidden="true"
                />
            </button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-base">{label}</DialogTitle>
                        <DialogDescription className="sr-only">Full text</DialogDescription>
                    </DialogHeader>
                    <p className="max-h-[60vh] overflow-y-auto whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">
                        {value}
                    </p>
                </DialogContent>
            </Dialog>
        </>
    );
}
