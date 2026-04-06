"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div data-slot="table-container" className="relative w-full overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_-4px_rgba(0,0,0,0.1)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2),0_4px_16px_-4px_rgba(0,0,0,0.3)]">
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm border-collapse", className)}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("bg-slate-50 dark:bg-slate-800/80 sticky top-0 z-10", className)}
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
      className={cn("bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-200 dark:border-slate-700 font-medium [&>tr]:last:border-b-0", className)}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "border-b border-slate-100/90 dark:border-slate-800/80 transition-[background-color] duration-150",
        "even:bg-slate-50/60 dark:even:bg-slate-800/20",
        "hover:bg-[#00d2b3]/5 dark:hover:bg-slate-700/40",
        "data-[state=selected]:bg-[#00d2b3]/8",
        className
      )}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "h-11 sm:h-12 px-4 sm:px-6 py-3 text-start align-middle font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider whitespace-nowrap",
        "border-b-2 border-slate-200 dark:border-slate-700",
        "hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors",
        "[&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "px-4 sm:px-6 py-4 align-middle text-slate-700 dark:text-slate-300 text-sm font-semibold",
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
