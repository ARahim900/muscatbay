# Dependencies & Modularity Guide

This document explains the project's technology choices, their long-term support status, and how each component can be replaced without breaking the application.

## Core Dependencies

### Framework Layer

| Package | Version | Purpose | LTS Status |
|---------|---------|---------|------------|
| `next` | 16.x | React framework, routing, SSR | ✅ Vercel-maintained, major releases yearly |
| `react` | 19.x | UI component library | ✅ Meta-backed, stable API |
| `typescript` | 5.x | Type safety | ✅ Microsoft-maintained |

### Database Layer

| Package | Version | Purpose | Swappable? |
|---------|---------|---------|------------|
| `@supabase/supabase-js` | 2.88 | PostgreSQL client | ✅ Yes |

**Replacement Strategy**: All database operations are centralized in `lib/supabase.ts`. To swap:
1. Create a new client module (e.g., `lib/prisma.ts`)
2. Implement the same exported functions
3. Update imports in page files

**Compatible Alternatives**: Prisma, Drizzle ORM, direct pg client, Firebase

### Styling Layer

| Package | Version | Purpose | Swappable? |
|---------|---------|---------|------------|
| `tailwindcss` | 4.x | Utility CSS framework | ⚠️ Embedded in components |
| `class-variance-authority` | 0.7 | Component variants | ✅ Yes |
| `tailwind-merge` | 3.4 | Class merging | ✅ Yes |
| `clsx` | 2.1 | Conditional classes | ✅ Yes |

**Replacement Strategy**: Tailwind is deeply integrated. For migration:
- Keep utility classes (they're standard CSS concepts)
- `cn()` helper in `lib/utils.ts` abstracts class merging

### UI Components

| Package | Version | Purpose | Swappable? |
|---------|---------|---------|------------|
| `@radix-ui/react-slider` | 1.3 | Accessible slider | ✅ Yes |
| `lucide-react` | 0.561 | Icon library | ✅ Yes |
| `react-day-picker` | 9.12 | Date picker | ✅ Yes |

**Replacement Strategy**: All UI primitives are in `components/ui/`. Each component:
- Has a single responsibility
- Exports a consistent interface
- Can be replaced individually

### Charts

| Package | Version | Purpose | Swappable? |
|---------|---------|---------|------------|
| `recharts` | 3.6 | React charts | ✅ Yes |

**Replacement Strategy**: Chart components are wrapped in `components/charts/`:
- `liquid-area-chart.tsx`
- `liquid-bar-chart.tsx`
- `liquid-progress-ring.tsx`

To swap for Chart.js or D3:
1. Create new chart components with same props interface
2. Update imports in page files

**Compatible Alternatives**: Chart.js, Nivo, Victory, D3 with React wrappers

### Testing

| Package | Version | Purpose | Swappable? |
|---------|---------|---------|------------|
| `vitest` | 4.x | Test runner | ✅ Yes |
| `@testing-library/react` | 16.x | Component testing | ✅ Yes |
| `jsdom` | 27.x | DOM environment | ✅ Yes |

**Replacement Strategy**: Tests use Jest-compatible API. To swap to Jest:
1. Replace `vitest.config.ts` with `jest.config.js`
2. Update test scripts in `package.json`
3. Tests remain unchanged (same `describe`/`it`/`expect` API)

---

## Abstraction Interfaces

These interfaces define the contracts that allow swapping implementations:

### Database Operations (`lib/supabase.ts`)

```typescript
// Any database client must implement these exports:
export function isSupabaseConfigured(): boolean
export function getSupabaseClient(): Client | null
export async function getAssetsFromSupabase(page, pageSize, search)
export async function getSTPOperationsFromSupabase()
export async function getWaterMetersFromSupabase()
export async function getContractorTrackerData()
// ... etc
```

### Authentication (`lib/auth.ts`)

```typescript
// Auth provider must implement:
export async function signUp(email, password, fullName?)
export async function signIn(email, password)
export async function signOut()
export async function getCurrentUser(): AuthUser | null
export function onAuthStateChange(callback)
```

### Configuration (`lib/config.ts`)

```typescript
// Can be database-driven by replacing constant exports:
export const STP_RATES = { TANKER_FEE, TSE_SAVING_RATE }
export const ELECTRICITY_RATES = { RATE_PER_KWH }
export const PAGINATION = { DEFAULT_PAGE_SIZE, ... }
```

---

## Update Strategy

When updating dependencies:

1. **Minor versions** (x.Y.z): Safe to update, run tests
2. **Major versions** (X.0.0): Review changelog, check breaking changes
3. **Framework updates** (Next.js, React): Wait 1-2 months after release

### Recommended Update Commands

```bash
# Check outdated packages
npm outdated

# Update minor/patch versions safely
npm update

# Update specific package to latest
npm install package@latest
```

---

## Version Pinning

The `package.json` uses caret (`^`) versioning for flexibility:
- `"next": "16.0.10"` - Exact version for framework stability
- `"recharts": "^3.6.0"` - Allow minor updates

For maximum stability, consider pinning exact versions in production.
