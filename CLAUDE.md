# CLAUDE.md — Muscat Bay Operations Dashboard

## Project Overview

Muscat Bay Management Dashboard is a facility management system for a residential community in Oman. It provides operational oversight for water systems, electricity consumption, sewage treatment plant (STP) operations, contractor management, asset inventory, fire safety, and pest control.

**Live deployment**: Hosted on Vercel.

## Repository Structure

```
muscatbay/
├── .github/workflows/          # GitHub Actions (Grafana water sync)
├── muscatbay/app/              # Main Next.js application root
│   ├── app/                    # Next.js App Router (pages/routes)
│   │   ├── page.tsx            # Main dashboard
│   │   ├── water/              # Water system monitoring
│   │   ├── electricity/        # Electricity consumption tracking
│   │   ├── stp/                # Sewage Treatment Plant operations
│   │   ├── contractors/        # AMC contractor management
│   │   ├── assets/             # Asset inventory
│   │   ├── firefighting/       # Fire safety + /quotes sub-route
│   │   ├── pest-control/       # Pest control management
│   │   ├── login/              # Authentication
│   │   ├── signup/             # Registration (+ /professional)
│   │   ├── settings/           # User settings
│   │   ├── forgot-password/    # Password reset flow
│   │   ├── auth/               # Auth callbacks & reset-password
│   │   └── api/water/          # API route (Grafana webhook)
│   ├── components/             # React components
│   │   ├── ui/                 # Shadcn/ui base components
│   │   ├── shared/             # Reusable components (page-header, stats-grid, etc.)
│   │   ├── layout/             # Sidebar, topbar, client-layout
│   │   ├── charts/             # Recharts wrappers
│   │   ├── water/              # Water-specific components
│   │   └── auth/               # Auth provider
│   ├── entities/               # TypeScript interfaces for DB models
│   ├── functions/              # Supabase client + API layer
│   │   ├── supabase-client.ts  # Client initialization
│   │   └── api/                # CRUD functions per domain
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Core utilities and business logic
│   ├── actions/                # Next.js server actions
│   ├── sql/                    # DB schema, migrations, seeds, fixes
│   ├── scripts/                # Dev/utility scripts
│   ├── __tests__/              # Unit tests (Vitest)
│   └── public/                 # Static assets (logos)
└── testsprite_tests/           # Test planning & automation
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | **Next.js 16** (App Router) |
| Language | **TypeScript 5** (strict mode) |
| UI Library | **React 19** |
| Styling | **Tailwind CSS 4** |
| Component Library | **Shadcn/ui** (Radix UI primitives) |
| Charts | **Recharts 3** |
| Icons | **Lucide React** |
| Database/Backend | **Supabase** (PostgreSQL + Auth + Storage) |
| Testing | **Vitest 4** + **@testing-library/react** |
| Linting | **ESLint 9** (next/core-web-vitals + typescript) |
| Deployment | **Vercel** |

## Common Commands

All commands run from the `muscatbay/app/` directory:

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm start            # Start production server
npm run lint         # Run ESLint
npm test             # Run Vitest tests
npm test -- --run    # Run tests once (no watch)
npm run test:ui      # Tests with browser UI
npm run test:coverage # Coverage report
```

**Install dependencies**: `npm install --legacy-peer-deps` (required due to peer dep conflicts).

## Architecture & Conventions

### Directory Roles

- **`entities/`** — TypeScript interfaces mapping to Supabase tables. Each file exports interfaces with JSDoc `@fileoverview` and `@module` tags. Barrel-exported via `entities/index.ts`.
- **`functions/api/`** — Data access layer. Each file contains async functions that call `supabase-client.ts` to query a specific domain (assets, contractors, electricity, stp, water). Barrel-exported via `functions/api/index.ts`.
- **`lib/`** — Business logic and utilities. Large domain-specific modules (e.g., `water-data.ts` at 112 KB) live here alongside general helpers (`utils.ts`, `validation.ts`, `config.ts`).
- **`hooks/`** — Custom React hooks for data fetching and state management (e.g., `useDashboardData`, `useSTPData`).
- **`components/ui/`** — Shadcn/ui components. Added via `npx shadcn add <component>`. Do not edit manually unless extending.
- **`components/shared/`** — Reusable layout/display components used across pages.
- **`components/layout/`** — App shell: sidebar, topbar, client-layout wrapper.
- **`sql/`** — Database schema definitions, migration scripts, seed data, and RLS policy fixes. Reference these when modifying DB structure.

### Code Conventions

- **Path aliases**: Use `@/*` imports (maps to `muscatbay/app/*`). Example: `import { cn } from "@/lib/utils"`.
- **Component pattern**: Pages are in `app/<route>/page.tsx`. Heavy components use `"use client"` directive. The root layout (`app/layout.tsx`) is a client component.
- **Naming**: Files use kebab-case (`water-data.ts`, `page-header.tsx`). Components use PascalCase exports. React components with multiple words may use either PascalCase filenames (`DailyWaterReport.tsx`, `CSVUploadDialog.tsx`) or kebab-case.
- **Entities**: Each entity file has a `@fileoverview` JSDoc block. Interfaces mirror Supabase table columns with optional `created_at` fields.
- **Barrel exports**: `entities/index.ts` and `functions/api/index.ts` re-export all modules. Use these for imports.
- **Styling utility**: Use `cn()` from `@/lib/utils` to merge Tailwind classes (combines `clsx` + `tailwind-merge`).
- **Auth pages**: Routes in `/login`, `/signup`, `/forgot-password`, `/auth` render without the sidebar/topbar layout.

### Design System

- **Primary color**: `#4E4456` (deep purple-gray) — headers, sidebar
- **Accent color**: `#81D8D0` (tiffany blue) — CTAs, active states
- **Base UI**: Shadcn/ui with `base-vega` style, `zinc` base color, CSS variables enabled
- **Icons**: Lucide React exclusively
- **Font**: System font stack (no Google Fonts)

## Database (Supabase)

### Key Tables

| Table | Domain |
|-------|--------|
| `water_system` | Water meter readings |
| `electricity_meters` | Meter configuration |
| `electricity_readings` | Monthly consumption data |
| `stp_operations` | STP daily operations |
| `mb_assets` | Facility asset inventory |
| `contractor_tracker` | AMC contracts |
| `profiles` | User profiles |
| `amc_*` tables | Contractor/pricing data |

### Patterns

- All tables use **Row-Level Security (RLS)**. See `sql/fixes/` for policy definitions.
- Supabase client is initialized in `functions/supabase-client.ts` and re-exported from `lib/supabase.ts`.
- Server-side auth uses `@supabase/ssr` via middleware (`middleware.ts`) to refresh sessions on every request.
- A dev mode bypass exists (`NEXT_PUBLIC_DEV_MODE=true`) — **never enable in production**.

## Environment Variables

Copy `.env.example` to `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=<supabase-project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase-anon-key>
GRAFANA_API_KEY=<grafana-service-account-token>
```

Never commit `.env*` files (except `.env.example`).

## Testing

- **Framework**: Vitest with jsdom environment
- **Location**: `__tests__/lib/` for unit tests
- **Setup**: `setupTests.ts` mocks Next.js router and Supabase client
- **Path alias**: `@` is resolved in `vitest.config.ts`
- **Pattern**: Test files match `**/__tests__/**/*.{test,spec}.{ts,tsx}`
- **Coverage**: v8 provider, outputs text + HTML

When adding tests, place them in `__tests__/` mirroring the source path. Use the existing mock patterns from `setupTests.ts`.

## Deployment

- **Platform**: Vercel
- **Install command**: `npm install --legacy-peer-deps`
- **Security headers**: Configured in `vercel.json` (CSP, X-Frame-Options, XSS protection, etc.)
- **Middleware**: `middleware.ts` handles Supabase session refresh for all routes except static assets.
- **GitHub Actions**: `.github/workflows/sync-water-consumption.yml` runs daily at 06:00 UTC to sync Grafana water data to Supabase (self-hosted runner).

## External Integrations

- **Supabase** — Database, auth, real-time subscriptions, file storage
- **Grafana** — Water consumption data source, synced via daily GitHub Action and API route
- **Airtable** — Historical water data integration (referenced in embeds)

## Important Notes for AI Assistants

1. **Working directory**: The Next.js app root is `muscatbay/app/`, not the repo root. Run `npm` commands from there.
2. **Legacy peer deps**: Always use `npm install --legacy-peer-deps` when adding packages.
3. **Large lib files**: `lib/water-data.ts` (112 KB), `lib/water-network-data.ts` (35 KB), and `lib/water-daily-hierarchy.ts` (33 KB) contain substantial hardcoded data alongside logic. Be cautious editing these.
4. **Shadcn/ui components**: Add new UI components with `npx shadcn add <name>`. Don't manually create files in `components/ui/`.
5. **SQL migrations**: Database changes should have corresponding SQL in `sql/migrations/` or `sql/schema/`.
6. **Mock data fallback**: `lib/mock-data.ts` provides fallback data when Supabase is unavailable. Update it if entity shapes change.
7. **No README creation**: This project does not use separate README files per directory.
8. **Security**: Input validation lives in `lib/validation.ts`. Follow existing patterns for sanitization. Never hardcode credentials.
