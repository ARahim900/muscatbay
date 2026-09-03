import * as React from "react"

import { cn } from "@/lib/utils"

type TableProps = React.ComponentProps<"table"> & {
  /**
   * Props for the scroll container (`.ops-table-shell`, `overflow-x: auto`).
   * A wide table that scrolls sideways is a scrollable region, so give the
   * SHELL the landmark and keyboard focus (`role="region"`, `aria-label`,
   * `tabIndex={0}`) — never the `<table>` itself, where a `role` would replace
   * the native table semantics assistive technology relies on.
   */
  containerProps?: React.ComponentProps<"div">;
};

function Table({ className, containerProps, ...props }: TableProps) {
  return (
    <div
      data-slot="table-container"
      {...containerProps}
      className={cn("ops-table-shell", containerProps?.className)}
    >
      <table
        data-slot="table"
        className={cn("ops-table", className)}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn(className)}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn("bg-muted-bg/50 dark:bg-muted-bg/30 border-t border-border font-medium [&>tr]:last:border-b-0", className)}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "border-b border-border/90 dark:border-border/80 transition-[background-color] duration-150",
        "data-[state=selected]:bg-secondary/8",
        className
      )}
      {...props}
    />
  )
}

function TableHead({ className, scope = "col", ...props }: React.ComponentProps<"th">) {
  return (
    // `scope="col"` by default: every <TableHead> is a column header unless a
    // consumer explicitly passes scope="row"/"rowgroup". Without it screen
    // readers cannot announce which header a cell belongs to (WCAG 1.3.1).
    <th
      data-slot="table-head"
      scope={scope}
      className={cn(
        "text-start align-middle whitespace-nowrap transition-colors",
        "[&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    // Base cell weight (500) comes from `.ops-table tbody td` in globals.css —
    // a font utility here would sit in the Tailwind `utilities` layer and defeat
    // the first-column emphasis rule, which lives in the `components` layer.
    <td
      data-slot="table-cell"
      className={cn(
        "align-middle",
        "[&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("text-muted-foreground mt-4 text-sm", className)}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
}
