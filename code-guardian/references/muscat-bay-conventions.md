# Muscat Bay Project Conventions

## Tech Stack
- **Framework:** Next.js 16 with App Router
- **UI:** React 19 + Tailwind CSS 4
- **Backend:** Supabase (auth, database, storage)
- **Language:** TypeScript (strict mode, ES2017 target)
- **Animations:** GSAP (scroll animations via `useScrollAnimation` hook)
- **Charts:** Recharts
- **Icons:** Lucide React
- **Testing:** Vitest
- **Linting:** ESLint 9 flat config (`eslint.config.mjs`) extending `next/core-web-vitals`
- **Path Alias:** `@/*` maps to project root

## Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Files | kebab-case | `dashboard-stats.tsx` |
| Components | PascalCase | `DashboardStats` |
| Functions/variables | camelCase | `fetchWaterData` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| Types/interfaces | PascalCase | `WaterReading` |
| Custom hooks | use prefix | `useDashboardData` |
| CSS classes | Tailwind utilities | `text-purple bg-teal` |

## Directory Structure

```
muscatbay/app/
├── app/                    # Next.js App Router pages
│   ├── page.tsx            # Dashboard (/)
│   ├── layout.tsx          # Root layout
│   ├── water/page.tsx      # Water management
│   ├── electricity/page.tsx # Electricity management
│   ├── stp/page.tsx        # STP Plant
│   ├── assets/page.tsx     # Asset management
│   ├── contractors/page.tsx # Contractor management
│   ├── pest-control/page.tsx
│   ├── firefighting/page.tsx
│   ├── settings/page.tsx
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   └── forgot-password/page.tsx
├── components/
│   ├── layout/             # Sidebar, Topbar, MainLayout
│   ├── shared/             # PageHeader, StatsGrid, reusable UI
│   ├── charts/             # Recharts-based chart components
│   └── data-table/         # Table components (sorting, filtering)
├── hooks/                  # Custom React hooks
├── lib/                    # Utilities
│   ├── supabase.ts         # Supabase client (isSupabaseConfigured, getSupabaseClient)
│   ├── auth.ts             # Auth utilities (signUp, signIn, signOut, getCurrentUser)
│   ├── validation.ts       # Input validation/sanitization
│   └── config.ts           # Configuration constants
└── public/                 # Static assets
```

## Tailwind Theme (Brand Colors)

### Primary Colors
| Name | Hex | Usage |
|------|-----|-------|
| Purple | `#4E4456` | Primary brand color, headers, navigation |
| Teal | `#81D8D0` | Accent color, highlights, CTAs |

### Custom Theme Tokens
- **Shadows:** `shadow-card` and custom shadow system
- **Font sizes:** Custom scale defined in `tailwind.config.ts`
- **Border radius:** Custom values in config
- **Colors:** Use theme tokens (`text-purple`, `bg-teal`) not arbitrary hex values

### Rules
- Always use theme tokens over hardcoded colors
- Mobile-first responsive design (`sm:`, `md:`, `lg:` breakpoints)
- No inline `style={}` when Tailwind classes exist
- Group Tailwind classes logically (layout > spacing > typography > colors > effects)

## Component Patterns

### Page Component Structure
```tsx
"use client"

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/shared/page-header'
import { StatsGrid } from '@/components/shared/stats-grid'

export default function WaterPage() {
  // hooks at top
  // data fetching with error handling
  // render with loading/error/empty states
}
```

### Data Fetching Pattern
```tsx
const [data, setData] = useState<DataType[]>([])
const [loading, setLoading] = useState(true)
const [error, setError] = useState<string | null>(null)

useEffect(() => {
  async function fetchData() {
    try {
      if (!isSupabaseConfigured()) {
        setData(mockData)
        return
      }
      const supabase = getSupabaseClient()
      const { data: result, error: err } = await supabase.from('table').select('*')
      if (err) throw err
      setData(result || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch')
    } finally {
      setLoading(false)
    }
  }
  fetchData()
}, [])
```

### Provider Pattern
- Wrap client-side providers for hydration safety
- Use composition to avoid prop drilling

### Animation Pattern
- GSAP scroll animations via `useScrollAnimation` custom hook
- Staggered entrance animations for cards and grids

## Import Order
1. React / Next.js
2. External libraries (recharts, gsap, lucide-react)
3. Internal absolute imports (`@/components/...`, `@/lib/...`, `@/hooks/...`)
4. Relative imports
5. Type-only imports (`import type { ... }`)

## Error Handling
- Use `Promise.allSettled` for parallel data fetches
- Always provide loading, error, and empty states
- Never expose raw error messages to users
- Log errors to console in development

## ESLint Configuration
- ESLint 9 flat config format (`eslint.config.mjs`)
- Extends `next/core-web-vitals`
- TypeScript strict mode enforced
- No Prettier config (use ESLint for formatting rules)
