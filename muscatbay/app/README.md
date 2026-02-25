# Muscat Bay Management Dashboard

A comprehensive facility management dashboard for Muscat Bay residential community built with Next.js 16 and Supabase.

## Project Structure

```
app/
├── app/                    # Next.js App Router pages
│   ├── water/             # Water meter management
│   ├── electricity/       # Electricity monitoring
│   ├── stp/               # STP plant operations
│   ├── contractors/       # AMC contractor tracking
│   ├── assets/            # Asset management
│   ├── settings/          # User settings
│   ├── login/             # Authentication pages
│   └── page.tsx           # Main dashboard
│
├── components/             # React components
│   ├── ui/                # Base UI components (shadcn/ui)
│   ├── shared/            # Reusable shared components
│   ├── charts/            # Chart components
│   ├── layout/            # Layout components (sidebar, topbar)
│   └── water/             # Water-specific components
│
├── lib/                    # Core utilities (see lib/README.md)
│   ├── supabase.ts        # Database operations
│   ├── water-data.ts      # Water meter data & analysis
│   ├── mock-data.ts       # Development fallback data
│   ├── auth.ts            # Authentication
│   ├── config.ts          # App configuration
│   └── validation.ts      # Input validation
│
├── scripts/                # Utility scripts (see scripts/README.md)
│   ├── seeds/             # Database seeding
│   ├── tests/             # Diagnostic tests
│   └── utils/             # Helper utilities
│
├── sql/                    # SQL files (see sql/README.md)
│   ├── schema/            # Table definitions
│   └── data/              # Seed data
│
├── hooks/                  # Custom React hooks
├── __tests__/              # Test files
└── public/                 # Static assets
```

## Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure Supabase** (optional)
   Create `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

3. **Run development server**
   ```bash
   npm run dev
   ```

4. **Open browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm test` | Run unit tests |
| `npm run lint` | Run ESLint |

## Documentation

- [Library Modules](./lib/README.md) - Core utility documentation
- [Scripts Guide](./scripts/README.md) - Database & utility scripts
- [SQL Reference](./sql/README.md) - Database schema files
- [Architecture](./ARCHITECTURE.md) - System design overview
- [Design System](./DESIGN_SYSTEM.md) - UI styling guide

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Testing**: Vitest
