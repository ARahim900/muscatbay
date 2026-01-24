# Folder Structure Guide

This document describes the organization of the Muscat Bay application codebase.

## Overview

```
app/
├── app/              # Next.js App Router (pages/routes)
├── components/       # Reusable UI components
├── entities/         # Database models/schemas
├── functions/        # Backend utility functions
├── lib/              # Shared utilities and configuration
├── hooks/            # Custom React hooks
├── docs/             # Documentation and examples
│   └── examples/     # Code examples and references
├── public/           # Static assets
├── scripts/          # Development and data scripts
├── sql/              # Database SQL scripts (schema, data, migrations)
└── __tests__/        # Unit test files
```

---

## `/app/` - Pages (Routes)

Each folder represents a route in the application. One `page.tsx` per route.

| Route | Description |
|-------|-------------|
| `/` | Main dashboard |
| `/water` | Water system monitoring |
| `/electricity` | Electricity consumption tracking |
| `/stp` | Sewage Treatment Plant operations |
| `/contractors` | AMC contractor management |
| `/assets` | Asset inventory |
| `/firefighting` | Fire safety equipment |
| `/login`, `/signup` | Authentication pages |
| `/settings` | User settings |

---

## `/components/` - UI Components

Organized by scope and purpose:

### `/ui/` - Core UI Elements
Base components like buttons, inputs, cards, modals, dialogs. These are the building blocks.

### `/shared/` - Common Components
Components used across multiple pages: loading spinners, date pickers, stat grids.

### `/layout/` - Layout Components
Sidebar, topbar, and page wrapper components.

### `/[domain]/` - Domain-Specific
Components grouped by feature area:
- `/water/` - Water-specific charts and displays
- `/charts/` - Reusable chart components
- `/auth/` - Authentication components

---

## `/entities/` - Database Models

One file per entity defining TypeScript interfaces and transform functions.

| File | Contents |
|------|----------|
| `asset.ts` | `SupabaseAsset`, `transformAsset()` |
| `contractor.ts` | `ContractorTracker`, AMC interfaces |
| `electricity.ts` | `ElectricityMeter`, `ElectricityReading` |
| `stp.ts` | `SupabaseSTPOperation`, `transformSTPOperation()` |
| `water.ts` | `SupabaseWaterMeter`, `transformWaterMeter()` |
| `fire-safety.ts` | Fire equipment and quotation types |
| `index.ts` | Barrel export for all entities |

---

## `/functions/` - Backend Utilities

Organized by responsibility:

### `/functions/supabase-client.ts`
Supabase client initialization and configuration utilities.

### `/functions/api/`
Data fetching functions grouped by domain:
- `assets.ts` - Asset queries
- `contractors.ts` - Contractor queries
- `electricity.ts` - Electricity meter queries
- `stp.ts` - STP operation queries
- `water.ts` - Water meter queries

---

## `/lib/` - Shared Utilities

| File | Purpose |
|------|---------|
| `supabase.ts` | Re-exports from entities/functions (backward compatibility) |
| `mock-data.ts` | Fallback data for development |
| `water-data.ts` | Water meter utilities |
| `auth.ts` | Authentication utilities |
| `validation.ts` | Input validation |
| `config.ts` | App configuration |
| `utils.ts` | General utilities |
| `export-utils.ts` | Data export helpers |

---

## Conventions

1. **One file per entity** - Each database table maps to one entity file
2. **Barrel exports** - Use `index.ts` files to simplify imports
3. **Separation of concerns**:
   - Pages = routing and layout
   - Components = UI rendering
   - Entities = data structures
   - Functions = business logic
4. **Backward compatibility** - `lib/supabase.ts` re-exports for existing imports
5. **Type safety** - All entities have TypeScript interfaces
