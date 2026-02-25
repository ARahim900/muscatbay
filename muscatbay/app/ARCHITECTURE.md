# Architecture Overview

This document describes the high-level architecture of the Muscat Bay Management Dashboard.

## System Design

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                       │
├─────────────────────────────────────────────────────────────────┤
│  Pages (app/)           Components             Utilities (lib/) │
│  ├── Dashboard          ├── ui/               ├── supabase.ts  │
│  ├── Water              ├── shared/           ├── auth.ts      │
│  ├── Electricity        ├── charts/           ├── config.ts    │
│  ├── STP                └── water/            └── validation.ts│
│  ├── Contractors                                                │
│  └── Assets                                                     │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  │ Supabase Client (REST API)
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Supabase Backend                            │
├─────────────────────────────────────────────────────────────────┤
│  Tables:                                                         │
│  ├── mb_assets           - Asset inventory                      │
│  ├── Water System        - Water meter readings                 │
│  ├── stp_operations      - STP daily operations                 │
│  ├── electricity_meters  - Electricity meter config             │
│  ├── electricity_readings- Monthly consumption                  │
│  ├── Contractor_Tracker  - AMC contracts                        │
│  └── profiles            - User profiles                        │
│                                                                  │
│  Auth: Supabase Auth with RLS policies                          │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Page Load
```
User Request → Next.js Page → lib/supabase.ts → Supabase API
                    ↓
              Check Config
                    ↓
    ┌───────────────┴───────────────┐
    ▼                               ▼
Supabase OK                    Not Configured
    ↓                               ↓
Fetch Live Data              Return Empty []
    ↓                               ↓
Transform Data              Use Mock Data
    ↓                               ↓
    └───────────────┬───────────────┘
                    ▼
              Render UI
```

### 2. Authentication
```
Login Page → lib/auth.ts → Supabase Auth
                 ↓
         Validate Inputs
                 ↓
    ┌────────────┴────────────┐
    ▼                         ▼
Success                    Failure
    ↓                         ↓
Store Session          Show Error
    ↓
Redirect to Dashboard
```

## Key Modules

| Module | Responsibility |
|--------|----------------|
| `lib/supabase.ts` | All database operations, client singleton |
| `lib/auth.ts` | Authentication flows, session management |
| `lib/water-data.ts` | Water meter analysis calculations |
| `lib/config.ts` | Centralized app configuration |
| `lib/validation.ts` | Input sanitization and validation |
| `lib/mock-data.ts` | Development fallback data |

## Component Hierarchy

```
Layout (layout.tsx)
├── Sidebar (components/layout/sidebar.tsx)
├── Topbar (components/layout/topbar.tsx)
└── Page Content
    ├── PageHeader (components/shared/page-header.tsx)
    ├── StatsGrid (components/shared/stats-grid.tsx)
    ├── Charts (components/charts/*)
    └── Tables (components/ui/table.tsx)
```

## Security

- **Row Level Security (RLS)**: All Supabase tables have RLS policies
- **Input Validation**: All user inputs validated via `lib/validation.ts`
- **Environment Variables**: Sensitive keys in `.env.local`
- **Authentication**: Supabase Auth with secure session handling
