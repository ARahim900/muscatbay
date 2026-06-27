"use client";

import type { ReactNode } from "react";

import { TableHead } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { SortIcon } from "./sort-icon";

interface SortableTableHeadProps {
    field: string;
    currentSortField: string | null;
    currentSortDirection: "asc" | "desc";
    onSort: (field: string) => void;
    children: ReactNode;
    className?: string;
    align?: "left" | "center" | "right";
}

export function SortableTableHead({
    field,
    currentSortField,
    currentSortDirection,
    onSort,
    children,
    className,
    align = "left",
}: SortableTableHeadProps) {
    const isActive = currentSortField === field;
    const ariaSort = isActive
        ? currentSortDirection === "asc" ? "ascending" : "descending"
        : "none";

    return (
        <TableHead scope="col" aria-sort={ariaSort} className={className}>
            <button
                type="button"
                onClick={() => onSort(field)}
                className={cn(
                    "inline-flex min-h-11 w-full items-center gap-1.5 rounded-md py-1 text-inherit transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    align === "right" && "justify-end",
                    align === "center" && "justify-center"
                )}
            >
                {children}
                <SortIcon
                    field={field}
                    currentSortField={currentSortField}
                    currentSortDirection={currentSortDirection}
                />
            </button>
        </TableHead>
    );
}
