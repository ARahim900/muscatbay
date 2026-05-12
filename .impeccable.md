# Impeccable Design Context — Muscat Bay Operations Dashboard

> Authoritative brand & token spec: [`BRAND_DESIGN.md`](./BRAND_DESIGN.md) · [`DESIGN_SYSTEM.md`](./muscatbay/app/DESIGN_SYSTEM.md) · [`globals.css`](./muscatbay/app/app/globals.css)
> When this file and `BRAND_DESIGN.md` disagree, `BRAND_DESIGN.md` wins.

## Design Context

### Users
- **Primary**: Operations staff and facility/asset managers at Muscat Bay monitoring water, electricity, STP, assets, contractors, HVAC, pest control, and fire safety.
- **Secondary**: Executives reviewing high-level KPIs on the dashboard.
- **Field**: Engineers and supervisors on tablets, occasionally on mobile, sometimes in gloves and outdoor lighting.
- **Context**: Mostly on-site via laptop/tablet in control rooms and offices, including long night-shift sessions. Live data via Supabase — assume real users, not demos.
- **Job to be done**: Monitor utilities across modules, spot anomalies fast, track assets/contractors, and make data-driven decisions without switching tools.

### Brand Personality
- **Three words**: Professional, reliable, modern.
- **Voice & tone**: Serious operations tool — not a marketing site, not a gaming dashboard. Closer in language to industrial BMS dashboards (Siemens Desigo, Schneider EcoStruxure) than to SaaS landing pages.
- **Emotional goals**:
  - **Confidence & trust** — data looks reliable, stable, and consistent across pages.
  - **Calm control** — even during critical events, the layout stays clean and structured, never chaotic.
  - **Low-key urgency** — alarms use red badges and clear alert banners without overwhelming the rest of the UI.

### Aesthetic Direction
- **Visual tone**: Clean enterprise dashboard — flat, minimal, focused on data. Reference: Grafana, Linear, Azure Portal-style cards, modern BMS web HMIs.
- **Anti-references**: No playful neon, heavy gradients, sales/marketing aesthetics, or dense SCADA mimic panels with too many tiny icons. No per-module visual identities competing with each other.
- **Theme**: Dark mode is primary (control rooms, night shifts, long sessions). Light mode is first-class for executives and daytime office use — both are production-grade.
- **Cross-module consistency** is non-negotiable: water, electricity, STP, assets, contractors, HVAC, pest control, and fire safety must look like pages of one app, not seven different apps. Module accent colors (see §2.8 of `BRAND_DESIGN.md`) are limited to icons, chart series, and small highlights — never to wholesale page chrome.

### Design Principles

1. **Data first, decoration never** — every visual element must serve the data. No ornamental gradients, illustrations, or flourishes. If it doesn't help the operator understand status faster, remove it.

2. **Calm by default, urgent only when earned** — the UI feels steady and controlled. Reserve red, animation, and elevated visual weight for genuine alarms. Normal state is quiet confidence.

3. **One system, many modules** — every module reuses the same `DataTable`, `StatsGrid`, `PageHeader`, `Breadcrumbs`, `TabNavigation`, card style, spacing scale, typography, and interaction patterns. New module ≠ new design — only new data. Per-module accent color is a small highlight, not a re-skin.

4. **Tokens, never hex** — colors, radii, spacing, and shadows must come from CSS variables / Tailwind tokens defined in `globals.css`. Inline hex codes in components are a bug. Status uses `--status-*` tokens; charts use `--chart-*` and `--module-*` tokens.

5. **Accessible in the field** — generous touch targets for tablet/glove use. Never rely on color alone for status — pair with icons (check/triangle/circle) and text labels. Meet WCAG AA contrast in both themes. Respect `prefers-reduced-motion`. Plan for RTL (Arabic).

6. **Equally readable in light and dark** — both themes ship. Dark is biased for control rooms; light for executive/office use. Neither is an afterthought, and both must pass contrast on every KPI, chart axis, and badge.

---

## Tokens at a Glance

> Full spec in [`BRAND_DESIGN.md`](./BRAND_DESIGN.md). Always read tokens from CSS variables — these values are the contract.

### Brand Core
| Token | Hex | Role |
|-------|-----|------|
| `--primary` | `#4E4456` | Sidebar, topbar, buttons, headings |
| `--mb-primary-hover` | `#3A3341` | Primary hover |
| `--secondary` / `--accent` | `#A1D1D5` | CTAs, focus rings, highlights (soft teal) |
| `--mb-secondary-active` | `#8AAFA5` | Active/pressed teal |

### Surfaces
| Token | Light | Dark |
|-------|-------|------|
| `--background` | `#F7F8F9` | `#0A090C` |
| `--card` | `#FFFFFF` | `#16141B` |
| `--component` | `#F0F2F4` | `#16141B` |
| `--muted` | `#F3F4F6` | `#22202A` |
| `--border` | `#E5E7EB` | `rgba(255,255,255,0.1)` |
| `--ring` | `#A1D1D5` | `#A1D1D5` |

### Text
| Token | Light | Dark |
|-------|-------|------|
| `--foreground` | `#0A0A0A` | `#F1F5F9` |
| `--muted-foreground` | `#6B7280` | `#9CA3AF` |

### Status (with icons + labels, never color alone)
| Token | Hex | Meaning |
|-------|-----|---------|
| `--status-normal` | `#22C55E` | OK / operational |
| `--status-warning` | `#F59E0B` | Caution |
| `--status-danger` | `#EF4444` | Critical |
| `--status-info` | `#3B82F6` | Informational |
| `--status-stale` | `#F97316` | Stale data |
| `--status-missing` | `#94A3B8` | No data |

### Module Accents (icons & chart series only — not page chrome)
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

### Typography
- **Font family**: **Inter** (variable, weights 400/500/600/700/800) via `--font-sans`. Loaded once in `app/layout.tsx` via `next/font/google` and exposed through `tailwind.config.ts` `fontFamily.sans` so every Tailwind `font-sans` class resolves to it. Do not re-declare `font-family` anywhere else.
- **Body**: `14px` / 400 / `21px` line-height.
- **Headings**: `15–15.75px` / 600–700 / `tracking-tight`, color `--primary` in light, `--foreground` in dark.
- **Buttons**: `12.25–14px` / 500.

### Layout & Shell
| Element | Value |
|---------|-------|
| Sidebar expanded | `220px` |
| Sidebar collapsed | `72px` |
| Topbar height | `64px` |
| Content max-width | `1536px` (`.layout-shell`) |
| Card gap | `14px` |

### Radius
| Token | Value |
|-------|-------|
| `--radius` / `--radius-lg` | `10.5px` (cards, modals) |
| `--radius-md` | `7px` (inputs, popovers) |
| `--radius-sm` | `5px` (badges, chips, buttons) |

### Motion
- Easing: `cubic-bezier(0.4, 0, 0.2, 1)`; default duration `0.2s`.
- Page transitions via View Transitions API: 120ms exit / 160ms enter + 4px lift.
- All decorative loops disabled under `prefers-reduced-motion`.

---

## Shared Components — Use These, Don't Rebuild

When building or fixing any module page, reach for these first. Inconsistency almost always traces back to a one-off table or KPI card instead of the shared primitive.

| Need | Component | Path |
|------|-----------|------|
| Tabular data | `DataTable` | `components/shared/data-table/` |
| KPI tiles | `StatsGrid` | `components/shared/stats-grid.tsx` |
| Page header / title | `PageHeader` | `components/shared/` |
| Route-aware crumbs | `Breadcrumbs` | `components/shared/` |
| Tab switcher | `TabNavigation` | `components/shared/` |
| Charts | `components/charts/` | Recharts wrappers |
| Class merge | `cn()` | `@/lib/utils` |
| Icons | `lucide-react` | Named imports, `w-5 h-5` default |

If a module is rendering its own bespoke table, KPI card, or header, that's a normalization bug — fold it back into the shared primitive instead of forking.

---

## Accessibility Floor (non-negotiable)
- **WCAG AA** contrast on all KPIs, badges, chart axis labels, and buttons in both themes.
- **Never color-only** — pair status color with icon + short text label.
- **Touch targets** ≥ 44×44px for primary actions; comfortable spacing for gloved tablet use.
- **`prefers-reduced-motion`** disables decorative loops (logo pulse, shimmer, ring) and page transitions.
- **RTL-aware** — direction-agnostic flex/grid, mirrored icons where semantic, nav and chart legends flip cleanly.
- **Focus-visible ring** on every interactive element (`#A1D1D5`, 2px, with offset).

---

## Tech Stack Reference
- **Framework**: Next.js 16 (App Router) · React 19 · TypeScript 5.
- **Styling**: Tailwind CSS 4, CSS variables in `app/globals.css`, `cn()` for conditional merge.
- **UI primitives**: shadcn/ui (base-vega) in `components/ui/`.
- **Charts**: Recharts 3 wrappers in `components/charts/`.
- **Icons**: Lucide React (named imports).
- **Animation**: GSAP for scroll choreography; CSS for everything else. Subtle, gated on reduced-motion.
- **Data**: Supabase (live, not demo) via `@supabase/ssr`, server actions in `actions/`, API helpers in `functions/api/`.

---

*Loaded automatically by Impeccable skills. To refresh, run `/teach-impeccable` again.*
