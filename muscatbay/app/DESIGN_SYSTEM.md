# Muscat Bay Design System

> Developer-facing reference for the visual system. The authoritative *brand* spec lives in [`/BRAND_DESIGN.md`](../../BRAND_DESIGN.md). The AI agent design context lives in [`/.impeccable.md`](../../.impeccable.md). When values conflict across docs, `BRAND_DESIGN.md` wins.

This document describes what *actually* ships in this app — what to import, which tokens to use, and which patterns to follow when adding new UI.

---

## 1. The Six Principles

Every UI decision in this app follows these. They are repeated in `BRAND_DESIGN.md`, `.impeccable.md`, and `CLAUDE.md` so they cannot be forgotten:

1. **Data first, decoration never** — every visual element must help an operator read status faster. If it doesn't, remove it.
2. **Calm by default, urgent only when earned** — red, motion, and elevated visual weight are reserved for genuine alarms. Normal state = quiet confidence.
3. **One system, many modules** — water, electricity, STP, assets, contractors, HVAC, pest, fire all look like pages of one app, not seven. Reuse the shared primitives below; module accent colors are scoped to icons and chart series.
4. **Tokens, never hex** — colors, radii, spacing, and shadows come from CSS variables in `app/globals.css`. Inline hex codes in components are a bug.
5. **Accessible in the field** — generous touch targets (≥ 44×44px on primary actions), never color-only status (always pair with icon + text label), WCAG AA in both themes, respect `prefers-reduced-motion`, RTL-aware.
6. **Equally readable in light and dark** — both themes ship as production-grade. Test every KPI, axis label, and badge in both.

---

## 2. The Token Contract

**Components must read colors from CSS variables, not Tailwind colors.** Raw `bg-white`, `text-slate-500`, `border-gray-200` etc. are forbidden in app code — they bypass the theme and break dark mode. The codebase was swept clean of these in commit `08ec7fe`; do not reintroduce them.

### 2.1 Brand

| Token | Light | Dark | Tailwind class | Use for |
|-------|-------|------|----------------|---------|
| `--primary` | `#4E4456` | `#4E4456` | `bg-primary` / `text-primary` | Sidebar, primary buttons, headings (light mode) |
| `--primary-foreground` | `#FFFFFF` | `#FFFFFF` | `text-primary-foreground` | Text on primary surfaces |
| `--secondary` / `--accent` | `#43B3AE` | `#43B3AE` | `bg-secondary` / `text-secondary` / `ring-secondary` | CTAs, focus rings, active tab indicator |
| `--secondary-foreground` | `#1F2937` | `#1F2937` | `text-secondary-foreground` | Text on secondary surfaces |
| `--mb-primary-hover` | `#3A3341` | `#3A3341` | `hover:bg-[var(--mb-primary-hover)]` | Primary hover state |
| `--mb-secondary-active` | `#8AAFA5` | `#8AAFA5` | n/a | Pressed/active teal |

### 2.2 Surfaces

| Token | Light | Dark | Tailwind class | Use for |
|-------|-------|------|----------------|---------|
| `--background` | `#F7F8F9` | `#0A090C` | `bg-background` | Page background |
| `--card` | `#FFFFFF` | `#16141B` | `bg-card` | Card / panel surfaces |
| `--component` | `#F0F2F4` | `#16141B` | `bg-component` | Inner component areas |
| `--muted` | `#F3F4F6` | `#22202A` | `bg-muted` | Neutral fills, hover backgrounds, skeleton |
| `--popover` | `#FFFFFF` | `#16141B` | `bg-popover` | Popovers, dropdowns |

### 2.3 Text & borders

| Token | Light | Dark | Tailwind class |
|-------|-------|------|----------------|
| `--foreground` | `#0A0A0A` | `#F1F5F9` | `text-foreground` |
| `--card-foreground` | `#0A0A0A` | `#F1F5F9` | `text-card-foreground` |
| `--muted-foreground` | `#6B7280` | `#9CA3AF` | `text-muted-foreground` |
| `--border` | `#E5E7EB` | `rgba(255,255,255,0.1)` | `border-border` |
| `--input` | `#E5E7EB` | `rgba(255,255,255,0.1)` | `border-input` |
| `--ring` | `#43B3AE` | `#43B3AE` | `ring-ring` / `focus-visible:ring-secondary` |

### 2.4 Status colors (always paired with icon + text label)

Never rely on color alone to convey status — always combine with an icon (check / triangle / circle) and a short label.

| Token | Hex | Tailwind reference | Meaning |
|-------|-----|--------------------|---------|
| `--status-normal` | `#22C55E` | `text-[var(--status-normal)]` | OK / operational |
| `--status-warning` | `#F59E0B` | `text-[var(--status-warning)]` | Caution |
| `--status-danger` | `#EF4444` | `text-[var(--status-danger)]` | Critical / error |
| `--status-info` | `#3B82F6` | `text-[var(--status-info)]` | Informational |
| `--status-stale` | `#F97316` | `text-[var(--status-stale)]` | Stale data |
| `--status-missing` | `#94A3B8` | `text-[var(--status-missing)]` | No data |

Each status has a 10% opacity tint variant (e.g. `--status-danger-bg`) for badge backgrounds.

### 2.5 Module accents — icons and chart series only

These are the per-module accents. **Do not use them as page chrome or wholesale backgrounds** — that's how cross-module visual identity drift happens. They live in module icons, chart series, and small highlights.

| Module | Token | Hex |
|--------|-------|-----|
| Water | `--module-water` | `#3B7ED2` |
| Electricity | `--module-electricity` | `#E8A838` |
| STP | `--module-stp` | `#10B981` |
| Assets | `--module-assets` | `#8B7F94` |
| Contractors | `--module-contractors` | `#6B9AC4` |
| HVAC | `--module-hvac` | `#E8C064` |
| Pest Control | `--module-pest` | `#84B59F` |
| Fire Safety | `--module-fire` | `#D67A7A` |

### 2.6 Chart palette

For multi-series charts use the chart slots; for domain-specific charts, layer with `--module-*`.

| Token | Hex | Role |
|-------|-----|------|
| `--chart-1` | `#6B9AC4` | Primary series (sky blue) |
| `--chart-2` | `#43B3AE` | Secondary series (brand teal) |
| `--chart-3` | `#E8C064` | Tertiary series (amber) |
| `--chart-4` | `#84B59F` | Quaternary series (sage) |
| `--chart-5` | `#4D445D` | Brand purple |
| `--chart-loss` | `#D67A7A` | Loss / deficit |
| `--chart-success` | `#84B59F` | Gain / surplus |
| `--chart-axis` | `#6B7280` / `#94A3B8` (dark) | Axis lines & labels |

---

## 3. Typography

### Font family

**Inter** (variable, weights 400/500/600/700/800), loaded once via `next/font/google` in `app/layout.tsx` and exposed through `--font-sans`. The font is wired through `tailwind.config.ts` `fontFamily.sans` so every Tailwind `font-sans` class — and every element under `<body>` — resolves to Inter.

**Never re-declare `font-family` anywhere.** That was the root cause of the cross-section font drift fixed in commit `08ec7fe`. The CSS variable is the single source of truth.

```ts
// app/layout.tsx — one place, no exceptions
import { Inter } from "next/font/google";
const inter = Inter({ subsets: ["latin"], variable: "--font-sans",
                       weight: ["400", "500", "600", "700", "800"] });
```

```ts
// tailwind.config.ts
fontFamily: {
  sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif', ...],
}
```

### Type scale

Sizes live as Tailwind tokens. Avoid arbitrary `text-[Npx]` outside this scale.

| Token | Size | Tailwind class | Use for |
|-------|------|----------------|---------|
| `--font-size-xs` | `12.25px` | `text-xs` | Captions, micro-text, badges |
| `--font-size-sm` | `14px` | `text-sm` | Labels, button text |
| `--font-size-base` | `14px` | `text-base` | Body text |
| `--font-size-lg` | `15px` | `text-lg` | Larger body |
| `--font-size-xl` | `15.75px` | `text-xl` | H1/H3 headings |

### Heading rule

All `h1–h6` use `font-semibold tracking-tight`. Color is `text-primary` in light mode, `text-foreground` in dark.

### KPI values (overrides the base scale)

KPI numbers on `StatsGrid` tiles intentionally break out of the base scale so they read as the dominant element on the page. See §5 `StatsGrid` for the full recipe.

| Property | Value |
|----------|-------|
| Size | `text-2xl` (24px) — flat across all breakpoints so values like `92,051.5 OMR` fit in 4-column 8-tile grids without truncation |
| Weight | `font-semibold` (600) — modern dashboards (Linear, Stripe, Vercel) use 500–600 for emphasis; 800 reads heavy and dated |
| Color | `text-primary` (light) · `text-foreground` (dark) |
| Numerals | `tabular-nums` |
| Line height | `leading-none` |

---

## 4. Layout & Spacing

| Element | Value | Source |
|---------|-------|--------|
| Sidebar (expanded) | `220px` | `--sidebar-width-expanded` |
| Sidebar (collapsed) | `72px` | `--sidebar-width-collapsed` |
| Topbar height | `64px` | `--header-height` |
| Content max-width | `1536px` | `.layout-shell` |
| Card gap | `14px` | grid utility |

### Responsive breakpoints

Tailwind defaults: `sm` 640 · `md` 768 · `lg` 1024 · `xl` 1280 · `2xl` 1536.

### Content padding (`.layout-shell`)

| Breakpoint | Padding (y / x) |
|------------|-----------------|
| Mobile (`< 640px`) | `0.75rem / 0.75rem` |
| Tablet (`≥ 640px`) | `1rem / 1.25rem` |
| Desktop (`≥ 1024px`) | `1rem / 2rem` |
| Large (`≥ 1280px`) | `1.5rem / 2.5rem` |
| XL (`≥ 1536px`) | max-width, auto margin |

### Border radius

| Token | Value | Use |
|-------|-------|-----|
| `--radius` / `--radius-lg` | `10.5px` | Cards, modals |
| `--radius-md` | `7px` | Inputs, popovers |
| `--radius-sm` | `5px` | Badges, chips, small buttons |

---

## 5. Shared Primitives (use these, do not rebuild)

When adding any page or feature, reach for these first. Building a one-off table, KPI card, or page header is a normalization bug — fold it into the primitive instead.

| Need | Component | Path |
|------|-----------|------|
| Page title + description | `PageHeader` | `components/shared/page-header.tsx` |
| Route-aware breadcrumbs | `Breadcrumbs` | `components/shared/breadcrumbs.tsx` |
| Connection / live-data badge + timestamp | `PageStatusBar` | `components/shared/page-status-bar.tsx` |
| Tab switcher (keyboard-aware) | `TabNavigation` | `components/shared/tab-navigation.tsx` |
| KPI tiles | `StatsGrid` | `components/shared/stats-grid.tsx` |
| Empty / error / no-results states | `EmptyState` | `components/shared/empty-state.tsx` |
| Loading placeholders | `Skeleton` family | `components/shared/skeleton.tsx` |
| Tabular data | `DataTable` family | `components/shared/data-table/` |
| Charts | wrappers in `components/charts/` | Recharts-based |
| Class merge | `cn()` | `@/lib/utils` |
| Icons | `lucide-react` | named imports, default `w-5 h-5` |

### `DataTable` family

Re-exported from `components/shared/data-table/index.ts`:

- `SortableTableHead` — column header with sort indicator & keyboard support. Inactive caret renders at 11px / 45% opacity, active caret at `text-foreground` / 100%
- `SortIcon` — standalone sort glyph
- `TableToolbar` — search + filter container. Accepts optional `title?: ReactNode` and `count?: number | string` slot props; numeric `count` is locale-formatted automatically
- `DensityToggle` — compact / comfortable / spacious switcher (writes `data-density` on the `<table>`)
- `TablePagination` — page-size selector + paging controls (`PageSizeOption`)
- `MultiSelectDropdown` — filter dropdown with color dots
- `ActiveFilterPills` — removable filter chips
- `StatusBadge` — themed badge with `BadgeColor` (`DOT_COLORS` map). Defaults to a soft dot leading visual; pass `iconVariant="icon"` for the lucide symbol or `"none"` for label-only. Legacy `hideIcon` is still accepted (maps to `iconVariant="dot"`).

Reference implementations: `app/assets/page.tsx`, `app/contractors/page.tsx`, `app/electricity/page.tsx`, `app/stp/page.tsx`, `app/firefighting/quotes/page.tsx`, `components/water/meter-table.tsx`, `components/water/water-database-table.tsx`, `components/water/DailyWaterReport.tsx` (and the `daily-report/` panel family), `components/gulf-expert/{overview,findings,equipment}-tab.tsx`. The system is unified — bespoke tables are anti-patterns, not legacy debt.

### Unified table look — what `<Table>` gives you for free

The shared `<Table>` primitive (`components/ui/table.tsx`) wraps every consumer in `.ops-table-shell`. The look is driven entirely by `app/globals.css` so a single CSS change reskins every page.

- **Card chrome** — 1px `--border`, `--radius` (10.5px), `box-shadow: 0 1px 2px rgb(15 23 42 / 0.06)` (`0 1px 0 rgba(255,255,255,0.03)` dark). One bordered card per table, no nested `ops-table-shell` divs.
- **Header band** — `background: var(--header-band)`, full-strength `--border` underline, hairline vertical dividers between columns. Text: 12.5px / 500 / mixed-case / `--muted-foreground`. No uppercase, no letter-spacing.
- **Body cells** — 13px / `--card-foreground`, 14×18 padding, 52px row height (comfortable default). Every cell gets a `--hairline` right + bottom border (last-of-row/last-of-table collapse). **No zebra striping** — flat rows are the system.
- **Hover** — `background: var(--row-hover)`, 120ms ease-out transition (guarded by `prefers-reduced-motion`).
- **Density variants** — set on the `<Table>` element directly:
  ```tsx
  <Table data-density="compact">   {/* 40px rows, 10×14 padding — ledger pages */}
  <Table>                          {/* 52px rows, 14×18 padding — default */}
  <Table data-density="spacious">  {/* 64px rows, 18×22 padding — short tables */}
  ```

### Table helper classes — use these on `<TableHead>` / `<TableCell>`

All scoped to `.ops-table` so they only apply inside tables:

- `.num` — right-aligned + `font-variant-numeric: tabular-nums`. Use on every numeric column (header AND cell). **Replaces ad-hoc `text-right font-mono` on quantity / money cells.**
- `.meter` — monospace + tabular-nums + `--muted-foreground` for genuine mono content (account numbers, meter IDs).
- `.strong` — `--foreground` + `font-weight: 500` for a row's primary identifier (the cell that names the row).
- `.col-sticky` — sticky first-column helper. Bundles `position: sticky; left: 0; z-index: 1` for cells (z-index 6 on header cells to clear the sticky `thead`) plus a tinted hover state. **Replaces the inline `sticky left-0 bg-muted dark:bg-muted/80 z-20` strings that used to clutter wide-ledger pages.**

### Table system tokens (in `globals.css`)

| Token | Purpose | Light | Dark |
|---|---|---|---|
| `--hairline` | Cell-grid borders | `color-mix(--border 55%, transparent)` | `color-mix(--border 70%, transparent)` |
| `--header-band` | Header background | `color-mix(--card 96%, --muted)` | `color-mix(--card 88%, --muted)` |
| `--row-hover` | Hover row bg | `color-mix(--secondary 8%, transparent)` | `color-mix(--secondary 7%, transparent)` |

Driven by `--card` / `--border` / `--secondary` / `--muted` — the table look retunes automatically when those move.

Spec / plan: `docs/superpowers/specs/2026-05-14-unified-table-system-design.md` · `docs/superpowers/plans/2026-05-14-unified-table-system.md`.

### `StatsGrid`

Auto-lays out 3 / 4 / 6 / 8 KPI tiles responsively. Tile variants drive the icon tint via tokens: `primary | secondary | success | warning | danger | info | water | default`. Trend indicators auto-color (green=good, red=bad), with `invertTrend` for savings-style metrics where down is good. Optional `href` makes tiles clickable as `<Link>`.

**Value typography** is intentionally heavy and brand-coloured to anchor the eye:

```tsx
<h3 className="text-lg sm:text-2xl font-semibold tabular-nums tracking-tight truncate
               text-primary dark:text-foreground leading-none">
  {stat.value}
</h3>
```

- **Color**: `text-primary` (`#4E4456`, brand purple) in light mode, `text-foreground` in dark mode so contrast stays AA on `#0A090C`.
- **Weight**: `font-extrabold` (800) — heaviest weight Inter ships in this app.
- **Size**: `text-lg` (15px) on mobile, `text-2xl` (24px) from `sm` up. Capped here because (a) larger reads heavy/dated, and (b) values like `92,051.5 OMR` on the 8-tile STP layout truncated at `text-3xl` once the icon and padding took their share. Tabular nums + `leading-none` keep neighbouring tiles aligned even when values differ in width.
- **Weight**: `font-semibold` (600) — modern dashboards (Linear, Stripe, Vercel) cap value emphasis here. Avoid `font-bold`/`font-extrabold` on tabular data — they make the dashboard read like a 2010-era spreadsheet rather than a 2026 product.
- **Never tint red/green based on the metric** — colour stays brand-purple regardless of trend. The trend chip below the value carries the sentiment.

### `PageStatusBar`

Right-aligned cluster showing connection state, optional live-subscription badge, and last-updated timestamp. Use on every data-bound page.

---

## 6. Motion

### Standard easing

```css
--transition-timing: cubic-bezier(0.4, 0, 0.2, 1);
--transition-duration: 0.2s;
```

### Page transitions (View Transitions API)

- Exit: 120ms fade-out
- Enter: 160ms fade-in + `translateY(4px → 0)` lift
- Disabled under `prefers-reduced-motion`

### Named utility classes

- `.transition-design` — color, bg, border, shadow, opacity, transform
- `.transition-colors-design` — color, bg, border, fill, stroke

### Component animations

| Class | Effect | Duration |
|-------|--------|---------|
| `.mb-pulse` | Logo breathe scale 1 → 1.06 | 2.8s infinite |
| `.mb-ring-anim` | Expanding ring + fade | 2.2s infinite |
| `.mb-shimmer` | Shimmer sweep | 1.9s linear infinite |
| `.mb-spin` | 360° spinner | 0.85s linear infinite |
| `.animate-fade-in-up` | Opacity 0→1 + translateY 10→0 | 0.5s |
| `.animate-pulse-dot` | Pulsing red dot glow | 2s infinite |

All decorative loops are disabled under `prefers-reduced-motion`. **Do not animate `width`, `height`, `top`, `left`** — use `transform` and `opacity` only.

---

## 7. Shadows

### Cards

```css
/* Primary — large cards */
box-shadow: 0px 12px 18px -3px rgba(0,0,0,0.15),
            0px 6px 8px -4px rgba(0,0,0,0.12);

/* Standard — KPI / metric cards */
box-shadow: 0px 6px 10px -1px rgba(0,0,0,0.12),
            0px 3px 6px -2px rgba(0,0,0,0.1);
```

### `.card-elevated`

Light mode default + hover, dark mode default + hover — see `globals.css`. Use on lifted surfaces (KPI grids, chart cards, detail panels).

---

## 8. Component Recipes

### Buttons

| Variant | Background | Text | Hover |
|---------|-----------|------|-------|
| Primary | `bg-primary` | `text-primary-foreground` | `hover:bg-[var(--mb-primary-hover)]` |
| Secondary | `bg-secondary` | `text-secondary-foreground` | — |
| Success | `bg-mb-success` | `text-primary-foreground` | `hover:bg-[var(--mb-success-active)]` |
| Destructive | `bg-destructive` | `text-destructive-foreground` | — |
| Ghost | transparent | `text-foreground` | `hover:bg-muted` |

- Border radius: `rounded-sm` (`5px`)
- Font: `text-xs sm:text-sm` weight 500
- Min touch target: `min-h-[44px]` on mobile primary actions

### Cards (`Card` component)

`bg-card border border-border rounded-xl shadow-sm` — set in `components/ui/card.tsx`. Use it; don't roll a one-off `<div className="bg-white ...">`.

### Sidebar

- Width: 220px / 72px
- Background: `--sidebar` (`#423846` light / `#3B3240` dark)
- Active item tint: `rgba(77,191,191,0.15)` + secondary teal text

### Topbar

- Height: 64px
- Backdrop: `.header-blur` — blurred surface, sticky

### Tooltip (CSS-only)

Triggered via `data-tooltip` attribute on hover or focus-visible. Background `rgba(15,23,42,0.85)`, white text, `text-xs` weight 500, `4px 8px / radius-md`.

### Focus ring

```css
focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2
```

Every interactive element gets this. Never remove without a replacement.

---

## 9. Accessibility floor (non-negotiable)

- **WCAG AA** contrast on all KPIs, badges, chart axis labels, and buttons — in both themes.
- **Never color-only** — status color + icon + short label, always.
- **Touch targets** ≥ 44×44px for primary actions; comfortable spacing for gloved tablet use.
- **`prefers-reduced-motion`** disables decorative loops and page transitions.
- **RTL-aware** — direction-agnostic flex/grid, mirrored icons where semantic.
- **Focus-visible ring** on every interactive element.

---

## 10. Anti-patterns (do not do)

| ❌ Don't | ✅ Do |
|---------|-------|
| `bg-white dark:bg-slate-900` | `bg-card` |
| `text-slate-500 dark:text-slate-400` | `text-muted-foreground` |
| `text-slate-800 dark:text-slate-100` | `text-foreground` |
| `border-slate-200 dark:border-slate-800` | `border-border` |
| `text-white` (on a primary surface) | `text-primary-foreground` |
| Inline hex `#3B82F6` in a `.tsx` | `var(--status-info)` or `var(--module-water)` |
| Bespoke `<table>` with custom sort icons | `DataTable` family from `components/shared/data-table` |
| `<TableCell className="text-right font-mono">` on a number | `<TableCell className="num">` |
| `<TableCell className="text-muted-foreground font-mono">` on an ID/account | `<TableCell className="meter">` |
| Inline `sticky left-0 bg-muted dark:bg-muted/80 z-20` on a column | `className="col-sticky"` (drop the bg + z-index) |
| `even:bg-*` / `nth-child(even)` zebra striping on rows | Flat rows — the unified table system removes striping intentionally |
| `hover:bg-secondary/5 dark:hover:bg-muted/40` on `<TableRow>` | Drop it — `.ops-table tbody tr:hover` uses `--row-hover` automatically |
| `text-transform: uppercase tracking-wide` on `<TableHead>` | Drop it — headers are mixed-case 12.5px muted by system |
| Raw `<Badge>` inside a table row for status | `<StatusBadge label={…} color={…}>` (defaults to dot) |
| `manual border-l border-border` between column groups | Drop it — the cell-grid CSS provides uniform hairlines |
| Nested `<div className="ops-table-shell">` wrapping a `<Table>` | Just `<Table>` — the primitive wraps itself |
| One-off KPI card `<div>` per page | `StatsGrid` |
| Per-module page chrome in module-accent color | Module accents in icons & chart series only |
| `font-family: "Inter"` declared in a component | `var(--font-sans)` (loaded once in layout) |
| `font-bold` / `font-extrabold` on table cells, totals, or KPI values | `font-medium` on cells, `font-semibold` on totals & KPI values |
| Same weight for header + cell + total (visual flat) | Cells `font-normal`, headers `font-medium`, totals `font-semibold` (gentle hierarchy) |
| Animating `height`, `width`, `top`, `left` | `transform` + `opacity` |
| Bounce / elastic easing | `cubic-bezier(0.4, 0, 0.2, 1)` (ease-out) |
| Pure `#FFFFFF` / `#000000` outside `globals.css` | `--background` / `--foreground` |

---

## 11. Where to find things

- **CSS variables**: `app/globals.css` (light theme `:root`, dark theme `.dark`)
- **Tailwind tokens**: `tailwind.config.ts` (`fontFamily`, `fontSize`, `boxShadow`, etc.)
- **Shared primitives**: `components/shared/`
- **UI primitives** (shadcn/ui base-vega): `components/ui/`
- **Charts**: `components/charts/`
- **Brand spec (authoritative)**: `BRAND_DESIGN.md` (repo root)
- **AI agent design context**: `.impeccable.md` (repo root)
- **Project conventions**: `CLAUDE.md` (repo root)

---

## 12. Adding a new module page

The pattern, in order:

1. Create route in `app/<route>/page.tsx`
2. Add entity types in `entities/`
3. Add data fetchers in `functions/api/`
4. Compose the page from shared primitives:
   ```tsx
   <div className="space-y-6 sm:space-y-7 md:space-y-8 w-full">
     <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
       <PageHeader title="…" description="…" />
       <PageStatusBar isConnected={…} lastUpdated={…} />
     </div>
     <TabNavigation tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
     <StatsGrid stats={kpis} />
     {/* tabs render here, each using DataTable + chart wrappers */}
   </div>
   ```
5. Add the sidebar nav item in `components/layout/sidebar.tsx`
6. Pick a module accent from §2.5 and use it for the route's icon + chart series only

Anything that diverges from this recipe should be conscious and justified.

---

*Last unified: commit `08ec7fe` — `feat(design-system): unify tokens, font, and shared primitives across modules`.*
