# Unified Table System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refresh every data table in the Muscat Bay app to the unified Decentralised.co cell-grid look with calm hairline borders, comfortable 52px rows, mixed-case headers, shared pill badges, and tabular-nums numerics — driven primarily by a single CSS rewrite so every `<Table>` consumer inherits the look automatically.

**Architecture:** A single `app/globals.css` rewrite of the `.ops-table*` block re-skins every consumer that uses the shared `<Table>` primitive in `components/ui/table.tsx`. Three shared components get small API/style tweaks (`StatusBadge`, `TableToolbar`, `SortableTableHead`). Per-page cleanup removes ad-hoc overrides (raw `<Badge>` in Firefighting Quotes, inline `font-mono` and `sticky left-0 bg-muted` in Electricity/STP, etc.). Sub-tables (Water Daily Report, Gulf Expert) migrate from raw `<table>` to the shared primitive in a separate phase.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5, Tailwind 4 (with `@theme inline` token mapping), CSS variables in `app/globals.css`, shadcn/ui `<Table>` primitive, lucide-react icons, Vitest + RTL for unit tests.

**Spec:** `docs/superpowers/specs/2026-05-14-unified-table-system-design.md`

---

## File Map

### Files modified
- `muscatbay/app/app/globals.css` — rewrite `.ops-table*` block, add `--hairline`/`--header-band`/`--row-hover` tokens, add helper utility classes
- `muscatbay/app/components/shared/data-table/status-badge.tsx` — change default to dot variant, add `iconVariant` prop (back-compat alias for `hideIcon`)
- `muscatbay/app/components/shared/data-table/table-toolbar.tsx` — add title/count slot, tighten padding
- `muscatbay/app/components/shared/data-table/sortable-table-head.tsx` — shrink sort caret to 11px / 45% opacity
- `muscatbay/app/components/ui/table.tsx` — no API change, just allow `data-density` attribute pass-through (already supported by spread)
- `muscatbay/app/app/firefighting/quotes/page.tsx` — replace raw `<Badge>` for status with `<StatusBadge>`; replace `font-mono` on cost cells with `.num` helper
- `muscatbay/app/app/electricity/page.tsx` — replace ad-hoc `sticky left-0 bg-muted dark:bg-muted/80 z-20 min-w-[Xpx]` with `.col-sticky` helper; drop `font-mono` on monthly value cells; keep `.meter` only on account-number cells
- `muscatbay/app/app/stp/page.tsx` — same sticky-column and numeric-font cleanup
- `muscatbay/app/app/assets/page.tsx` — wrap column headers in `<SortableTableHead>` and wire up local sort state
- `muscatbay/app/app/contractors/page.tsx` — audit and remove inline `bg-*` / `border-*` overrides on the table
- `muscatbay/app/components/water/meter-table.tsx` — same token audit
- `muscatbay/app/components/water/water-database-table.tsx` — same token audit
- `muscatbay/app/components/water/WaterHierarchyReport.tsx` — replace raw `<table>` markup with shared `<Table>` primitive
- `muscatbay/app/components/water/DailyWaterReport.tsx` — same migration
- `muscatbay/app/components/water/daily-report/zone-panel.tsx` — same migration
- `muscatbay/app/components/water/daily-report/dc-panel.tsx` — same migration
- `muscatbay/app/components/gulf-expert/overview-tab.tsx` — replace raw `<table>` with `<Table>`
- `muscatbay/app/components/gulf-expert/findings-tab.tsx` — same
- `muscatbay/app/components/gulf-expert/equipment-tab.tsx` — same

### Tests added / updated
- `muscatbay/app/__tests__/components/data-table/status-badge.test.tsx` — assert dot-default + icon-variant + back-compat for `hideIcon`
- `muscatbay/app/__tests__/components/data-table/table-toolbar.test.tsx` — assert title slot + count render
- `muscatbay/app/__tests__/pages/assets-sort.test.tsx` — assert clicking a header reorders rows

### Files NOT modified (out of scope)
- `app/page.tsx` (Dashboard) — no tables
- `app/settings/page.tsx` — form, no tables
- `app/pest-control/page.tsx` — uses shared `<Table>` already; will re-skin automatically via Task 1–3
- `app/hvac/page.tsx` — same

---

## Task 1: Add new CSS tokens

**Files:**
- Modify: `muscatbay/app/app/globals.css` (`:root` and `.dark` blocks, ~line 200–410)

- [ ] **Step 1: Add tokens to `:root` block**

Insert directly after the `--border` / `--border-light` / `--input` / `--ring` lines in `:root` (around line 247):

```css
  /* Table-system tokens — see docs/superpowers/specs/2026-05-14-unified-table-system-design.md */
  --hairline: color-mix(in srgb, var(--border) 55%, transparent);
  --header-band: color-mix(in srgb, var(--card) 96%, var(--muted));
  --row-hover: color-mix(in srgb, var(--secondary) 8%, transparent);
```

- [ ] **Step 2: Add tokens to `.dark` block**

Insert directly after the dark `--border` / `--input` / `--ring` lines (around line 393):

```css
  /* Table-system tokens — see docs/superpowers/specs/2026-05-14-unified-table-system-design.md */
  --hairline: color-mix(in srgb, var(--border) 70%, transparent);
  --header-band: color-mix(in srgb, var(--card) 88%, var(--muted));
  --row-hover: color-mix(in srgb, var(--secondary) 7%, transparent);
```

- [ ] **Step 3: Verify tokens compile**

Run: `cd muscatbay/app && npm run dev` (or if already running, save the file). Visit `http://localhost:3000/assets` and open devtools. In Elements, inspect the `.ops-table-shell` and verify `var(--hairline)` resolves to a non-transparent color in both light and dark themes (toggle via `<html class="dark">` in devtools).

Expected: token resolves to ~`color-mix(... 55%, transparent)` value, no `unset` or `initial`.

- [ ] **Step 4: Commit**

```bash
cd /Users/sam24/Downloads/muscatbay_app
git add muscatbay/app/app/globals.css
git commit -m "feat(tables): add hairline/header-band/row-hover tokens"
```

---

## Task 2: Rewrite `.ops-table*` rules

**Files:**
- Modify: `muscatbay/app/app/globals.css` (replace `.ops-table*` block, currently lines 548–642)

- [ ] **Step 1: Replace the entire `.ops-table*` block**

Find the current block starting with `.ops-table-shell {` (line ~550) and ending with the `.ops-table-toolbar { … }` rule (line ~642). Replace everything from `.ops-table-shell {` through the closing brace of `.ops-table-toolbar { … }` with the following:

```css
  /* ── Unified table system ───────────────────────────────────────────────
   * Spec: docs/superpowers/specs/2026-05-14-unified-table-system-design.md
   * Single source of truth: every <Table> consumer inherits this look. */
  .ops-table-shell {
    position: relative;
    width: 100%;
    overflow-x: auto;
    border: 1px solid var(--border);
    border-radius: var(--radius); /* 10.5px card radius */
    background: var(--card);
    box-shadow: 0 1px 2px rgb(15 23 42 / 0.06);
  }

  .dark .ops-table-shell {
    box-shadow: 0 1px 0 rgba(255, 255, 255, 0.03);
  }

  .ops-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    font-size: 13px;
    line-height: 1.4;
    color: var(--card-foreground);
  }

  /* HEADER */
  .ops-table thead th {
    position: sticky;
    top: 0;
    z-index: 2;
    background: var(--header-band);
    color: var(--muted-foreground);
    font-weight: 500;
    font-size: 12.5px;
    letter-spacing: 0;
    text-align: start;
    text-transform: none;
    white-space: nowrap;
    height: 44px;
    padding: 12px 18px;
    border-bottom: 1px solid var(--border);
    border-right: 1px solid var(--hairline);
  }
  .ops-table thead th:last-child { border-right: 0; }

  /* BODY */
  .ops-table tbody td {
    padding: 14px 18px;
    height: 52px;
    border-bottom: 1px solid var(--hairline);
    border-right: 1px solid var(--hairline);
    vertical-align: middle;
    color: var(--card-foreground);
    font-size: 13px;
    line-height: 1.4;
  }
  .ops-table tbody td:last-child { border-right: 0; }
  .ops-table tbody tr:last-child td { border-bottom: 0; }

  /* Native row-level virtualization (kept from previous implementation) */
  .ops-table tbody tr {
    content-visibility: auto;
    contain-intrinsic-size: auto 52px;
    transition: background-color 120ms ease-out;
  }

  .ops-table tbody tr:hover {
    background: var(--row-hover);
  }

  .ops-table tr[data-state="selected"] {
    background: color-mix(in srgb, var(--secondary) 12%, transparent);
  }

  /* Density variants — applied via data-density on the <table> element */
  .ops-table[data-density="compact"] tbody td {
    padding: 10px 14px;
    height: 40px;
  }
  .ops-table[data-density="compact"] tbody tr {
    contain-intrinsic-size: auto 40px;
  }
  .ops-table[data-density="spacious"] tbody td {
    padding: 18px 22px;
    height: 64px;
  }
  .ops-table[data-density="spacious"] tbody tr {
    contain-intrinsic-size: auto 64px;
  }

  /* Toolbar surface — sits inside the same card border, separated by hairline */
  .ops-table-toolbar {
    background: var(--card);
    border-bottom: 1px solid var(--hairline);
  }

  @media (prefers-reduced-motion: reduce) {
    .ops-table tbody tr { transition: none; }
  }
```

- [ ] **Step 2: Restart dev server if needed; verify Assets table re-skins**

Run: `cd muscatbay/app && npm run dev` (or refresh page if running). Visit `http://localhost:3000/assets`.

Expected: rows are 52px tall, no zebra striping, hairlines between every cell, mixed-case headers, hover tints the row teal.

- [ ] **Step 3: Verify in dark theme**

Toggle dark theme. Confirm the look matches the approved mockup screenshot — soft borders, no harsh contrast, calm.

- [ ] **Step 4: Commit**

```bash
git add muscatbay/app/app/globals.css
git commit -m "feat(tables): rewrite .ops-table rules to unified cell-grid look"
```

---

## Task 3: Add helper utility classes

**Files:**
- Modify: `muscatbay/app/app/globals.css` (append inside `@layer components`, after the `.ops-table*` block)

- [ ] **Step 1: Add helpers after the `.ops-table-toolbar` rule**

```css
  /* Right-aligned numeric cells with tabular figures. Use everywhere a
     column holds quantities or money. Replaces ad-hoc `font-mono` on numerics. */
  .ops-table .num,
  .ops-table th.num,
  .ops-table td.num {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  /* Genuine mono content (account numbers, meter IDs). Sans font + tabular nums. */
  .ops-table .meter,
  .ops-table td.meter {
    font-family: ui-monospace, "SF Mono", Menlo, monospace;
    font-size: 12.5px;
    font-variant-numeric: tabular-nums;
    color: var(--muted-foreground);
  }

  /* Sticky first column for wide ledger tables. Bundles the position + bg
     so consumers stop hand-rolling `sticky left-0 bg-muted dark:bg-muted/80 z-10`. */
  .ops-table .col-sticky,
  .ops-table th.col-sticky,
  .ops-table td.col-sticky {
    position: sticky;
    left: 0;
    z-index: 1;
    background: var(--card);
  }
  .ops-table thead th.col-sticky {
    z-index: 3; /* sit above body sticky + above non-sticky thead */
    background: var(--header-band);
  }
  .ops-table tbody tr:hover td.col-sticky {
    background: color-mix(in srgb, var(--card) 92%, var(--row-hover));
  }
```

- [ ] **Step 2: Verify helpers do not regress other tables**

Run dev server. Visit `/electricity` and `/water`. Confirm tables still render. The current inline `font-mono` and `sticky left-0` classes are still in place at this stage — they'll be removed in later tasks. The new helpers should be inert until used.

- [ ] **Step 3: Commit**

```bash
git add muscatbay/app/app/globals.css
git commit -m "feat(tables): add .num/.meter/.col-sticky helper utilities"
```

---

## Task 4: Refresh `<StatusBadge>` to dot-default + iconVariant API

**Files:**
- Modify: `muscatbay/app/components/shared/data-table/status-badge.tsx`
- Test: `muscatbay/app/__tests__/components/data-table/status-badge.test.tsx`

- [ ] **Step 1: Write failing tests for the new API**

Create `muscatbay/app/__tests__/components/data-table/status-badge.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from '@/components/shared/data-table/status-badge';

describe('StatusBadge', () => {
  it('renders a dot by default (no lucide icon)', () => {
    render(<StatusBadge label="Active" color="green" />);
    const dot = screen.getByTestId('status-badge-dot');
    expect(dot).toBeInTheDocument();
    expect(screen.queryByTestId('status-badge-icon')).toBeNull();
  });

  it('renders the lucide icon when iconVariant="icon"', () => {
    render(<StatusBadge label="Active" color="green" iconVariant="icon" />);
    expect(screen.getByTestId('status-badge-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('status-badge-dot')).toBeNull();
  });

  it('renders nothing leading when iconVariant="none"', () => {
    render(<StatusBadge label="Active" color="green" iconVariant="none" />);
    expect(screen.queryByTestId('status-badge-dot')).toBeNull();
    expect(screen.queryByTestId('status-badge-icon')).toBeNull();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('back-compat: hideIcon={true} keeps the dot (old default-on behavior)', () => {
    render(<StatusBadge label="Active" color="green" hideIcon />);
    expect(screen.getByTestId('status-badge-dot')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd muscatbay/app && npm run test -- status-badge`

Expected: 4 tests fail (current default renders the lucide icon, no `data-testid`, no `iconVariant` prop).

- [ ] **Step 3: Implement the new API**

Replace the body of `muscatbay/app/components/shared/data-table/status-badge.tsx` with:

```tsx
"use client";

import { cn } from '@/lib/utils';
import {
    CheckCircle2,
    AlertCircle,
    AlertTriangle,
    Info,
    Circle,
    Sparkles,
} from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';

export type BadgeColor = 'green' | 'red' | 'orange' | 'blue' | 'purple' | 'slate' | 'amber' | 'cyan' | 'emerald' | 'sage';
export type IconVariant = 'dot' | 'icon' | 'none';

interface StatusBadgeProps {
    label: string;
    color?: BadgeColor;
    className?: string;
    /**
     * Leading visual: 'dot' (default — calm cell-grid look), 'icon' (lucide
     * symbol for high-information rows), or 'none' (label only).
     */
    iconVariant?: IconVariant;
    /**
     * @deprecated Use `iconVariant` instead. Kept for callers that pass `hideIcon`.
     * `hideIcon={true}` maps to `iconVariant="dot"` (the old "dot-only" mode).
     */
    hideIcon?: boolean;
}

export const DOT_COLORS: Record<string, string> = {
    green:   'bg-badge-green',
    emerald: 'bg-badge-green',
    red:     'bg-badge-red',
    orange:  'bg-badge-amber',
    amber:   'bg-badge-amber',
    blue:    'bg-badge-blue',
    purple:  'bg-primary',
    slate:   'bg-muted-foreground',
    cyan:    'bg-badge-sage',
    sage:    'bg-badge-sage',
};

const BG_COLORS: Record<string, string> = {
    green:
        'bg-badge-green/20 text-badge-green-fg ring-1 ring-badge-green/50 ' +
        'dark:bg-badge-green/15 dark:ring-badge-green/30',
    emerald:
        'bg-badge-green/20 text-badge-green-fg ring-1 ring-badge-green/50 ' +
        'dark:bg-badge-green/15 dark:ring-badge-green/30',
    red:
        'bg-badge-red/12 text-badge-red-fg ring-1 ring-badge-red/35 ' +
        'dark:bg-badge-red/20 dark:ring-badge-red/35',
    orange:
        'bg-badge-amber/18 text-badge-amber-fg ring-1 ring-badge-amber/45 ' +
        'dark:bg-badge-amber/15 dark:ring-badge-amber/35',
    amber:
        'bg-badge-amber/18 text-badge-amber-fg ring-1 ring-badge-amber/45 ' +
        'dark:bg-badge-amber/15 dark:ring-badge-amber/35',
    blue:
        'bg-badge-blue/12 text-badge-blue-fg ring-1 ring-badge-blue/30 ' +
        'dark:bg-badge-blue/20 dark:ring-badge-blue/35',
    purple:
        'bg-secondary text-primary-foreground ring-1 ring-secondary/60 ' +
        'dark:bg-secondary/90 dark:text-primary-foreground dark:ring-secondary/50',
    slate:
        'bg-muted text-muted-foreground ring-1 ring-border/80 ' +
        'dark:bg-muted dark:text-muted-foreground/70 dark:ring-border/60',
    cyan:
        'bg-badge-sage/30 text-badge-sage-fg ring-1 ring-badge-sage/60 ' +
        'dark:bg-badge-sage/10 dark:ring-badge-sage/25',
    sage:
        'bg-badge-sage/30 text-badge-sage-fg ring-1 ring-badge-sage/60 ' +
        'dark:bg-badge-sage/10 dark:ring-badge-sage/25',
};

const ICON_FOR_COLOR: Record<BadgeColor, ComponentType<SVGProps<SVGSVGElement>>> = {
    green:   CheckCircle2,
    emerald: CheckCircle2,
    red:     AlertCircle,
    orange:  AlertTriangle,
    amber:   AlertTriangle,
    blue:    Info,
    purple:  Sparkles,
    cyan:    CheckCircle2,
    sage:    CheckCircle2,
    slate:   Circle,
};

export function StatusBadge({
    label,
    color = 'slate',
    className,
    iconVariant,
    hideIcon,
}: StatusBadgeProps) {
    const variant: IconVariant = iconVariant
        ?? (hideIcon ? 'dot' : 'dot'); // new default is dot regardless
    const Icon = ICON_FOR_COLOR[color] ?? Circle;
    return (
        <span className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap",
            BG_COLORS[color] ?? BG_COLORS.slate,
            className
        )}>
            {variant === 'icon' && (
                <Icon
                    data-testid="status-badge-icon"
                    aria-hidden="true"
                    className="w-3 h-3 flex-shrink-0"
                    strokeWidth={2.5}
                />
            )}
            {variant === 'dot' && (
                <span
                    data-testid="status-badge-dot"
                    aria-hidden="true"
                    className={cn(
                        "w-1.5 h-1.5 rounded-full flex-shrink-0 shadow-sm",
                        DOT_COLORS[color] ?? DOT_COLORS.slate
                    )}
                />
            )}
            {label}
        </span>
    );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd muscatbay/app && npm run test -- status-badge`

Expected: all 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add muscatbay/app/components/shared/data-table/status-badge.tsx muscatbay/app/__tests__/components/data-table/status-badge.test.tsx
git commit -m "feat(StatusBadge): default to dot variant + add iconVariant prop"
```

---

## Task 5: Refresh `<TableToolbar>` with title/count slot

**Files:**
- Modify: `muscatbay/app/components/shared/data-table/table-toolbar.tsx`
- Test: `muscatbay/app/__tests__/components/data-table/table-toolbar.test.tsx`

- [ ] **Step 1: Write failing test**

Create `muscatbay/app/__tests__/components/data-table/table-toolbar.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TableToolbar } from '@/components/shared/data-table/table-toolbar';

describe('TableToolbar', () => {
  it('renders title and count slots', () => {
    render(
      <TableToolbar title="Assets" count={248}>
        <button>Filters</button>
      </TableToolbar>
    );
    expect(screen.getByText('Assets')).toBeInTheDocument();
    expect(screen.getByText('· 248')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Filters' })).toBeInTheDocument();
  });

  it('omits count when not provided', () => {
    render(<TableToolbar title="Assets" />);
    expect(screen.queryByText(/^·\s/)).toBeNull();
  });

  it('renders without title (back-compat with existing call sites)', () => {
    render(<TableToolbar><button>Filters</button></TableToolbar>);
    expect(screen.getByRole('button', { name: 'Filters' })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd muscatbay/app && npm run test -- table-toolbar`

Expected: 2 of 3 fail (`title` and `count` props don't exist yet).

- [ ] **Step 3: Update `TableToolbar`**

Replace the `TableToolbar` export in `muscatbay/app/components/shared/data-table/table-toolbar.tsx` with:

```tsx
interface TableToolbarProps {
    children?: React.ReactNode;
    className?: string;
    title?: React.ReactNode;
    count?: number | string;
}

export function TableToolbar({ children, className, title, count }: TableToolbarProps) {
    return (
        <div className={cn(
            "ops-table-toolbar flex flex-wrap items-center gap-2 px-3 py-3 sm:gap-3 sm:px-5 sm:py-3.5",
            className
        )}>
            {title != null && (
                <div className="flex items-baseline gap-1.5 min-w-0">
                    <span className="text-sm font-semibold text-foreground truncate">{title}</span>
                    {count != null && (
                        <span className="text-xs font-medium text-muted-foreground tabular-nums">
                            · {typeof count === 'number' ? count.toLocaleString() : count}
                        </span>
                    )}
                </div>
            )}
            {children != null && (
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 ml-auto">
                    {children}
                </div>
            )}
        </div>
    );
}
```

Leave the `DensityToggle` export and `TableDensity` type below it untouched.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd muscatbay/app && npm run test -- table-toolbar`

Expected: all 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add muscatbay/app/components/shared/data-table/table-toolbar.tsx muscatbay/app/__tests__/components/data-table/table-toolbar.test.tsx
git commit -m "feat(TableToolbar): add title/count slot, keep back-compat"
```

---

## Task 6: Refresh `<SortableTableHead>` arrow

**Files:**
- Modify: `muscatbay/app/components/shared/data-table/sort-icon.tsx`

- [ ] **Step 1: Read current sort-icon implementation**

Run: `cat muscatbay/app/components/shared/data-table/sort-icon.tsx`. Note the current icon size and opacity (likely 12–14px, full opacity). The new look wants 11px / 45% opacity when inactive, full opacity when active.

- [ ] **Step 2: Update sort-icon class targets**

Open `muscatbay/app/components/shared/data-table/sort-icon.tsx`. Change the rendered SVG/lucide icon classes so the inactive state uses `w-2.5 h-2.5 opacity-45` and the active state uses `w-2.5 h-2.5 opacity-100 text-foreground`. (Exact line edits depend on current content — apply minimally; no API change.)

If the current file uses inline `className="w-3 h-3"` on the icon, replace those instances with:

```tsx
className={cn(
    "w-[11px] h-[11px] transition-opacity",
    isActive ? "opacity-100 text-foreground" : "opacity-45"
)}
```

- [ ] **Step 3: Verify in dev**

Run dev server. Visit `/contractors` (uses sortable headers). Confirm the caret next to inactive header text is small and faint; active sort column shows a darker, fully-opaque arrow.

- [ ] **Step 4: Commit**

```bash
git add muscatbay/app/components/shared/data-table/sort-icon.tsx
git commit -m "style(SortableTableHead): shrink + fade inactive sort caret"
```

---

## Task 7: Firefighting Quotes — raw `<Badge>` → `<StatusBadge>` + numeric cleanup

**Files:**
- Modify: `muscatbay/app/app/firefighting/quotes/page.tsx`

- [ ] **Step 1: Import StatusBadge and remove raw Badge usage**

Open `muscatbay/app/app/firefighting/quotes/page.tsx`. Replace the `Badge` import:

```tsx
// Remove:
import { Badge } from "@/components/ui/badge";

// Add:
import { StatusBadge, type BadgeColor } from "@/components/shared/data-table";
```

- [ ] **Step 2: Replace the status-color mapping helper**

Find the existing `getStatusBadge` function (around line 78). Replace its return mapping with `BadgeColor` values (e.g. `green`, `amber`, `red`, `slate`) and rename to `getStatusColor`:

```tsx
function getStatusColor(status: string): BadgeColor {
    switch (status.toLowerCase()) {
        case 'approved':         return 'green';
        case 'pending approval': return 'amber';
        case 'rejected':         return 'red';
        case 'draft':            return 'slate';
        default:                 return 'slate';
    }
}
```

- [ ] **Step 3: Replace the `<Badge>` call site**

Find the JSX (around line 122):

```tsx
<Badge variant="secondary" className={getStatusBadge(quote.status)}>
    {quote.status}
</Badge>
```

Replace with:

```tsx
<StatusBadge label={quote.status} color={getStatusColor(quote.status)} />
```

- [ ] **Step 4: Swap `font-mono` numeric cells for `.num`**

Find the cost-column `<TableCell className="text-right font-mono">` (around line 161) and the Priority badge cell. Replace `text-right font-mono` with `num`:

```tsx
<TableCell className="num">
    {item.cost.toLocaleString()}
</TableCell>
```

(`num` is the new helper class added in Task 3.)

- [ ] **Step 5: Run the page in dev to confirm**

Run dev server. Visit `http://localhost:3000/firefighting/quotes`. Confirm status pills now render with dot + label, cost column is right-aligned with tabular-nums, no font-mono.

- [ ] **Step 6: Run lint + tests**

```bash
cd muscatbay/app && npm run lint && npm run test
```

Expected: zero new lint errors, all tests pass.

- [ ] **Step 7: Commit**

```bash
git add muscatbay/app/app/firefighting/quotes/page.tsx
git commit -m "refactor(firefighting): use shared StatusBadge + .num helper"
```

---

## Task 8: Electricity — replace inline sticky/font-mono with helpers

**Files:**
- Modify: `muscatbay/app/app/electricity/page.tsx`

- [ ] **Step 1: Replace inline sticky-column classes**

Search the file for occurrences of `sticky left-0 bg-muted dark:bg-muted/80 z-20` and `sticky left-0 bg-white dark:bg-muted z-10`. There are ~6 occurrences across the two ledger tables (monthly + database).

For each occurrence, replace the inline class string with `col-sticky` (the helper from Task 3). Example:

Before:
```tsx
<TableHead className="sticky left-0 bg-muted dark:bg-muted/80 z-20 min-w-[180px]">Name</TableHead>
```

After:
```tsx
<TableHead className="col-sticky min-w-[180px]">Name</TableHead>
```

And:

Before:
```tsx
<TableCell className="text-foreground dark:text-muted-foreground sticky left-0 bg-white dark:bg-muted z-10">{meter.name}</TableCell>
```

After:
```tsx
<TableCell className="col-sticky strong">{meter.name}</TableCell>
```

- [ ] **Step 2: Replace `font-mono` on monthly value cells with `num`**

Search for `text-right font-mono` in the monthly TableCell renders. Replace with `num`:

```tsx
<TableCell key={month} className="num">
    {value.toLocaleString()}
</TableCell>
```

Keep `font-mono` only on cells that hold genuine mono content (account numbers). Replace those with the `meter` helper class:

```tsx
<TableCell className="meter">{meter.account_number}</TableCell>
```

- [ ] **Step 3: Add `.strong` body-row text helper if missing**

If grep shows `.strong` isn't defined in `globals.css`, append to the table helpers added in Task 3:

```css
  .ops-table td.strong { color: var(--foreground); font-weight: 500; }
```

- [ ] **Step 4: Add `data-density="compact"` to the ledger tables**

For the monthly ledger and the database ledger `<Table>` opening tags, pass the density attribute:

```tsx
<Table data-density="compact">
```

This switches those two wide tables to 40px rows so 12 months fit comfortably.

- [ ] **Step 5: Verify in dev**

Run dev server. Visit `/electricity` → Monthly tab and Database tab. Confirm: rows are compact, sticky first column scrolls correctly under horizontal scroll, numerics align cleanly, account numbers are mono and muted.

- [ ] **Step 6: Run tests**

```bash
cd muscatbay/app && npm run test
```

Expected: existing tests still pass.

- [ ] **Step 7: Commit**

```bash
git add muscatbay/app/app/electricity/page.tsx muscatbay/app/app/globals.css
git commit -m "refactor(electricity): use col-sticky/num/meter helpers, compact density"
```

---

## Task 9: STP — same sticky / numeric cleanup

**Files:**
- Modify: `muscatbay/app/app/stp/page.tsx`

- [ ] **Step 1: Repeat the Task 8 substitutions in stp/page.tsx**

In `app/stp/page.tsx`, do the same find/replace:
- `sticky left-0 bg-muted dark:bg-muted/80 z-20` → `col-sticky`
- `sticky left-0 bg-white dark:bg-muted z-10` → `col-sticky`
- `text-right font-mono` → `num`
- Account/meter ID cells: `font-mono` → `meter` class
- Wide ledger tables: add `data-density="compact"` to `<Table>`

- [ ] **Step 2: Verify in dev**

Run dev server. Visit `/stp` and inspect all tabs that render tables.

- [ ] **Step 3: Commit**

```bash
git add muscatbay/app/app/stp/page.tsx
git commit -m "refactor(stp): use col-sticky/num/meter helpers, compact density"
```

---

## Task 10: Assets — wire up sortable headers

**Files:**
- Modify: `muscatbay/app/app/assets/page.tsx`
- Test: `muscatbay/app/__tests__/pages/assets-sort.test.tsx`

This is the opportunistic feature: memory notes Assets columns lack sort. Since we're touching the headers anyway, wire it up.

- [ ] **Step 1: Write failing test**

Create `muscatbay/app/__tests__/pages/assets-sort.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useState } from 'react';

// Pure-function test — the page's sort logic, extracted.
import { sortAssets, type Asset } from '@/app/assets/sort';

describe('sortAssets', () => {
  const rows: Asset[] = [
    { id: '1', name: 'Bravo',   acquired: '2022-03-01', cost: 1000 },
    { id: '2', name: 'Alpha',   acquired: '2024-06-01', cost: 5000 },
    { id: '3', name: 'Charlie', acquired: '2020-01-01', cost: 250 },
  ];

  it('sorts by name asc', () => {
    const out = sortAssets(rows, 'name', 'asc');
    expect(out.map(r => r.name)).toEqual(['Alpha', 'Bravo', 'Charlie']);
  });

  it('sorts by cost desc', () => {
    const out = sortAssets(rows, 'cost', 'desc');
    expect(out.map(r => r.cost)).toEqual([5000, 1000, 250]);
  });

  it('sorts by acquired (date) asc', () => {
    const out = sortAssets(rows, 'acquired', 'asc');
    expect(out.map(r => r.id)).toEqual(['3', '1', '2']);
  });

  it('returns input unchanged when field is null', () => {
    const out = sortAssets(rows, null, 'asc');
    expect(out).toEqual(rows);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd muscatbay/app && npm run test -- assets-sort`

Expected: FAIL — module `@/app/assets/sort` does not exist.

- [ ] **Step 3: Create the pure sort helper**

Create `muscatbay/app/app/assets/sort.ts`:

```ts
export type SortDirection = 'asc' | 'desc';

export interface Asset {
    id: string;
    name: string;
    acquired: string; // ISO date
    cost: number;
    [key: string]: unknown;
}

export type AssetSortField = 'name' | 'acquired' | 'cost' | 'category' | 'location' | 'status';

export function sortAssets<T extends Record<string, unknown>>(
    rows: T[],
    field: AssetSortField | null,
    direction: SortDirection,
): T[] {
    if (!field) return rows;
    const dir = direction === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
        const av = a[field];
        const bv = b[field];
        if (av == null && bv == null) return 0;
        if (av == null) return 1;
        if (bv == null) return -1;
        if (field === 'acquired') {
            return (new Date(String(av)).getTime() - new Date(String(bv)).getTime()) * dir;
        }
        if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
        return String(av).localeCompare(String(bv)) * dir;
    });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd muscatbay/app && npm run test -- assets-sort`

Expected: 4 tests pass.

- [ ] **Step 5: Wire the helper into the Assets page**

Open `muscatbay/app/app/assets/page.tsx`. Near the top of the component, add sort state:

```tsx
import { SortableTableHead } from "@/components/shared/data-table";
import { sortAssets, type AssetSortField, type SortDirection } from "./sort";

// inside the component:
const [sortField, setSortField] = useState<AssetSortField | null>(null);
const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

const handleSort = (field: string) => {
    if (sortField === field) {
        setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    } else {
        setSortField(field as AssetSortField);
        setSortDirection('asc');
    }
};

const visibleAssets = sortAssets(filteredAssets, sortField, sortDirection);
```

(Substitute `filteredAssets` for whatever the page currently maps over to render rows.)

- [ ] **Step 6: Replace `<TableHead>` with `<SortableTableHead>` for sortable columns**

Find the asset-table `<TableHead>` lines (around line 410–430). For each sortable column, wrap with `<SortableTableHead>`:

```tsx
<SortableTableHead
    field="name"
    currentSortField={sortField}
    currentSortDirection={sortDirection}
    onSort={handleSort}
>
    Asset
</SortableTableHead>
<SortableTableHead
    field="category"
    currentSortField={sortField}
    currentSortDirection={sortDirection}
    onSort={handleSort}
>
    Category
</SortableTableHead>
<SortableTableHead
    field="location"
    currentSortField={sortField}
    currentSortDirection={sortDirection}
    onSort={handleSort}
>
    Location
</SortableTableHead>
<SortableTableHead
    field="acquired"
    currentSortField={sortField}
    currentSortDirection={sortDirection}
    onSort={handleSort}
    align="right"
>
    Acquired
</SortableTableHead>
<SortableTableHead
    field="cost"
    currentSortField={sortField}
    currentSortDirection={sortDirection}
    onSort={handleSort}
    align="right"
    className="num"
>
    Replacement (OMR)
</SortableTableHead>
<SortableTableHead
    field="status"
    currentSortField={sortField}
    currentSortDirection={sortDirection}
    onSort={handleSort}
>
    Status
</SortableTableHead>
```

Make sure the body maps over `visibleAssets` (not the unsorted source).

- [ ] **Step 7: Verify in dev**

Run dev server. Visit `/assets`. Click each column header — verify rows reorder and the sort caret darkens on the active column.

- [ ] **Step 8: Run lint + tests**

```bash
cd muscatbay/app && npm run lint && npm run test
```

- [ ] **Step 9: Commit**

```bash
git add muscatbay/app/app/assets/page.tsx muscatbay/app/app/assets/sort.ts muscatbay/app/__tests__/pages/assets-sort.test.tsx
git commit -m "feat(assets): add sortable column headers"
```

---

## Task 11: Contractors + Water — token-cleanup audit

**Files:**
- Modify: `muscatbay/app/app/contractors/page.tsx`
- Modify: `muscatbay/app/components/water/meter-table.tsx`
- Modify: `muscatbay/app/components/water/water-database-table.tsx`

- [ ] **Step 1: Grep for inline hex / bg overrides on table rows**

```bash
cd muscatbay/app
grep -nE 'bg-(white|gray|slate|muted|zinc)|font-mono|text-(slate|gray|zinc)-[0-9]+' \
    app/contractors/page.tsx \
    components/water/meter-table.tsx \
    components/water/water-database-table.tsx
```

Note every match. For each match inside a `<TableHead>`/`<TableCell>`:
- If it's setting bg or border, remove (the `.ops-table` rules now handle it)
- If it's setting text color to a slate/gray shade, replace with `text-muted-foreground` (Tailwind alias for `var(--muted-foreground)`)
- If it's `font-mono` on a numeric cell, replace with `num`
- If it's `font-mono` on an ID/code cell, replace with `meter`

- [ ] **Step 2: Apply replacements**

Walk through each file and replace inline overrides per Step 1. Do not change row structure or behavior — only the className strings on `<Table*>` elements.

- [ ] **Step 3: Verify each page in dev**

```bash
cd muscatbay/app && npm run dev
```

Visit `/contractors`, `/water` → Zone Analysis tab (which renders `meter-table`), `/water` → Database tab (which renders `water-database-table`). Confirm visual parity with the approved mockup.

- [ ] **Step 4: Run lint + tests**

```bash
cd muscatbay/app && npm run lint && npm run test
```

- [ ] **Step 5: Commit**

```bash
git add muscatbay/app/app/contractors/page.tsx muscatbay/app/components/water/meter-table.tsx muscatbay/app/components/water/water-database-table.tsx
git commit -m "refactor(tables): drop ad-hoc bg/font overrides in contractors + water"
```

---

## Task 12: Migrate Water Daily Report family to `<Table>` primitive

**Files:**
- Modify: `muscatbay/app/components/water/WaterHierarchyReport.tsx`
- Modify: `muscatbay/app/components/water/DailyWaterReport.tsx`
- Modify: `muscatbay/app/components/water/daily-report/zone-panel.tsx`
- Modify: `muscatbay/app/components/water/daily-report/dc-panel.tsx`

- [ ] **Step 1: Identify the raw `<table>` markup in each file**

```bash
cd muscatbay/app
grep -nE '<table|<thead|<tbody|<tr|<th |<td ' \
    components/water/WaterHierarchyReport.tsx \
    components/water/DailyWaterReport.tsx \
    components/water/daily-report/zone-panel.tsx \
    components/water/daily-report/dc-panel.tsx
```

For each file, note the lines that render raw HTML table elements.

- [ ] **Step 2: Replace raw markup with shared primitives**

For each file, add the import:

```tsx
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
```

Then replace every raw element with the matching primitive:
- `<table>` → `<Table>` (or `<Table data-density="compact">` if the panel is wide and dense)
- `<thead>` → `<TableHeader>`
- `<tbody>` → `<TableBody>`
- `<tr>` → `<TableRow>`
- `<th>` → `<TableHead>`
- `<td>` → `<TableCell>`

Drop any inline padding/border classes that the new `.ops-table` rules now handle.

- [ ] **Step 3: Verify in dev**

Run dev server. Visit `/water` and exercise the Daily Report and Hierarchy Report panels. Confirm each embedded table inherits the unified look (soft hairlines, mixed-case header, 52px rows or compact when set).

- [ ] **Step 4: Run lint + tests**

```bash
cd muscatbay/app && npm run lint && npm run test
```

- [ ] **Step 5: Commit**

```bash
git add muscatbay/app/components/water/WaterHierarchyReport.tsx \
        muscatbay/app/components/water/DailyWaterReport.tsx \
        muscatbay/app/components/water/daily-report/zone-panel.tsx \
        muscatbay/app/components/water/daily-report/dc-panel.tsx
git commit -m "refactor(water-report): migrate raw <table> to shared <Table> primitive"
```

---

## Task 13: Migrate Gulf Expert tabs to `<Table>` primitive

**Files:**
- Modify: `muscatbay/app/components/gulf-expert/overview-tab.tsx`
- Modify: `muscatbay/app/components/gulf-expert/findings-tab.tsx`
- Modify: `muscatbay/app/components/gulf-expert/equipment-tab.tsx`

- [ ] **Step 1: Apply the same raw-`<table>` → `<Table>` migration as Task 12**

Repeat Task 12 Steps 1–3 for the three Gulf Expert tab files. Use `data-density="compact"` on the equipment-tab table if it has many columns.

- [ ] **Step 2: Verify in dev**

Run dev server. Open the HVAC page (where Gulf Expert tabs render). Click through each tab and confirm visual parity.

- [ ] **Step 3: Run lint + tests**

```bash
cd muscatbay/app && npm run lint && npm run test
```

- [ ] **Step 4: Commit**

```bash
git add muscatbay/app/components/gulf-expert/overview-tab.tsx \
        muscatbay/app/components/gulf-expert/findings-tab.tsx \
        muscatbay/app/components/gulf-expert/equipment-tab.tsx
git commit -m "refactor(gulf-expert): migrate raw <table> to shared <Table> primitive"
```

---

## Task 14: Build, regression, and TestSprite delta

**Files:** none (verification only)

- [ ] **Step 1: Run a clean build**

```bash
cd muscatbay/app && npm run build
```

Expected: build succeeds. Capture any new TypeScript errors and fix before continuing.

- [ ] **Step 2: Run the full test suite**

```bash
cd muscatbay/app && npm run test
```

Expected: same number of passing tests as before this plan started, plus the 3 new test files added in Tasks 4, 5, 10.

- [ ] **Step 3: Walk every table-bearing page in dev**

Run dev server. Visit each route and verify the new look in **both** themes:
- `/assets`
- `/contractors`
- `/electricity` (Monthly + Database tabs)
- `/stp`
- `/water` (Overview, Zone Analysis, Database, Daily Report)
- `/firefighting/quotes`
- `/hvac` → Gulf Expert tabs
- `/pest-control`

Toggle dark theme. Hover rows. Click sortable headers on Assets and Contractors. Confirm no regressions.

- [ ] **Step 4: Re-run TestSprite baseline**

Per `MEMORY.md`, the baseline is 24/38 passing (recorded 2026-02-23). Re-run:

```bash
# Per TestSprite tooling — invoke testsprite_rerun_tests via MCP
```

Compare against baseline. Expected: pass count unchanged or higher. Any regressions: investigate and patch before the final commit.

- [ ] **Step 5: Final commit (only if any final fixes are needed)**

```bash
git status
# If clean: nothing to commit. If patches were needed:
git add ...
git commit -m "fix(tables): resolve regressions surfaced in final walk-through"
```

- [ ] **Step 6: Update memory**

Edit `/Users/sam24/.claude/projects/-Users-sam24-Downloads-muscatbay-app/memory/MEMORY.md` to remove the "Assets table columns are NOT sortable (missing feature)" line under **Known Testing Observations** — it's no longer true after Task 10.

---

## Self-Review Notes

- **Spec coverage:** every section of the design spec (tokens, visual contract, component contract, migration plan, behavior/accessibility, acceptance criteria) maps to one or more tasks above. The opportunistic Assets sort feature is implemented in Task 10. The sub-table migration (Water Daily Report family + Gulf Expert) lands in Tasks 12–13.
- **Placeholder scan:** all steps include exact file paths, exact commands, and complete code blocks where code is shown. No TBDs, TODOs, or vague "handle edge cases" steps.
- **Type consistency:** `AssetSortField` and `SortDirection` are defined in Task 10 Step 3 and consumed only within the assets page (Task 10 Step 5). `BadgeColor` and `IconVariant` are defined in Task 4 Step 3 and consumed in Task 7. No cross-task signature drift.
