# Muscat Bay Operations — Design System (canonical)

> **This is the only design document for the app.** If anything elsewhere (an old skill, a comment, a component) disagrees with this file, this file wins. Update this file first, then the code.
>
> **App:** Muscat Bay Operations · muscatbay.work · Next.js 16 · React 19 · TypeScript 5 · Tailwind CSS 4 · Supabase
> **Version:** 2.0 · 2026-09-02 · supersedes `muscat-bay-brand-design-system` and `muscatbay-design`

---

## 0. Definition of done (check before every UI PR)

- [ ] Page uses `PageHeader` with a `StatusChip`; the title does not wrap at 1280 px.
- [ ] Breadcrumb is present above the header on every module page.
- [ ] Mode switch (if any) is a `SegmentedControl`; section switch (if any) is `Tabs`. Never the same component for both. Tabs never scroll.
- [ ] Every KPI is a `KpiCard`; every card in a grid is the same height; no KPI label wraps.
- [ ] Every content block is a `SectionCard`; its header is one title line plus at most one description line.
- [ ] Exactly **one** filled purple button per view.
- [ ] Charts go through `ChartFrame`; legends are hidden for single-series charts; no labels drawn on donut rings.
- [ ] No arbitrary Tailwind values (`text-[…]`, `shadow-[…]`, `rounded-[…]`, `bg-[#…]`) and no Tailwind palette colours (`blue-500`, `slate-900`…). `pnpm lint` passes.
- [ ] No ticker / marquee strips. No duplicate "live data" information.
- [ ] Checked in light **and** dark mode; screenshot at 1440 px attached to the PR.

---

## 1. Brand

| Attribute | Value |
|---|---|
| Product name | Muscat Bay Operations (short: MuscatBay) |
| Primary | **Charcoal Purple `#4E4456`** — sidebar, page and section titles, table headers, one primary button per view, active segmented pill |
| Accent | **Tiffany Blue `#A1D1D5`** — active-tab underline, focus ring, icon tiles, secondary chart series |
| Typeface | **DM Sans** (Google Fonts, variable; weights 400 / 500 / 600 / 700) with `ui-sans-serif, system-ui` fallback |
| Icons | **Lucide** only, 2 px stroke, monochrome. 16 px inline, 20 px in KPI tiles and navigation. **No emoji, no illustrations.** |
| Logo | `/public/mb-logo.png` (primary), `/public/logo.png` (alt), favicon and PWA icons as already shipped |
| Tone | Calm and operational. Sentence case for titles, UPPERCASE eyebrows, Title Case column headers, no exclamation marks |

Green is reserved for **status** (dots, badges, trend arrows). It is never decorative.

---

## 2. Colour tokens

All colours are CSS custom properties defined once in `app/design-tokens.css` and exposed to Tailwind through `@theme`. Components use the utility (`bg-card`, `text-muted`, `border-line`) — never a hex.

### 2.1 Surfaces and text

| Token | Light | Dark | Use |
|---|---|---|---|
| `--color-bg` | `#F7F8F9` | `#0A090C` | Page background (warm, not slate) |
| `--color-card` | `#FFFFFF` | `#16141B` | Cards, popovers |
| `--color-component` | `#F0F2F4` | `#1E1C26` | Segmented-control track, table stripes, inputs |
| `--color-line` | `#E5E7EB` | `rgba(255,255,255,.10)` | Borders and dividers |
| `--color-fg` | `#0A0A0A` | `#F1F5F9` | Body text |
| `--color-muted` | `#6B7280` | `#9CA3AF` | Labels, captions, secondary text |
| `--color-primary` | `#4E4456` | `#4E4456` | Brand purple |
| `--color-primary-hover` | `#3A3341` | `#5C5166` | |
| `--color-on-primary` | `#FFFFFF` | `#FFFFFF` | |
| `--color-accent` | `#A1D1D5` | `#A1D1D5` | Brand teal |
| `--color-accent-tint` | `#E8F1EF` | `rgba(161,209,213,.14)` | Icon tiles, hover backgrounds |
| `--color-sidebar` | `#423846` | `#3B3240` | |

### 2.2 Status (muted — never saturated)

| Token | Text (light) | Text (dark) | Tint (light) | Tint (dark) |
|---|---|---|---|---|
| `success` | `#2E7D42` | `#9FD6AE` | `#E9F5EC` | `rgba(132,181,159,.16)` |
| `warning` | `#9A6B00` | `#F0D08A` | `#FDF5E6` | `rgba(232,192,100,.16)` |
| `danger` | `#B03A2E` | `#F0A8A8` | `#FCEAEA` | `rgba(214,122,122,.16)` |
| `info` | `#2F5F9E` | `#A9C6E6` | `#EBF1FA` | `rgba(107,154,196,.16)` |
| `neutral` | `#6B7280` | `#9CA3AF` | `#F0F1F3` | `rgba(255,255,255,.06)` |

Status dots use the text colour; badges use tint background + text colour. Every pair above meets WCAG AA (≥ 4.5:1) in both modes — this fixes the unreadable dark-mode loss call-out.

### 2.3 Module accents (icon tiles, chart primary series)

| Module | Token | Hex |
|---|---|---|
| Water | `--color-mod-water` | `#3B7ED2` |
| Electricity | `--color-mod-electricity` | `#D4A843` |
| STP | `--color-mod-stp` | `#5FA88A` |
| Assets | `--color-mod-assets` | `#8B7F94` |
| Contractors | `--color-mod-contractors` | `#6B9AC4` |
| HVAC | `--color-mod-hvac` | `#C99A4B` |
| Pest control | `--color-mod-pest` | `#84B59F` |
| Fire safety | `--color-mod-fire` | `#C96B6B` |

### 2.4 Chart series (in order)

`#4E4456` purple · `#A1D1D5` teal · `#3B7ED2` water blue · `#D4A843` amber · `#8B6DB0` violet · `#5FA88A` sage. Loss / negative `#C96B6B`. Target lines `#9A6B00` dashed. Axis text `--color-muted`. Grid `--color-line`.

---

## 3. Typography — seven steps, nothing else

| Utility | Size / line / weight | Tracking | Use |
|---|---|---|---|
| `text-display` | 28 / 34 / 700 | −0.02 em | Page title. One per page. Never wraps at ≥ 1280 px |
| `text-title` | 16 / 22 / 600 | −0.01 em | Section card titles, dialog titles |
| `text-body` | 14 / 21 / 400 | 0 | Body, table cells, descriptions |
| `text-label` | 13 / 18 / 500 | 0 | Buttons, tabs, form labels, badges |
| `text-caption` | 12 / 16 / 400 | 0 | Footnotes, axis ticks, timestamps |
| `text-eyebrow` | 11 / 14 / 600 | +0.08 em, uppercase | KPI labels, nav groups, table headers |
| `text-kpi` | 24 / 28 / 700 | −0.01 em, `tabular-nums` | KPI values (as `<p>`, never as a heading) |

Rules: minimum size 11 px; weight 800 does not exist; italics are not used in UI (only inside quoted text); numbers always `tabular-nums` with the unit to the right in `text-caption` muted (`373,260 m³`, `4.7k OMR`).

---

## 4. Shape, elevation, motion

| Token | Value | Use |
|---|---|---|
| `rounded-card` | 10.5 px | Cards, modals, iframe frames |
| `rounded-control` | 6 px | Buttons, inputs, segmented control, icon tiles |
| `rounded-pill` | 9999 px | Badges, status chips, avatars |
| `shadow-card` | `0 1px 2px rgba(0,0,0,.04), 0 2px 6px rgba(0,0,0,.06)` | Every card at rest |
| `shadow-card-hover` | `0 2px 4px rgba(0,0,0,.06), 0 4px 12px rgba(0,0,0,.08)` | Interactive cards on hover, popovers |
| Dark mode shadows | `0 4px 12px rgba(0,0,0,.30), 0 2px 4px rgba(0,0,0,.20)` | Automatic via token |
| Motion | `200 ms cubic-bezier(.4,0,.2,1)`; hover lift `translateY(-1px)`; no bounces; all loops off under `prefers-reduced-motion` | |
| Focus | `outline: 2px solid var(--color-accent); outline-offset: 2px` on `:focus-visible` | |

Two shadows. Three radii. That is the whole list.

---

## 5. Layout

| Element | Value |
|---|---|
| Sidebar | 220 px expanded · 72 px collapsed |
| Topbar | 64 px, `backdrop-filter: blur(12px)` |
| Content max-width | 1536 px, padding 24 px (≥ 1024) / 40 px (≥ 1280) |
| Vertical rhythm | 24 px between blocks; 14 px gap inside card grids |
| Grid | 12 columns. Card rows are 6 + 6, 8 + 4 or 12. KPI rows are 3 or 4 across |
| Fixed heights | `PageHeader` 64 px · `SegmentedControl` 36 px · `Tabs` 40 px · `KpiCard` 104 px · `SectionCard` header 56 px · footer 40 px · chart body 260 px (half width) / 320 px (full width) |

Every page, top to bottom: **Breadcrumb → PageHeader → SegmentedControl (optional) → KPI row → Tabs (optional) → SectionCards**.

---

## 6. Components (`components/ui/`)

One way to do each thing. Do not create a second version of any of these on a page.

| Component | Purpose | Never |
|---|---|---|
| `Breadcrumb` | `Dashboard › Water` above the header | Deeper than 3 levels |
| `PageHeader` | Title (`text-display`) + one description line + right-hand slot for one `StatusChip` | Wrapping titles — shorten the title instead |
| `StatusChip` | Data-source state: `live` · `stale` · `offline` · `connecting` | Two chips, or "Connected" next to "Offline" |
| `SegmentedControl` | **Primary** mode switch (Monthly / Daily / Satellite) — filled purple active pill on a tinted track, 36 px | More than 4 options |
| `Tabs` | **Secondary** section switch — underline style, 40 px, accent underline | Scrolling; more than 6 tabs (use fewer sections) |
| `KpiCard` | 104 px tile: icon tile · eyebrow label · `text-kpi` value + unit · one footnote | Wrapped labels; coloured borders; growing height |
| `SectionCard` (`.Header` / `.Body` / `.Footer`) | Any content block. Header 56 px fixed; footer 40 px fixed | Insight text or status lines in the header |
| `Badge` | Status pill: tint + text, 22 px | Filled saturated colours |
| `Button` | `primary` · `secondary` (outline) · `ghost` · `danger`; sizes `sm` 28 · `md` 36 · `lg` 40 | 44 px buttons on desktop; two primaries in one view |
| `ChartFrame` | Recharts theme: series palette, dashed horizontal grid only, no axis lines, 12 px ticks, card-style tooltip, legend below and hidden when series = 1 | Raw Recharts defaults |
| `DateRangePicker` | Presets (3M · 6M · 1Y · YTD) + start / end month selects, 44 px tall, helper text "8 months available" | Three separate period controls on one page |
| `EmbedFrame` | Framed iframe for external tools (Pest Control / AITable): `SectionCard` chrome, fixed 720 px, open-in-new-tab action, theme passed via URL param | Letting the embedded tool's header dictate the page |
| `DataTable` | Purple header row (`text-eyebrow`, on-primary), 44 px rows, zebra `--color-component`, sticky header | Coloured row borders as status; use a `Badge` cell |

---

## 7. Page-specific rulings (from the 2026-09-02 audit)

- **Water:** Monthly / Daily / Satellite → `SegmentedControl`. Overview / Zone Analysis / Assets & Connections / Main Database / Exceptions → `Tabs` (5 tabs, no scroll). Loss call-out uses `danger` tint + text tokens (readable in dark).
- **Dashboard:** hero grid keeps its dark-on-purple treatment but uses `KpiCard` proportions. Remove the estate briefing ticker. Chart cards use `SectionCard` with equal heights; insight lines move to the footer. "Year to date" and "Latest updates" lose the empty toolbar rows. Latest updates becomes a 2-up grid or list rows so titles do not truncate.
- **Electricity / STP:** remove the load / plant briefing tickers. KPI strips become `KpiCard` rows. Status badges use tinted `Badge`. Coloured row borders on tables are removed.
- **STP:** the coloured-top-strip KPI variant is retired.
- **Contractors:** `Tabs` move above the KPI row only if they change the KPIs; otherwise below is fine — but keep it the same on every module page (decision: **KPIs first, then Tabs**).
- **Fire Safety:** KPI labels shortened ("Zones", "PPM cycles", "Cycles done", "Open issues"); donut labels move to a legend table.
- **HVAC:** must render a `PageHeader` (it currently has none); status chip shows one state.
- **Assets:** "Connecting…" becomes `StatusChip state="connecting"`; skeleton cards must match `KpiCard` height (104 px).
- **Pest Control:** `EmbedFrame` around the AITable embed. Pass `?theme=` when AITable supports it; otherwise leave the embed light and rely on the frame to hold the page's look.
- **Settings:** replace the "Authenticated" pill with the standard `StatusChip`; forms use `Button md`.
- **Breadcrumbs:** kept on every page (decision 2026-09-02).

---

## 8. Enforcement

- `app/design-tokens.css` is the only place colours, radii, shadows and type steps are defined.
- `eslint.config.mjs` includes the design rule from `eslint.design-rules.mjs` — arbitrary Tailwind values and palette colours fail the build in `app/**` and `components/**`.
- `CLAUDE.md` carries the "Design rules for agents" section verbatim (see `CLAUDE-design-section.md`).
- `scripts/screenshots.ts` (Playwright) captures the ten pages at 1440 px light + dark; run before opening a PR.

---

## 9. Documents (Word / PowerPoint / Excel / PDF)

Unchanged from the previous guide: titles `#4E4456`, body Calibri 11 pt `#1F497D` for email / `#1A1A1A` for documents, table headers white on `#4E4456`, accent strip `#A1D1D5`, chart colours from §2.4, positive `#2E7D42`, negative `#B03A2E`.
