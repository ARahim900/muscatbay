# Unified Table System — Design Spec

**Date:** 2026-05-14
**Owner:** Muscat Bay app
**Status:** Approved (visual direction), ready for implementation plan

## Goal

Refresh every data table in the Muscat Bay app so the eight modules (Water, Electricity, STP, Assets, Contractors, Pest, Fire, HVAC) read as pages of one calm, modern operations tool — not seven different stylesheets. The new look is the **Decentralised.co cell-grid** reference with **soft, calm hairline borders** and generous breathing room.

A live mockup was approved at `/tmp/mb-table-mockup.html` showing Assets / Electricity-monthly / Firefighting-quote layouts in both themes.

## Non-goals

- Replacing Recharts with a different chart library.
- Touching dashboards, KPI cards (`StatsGrid`), or non-tabular surfaces.
- Adding new table features (column reordering, column show/hide, saved views) — only re-skinning + consistency.
- Migrating the embedded Airtable iframe on STP → Details Data.

## Design tokens

All values resolve to existing CSS variables in `app/globals.css` — no inline hex.

| Surface | Light | Dark |
|---|---|---|
| Card | `var(--card)` `#FFFFFF` | `var(--card)` `#16141B` |
| Card border | `var(--border)` `#E3E0E6` | `var(--border)` `rgba(255,255,255,0.08)` |
| Hairline (cell grid) | `color-mix(in srgb, var(--border) 55%, transparent)` | `color-mix(in srgb, var(--border) 70%, transparent)` |
| Header band | `color-mix(in srgb, var(--card) 96%, var(--muted))` | `color-mix(in srgb, var(--card) 88%, var(--muted))` |
| Row hover | `color-mix(in srgb, var(--secondary) 8%, transparent)` | `color-mix(in srgb, var(--secondary) 7%, transparent)` |
| Header text | `var(--muted-foreground)` · 12.5px · 500 · mixed-case | same |
| Cell text | `var(--card-foreground)` · 13px · 400/500 | same |

Two new tokens may be introduced for clarity (`--hairline`, `--header-band`) — both as `color-mix` resolutions in `:root` and `.dark`. Existing badge tokens (`--badge-green/amber/red/blue/purple/slate*`) are reused unchanged.

## Visual contract

### Card shell
- `border: 1px solid var(--border)`, `border-radius: var(--radius-md)` (10.5px)
- `box-shadow: 0 1px 2px rgb(15 23 42 / 0.06)` light; `0 1px 0 rgba(255,255,255,0.03)` dark
- `overflow: hidden` so child borders meet the rounded corners cleanly

### Toolbar (top)
- 14×18 padding, separated from table by 1px hairline
- Layout: title + count → flex spacer → search (240px min) → filter button → primary action
- Search and buttons reuse the existing `mb-pill-btn`/input styles already in `app/globals.css`
- `<DensityToggle>` stays available but moves to a meatballs/overflow menu so the toolbar stays calm

### Header
- Sticky (`position: sticky; top: 0; z-index: 2`)
- `background: var(--header-band)`, `border-bottom: 1px solid var(--border)` (full strength)
- `padding: 12px 18px`, `height: 44px`
- Text: 12.5px / 500 / mixed-case (e.g. `Funding Type`, not `FUNDING TYPE`) / `--muted-foreground`
- Vertical hairline between every header cell except the last
- `<SortableTableHead>` keeps the existing arrow-up/arrow-down icon but at 11px and 45% opacity until active

### Body rows
- Default `height: 52px`, `padding: 14px 18px` (comfortable density)
- Hairline border on **every** cell side, `border-bottom` on the last row collapses with the card
- **No zebra striping.** Flat rows. (Removes existing `.ops-table tbody tr:nth-child(even)` rule.)
- Hover: bg set to `--row-hover`, no border-color change, 120ms transition
- Right-align numeric cells; apply `font-variant-numeric: tabular-nums` via a `.num` helper class
- Drop ad-hoc `font-mono` on quantity cells. Keep mono only for genuine mono content (account numbers, meter IDs) via a `.meter` helper class

### Density variants
- `compact` 40px rows / 10×14 padding — used for the Electricity monthly ledger and Water DB long-form tables by default
- `comfortable` 52px rows / 14×18 padding — **new system default**
- `spacious` 64px rows / 18×22 padding — opt-in only

Density resolves through the existing `<DensityToggle>`; it sets a `data-density` attribute on the `<table>` and the CSS keys off that.

### Pills / status / category
- Replace **all** raw `<Badge>` usages in tables (notably `app/firefighting/quotes/page.tsx`) with the shared `<StatusBadge>`
- Pill spec: 22px tall, 10px horizontal padding, 11.5px / 600, `border-radius: 999px`, inset 1px ring in matching ring token
- A 6px dot (`background: currentColor`) sits inside the pill before the label — keeps accessibility (icon + color + label) without the larger lucide icon
- A `hideIcon: true` mode keeps the lucide variant for places that want the icon

### Row actions
- Right-most cell, fixed `width: 88px`, no border-right
- Lucide icons at 14px, `color: var(--muted-foreground)`
- Default `opacity: 0`; reveal on `tr:hover` with 120ms transition (keyboard-focus also reveals via `:focus-within`)
- Each button has 6px padding and rounds to `--radius-sm`

### Footer (pagination)
- 12×18 padding, 1px hairline border-top
- Left: "Showing X–Y of N" in `--muted-foreground` 12.5px
- Right: pager buttons reused from existing `<TablePagination>` — current page filled `--primary`, others outlined
- Page-size selector folds into a quiet meatballs menu next to the pager (de-clutters toolbar)

## Component contract

Existing primitives stay; this is a re-skin + behavior-consolidation, not a new API.

### Stays as-is
- `components/ui/table.tsx` — `<Table>`, `<TableHeader>`, `<TableBody>`, `<TableRow>`, `<TableHead>`, `<TableCell>`, `<TableFooter>`, `<TableCaption>`
- `components/shared/data-table/sortable-table-head.tsx` — `<SortableTableHead>`
- `components/shared/data-table/table-pagination.tsx` — `<TablePagination>`
- `components/shared/data-table/multi-select-dropdown.tsx` — `<MultiSelectDropdown>`
- `components/shared/data-table/active-filter-pills.tsx` — `<ActiveFilterPills>`

### Updated
- `components/shared/data-table/table-toolbar.tsx` — tighten padding to spec, expose a slot for title + count, move density toggle into an overflow menu
- `components/shared/data-table/status-badge.tsx` — keep API, change default to **dot** variant (current default is icon); `hideIcon` becomes `iconVariant: 'dot' | 'icon' | 'none'` (back-compat aliases preserved for the few sites that pass `hideIcon={true}`)
- `components/ui/table.tsx` — no API change. The `<Table>` wrapper accepts `data-density` and `data-grid` attributes that key into the new CSS

### CSS rewrite
- `app/globals.css` `.ops-table*` block is rewritten end-to-end per the visual contract above. This single change re-skins every page that uses `<Table>` automatically.
- Add two helper utility classes inside `@layer components`:
  - `.num` — `text-align: right; font-variant-numeric: tabular-nums;`
  - `.meter` — same, plus `font-family: ui-monospace, …` for genuine mono content
- Add a sticky-column helper `.col-sticky` that bundles `position: sticky; left: 0; z-index: 1; background: var(--card);` so the Electricity / Water monthly tables can drop their ad-hoc inline classes

## Migration plan (by file)

Order is risk-graded: CSS first re-skins everything automatically, then per-page cleanup, then sub-tables.

1. **CSS pass** — rewrite `.ops-table*` in `app/globals.css`. After this, every `<Table>` consumer picks up the new look automatically. Verify visually in dev: Assets, Contractors, Electricity, STP, Water DB, Firefighting Quotes, Gulf Expert tabs.

2. **Toolbar + StatusBadge tweaks** — update `table-toolbar.tsx`, `status-badge.tsx` per the contract above.

3. **Per-page cleanup** (consistency wins, not visual):
   - `app/firefighting/quotes/page.tsx` — replace `<Badge variant="secondary" className={getStatusBadge(...)} >` with `<StatusBadge>`; replace the `font-mono` on cost column with `.num`
   - `app/electricity/page.tsx` — replace ad-hoc `sticky left-0 bg-muted dark:bg-muted/80 z-20 min-w-[Xpx]` with `.col-sticky` helper; drop `font-mono` on monthly columns, keep `.meter` only on account numbers
   - `app/stp/page.tsx` — same sticky-column cleanup
   - `app/assets/page.tsx` — already on `StatusBadge`; verify pill colors match new module palette; add `SortableTableHead` (assets currently lacks sort — memory notes this is a known gap; adding sort is in-scope for this pass since the column headers are already touched)
   - `app/contractors/page.tsx` — audit inline padding/colors and remove anything overriding tokens
   - `components/water/meter-table.tsx` + `components/water/water-database-table.tsx` — same audit; replace any inline `bg-*` overrides with token-based equivalents
   - `app/water/page.tsx` — verify Zone Analysis sub-tab table (meter-table) inherits cleanly

4. **Sub-tables (round 2)**:
   - `components/water/WaterHierarchyReport.tsx`, `components/water/DailyWaterReport.tsx`, `components/water/daily-report/zone-panel.tsx`, `components/water/daily-report/dc-panel.tsx` — these currently render raw HTML `<table>`. Migrate to the shared `<Table>` primitive so they inherit the look.
   - `components/gulf-expert/overview-tab.tsx`, `findings-tab.tsx`, `equipment-tab.tsx` — same migration

5. **Regression check** — re-run TestSprite baseline (24/38 passing) per `MEMORY.md`. Document any new pass/fail deltas.

## Behavior & accessibility

- All tables: keyboard-navigable, focus rings on sortable headers and row-action buttons via `--ring`
- Sort state announced via `aria-sort="ascending|descending|none"` (already implemented in `<SortableTableHead>`)
- Row-action buttons remain reachable via tab — they reveal on `:focus-within` for the row, not only on hover
- Status pills never rely on color alone — dot + text label always paired; icon variant available where needed
- `prefers-reduced-motion: reduce` disables the 120ms hover transition
- WCAG AA contrast verified for: header text on header band, cell text on card, all pill foreground/background pairs, row hover state

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| Re-skinning via `.ops-table` regresses a page that overrides the class | Search for `ops-table` overrides before the CSS pass; only Electricity/STP have inline overrides — covered in step 3 |
| Hairlines look invisible on some monitors | Use `color-mix` with explicit fallback; verify on retina + non-retina laptop in both themes |
| Sticky-column helper breaks horizontal scroll on Electricity monthly | Snapshot-test the existing behavior, then verify pre/post visually with 12-month data |
| Sub-table migration (step 4) inflates scope | Step 4 is **independent** of steps 1–3; can ship as a follow-up PR if needed |

## Acceptance criteria

- Every `<Table>` consumer renders with: cell grid, soft hairlines, mixed-case header, 52px rows (or compact for ledger pages), tabular-nums numerics, shared `<StatusBadge>` for status
- Zero inline `bg-#*` / `border-#*` / `font-mono` hex usage in the listed table files
- Both light and dark themes pass visual review and WCAG AA contrast
- TestSprite regression delta is zero (or net-positive)
- `app/firefighting/quotes/page.tsx` no longer imports raw `<Badge>` for status

## Out of scope (future)

- Column-reorder / show-hide / saved views
- Server-side pagination for Assets table
- Inline editing
- Selection-based bulk actions toolbar
- Migrating the STP Details Data Airtable iframe to a native table
