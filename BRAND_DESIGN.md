# Muscat Bay — Brand & Design System

> ⚠️ **SUPERSEDED on 2026-09-02 by [`/DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) (v2.0).**
> That file is now the only design reference for the app; this document is kept
> for history and must not be used to make design decisions. Where the two
> disagree, `/DESIGN_SYSTEM.md` wins.

> **App:** Muscat Bay Operations Dashboard  
> **URL:** [muscatbay.live](https://muscatbay.live)  
> **Purpose:** Utility management and operations monitoring platform for Muscat Bay  
> **Stack:** Next.js 16 · React 19 · TypeScript 5 · Tailwind CSS 4 · Supabase  
> **Last curated review:** 2026-08-30 — sections 2 (Color System) and 3
> (Typography) re-derived from `app/globals.css` and `app/layout.tsx`. See
> *How to keep this file true* at the top of section 2.

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
Paths are given as **served URLs**. Note that `favicon.ico`, `icon.png` and
`apple-icon.png` are *not* in `public/` — they sit in `muscatbay/app/app/` as
Next.js file-convention icons and are served from the site root from there.

| Asset | Served at | On disk | Size |
|-------|-----------|---------|------|
| Primary logo (brand mark) | `/logo.png` | `muscatbay/app/public/logo.png` | — |
| Same file, legacy name | `/mb-logo.png` | `muscatbay/app/public/mb-logo.png` | — |
| Mark on frame | `/brand/mark-frame.png` | `muscatbay/app/public/brand/mark-frame.png` | — |
| Favicon | `/favicon.ico` | `muscatbay/app/app/favicon.ico` | any |
| PNG icon | `/icon.png` | `muscatbay/app/app/icon.png` | 32×32 |
| Apple icon (route) | `/apple-icon.png` | `muscatbay/app/app/apple-icon.png` | 180×180 |
| Apple touch icon (linked) | `/icons/apple-touch-icon-180x180.png` | `muscatbay/app/public/icons/` | 180×180 |
| PWA icon | `/icons/icon-192x192.png` | `muscatbay/app/public/icons/` | 192×192 |
| PWA icon | `/icons/icon-512x512.png` | `muscatbay/app/public/icons/` | 512×512 |
| PWA icon (maskable) | `/icons/icon-192x192-maskable.png` · `/icons/icon-512x512-maskable.png` | `muscatbay/app/public/icons/` | 192 · 512 |
| OG image | `/og-image.png` | `muscatbay/app/public/og-image.png` | 1200×630 |

`logo.png` and `mb-logo.png` are byte-identical copies of the same mark. **All
app code references `/logo.png`** — the sidebar, splash screen, loading overlay,
the auth brand lockup, and the service worker precache list. `/mb-logo.png` is
kept only because older docs and the service-worker history reference that name;
do not introduce new references to it.

---

## 2. Color System

> **How to keep this file true.** Sections 2 and 3 are *derived*: every hex,
> token name and font below was read out of
> [`muscatbay/app/app/globals.css`](muscatbay/app/app/globals.css) and
> [`muscatbay/app/app/layout.tsx`](muscatbay/app/app/layout.tsx). The CSS is the
> source of truth; this file is a description of it. **Change a token and update
> this file in the same PR** — a stale brand doc is worse than no brand doc,
> because someone implements from it. The last drift cost the app a documented
> WCAG failure: the doc claimed white text on brand teal (1.67:1) while the code
> had already fixed it to `#1F2937` (8.81:1).
>
> Two frameworks are in play and they are not the same thing:
> **MB-BDF v1.0** = the *Muscat Bay Brand & Design Framework v1.0* (the company
> brand document), and **the app** = what `globals.css` actually ships. Where
> they differ, the table says so and gives the reason. Nothing below diverges
> silently.

### 2.1 Brand Core

| Token | Hex | RGB | Role |
|-------|-----|-----|------|
| `--primary` | `#4E4456` | `78 68 86` | Deep purple. Sidebar/topbar fill, table header band, headings (light), buttons. MB-BDF v1.0 value verbatim. 9.19:1 on `--card`, 8.64:1 on `--background`. |
| `--primary-foreground` | `#FFFFFF` | `255 255 255` | Text/icons on `--primary`, both themes |
| `--mb-primary` | `#4D445D` | `77 68 93` | **Diverges from MB-BDF v1.0** (`#4E4456`). Legacy auth-page purple, one step cooler and lighter. Kept because auth screens and several chart series (`--chart-5`, `--chart-brand`, `--chart-inlet`) still read it; not a second brand purple — treat as pending consolidation onto `--primary`. |
| `--mb-primary-hover` | `#3A3341` | `58 51 65` | Hover on the legacy purple |
| `--mb-primary-light` | `#6B5F73` | `107 95 115` | Lighter purple tint (light); `#8b7f94` in dark |
| `--secondary` / `--accent` | `#A1D1D5` | `161 209 213` | The single accent: CTAs, selection/row tints, glow, dark-mode focus ring. **Open decision — see below.** |
| `--secondary-foreground` / `--accent-foreground` | `#1F2937` | `31 41 55` | Text on the teal accent, **both themes**. 8.81:1 on `#A1D1D5`. Never `#FFFFFF` — that pairing is 1.67:1 and fails AA outright. |
| `--mb-secondary` | `#A1D1D5` | `161 209 213` | Same teal, auth/legacy call sites |
| `--mb-secondary-foreground` | `#1F2937` | `31 41 55` | Text on `--mb-secondary`, both themes |
| `--mb-secondary-light` | `#E8F1EF` | — | Tinted teal background (light); `rgba(77,191,191,0.12)` in dark |
| `--mb-secondary-active` | `#7BB6BA` | `123 182 186` | Active/pressed teal, both themes |
| `--destructive` | `#D67A7A` | `214 122 122` | Destructive actions, both themes. MB-BDF v1.0 danger hue verbatim. |
| `--destructive-foreground` | `#FFFFFF` | — | Light theme only; dark inherits it |

> **⚠ Open decision for Rahim — which teal is brand teal?**
> MB-BDF v1.0 specifies sage teal **`#A4C5BB`** as the single accent. The app
> ships **`#A1D1D5`** everywhere (`--secondary`, `--accent`, `--mb-secondary`,
> `--chart-2`, the dark-mode `--ring`), and the codebase documents that value as
> **sampled directly from the cyan-teal slashes in the logo mark** so the UI and
> the logo stay in lockstep.
>
> This file does **not** assert that either is correct. They are visibly
> different hues — `#A1D1D5` is cooler and cyan-leaning, `#A4C5BB` is greener —
> so this is a brand call, not a code cleanup. Two coherent resolutions:
> **(a)** retune the app to `#A4C5BB` and accept the logo/UI mismatch, or
> **(b)** amend MB-BDF v1.0 to record `#A1D1D5` as the sampled brand teal.
> Until Rahim rules, the code stays as-is and this note stays here.
> Whichever wins, `--secondary-foreground` remains `#1F2937`: `#A4C5BB` is a
> light field too, and white on it fails AA just as badly.

### 2.2 Backgrounds & Surfaces

#### Light Mode
| Token | Hex | Role |
|-------|-----|------|
| `--background` | `#F7F8F9` | Page background |
| `--card` | `#FFFFFF` | Card surfaces |
| `--component` | `#F0F2F4` | Inner component surfaces |
| `--muted` | `#F3F4F6` | Neutral backgrounds |
| `--popover` | `#FFFFFF` | Popover / dropdown |

#### Dark Mode
| Token | Hex | Role |
|-------|-----|------|
| `--background` | `#0A090C` | Page background (warm near-black, ~1% purple tint — never blue slate) |
| `--card` | `#16141B` | Lifted surface |
| `--component` | `#16141B` | Inner surfaces |
| `--muted` | `#22202A` | Muted areas |
| `--popover` | `#16141B` | Popover / dropdown |

#### Dark Surface Remap (unlayered overrides)
~49 feature components still carry `dark:bg-slate-*` / `dark:border-slate-*`
classes. Rather than rewrite them all, `globals.css` remaps those utilities to
the warm near-black family in an **unlayered** block at the end of the file, so
the rules outrank Tailwind's own layered output regardless of source order.

| Tailwind class | Remapped hex | Role |
|----------------|-------------|------|
| `dark:bg-slate-950` | `#0A090C` | → `--background` |
| `dark:bg-slate-900` | `#16141B` | → `--card` |
| `dark:bg-slate-800` | `#1E1C26` | Elevated surface |
| `dark:bg-slate-700` | `#2A2733` | Hover / highlight |

Opacity variants (`/20`–`/80`) and the hover forms resolve to the `rgba()` of
the same four bases. `dark:border-slate-*` remaps to white hairlines at
5–16% alpha, not to a coloured border.

### 2.3 Foreground & Text

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--foreground` | `#0A0A0A` | `#F1F5F9` | Body text |
| `--card-foreground` | `#0A0A0A` | `#F1F5F9` | Card text |
| `--popover-foreground` | `#0A0A0A` | `#F1F5F9` | Popover text |
| `--component-foreground` | `#0A0A0A` | `#F1F5F9` | Inner-surface text |
| `--muted-foreground` | `#5D6976` | `#9CA3AF` | Placeholder, secondary text, `.meter` cells |
| `--primary-foreground` | `#FFFFFF` | `#FFFFFF` | Text on `--primary` |
| `--secondary-foreground` | `#1F2937` | `#1F2937` | Text on `--secondary` / `--accent` |
| `--text-zinc-200` | `#E4E4E7` | `#E4E4E7` | Fixed light ink for always-dark chrome |

- **`--muted-foreground` diverges from MB-BDF v1.0** (`#6B7280`) in light mode
  only. `#6B7280` is below AA for secondary text on the app's muted surfaces, so
  the value is darkened to `#5D6976` (~5.0:1 on `--muted`, ~5.2:1 on
  `--background`). The framework grey survives untouched in three places where
  it *is* correct: `--status-missing`, `--chart-axis`, and the print override.
- **`--secondary-foreground` is `#1F2937` in both themes**, not `#FFFFFF`.
  The teal is a light field in dark mode too, so the ink must stay dark.

### 2.4 Sidebar

The sidebar stays dark purple in **both** themes, so most of these tokens do not
flip — only `--sidebar` itself has a dark-mode value.

| Token | Light | Dark | Role |
|-------|-------|------|------|
| `--sidebar` | `#423846` | `#3B3240` | Rail fill — a step darker than `--primary` so the sidebar reads as its own zone against the topbar without a harsh jump |
| `--sidebar-foreground` | `#E4E4E7` | `#E4E4E7` | Idle nav label |
| `--sidebar-foreground-active` | `#FFFFFF` | `#FFFFFF` | Active nav label |
| `--sidebar-primary` | `#FFFFFF` | `#FFFFFF` | Active item fill |
| `--sidebar-primary-foreground` | `#4D445D` | `#4D445D` | Ink on that fill |
| `--sidebar-accent` | `rgba(77,191,191,0.15)` | `rgba(77,191,191,0.15)` | Hover/active tint |
| `--sidebar-accent-foreground` | `#FFFFFF` | `#FFFFFF` | Ink on the accent tint |
| `--sidebar-border` | `rgba(255,255,255,0.1)` | `rgba(255,255,255,0.1)` | Rail hairlines |
| `--sidebar-danger` | `#E09090` | `#E09090` | Destructive nav action; ~4.5:1 on `#423846` |

Layout constants live alongside them: `--sidebar-width-collapsed: 72px`,
`--sidebar-width-expanded: 220px`, `--header-height: 64px`.

### 2.5 Borders, Inputs & Focus Ring

| Token | Light | Dark | Role |
|-------|-------|------|------|
| `--border` / `--border-light` | `#E5E7EB` | `rgba(255,255,255,0.1)` | 1px hairlines, never coloured |
| `--input` | `#E5E7EB` | `rgba(255,255,255,0.1)` | Input borders |
| `--ring` | `#4A8E93` | `#A1D1D5` | Focus indicator |

**`--ring` in light mode diverges from brand teal on purpose.** `#A1D1D5` is far
too light to serve as a focus indicator on `#F7F8F9`/`#FFFFFF` — it misses the
WCAG 1.4.11 non-text floor of 3:1. The light theme therefore uses a deepened
teal of the same family, `#4A8E93` (~3.5:1 on `--background`, ~3.8:1 on
`--card`); dark mode keeps brand teal `#A1D1D5` (~11:1 on `#0A090C`), where it
is already high-contrast. Focus styling reads `--ring`, **never** `--secondary`,
so each theme gets a compliant indicator from one rule.

### 2.6 Status & Functional Colors

Status colour was retuned on **2026-08-30** off Tailwind's crayon primaries
(`#22c55e`, `#f59e0b`, `#ef4444`, `#3b82f6`, `#94a3b8`, `#f97316`) and onto the
MB-BDF v1.0 hues. Two of the old values failed WCAG 1.4.11 outright — `#22c55e`
on `--mb-success-light` was 1.98:1 and `#f59e0b` on `--mb-warning-light` was
1.96:1, against a 3:1 floor. **The token names did not change**, so every
existing `var(--status-*)` call site was fixed at the token layer.

**One hue cannot do all three jobs.** The framework hues are deliberately soft,
and soft on white is not readable (`#84B59F` on `#FFFFFF` is 2.31:1, `#E8C064`
is 1.73:1). So the palette is tiered:

| Tier | Token shape | Use for | Contrast job |
|------|-------------|---------|--------------|
| **Field** | `--status-*-field` | Bar/area fills, progress bars, legend swatches, filled pills | Carried by the area's size and its adjacent label |
| **Icon / stroke** | `--status-*` (bare) | Glyphs, status dots, thin chart strokes, reference lines, 1–2px marks | ≥3:1 (WCAG 1.4.11 non-text) |
| **Tint** | `--status-*-bg` | Callout / cell backgrounds | Surface only, carries no meaning alone |
| **Text** | `--mb-*-text` | Any *text* on a status tint | ≥4.5:1 (WCAG 1.4.3) |

Text is a fourth job and neither colour tier does it — 3:1 is the graphic floor,
text needs 4.5:1. **Colour status text with `--mb-*-text`, never with
`--status-*` or `--mb-*`.**

#### Field tier — MB-BDF v1.0 hues verbatim
| Token | Light | Dark |
|-------|-------|------|
| `--status-normal-field` | `#84B59F` | `#84B59F` |
| `--status-warning-field` | `#E8C064` | `#E8C064` |
| `--status-danger-field` | `#D67A7A` | `#D67A7A` |
| `--status-info-field` | `#6B9AC4` | `#6B9AC4` |
| `--status-stale-field` | `#C79A3F` | `#C79A3F` |
| `--status-missing-field` | `#6B7280` | `#9CA3AF` |

#### Icon / stroke tier — the default
Derived from the *same* framework hue by holding hue and saturation in HLS and
lowering lightness until the colour clears 3:1 against **both** `#FFFFFF` and
its matching `--mb-*-light` tint. No new hues were invented. On the near-black
dark surfaces the opposite is true — the framework hues are already light
enough, so the two tiers converge and the hues are used verbatim.

| Token | Light | On `#FFFFFF` | On its tint | Dark | On `#16141B` |
|-------|-------|--------------|-------------|------|--------------|
| `--status-normal` | `#579077` | 3.71:1 | 3.23:1 | `#84B59F` | 7.91:1 |
| `--status-warning` | `#AE811A` | 3.53:1 | 3.22:1 | `#E8C064` | 10.57:1 |
| `--status-danger` | `#C86565` | 3.81:1 | 3.24:1 | `#D67A7A` | 6.02:1 |
| `--status-info` | `#5889B5` | 3.71:1 | 3.23:1 | `#6B9AC4` | 6.13:1 |
| `--status-stale` | `#8A6A2C` | 5.03:1 | — | `#C79A3F` | 7.06:1 |
| `--status-missing` | `#6B7280` | 4.83:1 | — | `#9CA3AF` | 7.19:1 |

**`stale` and `missing` have no framework hue** — MB-BDF v1.0 defines four
status colours, not six. `missing` takes the framework's neutral text grey
`#6B7280` (unknown must read as neutral, never as a severity). `stale` stays in
the warning family as a quieter, deeper amber, so a stale reading never shouts
louder than a live warning. The pair is separated at every call site by icon and
label, per the app's standing *status is never colour-only* rule.

#### Tint tier
`--status-*-bg` is the **field** hue at 12% alpha — alpha, not a baked hex, so
one definition works over the light card *and* the dark card. These are
deliberately **not** overridden in `.dark`.

| Token | Value |
|-------|-------|
| `--status-normal-bg` | `rgba(132,181,159,0.12)` |
| `--status-warning-bg` | `rgba(232,192,100,0.12)` |
| `--status-danger-bg` | `rgba(214,122,122,0.12)` |
| `--status-info-bg` | `rgba(107,154,196,0.12)` |
| `--status-stale-bg` | `rgba(199,154,63,0.12)` |
| `--status-missing-bg` | `rgba(107,114,128,0.12)` |

All three tiers are also exposed as Tailwind utilities —
`text-status-danger`, `bg-status-danger-field`, `bg-status-danger-bg`. Existing
`[var(--status-*)]` arbitrary-value call sites keep working; **new code should
use the named utilities.**

#### Elegant status palette (`--mb-*` — component tints and text)
| Token | Light | Dark | Role |
|-------|-------|------|------|
| `--mb-success` | `#84B59F` | `#84B59F` | Success fill |
| `--mb-success-hover` | `#6B9A87` | `#9DCAB6` | Hover |
| `--mb-success-light` | `#E8F1EF` | `rgba(132,181,159,0.12)` | Tint |
| `--mb-danger` | `#D67A7A` | `#D67A7A` | Error fill |
| `--mb-danger-hover` | `#C06070` | `#E09090` | Hover |
| `--mb-danger-light` | `#F5EAEA` | `rgba(214,122,122,0.12)` | Tint |
| `--mb-warning` | `#E8C064` | `#E8C064` | Warning fill |
| `--mb-warning-light` | `#FBF4E3` | `rgba(232,192,100,0.12)` | Tint |
| `--mb-info` | `#6B9AC4` | `#6B9AC4` | Info fill |
| `--mb-info-light` | `#EAF0F7` | `rgba(107,154,196,0.12)` | Tint |
| `--mb-stale` | `#f97316` | `#f97316` | **Diverges from MB-BDF v1.0** — the last Tailwind crayon orange left in the palette, surviving only in this legacy tier. The `--status-stale` path (`#C79A3F` / `#8A6A2C`) is the retuned one; prefer it. |
| `--mb-stale-light` | `rgba(249,115,22,0.10)` | `rgba(249,115,22,0.12)` | Tint |

#### Text-on-tint tokens (`--mb-*-text`)
The only tokens sanctioned for **status text**. They flip to light values in
dark mode. Not framework colours — they are contrast-derived ink, chosen to
clear AA on the matching tint (≥8:1 light, ≥12:1 on `--card` in dark).

| Token | Light | Dark |
|-------|-------|------|
| `--mb-success-text` | `#064e3b` | `#a7f3d0` |
| `--mb-danger-text` | `#7f1d1d` | `#fecaca` |
| `--mb-warning-text` | `#78350f` | `#fde68a` |
| `--mb-info-text` | `#1e3a5f` | `#bfdbfe` |
| `--mb-stale-text` | `#7c2d12` | `#fdba74` |

### 2.7 Badge Palette
Single source of truth for `StatusBadge` and the level-hierarchy badges. In dark
mode the foreground flips to the badge colour itself, so badges read as tinted
text rather than filled chips.

| Token | Background | Foreground (light) | Foreground (dark) |
|-------|------------|-------------------|------------------|
| `--badge-green` | `#A4DCC6` | `#0d5c38` | `#A4DCC6` |
| `--badge-red` | `#E05050` | `#8a1515` | `#E05050` |
| `--badge-amber` | `#F4C741` | `#7a5200` | `#F4C741` |
| `--badge-blue` | `#337FCA` | `#1a4fa8` | `#337FCA` |
| `--badge-sage` | `#C6D8D3` | `#2d5048` | `#C6D8D3` |
| `--badge-purple-fg` | — | `#4E4456` | `#c6bece` |

**Diverges from MB-BDF v1.0.** Only `--badge-purple-fg` is a framework hue. The
five badge fills are more saturated than the framework's status palette — they
predate the 2026-08-30 status retune and were **not** included in it, because
badges are filled chips carrying their own dark ink rather than marks judged
against the page. Worth a deliberate pass to bring them onto the framework hues;
not yet done.

### 2.8 Module Domain Accent Colors
One accent per module, used for **icons and chart series only** — never for page
chrome, per the *one system, many modules* principle.

| Module | Token | Hex | vs MB-BDF v1.0 |
|--------|-------|-----|----------------|
| Water | `--module-water` | `#3B7ED2` | **Diverges** — framework water is `#6B9AC4` (which the app does use for `--chart-water-primary`, `--status-info-field` and `--module-contractors`). The module accent is a stronger blue so a water icon reads at 16px. |
| Electricity | `--module-electricity` | `#E8A838` | **Diverges** — framework electricity is `#E8C064`; this is the same amber pushed deeper for icon legibility. |
| STP Plant | `--module-stp` | `#10B981` | **Diverges** — framework STP is `#84B59F`. `#10B981` is a saturated emerald outside the framework palette; the strongest candidate for retuning. |
| Assets | `--module-assets` | `#8B7F94` | No framework value (muted purple, in the brand family) |
| Contractors | `--module-contractors` | `#6B9AC4` | Framework info hue verbatim |
| HVAC | `--module-hvac` | `#E8C064` | **Diverges** — framework HVAC is `#9B86A8` (mauve). The app uses the framework's *electricity* amber here, so HVAC and electricity are not distinguishable by colour alone. Flagged for a decision. |
| Pest Control | `--module-pest` | `#84B59F` | Framework STP/success hue verbatim |
| Fire Safety | `--module-fire` | `#D67A7A` | Framework danger hue verbatim |

### 2.9 Chart Color Palette

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--chart-1` | `#6B9AC4` | — | Primary series (sky blue) |
| `--chart-2` | `#A1D1D5` | — | Secondary series (brand teal) |
| `--chart-3` | `#E8C064` | — | Tertiary series (amber) |
| `--chart-4` | `#84B59F` | — | Quaternary series (sage) |
| `--chart-5` | `#4D445D` | `#8B7F94` | Quinary / brand purple |
| `--chart-inlet` | `#4D445D` | `#9B8FA6` | Inlet / total series |
| `--chart-loss` | `#D67A7A` | — | Loss / deficit |
| `--chart-success` | `#84B59F` | — | Gain / surplus |
| `--chart-teal` | `#A1D1D5` | — | Teal series alias |
| `--chart-brand` | `#4D445D` | — | Brand series alias |
| `--chart-amber` | `#E8C064` | — | Warning trend |
| `--chart-gray` | `#9B86A8` | — | Neutral / inactive series (framework HVAC mauve) |
| `--chart-axis` | `#6B7280` | `#94A3B8` | Axis lines and labels; also the light-mode scrollbar thumb |

A dash means the light value is used in both themes (no `.dark` override).

**Domain-specific series:**

| Domain | Primary | Secondary | Accent |
|--------|---------|-----------|--------|
| Water | `#6B9AC4` | `#A1D1D5` | `#A1D1D5` |
| Electricity | `#E8C064` | `#DF9A5B` | `#E8C064` |
| STP | `#84B59F` | `#A1D1D5` | `#84B59F` |

**Zone series** (`--chart-zone-a` … `-f`), for per-zone comparisons:
`#6B9AC4` · `#8B7AB5` · `#84B59F` · `#E8C064` · `#D67A7A` · `#A1D1D5`.

**Recharts overlays** — theme-aware, so cursors and grids never punch through
the near-black surfaces:

| Token | Light | Dark |
|-------|-------|------|
| `--chart-cursor-stroke` | `rgba(15,23,42,0.10)` | `rgba(255,255,255,0.12)` |
| `--chart-cursor-fill` | `rgba(15,23,42,0.04)` | `rgba(255,255,255,0.06)` |
| `--chart-grid` | `rgba(148,163,184,0.25)` | `rgba(148,163,184,0.18)` |

**Chart tinted backgrounds** — KPI-tile washes, overridden in dark mode because
the light pastels wash out and clash against `#16141B`/`#0A090C`. The dark
values are deep, low-chroma tints (~12–17% lightness) that sit just above the
card while keeping the hue association. **Diverges from MB-BDF v1.0**: these
eight pastels are Tailwind's `-50` steps, not framework colours; they predate
the framework and are surface washes rather than data ink.

| Colour | Light | Dark |
|--------|-------|------|
| Blue | `#EFF6FF` | `#131A26` |
| Green | `#F0FDF4` | `#121E18` |
| Yellow | `#FEFCE8` | `#201D11` |
| Red | `#FEF2F2` | `#231314` |
| Purple | `#FAF5FF` | `#1B1422` |
| Cyan | `#F0FDFA` | `#11201F` |
| Orange | `#FFF7ED` | `#221A11` |
| Pink | `#FDF2F8` | `#221320` |

### 2.10 Table Surface Tokens

The unified table system derives its surfaces with `color-mix()` from the tokens
above rather than baking hexes, so retuning `--card`, `--border`, `--muted` or
`--secondary` retunes every ledger in the app.

| Token | Light | Dark |
|-------|-------|------|
| `--hairline` | `color-mix(in srgb, var(--border) 55%, transparent)` | `…70%, transparent` |
| `--header-band` | `color-mix(in srgb, var(--card) 96%, var(--muted))` | `…88%, var(--muted)` |
| `--row-hover` | `color-mix(in srgb, var(--secondary) 8%, transparent)` | `…7%, transparent` |
| `--row-zebra` | `color-mix(in srgb, var(--card) 93%, var(--muted))` | same |

`--header-band` is currently **defined but unreferenced** — `.ops-table thead th`
is a solid `--primary` fill with `--primary-foreground` ink in both themes, which
is the app's one large solid brand field besides the sidebar. Row selection is
`--secondary` at 12% (16% when also hovered).

---

## 3. Typography

### Font Family

**Inter** (UI/body/headings) with **Geist Mono** for genuine mono content. Both
are loaded once via `next/font/google` in
[`app/layout.tsx`](muscatbay/app/app/layout.tsx) and exposed to Tailwind through
the `@theme inline` block in `globals.css`. **Never re-declare `font-family`
anywhere else.**

| Role | Face | CSS variable | Tailwind | Applied by |
|------|------|-------------|----------|-----------|
| Body / UI / headings | **Inter** | `--font-sans` | `font-sans` | `body { @apply font-sans }` — everything inherits |
| Mono | **Geist Mono** | `--font-mono` | `font-mono` | the `.meter` rule (meter IDs, account numbers) |

Both are loaded as **variable fonts (100–900)** with `display: "swap"` and the
`latin` subset, so `font-medium` (500), `font-semibold` (600), `font-bold`
(700), `font-extrabold` (800) and `font-black` (900) all render real weights —
nothing synthesises a faux weight. Inter is additionally loaded with its
**`opsz` optical-size axis (14–32)**: browsers interpolate the grade to the
rendered size, so small UI text gets the sturdier text cut and large headlines
automatically get the Display cut with its tighter built-in spacing. This is
the "UI-optimised" behaviour Inter is designed around — do not drop the axis.

> **Decision history, so it is not re-litigated.**
> *2026-08-30:* MB-BDF v1.0's Roboto Slab (headings) + Inter (body) pair was
> trialled and rejected on sight — slab headings read as obtrusive against the
> dense operational tables — and Geist stood for everything.
> *2026-08-31:* **Rahim directed the switch to Inter for headings AND body** —
> headlines in Inter SemiBold with tight tracking, body/description text in
> Inter Regular — superseding the Geist decision. The earlier concern that
> Inter's UI weights render thin at dashboard sizes is addressed by the `opsz`
> axis (real optical grades) and by SemiBold headline weight. Roboto Slab
> remains rejected: **headings deliberately use Inter, not the framework's
> slab** — do not re-apply Roboto Slab without asking Rahim first. Headings
> keep the framework's other rules — sentence case, token-driven colour,
> tabular figures. **Geist Mono was deliberately kept** — the framework
> prescribes no monospace face, and tabular identifiers need one.

```css
/* headings and body share one face — Inter, via next/font's fallback stack */
font-family: var(--font-sans);

/* .meter cells only */
font-family: var(--font-mono), ui-monospace, "SF Mono", Menlo, monospace;
```

### Type Scale

Text utilities are **Tailwind stock values** on purpose (`text-sm` 14px,
`text-base` 16px, `text-lg` 18px, `text-xl` 20px…): `tailwind.config.ts` is
dead configuration — Tailwind 4 only loads a JS config behind an explicit
`@config` directive and `globals.css` has none. The legacy `--font-size-*` /
`--line-height-*` tokens that once shadowed this scale were referenced by
nothing and were **removed from `globals.css` on 2026-08-31** so nobody designs
against values the app never applied.

### Main Headline Rule

The page headline — `PageHeader`'s `<h1>` and the dashboard command deck's
`<h1>` — is one shared spec (2026-08-31):

| Property | Value |
|----------|-------|
| Face / weight | Inter **SemiBold (600)** — same weight as every other heading, size does the hierarchy work |
| Size | `text-2xl` 24px → `sm:text-3xl` 30px → `md:text-4xl` 36px |
| Tracking | `tracking-tight` (`-0.025em`) — the tightening Inter's dynamic metrics recommend at these sizes; the `opsz` axis adds the Display grade on top |
| Leading | `md:leading-[1.15]` on `PageHeader`; deck relies on the size's stock leading |
| Colour | from the heading rule — `--primary` light / `--foreground` dark; solid white on the purple command deck |

**Description under a headline:** Inter Regular (400), `text-sm` 14px →
`sm:text-[0.9375rem]` 15px, `leading-relaxed`, `max-w-prose` measure, in
`--muted-foreground` — the AA-safe medium grey (`#5D6976` light / `#9CA3AF`
dark). On the purple command deck it is `text-white/70` instead, tuned to that
always-dark surface.

**Sizes actually shipped** (hard-coded in the component CSS, and the real scale
to design against):

| Where | Size | Weight |
|-------|------|--------|
| Table body cell (`.ops-table tbody td`) | `12px` | 400 |
| Table header (`.ops-table thead th`) | `12px` | 600 |
| `.meter` cells | `12.5px` | 400, `tabular-nums` |
| Whole table (`.ops-table`) | `13px` base | — |
| KPI label (StatsGrid) | `11px` | 600, uppercase, `+0.06em` |
| Ticker label | `11px` | 600, uppercase, `+0.06em` |
| Ticker value | `14px` | 600, `tabular-nums` |
| Ticker "BREAKING NEWS" caption | `10.5px` | 700, uppercase, `+0.1em` |
| Tooltip (`[data-tooltip]`) | `11.2px` | 500 |

**Diverges from MB-BDF v1.0**, which sets a floor of 14px on screen. Several
dense surfaces sit below it — 12px ledger cells, 11px KPI and ticker labels,
10.5px on the ticker caption. That is a deliberate density choice for
control-room ledgers with 20+ columns, but it is a real divergence and should be
recorded as such rather than assumed compliant. If Rahim wants the floor
enforced, the table system and the ticker are the two places to change.

### Heading Rule

`h1–h6` in `@layer base`:

| Property | Value |
|----------|-------|
| Family | `var(--font-sans)` → Inter (inherited; headings share the body face) |
| Weight | `font-semibold` (600) |
| Tracking | `tracking-tight` (Tailwind `-0.025em`) |
| Colour (light) | `var(--primary)` `#4E4456` — 8.64:1 on `--background`, 9.19:1 on `--card` |
| Colour (dark) | `var(--foreground)` `#F1F5F9` — 18.13:1 on `--background`, 16.67:1 on `--card` |

**Heading colour diverges from MB-BDF v1.0 in dark mode, and must.** The
framework specifies purple headings; `#4E4456` on the dark page `#0A090C` is
roughly 1.3:1 — unreadable. **Never hard-code a heading colour**; leave it
token-driven so each theme resolves its own.

### KPI Value Rule

KPI figures on `StatsGrid` tiles, as shipped in
`components/shared/stats-grid.tsx`:

| Property | Value |
|----------|-------|
| Element | `<h3>` — so the value inherits the heading rule's weight and colour |
| Size | `text-xl` (Tailwind stock 20px) — flat. Larger steps were tested and truncated long values like `92,051.5 OMR` on 8-tile grids once the icon claimed its space |
| Weight | `font-semibold` (600) — 700+ reads heavy and dated on tabular data |
| Colour | `text-foreground` in **both** themes — a utility, so it deliberately overrides the base heading rule's `--primary` |
| Numerals | `tabular-nums` |
| Line height / tracking | `leading-tight` · `tracking-tight` |
| Unit | Trails the figure in a `text-xs font-medium text-muted-foreground` span (`47.2k m³`, `106.0 MWh`) |
| Label | Above the figure: `11px`, 600, uppercase, `+0.06em`, `--muted-foreground` |

Colour never shifts to red/green based on the metric — that semantic lives in
the trend chip below the value, which reads `--mb-success-text` /
`--mb-danger-text` (never `--status-*`, which is tuned to the 3:1 graphic floor
and is not safe for 12px text).

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

/* Premium decelerations — entrances & micro-interactions */
--ease-out-quint: cubic-bezier(0.22, 1, 0.36, 1);
--ease-out-expo:  cubic-bezier(0.16, 1, 0.3, 1);
```

### GSAP Motion System (`lib/motion.ts`)
One choreography language for every module. JS animation goes through the
shared tokens — never ad-hoc durations/eases:

| Token | Value | Use |
|-------|-------|-----|
| `MOTION.dur.xs` | 0.18s | Press/toggle feedback |
| `MOTION.dur.sm` | 0.35s | Chips, badges |
| `MOTION.dur.md` | 0.6s | Card/row entrances |
| `MOTION.dur.lg` | 0.85s | Header/hero orchestration |
| `MOTION.dur.count` | 1.1s | KPI numeric roll-ups |
| `MOTION.ease.out` | `power3.out` | Default settle |
| `MOTION.ease.outExpo` | `expo.out` | Hero/headline moments |
| `MOTION.stagger.*` | 0.05–0.1s | Group reveals |

**Signature interactions** (all gated by `prefers-reduced-motion`):
- **KPI roll-up** — `CountUp` animates the numeric part of pre-formatted
  values into place on first view; SSR/reduced-motion render the final string.
- **Scroll reveals** — `useScrollAnimation` / `AnimateOnScroll` (GSAP +
  IntersectionObserver) stagger cards in with `power3.out`.
- **Cursor sheen** — `.mb-glow` + `data-glow`: a 10% brand-teal radial that
  tracks the pointer on interactive cards (one delegated app-wide listener).
- **Gliding rails** — the sidebar's active indicator and TabNavigation's
  active pill travel between items instead of blinking; static styles remain
  as the no-JS / reduced-motion fallback.

### Ambient Bay scene (Three.js)
`components/three/ambient-bay.tsx` — a calm GPU point-wave field in brand
teal/lavender, used **only** on brand-purple chrome: the dashboard `HeroBand`
and the login brand panel. Rules: lazy-loaded (`next/dynamic`, ssr:false),
DPR-capped at 1.75, paused off-screen, one static frame under reduced motion,
silently absent without WebGL (the gradient stands alone). Colors are read
from CSS tokens at runtime — never hex literals.

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
