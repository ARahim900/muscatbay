# Muscat Bay Operations Dashboard

> **A comprehensive operations management system for tracking critical infrastructure and utilities at Muscat Bay (Saraya Bandar Jissah SAOC)**

[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16.1-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61dafb)](https://react.dev/)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed-Vercel-black)](https://vercel.com)

---

## Overview

This application streamlines operations and maintenance management at Muscat Bay, enabling real-time tracking and analysis of:

- **STP (Sewage Treatment Plant) Operations** — Daily monitoring, chemical usage, and maintenance logs
- **Water Systems** — Consumption tracking across 350+ meters (L1–L4 hierarchy)
- **Electricity Monitoring** — Usage patterns, zone-wise consumption, and cost analysis
- **Contractors & AMC** — Annual Maintenance Contract tracking and vendor coordination
- **Asset Management** — Equipment registers and lifecycle tracking
- **Fire Safety** — Firefighting systems monitoring and quote management
- **Pest Control** — Scheduled maintenance and reports

Built by the **Assets & Operations Manager** to solve real-world infrastructure challenges.

---

## Purpose

**Problem:** Managing utilities, STP operations, and infrastructure across multiple zones requires constant data tracking, vendor coordination, and reporting to management.

**Solution:** A centralized dashboard that:
- Eliminates manual spreadsheet tracking
- Provides real-time operational insights via Supabase
- Automates reporting and alerts
- Improves decision-making with interactive data visualization
- Streamlines vendor and contractor management
- Works offline as a Progressive Web App (PWA)

---

## Technology Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| Next.js | 16.1 | React framework (App Router) |
| React | 19.2 | Component-based UI |
| TypeScript | 5 | Type-safe development |
| Tailwind CSS | 4 | Utility-first styling |
| shadcn/ui + Radix UI | Latest | Modern UI components |
| Recharts | 3.6 | Data visualization and charts |
| GSAP | 3.14 | Micro-animations and transitions |
| date-fns | 4.1 | Date manipulation |

### Backend & Database
- **Supabase** — Backend-as-a-Service (PostgreSQL + Auth + Realtime)
- **Next.js API Routes** — Server-side logic

### Infrastructure
- **Vercel** — Hosting and deployment
- **Git** — Version control

### Testing
- **Vitest** — Unit testing framework
- **Testing Library** — React component testing

---

## Project Structure

```
muscatbay/
├── app/                          # Main Next.js application
│   ├── app/                      # Next.js App Router pages
│   │   ├── water/                # Water meter management
│   │   ├── electricity/          # Electricity monitoring
│   │   ├── stp/                  # STP plant operations
│   │   ├── contractors/          # AMC contractor tracking
│   │   ├── assets/               # Asset management
│   │   ├── firefighting/         # Fire safety (+ /quotes sub-page)
│   │   ├── pest-control/         # Pest control management
│   │   ├── settings/             # User settings
│   │   ├── login/                # Authentication pages
│   │   ├── signup/               # Registration (+ /professional)
│   │   ├── forgot-password/      # Password reset
│   │   ├── auth/                 # Auth callbacks & reset
│   │   └── page.tsx              # Main dashboard
│   ├── components/               # React components
│   │   ├── ui/                   # Base UI components (shadcn/ui)
│   │   ├── shared/               # Reusable shared components
│   │   ├── charts/               # Chart components (Recharts)
│   │   ├── layout/               # Sidebar, topbar, bottom nav
│   │   ├── water/                # Water-specific components
│   │   ├── auth/                 # Auth provider
│   │   └── pwa/                  # Service worker registration
│   ├── lib/                      # Core utilities
│   ├── hooks/                    # Custom React hooks
│   ├── sql/                      # Database schema & seed data
│   ├── scripts/                  # Utility scripts
│   ├── public/                   # Static assets, PWA manifest, icons
│   ├── __tests__/                # Unit test files
│   ├── ARCHITECTURE.md           # System design overview
│   └── DESIGN_SYSTEM.md          # UI styling guide
├── docs/                         # Documentation and examples
├── App_Logo/                     # Branding assets
├── vercel.json                   # Vercel deployment config
├── CONTRIBUTING.md               # Contribution guidelines
├── CHANGELOG.md                  # Version history
└── README.md                     # This file
```

---

## Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ARahim900/muscatbay.git
   cd muscatbay
   ```

2. **Install dependencies**
   ```bash
   cd app
   npm install
   ```

3. **Set up environment variables**

   Create a `.env.local` file in the `app` directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser** at `http://localhost:3000`

---

## Key Features

### Dashboard
- KPI cards with real-time stats
- Interactive charts and trend analysis
- GSAP micro-animations for smooth transitions

### Water Tracking
- **Meter Hierarchy:** 350+ meters across L1 → L2 → L3 → L4 zones
- **Daily Reports:** Zone-wise consumption with date range picker
- **Building Consumption:** Per-building usage breakdown
- **Loss Detection:** Automated water loss percentage calculations
- **Zone Analysis:** Filterable by zone and distribution center

### STP Operations
- Daily flow rate and chemical usage tracking
- Maintenance schedule monitoring
- Compliance reporting with embedded data views

### Electricity Monitoring
- Zone-wise consumption with unified filter controls
- Cost analysis and monthly billing reconciliation

### Contractor Management
- AMC (Annual Maintenance Contract) tracking
- Vendor performance monitoring

### Asset Management
- Equipment registers and lifecycle tracking

### Fire Safety
- Firefighting systems monitoring
- Quote management sub-page

### Pest Control
- Scheduled maintenance tracking and reports

### Progressive Web App (PWA)
- Installable on mobile and desktop
- Offline caching via service worker
- App manifest with branded icons

### Responsive Design
- Fully responsive across PC, tablet, and phone
- Collapsible sidebar on desktop, bottom navigation on mobile

---

## Development

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm test` | Run unit tests (Vitest) |
| `npm run test:ui` | Run tests with browser UI |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run lint` | Run ESLint |

### Deployment

Automatic deployment to Vercel on push to `main` branch.

Security headers (CSP, X-Frame-Options) are configured in `vercel.json`.

---

## Roadmap

### Phase 1: Core Features (Completed)
- [x] STP operations tracking
- [x] Water meter hierarchy with daily reports
- [x] Electricity monitoring
- [x] Dashboard with KPI cards
- [x] Vercel deployment
- [x] Dark mode support

### Phase 2: Enhanced Tracking (Completed)
- [x] Fully responsive design (PC, tablet, phone)
- [x] Progressive Web App (PWA) support
- [x] Mobile bottom navigation
- [x] GSAP animations and UI polish
- [x] Date range picker with dual-range slider
- [x] Building consumption reports
- [x] Unified filter controls

### Phase 3: Automation (Planned)
- [ ] Real-time alerts for abnormal readings
- [ ] Multi-user access with roles
- [ ] Auto-email weekly reports to management
- [ ] SMS alerts for critical failures
- [ ] Integration with smart meters (Tadoom)
- [ ] Predictive maintenance using ML

---

## Contributing

This is a private project for Muscat Bay operations. If you're part of the team:

1. Create a feature branch: `git checkout -b feature/new-feature`
2. Commit changes: `git commit -m 'Add new feature'`
3. Push to branch: `git push origin feature/new-feature`
4. Open a Pull Request

See [CONTRIBUTING.md](./CONTRIBUTING.md) for full guidelines.

---

## License

Proprietary — Muscat Bay (Saraya Bandar Jissah SAOC)

---

## Author

**Abdulrahim AlBalushi**
*Assets & Operations Manager*
Muscat Bay (Saraya Bandar Jissah SAOC)

---

## Support

For questions or issues:
- **Internal:** Contact Operations Team
- **Technical Issues:** Create a GitHub issue
- **Urgent:** Email operations@muscatbay.om

---

## Acknowledgments

- Muscat Bay Management Team
- VP Abdullah AlNasiri
- External contractors and vendors (Gulf Experts, Kalhat, OWATCO, Tadoom, National Rocks)

---

## Additional Resources

- [Application Documentation](./app/README.md) — Detailed app structure
- [Architecture Overview](./app/ARCHITECTURE.md) — System design
- [Design System](./app/DESIGN_SYSTEM.md) — UI styling guide
- [Contributing Guidelines](./CONTRIBUTING.md) — Development setup and contribution guide
- [Changelog](./CHANGELOG.md) — Version history and updates
- [SQL Reference](./app/sql/README.md) — Database schema files

---

**Last Updated:** March 2026
**Version:** 1.1.0
**Status:** Active Development
