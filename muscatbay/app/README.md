# Muscat Bay Management Dashboard

A comprehensive facility management dashboard for Muscat Bay residential community built with Next.js 16 and Supabase.

## Project Structure

```
app/
├── app/                       # Next.js App Router pages
│   ├── water/                 # Water meter management
│   ├── electricity/           # Electricity monitoring
│   ├── stp/                   # STP plant operations
│   ├── contractors/           # AMC contractor tracking
│   ├── assets/                # Asset management
│   ├── firefighting/          # Fire safety (+ /quotes)
│   ├── pest-control/          # Pest control management
│   ├── settings/              # User settings
│   ├── login/                 # Authentication
│   ├── signup/                # Registration (+ /professional)
│   ├── forgot-password/       # Password reset
│   ├── auth/                  # Auth callbacks & reset
│   └── page.tsx               # Main dashboard
│
├── components/                # React components
│   ├── ui/                    # Base UI components (shadcn/ui)
│   ├── shared/                # Reusable shared components
│   ├── charts/                # Chart components (Recharts)
│   ├── layout/                # Sidebar, topbar, bottom nav
│   ├── water/                 # Water-specific components
│   ├── auth/                  # Auth provider
│   └── pwa/                   # Service worker registration
│
├── lib/                       # Core utilities (see lib/README.md)
│   ├── supabase.ts            # Database operations
│   ├── water-data.ts          # Water meter data & analysis
│   ├── water-accounts.ts      # Water account management
│   ├── auth.ts                # Authentication
│   ├── config.ts              # App configuration
│   ├── validation.ts          # Input validation
│   ├── export-utils.ts        # Data export helpers
│   ├── filter-preferences.ts  # Filter state persistence
│   └── utils.ts               # General utilities
│
├── hooks/                     # Custom React hooks
│   ├── useDashboardData.ts    # Dashboard data fetching
│   ├── useSTPData.ts          # STP data fetching
│   ├── useScrollAnimation.ts  # Scroll-triggered animations
│   └── useSupabaseRealtime.ts # Supabase realtime subscriptions
│
├── scripts/                   # Utility scripts (see scripts/README.md)
│   ├── seeds/                 # Database seeding
│   ├── tests/                 # Diagnostic tests
│   └── utils/                 # Helper utilities
│
├── sql/                       # SQL files (see sql/README.md)
│   ├── schema/                # Table definitions
│   └── data/                  # Seed data
│
├── public/                    # Static assets
│   ├── manifest.json          # PWA manifest
│   ├── sw.js                  # Service worker
│   └── icons/                 # PWA icons (192x192, 512x512)
│
├── __tests__/                 # Unit test files
├── ARCHITECTURE.md            # System design overview
└── DESIGN_SYSTEM.md           # UI styling guide
```

## Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure Supabase**
   Create `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

3. **Run development server**
   ```bash
   npm run dev
   ```

4. **Open browser** at [http://localhost:3000](http://localhost:3000)

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm test` | Run unit tests (Vitest) |
| `npm run test:ui` | Run tests with browser UI |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run lint` | Run ESLint |

## Documentation

- [Library Modules](./lib/README.md) — Core utility documentation
- [Scripts Guide](./scripts/README.md) — Database & utility scripts
- [SQL Reference](./sql/README.md) — Database schema files
- [Architecture](./ARCHITECTURE.md) — System design overview
- [Design System](./DESIGN_SYSTEM.md) — UI styling guide

## Tech Stack

- **Framework**: Next.js 16.1 (App Router)
- **Language**: TypeScript 5
- **UI**: React 19.2
- **Database**: Supabase (PostgreSQL + Auth + Realtime)
- **Styling**: Tailwind CSS 4
- **Components**: shadcn/ui, Radix UI, Base UI
- **Charts**: Recharts 3.6
- **Animations**: GSAP 3.14
- **Dates**: date-fns 4.1
- **Testing**: Vitest 4, Testing Library

## Dark Mode Theme

The dark theme uses a **warm near-black palette** that harmonizes with the `#4E4456` brand purple — no slate/navy surfaces. All tokens live in `app/globals.css` under the `.dark` block.

### Brand & Semantic Tokens (dark)

| Role | Token | Hex |
|---|---|---|
| Background (page) | `--background` | `#0A090C` |
| Card / popover / component surface | `--card`, `--popover`, `--component` | `#16141B` |
| Foreground (text) | `--foreground` | `#F1F5F9` |
| Muted surface | `--muted` | `#22202A` |
| Muted text | `--muted-foreground` | `#9CA3AF` |
| Primary (brand purple) | `--primary` | `#4E4456` |
| Sidebar (darker than primary) | `--sidebar` | `#3B3240` |
| Secondary / accent (teal) | `--secondary`, `--accent` | `#4DBFBF` |
| Destructive | `--destructive` | `#D67A7A` |
| Border / input | `--border`, `--input` | `rgba(255,255,255,0.1)` |
| Focus ring | `--ring` | `#4DBFBF` |

### Near-Black Surface Scale

Used for elevation and hover layers, unlayered in `globals.css` so they always win over Tailwind utilities:

| Level | Hex | Purpose |
|---|---|---|
| `slate-950` → | `#0A090C` | Page background |
| `slate-900` → | `#16141B` | Card / base surface |
| `slate-800` → | `#1E1C26` | Elevated surface |
| `slate-700` → | `#2A2733` | Hover / highlight |

Borders for `slate-700/800/900` are remapped to white-tinted hairlines (`rgba(255,255,255,0.05–0.16)`).

### Status Tokens (dark)

- Success `--mb-success` `#84B59F` · hover `#9DCAB6`
- Warning `--mb-warning` `#E8C064`
- Danger `--mb-danger` `#D67A7A` · hover `#E09090`
- Info `--mb-info` `#6B9AC4`
- Each has a `…-light` variant at ~12% alpha for tinted backgrounds.

### Rules

1. **Never hardcode dark surface hex values** — always use the token (`bg-card`, `bg-background`, `bg-muted`) or the legacy `dark:bg-slate-{700..950}` classes, which are remapped centrally.
2. **No `dark:bg-slate-*` additions outside the remap block** — if you need a new shade, add it to the remap section in `globals.css`, don't invent one-off hex values in components.
3. **Borders in dark mode use white-alpha**, not solid colors. Prefer `border-border` or the remapped `dark:border-slate-*` classes.
4. **Headings** auto-color: `--primary` in light, `--foreground` in dark (handled in the base layer).
5. **Sidebar must stay darker than `--primary`** so it reads as a distinct zone under the topbar.
6. **Charts** use the teal/amber/green/purple palette via `--chart-*` tokens — don't import Recharts' defaults.
7. **Focus ring** is always the teal `--ring` (`#4DBFBF`) for WCAG contrast against near-black.
8. **To retune the entire dark shell**, change the 4 base hex values in the "Dark Surface Remap" block in `globals.css` — every surface retracks automatically.

See [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) for the full light-mode spec, component patterns, and typography scale.
