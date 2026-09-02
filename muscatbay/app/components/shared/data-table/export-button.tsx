"use client";

import { Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { exportToCSV, getDateForFilename } from '@/lib/export-utils';

export interface ExportColumn<T extends object> {
    /** Property to read from each row (ignored when `format` is given). */
    key: keyof T & string;
    /** Column header in the exported file. */
    header: string;
    /** Optional cell formatter — receives the whole row so columns can combine fields. */
    format?: (row: T) => unknown;
}

interface ExportButtonProps<T extends object> {
    /** Rows to export — pass the filtered set so the file matches what's on screen. */
    rows: T[];
    /** Base filename; the current date and .csv extension are appended automatically. */
    filename: string;
    /** Columns (order + headers) for the file. Omit to export every property of the rows. */
    columns?: ExportColumn<T>[];
    label?: string;
    className?: string;
}

/**
 * Standard table-export action: downloads the given rows as a CSV named
 * `<filename>-<YYYY-MM-DD>.csv`. One component so every module's tables
 * share the same button, behaviour and disabled state.
 */
export function ExportButton<T extends object>({
    rows,
    filename,
    columns,
    label = 'Export CSV',
    className,
}: ExportButtonProps<T>) {
    const handleExport = () => {
        const cols: ExportColumn<T>[] = columns
            ?? Object.keys(rows[0] ?? {}).map(key => ({ key: key as keyof T & string, header: key }));
        const data = rows.map(row => {
            const out: Record<string, unknown> = {};
            for (const col of cols) {
                out[col.header] = col.format ? col.format(row) : (row as Record<string, unknown>)[col.key];
            }
            return out;
        });
        exportToCSV(data, `${filename}-${getDateForFilename()}`);
    };

    const empty = rows.length === 0;
    return (
        <button
            type="button"
            onClick={handleExport}
            disabled={empty}
            aria-label={label}
            title={empty ? 'No rows to export' : `Download ${rows.length.toLocaleString()} row${rows.length === 1 ? '' : 's'} as CSV`}
            /* Below `sm` the label is hidden and only the icon shows, so the
               touch floor has to cover WIDTH as well as height — same
               `pointer-coarse:min-h-11 pointer-coarse:min-w-11` contract as
               `components/ui/button.tsx`. Mouse sizing is unchanged. */
            className={cn(
                "flex items-center justify-center gap-2 px-3 py-1.5 min-h-[36px] pointer-coarse:min-h-11 pointer-coarse:min-w-11 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                className
            )}
        >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">{label}</span>
        </button>
    );
}
