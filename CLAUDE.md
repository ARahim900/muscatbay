# Muscat Bay Utility Management App

## Quick Reference

| Item | Value |
|------|-------|
| **Stack** | Next.js 16 + React 19 + TypeScript 5 + Tailwind 4 + Supabase |
| **App root** | `muscatbay/app/` |
| **Dev server** | `cd muscatbay/app && npm run dev` (port 3000) |
| **Build** | `cd muscatbay/app && npm run build` |
| **Lint** | `cd muscatbay/app && npm run lint` |
| **Test** | `cd muscatbay/app && npm run test` |
| **Deploy** | Vercel (auto-deploy from main) |

## Project Structure

```
muscatbay/app/
├── app/              # Next.js App Router (routes)
│   ├── api/          # API routes
│   ├── assets/       # Asset management
│   ├── auth/         # Auth callback & password reset
│   ├── contractors/  # Contractor management
│   ├── electricity/  # Electricity monitoring
│   ├── firefighting/ # Fire safety + quotes
│   ├── hvac/         # HVAC system
│   ├── pest-control/ # Pest control
│   ├── settings/     # User settings
│   ├── stp/          # STP plant monitoring
│   ├── water/        # Water management
│   └── page.tsx      # Dashboard (/)
├── actions/          # Server actions
├── components/
│   ├── auth/         # Auth components
│   ├── charts/       # Recharts visualizations
│   ├── gulf-expert/  # Gulf Expert HVAC feature
│   ├── layout/       # Sidebar, topbar, navbar, bottom-nav
│   ├── pwa/          # PWA service worker
│   ├── shared/       # Reusable: stats-grid, data-table, breadcrumbs, tab-navigation
│   ├── ui/           # shadcn/ui base components
│   └── water/        # Water-specific components
├── entities/         # TypeScript entity types
├── functions/api/    # API utility functions (data fetching)
├── hooks/            # Custom hooks: useDashboardData, useSTPData, useScrollAnimation, useSupabaseRealtime
├── lib/              # Core utilities: auth, supabase, utils (cn), validation, config, water-data, export-utils, filter-preferences
├── proxy.ts          # Supabase auth session refresh (Next.js 16 proxy convention)
├── scripts/          # Seed data & utility scripts
├── sql/              # Database schemas, migrations, fixes
└── public/           # Static assets, PWA icons, manifest
```

## Key Conventions

### Imports & Aliases
- `@/` maps to `muscatbay/app/` root (configured in tsconfig.json)
- Example: `import { cn } from "@/lib/utils"`

### Styling
- **Tailwind 4** with CSS variables in `app/globals.css`
- `cn()` utility for conditional class merging (clsx + tailwind-merge)
- Dark theme by default
- Brand colors: primary `#4E4456` (purple), accent `#A1D1D5` (soft teal)
- **Authoritative brand spec**: `BRAND_DESIGN.md` (overrides any older tokens elsewhere)
- Full design system also documented in `muscatbay/app/DESIGN_SYSTEM.md`
- Font: **Inter** (variable, weights 400/500/600/700/800) via `--font-sans` — single source of truth in `app/layout.tsx`, wired through `tailwind.config.ts` so every `font-sans` class resolves to it. Never re-declare `font-family` elsewhere.

### Components
- **UI primitives**: shadcn/ui (base-vega style) in `components/ui/`
- **Icons**: lucide-react v1 — import named icons from `"lucide-react"`
- **Charts**: Recharts v3 — chart components in `components/charts/`
- **Animations**: GSAP for scroll animations

### Data Layer
- **Supabase** for database, auth, and realtime
- `@supabase/ssr` v0.9 for server-side auth (getAll/setAll cookie API)
- `createBrowserClient` in `functions/supabase-client.ts` (client-side)
- `createServerClient` in `proxy.ts` (server-side session refresh; Next.js 16 renamed `middleware` → `proxy`)
- Server actions in `actions/` directory
- API functions in `functions/api/`

### Auth Flow
- Supabase Auth with email/password
- Middleware refreshes session on every request
- Protected routes redirect to `/login`
- Auth context in `components/auth/auth-provider.tsx`

### Testing
- Vitest + React Testing Library + jsdom
- Tests in `__tests__/` directory
- Run: `npm run test` or `npm run test:coverage`

## Common Patterns

### Data fetching in pages
Pages use server actions or client-side hooks. Water and STP pages use custom hooks (`useSTPData`, etc.) that call functions from `functions/api/`.

### Shared components
- `StatsGrid` — KPI cards with trend indicators
- `DataTable` — Sortable/filterable tables with pagination
- `TabNavigation` — Tab switching with icons
- `Breadcrumbs` — Route-aware breadcrumbs
- `PageHeader` — Consistent page headers

### Adding a new page
1. Create route in `app/<route>/page.tsx`
2. Add entity types in `entities/`
3. Add API functions in `functions/api/`
4. Add server actions in `actions/` if needed
5. Add sidebar nav item in `components/layout/sidebar.tsx`

## Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anonymous key
- See `.env.example` for template

## Code Quality Rules
- No `any` types — use proper TypeScript types
- No `SELECT *` — always specify columns in Supabase queries
- Error handling on all Supabase queries
- Tailwind class ordering via prettier/eslint
- Components must be properly structured (types → component → exports)

## Design Context

> Full spec: [`.impeccable.md`](./.impeccable.md) · [`BRAND_DESIGN.md`](./BRAND_DESIGN.md) · [`muscatbay/app/DESIGN_SYSTEM.md`](./muscatbay/app/DESIGN_SYSTEM.md). When values conflict, `BRAND_DESIGN.md` wins.

### Users
Operations staff and facility/asset managers at Muscat Bay (water, electricity, STP, assets, contractors, HVAC, pest, fire). Secondary: executives on the dashboard. Field: tablet users in control rooms and on-site, sometimes gloved or in night-shift lighting. Live Supabase data — never assume demo mode.

### Brand Personality
**Professional, reliable, modern.** A serious operations tool — closer to industrial BMS dashboards (Siemens Desigo, Schneider EcoStruxure) than to a marketing site or SaaS landing page. Emotional goals: confidence & trust, calm control, low-key urgency.

### Aesthetic Direction
Clean enterprise dashboard — flat, minimal, data-first. References: Grafana, Linear, Azure Portal-style cards, modern BMS HMIs. Anti-references: neon, heavy gradients, marketing-y aesthetics, dense SCADA mimic panels, per-module re-skins. **Dark mode is primary** (control rooms, night shifts); light mode is first-class and equally readable for executives/daytime use.

### Design Principles

1. **Data first, decoration never** — every visual element must serve the data. Remove anything that doesn't help an operator read status faster.
2. **Calm by default, urgent only when earned** — reserve red, animation, and elevated visual weight for genuine alarms. Normal state = quiet confidence.
3. **One system, many modules** — water, electricity, STP, assets, contractors, HVAC, pest, fire must look like pages of one app, not seven. Reuse `DataTable`, `StatsGrid`, `PageHeader`, `Breadcrumbs`, `TabNavigation`, cards, spacing, typography. Module accent colors live in icons and chart series only — never wholesale page chrome.
4. **Tokens, never hex** — colors, radii, spacing, shadows come from CSS variables in `globals.css`. Inline hex codes in components are a bug. Status → `--status-*`; charts → `--chart-*` / `--module-*`.
5. **Accessible in the field** — generous touch targets, never color-only status (pair color with icon + text), WCAG AA in both themes, respect `prefers-reduced-motion`, RTL-aware.
6. **Equally readable in light and dark** — both themes ship as production-grade. Test every KPI, chart axis, and badge in both.

### Quick Token Reminders
- **Primary** `--primary` `#4E4456` (sidebar, headings, buttons)
- **Accent** `--secondary` / `--accent` `#A1D1D5` (CTAs, focus ring, highlights)
- **Background** light `#F7F8F9` · dark `#0A090C`
- **Card** light `#FFFFFF` · dark `#16141B`
- **Radius** `10.5px` cards · `7px` inputs · `5px` chips/buttons
- **Status** `--status-normal/warning/danger/info/stale/missing` (always paired with icon + label)
- **Module accents** `--module-water/electricity/stp/assets/contractors/hvac/pest/fire` (icons & chart series only)

## Dependencies Not to Upgrade (Pinned)
- `typescript` — stay on 5.x until ecosystem supports 6.x
- `eslint` — stay on 9.x until plugins support 10.x
- `jsdom` — stay on 27.x (vitest compatibility)
- `@vitejs/plugin-react` — stay on 5.x (vitest compatibility)
