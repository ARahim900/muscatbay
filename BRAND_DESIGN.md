# Muscat Bay — Brand & Design System

> **App:** Muscat Bay Operations Dashboard  
> **URL:** [muscatbay.live](https://muscatbay.live)  
> **Purpose:** Utility management and operations monitoring platform for Muscat Bay  
> **Stack:** Next.js 16 · React 19 · TypeScript 5 · Tailwind CSS 4 · Supabase

---

## 1. Brand Identity

| Attribute | Value |
|-----------|-------|
| **Product name** | Muscat Bay Operations |
| **Short name** | MuscatBay |
| **Tagline** | Operations Dashboard for Muscat Bay |
| **Display mode** | Standalone PWA |
| **Theme (dark)** | `#0f172a` |
| **Theme (light)** | `#F9FAFB` |

### Logo & Icons
| Asset | Path | Size |
|-------|------|------|
| Primary logo | `/public/mb-logo.png` | — |
| Alt logo | `/public/logo.png` | — |
| Favicon | `/public/favicon.ico` | any |
| PNG icon | `/public/icon.png` | 32×32 |
| Apple touch icon | `/public/apple-icon.png` | 180×180 |
| PWA icon | `/public/icons/icon-192x192.png` | 192×192 |
| PWA icon | `/public/icons/icon-512x512.png` | 512×512 |
| OG image | `/public/og-image.png` | 1200×630 |

---

## 2. Color System

### 2.1 Brand Core

| Token | Hex | RGB | Role |
|-------|-----|-----|------|
| `--primary` | `#4E4456` | `78 68 86` | Sidebar, topbar, buttons, headings |
| `--mb-primary` | `#4D445D` | `77 68 93` | Auth pages, legacy usage |
| `--mb-primary-hover` | `#3A3341` | `58 51 65` | Hover state on primary |
| `--mb-primary-light` | `#6B5F73` | `107 95 115` | Lighter primary tint |
| `--secondary` / `--accent` | `#A1D1D5` | `161 209 213` | CTAs, focus rings, highlights — sampled directly from the cyan-teal slashes in `mb-logo.png` so brand teal and logo stay in lockstep. Never override to a different teal. |
| `--mb-secondary` | `#A1D1D5` | `161 209 213` | Brand teal |
| `--mb-secondary-light` | `#E8F1EF` | — | Tinted backgrounds |
| `--mb-secondary-active` | `#8AAFA5` | — | Active/pressed teal |

### 2.2 Backgrounds & Surfaces

#### Light Mode
| Token | Hex | Role |
|-------|-----|------|
| `--background` | `#F7F8F9` | Page background |
| `--card` | `#FFFFFF` | Card surfaces |
| `--component` | `#F0F2F4` | Inner component surfaces |
| `--muted` | `#F3F4F6` | Neutral backgrounds |
| `--popover` | `#FFFFFF` | Popover/dropdown |

#### Dark Mode
| Token | Hex | Role |
|-------|-----|------|
| `--background` | `#0A090C` | Page background (warm near-black) |
| `--card` | `#16141B` | Lifted surface |
| `--component` | `#16141B` | Inner surfaces |
| `--muted` | `#22202A` | Muted areas |

#### Dark Surface Remap (unlayered overrides)
| Tailwind class | Remapped hex |
|----------------|-------------|
| `dark:bg-slate-950` | `#0A090C` |
| `dark:bg-slate-900` | `#16141B` |
| `dark:bg-slate-800` | `#1E1C26` |
| `dark:bg-slate-700` | `#2A2733` |

### 2.3 Foreground & Text

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--foreground` | `#0A0A0A` | `#F1F5F9` | Body text |
| `--card-foreground` | `#0A0A0A` | `#F1F5F9` | Card text |
| `--muted-foreground` | `#6B7280` | `#9CA3AF` | Placeholder, secondary text |
| `--primary-foreground` | `#FFFFFF` | `#FFFFFF` | Text on primary |
| `--secondary-foreground` | `#FFFFFF` | `#1F2937` | Text on secondary |

### 2.4 Sidebar

| Token | Light | Dark |
|-------|-------|------|
| `--sidebar` | `#423846` | `#3B3240` |
| `--sidebar-foreground` | `#E4E4E7` | `#E4E4E7` |
| `--sidebar-foreground-active` | `#FFFFFF` | `#FFFFFF` |
| `--sidebar-accent` | `rgba(77,191,191,0.15)` | `rgba(77,191,191,0.15)` |
| `--sidebar-border` | `rgba(255,255,255,0.1)` | `rgba(255,255,255,0.1)` |

### 2.5 Borders & Inputs

| Token | Light | Dark |
|-------|-------|------|
| `--border` | `#E5E7EB` | `rgba(255,255,255,0.1)` |
| `--input` | `#E5E7EB` | `rgba(255,255,255,0.1)` |
| `--ring` | `#A1D1D5` | `#A1D1D5` |

### 2.6 Status & Functional Colors

#### Semantic Status (dots, badges, trend arrows, alerts)
| Token | Hex | Meaning |
|-------|-----|---------|
| `--status-normal` | `#22c55e` | OK / operational |
| `--status-warning` | `#f59e0b` | Caution |
| `--status-danger` | `#ef4444` | Critical / error |
| `--status-info` | `#3b82f6` | Informational |
| `--status-stale` | `#f97316` | Stale / outdated data |
| `--status-missing` | `#94a3b8` | No data |

Each status has a 10% opacity tint variant (e.g. `--status-danger-bg: rgba(239,68,68,0.10)`).

#### Elegant Status Palette (mb-* tokens — for component tints)
| Token | Light hex | Dark hex | Role |
|-------|-----------|----------|------|
| `--mb-success` | `#84B59F` | `#84B59F` | Success actions |
| `--mb-danger` | `#D67A7A` | `#D67A7A` | Errors, destructive |
| `--mb-warning` | `#E8C064` | `#E8C064` | Warnings |
| `--mb-info` | `#6B9AC4` | `#6B9AC4` | Info |

Light background tints: `--mb-*-light` (e.g. `#E8F1EF` for success).  
Text-on-tint tokens (WCAG AA): `--mb-*-text` (e.g. `#7f1d1d` for danger on light; `#fecaca` on dark).

### 2.7 Badge Palette
| Token | Background | Foreground (light) | Foreground (dark) |
|-------|------------|-------------------|------------------|
| `badge-green` | `#A4DCC6` | `#0d5c38` | `#A4DCC6` |
| `badge-red` | `#E05050` | `#8a1515` | `#E05050` |
| `badge-amber` | `#F4C741` | `#7a5200` | `#F4C741` |
| `badge-blue` | `#337FCA` | `#1a4fa8` | `#337FCA` |
| `badge-sage` | `#C6D8D3` | `#2d5048` | `#C6D8D3` |
| `badge-purple-fg` | — | `#4E4456` | `#c6bece` |

### 2.8 Module Domain Accent Colors
Each app module has a dedicated accent color used for icons, charts, and highlights.

| Module | Token | Hex | Tailwind approx. |
|--------|-------|-----|-----------------|
| Water | `--module-water` | `#3B7ED2` | blue-500 |
| Electricity | `--module-electricity` | `#E8A838` | amber-400 |
| STP Plant | `--module-stp` | `#10B981` | emerald-500 |
| Assets | `--module-assets` | `#8B7F94` | purple-400 |
| Contractors | `--module-contractors` | `#6B9AC4` | sky-400 |
| HVAC | `--module-hvac` | `#E8C064` | amber-300 |
| Pest Control | `--module-pest` | `#84B59F` | teal-400 |
| Fire Safety | `--module-fire` | `#D67A7A` | rose-400 |

### 2.9 Chart Color Palette
| Token | Hex | Usage |
|-------|-----|-------|
| `--chart-1` | `#6B9AC4` | Primary series (sky blue) |
| `--chart-2` | `#A1D1D5` | Secondary series (brand teal) |
| `--chart-3` | `#E8C064` | Tertiary series (amber) |
| `--chart-4` | `#84B59F` | Quaternary series (sage) |
| `--chart-5` | `#4D445D` | Quinary / brand purple |
| `--chart-loss` | `#D67A7A` | Loss / deficit |
| `--chart-success` | `#84B59F` | Gain / surplus |
| `--chart-amber` | `#E8C064` | Warning trend |
| `--chart-gray` | `#9B86A8` | Neutral / inactive series |
| `--chart-axis` | `#6B7280` / `#94A3B8` (dark) | Axis lines and labels |

**Domain-specific chart overrides:**

| Domain | Primary | Secondary |
|--------|---------|-----------|
| Water | `#6B9AC4` | `#A1D1D5` |
| Electricity | `#E8C064` | `#DF9A5B` |
| STP | `#84B59F` | `#A1D1D5` |

**Chart tinted backgrounds:**

| Color | Hex |
|-------|-----|
| Blue | `#EFF6FF` |
| Green | `#F0FDF4` |
| Yellow | `#FEFCE8` |
| Red | `#FEF2F2` |
| Purple | `#FAF5FF` |
| Cyan | `#F0FDFA` |
| Orange | `#FFF7ED` |
| Pink | `#FDF2F8` |

---

## 3. Typography

### Font Family
**Inter** (Google Fonts — variable, latin subset). Chosen for the unified, professional dashboard feel and excellent readability of tabular numbers at small sizes.

```css
font-family: "Inter", ui-sans-serif, system-ui, sans-serif,
             "Apple Color Emoji", "Segoe UI Emoji",
             "Segoe UI Symbol", "Noto Color Emoji";
```

CSS variable: `--font-sans` (loaded once via `next/font/google` in `app/layout.tsx` and exposed through `tailwind.config.ts` `fontFamily.sans` so every `font-sans` class — and every element under `<body>` — inherits it).
Loaded weights: **400, 500, 600, 700, 800**

### Type Scale

| Element | Size | Weight | Line Height | Token |
|---------|------|--------|-------------|-------|
| XS / caption | `12.25px` | — | `20px` | `--font-size-xs` |
| SM / label | `14px` | — | — | `--font-size-sm` |
| Base / body | `14px` | 400 | `21px` | `--font-size-base` |
| LG | `15px` | — | `20px` | `--font-size-lg` |
| XL / H3, H1 | `15.75px` | 600–700 | `24.5px` | `--font-size-xl` |
| Button | `12.25px–14px` | 500 | — | — |

### Heading Rule
All headings (`h1–h6`) use `font-semibold tracking-tight` and take the `--primary` color in light mode, `--foreground` in dark mode.

### KPI Value Rule
KPI numbers on `StatsGrid` tiles use a heavier, larger override so they dominate the tile visually:

| Property | Value |
|----------|-------|
| Size | `text-2xl` (24px) — flat; `text-3xl` was tested but truncated long values like `92,051.5 OMR` on 8-tile grids once the icon claimed its space |
| Weight | `font-semibold` (600) — modern, elegant. 700+ reads heavy/dated on tabular data |
| Color | `--primary` (`#4E4456`) in light · `--foreground` in dark |
| Numerals | `tabular-nums` |
| Line height | `leading-none` |

Colour never shifts to red/green based on the metric — that semantic lives in the trend chip below.

---

## 4. Layout & Spacing

### Shell Dimensions
| Element | Value | Token |
|---------|-------|-------|
| Sidebar expanded | `220px` | `--sidebar-width-expanded` |
| Sidebar collapsed | `72px` | `--sidebar-width-collapsed` |
| Topbar height | `64px` | `--header-height` |
| Main content max-width | `1536px` | `.layout-shell` |
| Card gap | `14px` | — |

### Content Padding (`.layout-shell`)
| Breakpoint | Padding |
|------------|---------|
| Mobile (`< 640px`) | `0.75rem / 0.75rem` |
| Tablet (`≥ 640px`) | `1rem / 1.25rem` |
| Desktop (`≥ 1024px`) | `1rem / 2rem` |
| Large (`≥ 1280px`) | `1.5rem / 2.5rem` |
| XL (`≥ 1536px`) | max-width constraint, auto margin |

### Responsive Breakpoints
| Name | Min-width |
|------|-----------|
| sm | `640px` |
| md | `768px` |
| lg | `1024px` |
| xl | `1280px` |
| 2xl | `1536px` |

### Card Row Spacing
| Breakpoint | Bottom margin |
|------------|--------------|
| Mobile | `24px` |
| Tablet | `28px` |
| Desktop | `32px` |

---

## 5. Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius` / `--radius-lg` | `10.5px` | Cards, modals |
| `--radius-md` | `7px` | Inputs, popovers |
| `--radius-sm` | `5px` | Badges, chips, buttons |

---

## 6. Shadows

### Card Shadows
```css
/* Primary — large cards */
box-shadow: 0px 12px 18px -3px rgba(0,0,0,0.15),
            0px 6px 8px -4px rgba(0,0,0,0.12);

/* Standard — metric / KPI cards */
box-shadow: 0px 6px 10px -1px rgba(0,0,0,0.12),
            0px 3px 6px -2px rgba(0,0,0,0.1);
```

### Elevated Card (`.card-elevated`)
```css
/* Light */
box-shadow: 0 1px 3px 0 rgb(0 0 0/0.1), 0 1px 2px -1px rgb(0 0 0/0.1);
/* Light — hover */
box-shadow: 0 4px 6px -1px rgb(0 0 0/0.1), 0 2px 4px -2px rgb(0 0 0/0.1);

/* Dark */
box-shadow: 0 4px 12px rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.2);
/* Dark — hover */
box-shadow: 0 8px 24px rgba(0,0,0,0.4), 0 4px 8px rgba(0,0,0,0.25);
```

---

## 7. Motion & Transitions

### Standard Easing
```css
--transition-timing: cubic-bezier(0.4, 0, 0.2, 1);
--transition-duration: 0.2s;
```

### Named Utility Classes
| Class | Properties animated |
|-------|-------------------|
| `.transition-design` | color, bg, border, shadow, opacity, transform |
| `.transition-colors-design` | color, bg, border, fill, stroke |

### Page Transitions (View Transitions API)
- **Exit:** 120ms fade-out
- **Enter:** 160ms fade-in + `translateY(4px → 0)` lift
- Disabled under `prefers-reduced-motion`

### Component Animations
| Class | Keyframe | Duration |
|-------|----------|---------|
| `.mb-pulse` | logo breathe (scale 1 → 1.06) | 2.8s infinite |
| `.mb-ring-anim` | expanding ring + fade | 2.2s infinite |
| `.mb-shimmer` | shimmer sweep | 1.9s linear infinite |
| `.mb-spin` | 360° spinner | 0.85s linear infinite |
| `.animate-fade-in-up` | opacity 0→1 + translateY 10→0 | 0.5s |
| `.animate-pulse-dot` | pulsing red dot glow | 2s infinite |

All decorative loops are disabled under `prefers-reduced-motion`.

---

## 8. Component Styles

### Buttons
| Variant | Background | Text | Hover |
|---------|-----------|------|-------|
| Primary | `#4E4456` | `#FFFFFF` | `#3A3341` |
| Secondary | `#A1D1D5` | `#FFFFFF` | — |
| Success | `#84B59F` | `#FFFFFF` | `#6B9A87` |
| Destructive | `#D67A7A` | `#FFFFFF` | `#C06070` |
| Ghost | transparent | inherit | — |

- **Border radius:** `5px`
- **Font weight:** 500
- **Font size:** `12.25px–14px`

### Cards
- **Background:** `#FFFFFF` / dark `#16141B`
- **Border:** `1px solid #E5E7EB` / dark `rgba(255,255,255,0.1)`
- **Border radius:** `10.5px`
- **Shadow:** Standard card shadow (see §6)

### Sidebar
- **Width:** 220px (expanded), 72px (collapsed)
- **Background:** `#423846` (light) / `#3B3240` (dark)
- **Text:** `#E4E4E7`, active `#FFFFFF`
- **Active item accent:** `rgba(77,191,191,0.15)` tint + `#A1D1D5` text
- **Divider / border:** `rgba(255,255,255,0.1)`

### Topbar / Header
- **Height:** 64px
- **Backdrop:** `rgba(255,255,255,0.90)` + `blur(12px)` (light) / `rgba(15,23,42,0.88)` + `blur(12px)` (dark)
- **Class:** `.header-blur`

### Tables (density variants)
| Class | Row padding |
|-------|------------|
| `.table-compact` | `0.25rem` top/bottom |
| `.table-comfortable` | `0.625rem` top/bottom |
| `.table-spacious` | `1rem` top/bottom |

### Icons
- **Library:** Lucide React v1
- **Standard size:** `w-5 h-5` (20px)
- **Color:** inherits from parent

### Focus Ring
```css
focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2
```
Ring color: `#A1D1D5`

### Scrollbar
- **Width:** 10px desktop, 4px mobile
- **Thumb:** `var(--chart-axis)` / hover `var(--muted-foreground)`
- **Track:** transparent (light) / `var(--card)` (dark)

### Tooltip (CSS-only)
- **Background:** `rgba(15,23,42,0.85)`
- **Text:** `#FFFFFF`
- **Font size:** `0.7rem` / weight 500
- **Padding:** `4px 8px` / radius `6px`
- Triggered via `data-tooltip` attribute on hover or `:focus-visible`

---

## 9. CSS Variable Reference

```css
/* Brand */
--primary:             #4E4456;
--primary-foreground:  #FFFFFF;
--secondary:           #A1D1D5;
--secondary-foreground:#FFFFFF;
--accent:              #A1D1D5;

/* Surfaces (light) */
--background:          #F7F8F9;
--card:                #FFFFFF;
--component:           #F0F2F4;
--muted:               #F3F4F6;
--muted-foreground:    #6B7280;
--border:              #E5E7EB;
--ring:                #A1D1D5;
--destructive:         #D67A7A;

/* Layout */
--sidebar-width-expanded:  220px;
--sidebar-width-collapsed:  72px;
--header-height:            64px;

/* Border radius */
--radius:    10.5px;
--radius-lg: 10.5px;
--radius-md:  7px;
--radius-sm:  5px;

/* Motion */
--transition-timing:   cubic-bezier(0.4, 0, 0.2, 1);
--transition-duration: 0.2s;

/* Type */
--font-size-xs:   12.25px;
--font-size-sm:   14px;
--font-size-base: 14px;
--font-size-lg:   15px;
--font-size-xl:   15.75px;
```

---

## 10. Accessibility

| Pairing | Contrast | WCAG level |
|---------|----------|-----------|
| Primary `#4E4456` on white | 6.3:1 | AA ✓ |
| Body text `#0A0A0A` on white | ~19:1 | AAA ✓ |
| Focus ring `#A1D1D5` (paired with offset) | — | AA ✓ |
| Status text tokens on their tinted bg | 8–10:1 | AA ✓ |

- All interactive elements expose `focus-visible` ring
- `.visually-hidden` utility for screen-reader-only text
- Reduced-motion preference respected for all decorative animations
- Touch scrollbar reduces to 4px on mobile (`max-width: 640px`)

---

## 11. PWA Configuration

| Property | Value |
|----------|-------|
| Display | `standalone` |
| Background color | `#0f172a` |
| Theme color | `#0f172a` |
| Start URL | `/` |
| Scope | `/` |
| Icons | 192×192, 512×512 PNG |

---

*Source files: [`app/globals.css`](muscatbay/app/app/globals.css) · [`DESIGN_SYSTEM.md`](muscatbay/app/DESIGN_SYSTEM.md) · [`app/layout.tsx`](muscatbay/app/app/layout.tsx)*
