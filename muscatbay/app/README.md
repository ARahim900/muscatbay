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
