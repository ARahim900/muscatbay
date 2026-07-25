# Folder Structure Guide

How the Muscat Bay application codebase is organised, and the rules that keep it
that way.

**Last reviewed:** 2026-07-25

## The two rules

1. **`app/` holds routes only.** Only Next.js file conventions belong there:
   `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `global-error.tsx`,
   `not-found.tsx`, `route.ts`, `globals.css` and route icons. A component,
   helper or constants file must never sit next to a `page.tsx`.
2. **One predictable home per module.** Everything a module renders lives in
   `components/<module>/`, named as the UI names the module.

## Overview

```
app/
├── app/              # ROUTES ONLY — Next.js App Router file conventions
├── components/       # Feature folders + cross-cutting UI
├── entities/         # Data layer 1 — types
├── functions/        # Data layer 2 — isomorphic readers
├── actions/          # Data layer 3 — 'use server' writers
├── hooks/            # Custom React hooks
├── lib/              # Cross-module utilities and configuration
├── public/           # Static assets, PWA icons, manifest, service worker
├── scripts/          # Seed/upload/verify scripts (not bundled)
├── sql/              # Schema, migrations, data loads
└── __tests__/        # Vitest suites, mirroring the source tree
```

---

## `/app/` — Routes

One `page.tsx` per route, plus the shared shell files at the root.

| Route | Description |
|-------|-------------|
| `/` | Dashboard command deck |
| `/water` | Water system monitoring |
| `/electricity` | Electricity consumption tracking |
| `/stp` | Sewage Treatment Plant operations |
| `/hvac` | HVAC (Gulf Expert) contracts, findings, recurring issues |
| `/contractors` | AMC contractor management |
| `/assets` | Asset register |
| `/firefighting` | Fire safety equipment, PPM programme, issues |
| `/pest-control` | Pest control |
| `/settings` | User settings |
| `/login`, `/signup`, `/signup/professional`, `/forgot-password` | Authentication |
| `/auth/callback`, `/auth/reset-password` | Supabase auth handoffs |
| `/privacy`, `/terms` | Legal pages |

Shell files at `app/` root: `layout.tsx`, `loading.tsx`, `error.tsx`,
`global-error.tsx`, `not-found.tsx`, `globals.css` (Tailwind 4 + all tokens),
`icon.png`, `apple-icon.png`, `favicon.ico`.

---

## `/components/` — UI

### Feature folders — one per module

| Folder | Contents |
|---|---|
| `assets/` | `asset-charts`, `truncated-text`, `sort` |
| `contractors/` | `renewals`, `terms`, `pricing`, `yearly-chart`, `contract-dates` |
| `dashboard/` | `command-deck`, `deck-brand-mark`, `module-coverage`, `ytd-panel` |
| `electricity/` | `electricity-analysis-view`, `load-watch`, `electricity-analytics`, `electricity-overview-charts`, `electricity-shared`, `reading-cell`, `electricity-loading` |
| `firefighting/` | `equipment-register`, `issues-register`, `firefighting-ui`, `ppm-programme`, `contract-reference` |
| `hvac/` | `overview-tab`, `findings-tab`, `recurring-tab`, `types` |
| `stp/` | `plant-watch`, `stp-analytics`, `stp-trend-charts` |
| `water/` | `daily-water-report`, `date-range-picker`, `daily-report/*`, `monthly/*` |

A module's non-JSX helpers are plain `.ts` files **in the same folder**
(`stp/stp-analytics.ts`, `assets/sort.ts`). Only genuinely cross-module logic is
promoted to `lib/`.

`pest-control` has no extracted components yet — its page renders inline. When
it grows, its components go in `components/pest-control/`.

### Cross-cutting folders

| Folder | Purpose |
|---|---|
| `ui/` | shadcn/ui primitives (base-vega style). Re-add more with `npx shadcn@latest add <name>`. |
| `shared/` | Used by three or more modules: `stats-grid`, `data-table/`, `page-header`, `breadcrumbs`, `tab-navigation`, `inspection`, `findings-register`, `page-status-bar`, `skeleton`, `empty-state`, `section-boundary`, `command-palette`, `scroll-animation` |
| `charts/` | Recharts wrappers: `chart-container`, `liquid-bar-chart`, `liquid-progress-ring`, `liquid-tooltip`, `toggleable-legend`, `dashboard-charts` |
| `layout/` | `sidebar`, `sidebar-context`, `topbar`, `bottom-nav`, `client-layout`, `layout-router`, `notification-bell` |
| `providers/` | `app-providers` (theme + loading overlay), `notification-provider` |
| `auth/` | `auth-provider`, `require-role`, `brand-lockup` |
| `alerts/`, `brand/`, `motion/`, `pwa/`, `three/` | Single-purpose cross-cutting pieces |

The **inspection toolkit** (`shared/inspection.tsx` + `shared/findings-register.tsx`)
is the one severity model for the whole app — STP Plant Watch, Electricity Load
Watch and Assets all render from it. Feed it a section's severity and rows;
never rebuild per-module severity cards.

---

## Data layer — three tiers, one barrel each

Strictly ordered. Each barrel documents the layering in its own header comment.

### 1. `/entities/` — types

Row shapes and transform functions. Zero runtime cost, importable anywhere.
Barrel: `@/entities`.

| File | Contents |
|------|----------|
| `asset.ts` | `SupabaseAsset`, `transformAsset()` |
| `contractor.ts` | `ContractorTracker`, AMC interfaces |
| `electricity.ts` | `ElectricityMeter`, `ElectricityReading` |
| `stp.ts` | `SupabaseSTPOperation`, `transformSTPOperation()` |
| `water.ts` | `SupabaseWaterMeter`, `transformWaterMeter()` |
| `fire-safety.ts` | Fire equipment, PPM and issue types |
| `index.ts` | Barrel |

### 2. `/functions/` — isomorphic readers

Supabase queries that return tier-1 types. Barrels: `@/functions` and
`@/functions/api`.

- `functions/supabase-client.ts` — browser client
- `functions/api/{assets,contractors,electricity,stp,water,fire-safety,gulf-expert,csv-upload}.ts`

**Must stay isomorphic** — no `next/*`, no `window`/`document`. The Expo app
bundles these exact files.

### 3. `/actions/` — server actions

`'use server'` wrappers over tier 2 for anything needing the server session.
Barrel: `@/actions` — which re-exports `'use server'` modules **and nothing
else**. Mixing tier-2 readers in would pull `next/headers` into the client graph
and break the build.

---

## `/lib/` — cross-module utilities

`supabase.ts` (compat re-exports), `supabase-server.ts`, `auth.ts`, `rbac.ts`,
`validation.ts`, `config.ts`, `utils.ts` (`cn`), `tokens.ts`, `thresholds.ts`,
`trends.ts`, `export-utils.ts`, `filter-preferences.ts`, `alert-preferences.ts`,
`operational-alerts.ts`, `page-cache.ts`, `count-format.ts`, `loading.ts`,
`logger.ts`, `motion.ts`, `mock-data.ts`, `water-data.ts`,
`water-monthly-data.ts`, `water-accounts.ts`.

---

## Shared with the mobile app — do not move blindly

`entities/`, `lib/` and `functions/api/` are consumed **directly** by the Expo
app in `../../mobile` via Metro `watchFolders` and a `@/*` alias
(`mobile/metro.config.js`, `mobile/tsconfig.json`). Metro swaps exactly one leaf
module — `functions/supabase-client` → `mobile/src/adapters/supabase-client.ts`.

Moving or renaming any file in those three folders silently breaks the mobile
build. Update `mobile/` in the same change, or leave the file where it is.

---

## Naming

- **kebab-case** for every component and helper file.
- `hooks/` uses `useThing.ts` (React convention, consistent across all hooks).
- Barrel files are always `index.ts`.
- A file named after its folder's module reads better than a generic one:
  `firefighting/firefighting-ui.tsx`, not `firefighting/ui.tsx`.

## Conventions

1. **One file per entity** — each database table maps to one entity file.
2. **Barrel exports** — `index.ts` per concern, never mixing server and client tiers.
3. **Separation of concerns** — routes route, components render, entities describe,
   functions read, actions write.
4. **No orphans** — a file nothing imports is deleted, not archived.
5. **Type safety** — no `any`; every entity has an interface.
