# Muscat Bay Operations Dashboard

> **A comprehensive operations management system for tracking critical infrastructure and utilities at Muscat Bay (Saraya Bandar Jissah SAOC)**

[![TypeScript](https://img.shields.io/badge/TypeScript-Primary-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed-Vercel-black)](https://vercel.com)

---

## 📋 Overview

This application is designed to streamline operations and maintenance management at Muscat Bay, enabling real-time tracking and analysis of:

- **STP (Sewage Treatment Plant) Operations** - Daily monitoring, chemical usage, and maintenance logs
- **Water Systems** - Consumption tracking across 350+ meters (L1-L4 hierarchy)
- **Electricity Monitoring** - Usage patterns and cost analysis
- **Contractors & AMC** - Annual Maintenance Contract tracking and vendor coordination
- **Asset Management** - Equipment registers and lifecycle tracking
- **Firefighting Systems** - Safety infrastructure monitoring
- **Pest Control** - Scheduled maintenance and reports

Built by the **Assets & Operations Manager** to solve real-world infrastructure challenges.

---

## 🎯 Purpose

**Problem:** Managing utilities, STP operations, and infrastructure across multiple zones requires constant data tracking, vendor coordination, and reporting to management.

**Solution:** A centralized dashboard that:
- ✅ Eliminates manual spreadsheet tracking
- ✅ Provides real-time operational insights
- ✅ Automates reporting and alerts
- ✅ Improves decision-making with data visualization
- ✅ Streamlines vendor and contractor management

---

## 🛠️ Technology Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe development
- **React 19** - Component-based UI
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Modern UI components
- **Recharts** - Data visualization and charts

### Backend & Database
- **Supabase** - Backend-as-a-Service (PostgreSQL)
- **Next.js API Routes** - Server-side logic

### Infrastructure
- **Vercel** - Hosting and deployment
- **GitHub Actions** - CI/CD automation
- **Git** - Version control

### Testing
- **Vitest** - Unit testing framework
- **Testing Library** - React component testing

---

## 📁 Project Structure

```
muscatbay/
├── app/                        # Main Next.js application
│   ├── app/                    # Next.js App Router pages
│   │   ├── water/              # Water meter management
│   │   ├── electricity/        # Electricity monitoring
│   │   ├── stp/                # STP plant operations
│   │   ├── contractors/        # AMC contractor tracking
│   │   ├── assets/             # Asset management
│   │   ├── firefighting/       # Firefighting systems
│   │   ├── pest-control/       # Pest control management
│   │   ├── settings/           # User settings
│   │   ├── login/              # Authentication pages
│   │   └── page.tsx            # Main dashboard
│   ├── components/             # React components
│   │   ├── ui/                 # Base UI components (shadcn/ui)
│   │   ├── shared/             # Reusable shared components
│   │   ├── charts/             # Chart components
│   │   ├── layout/             # Layout components (sidebar, topbar)
│   │   └── water/              # Water-specific components
│   ├── lib/                    # Core utilities
│   │   ├── supabase.ts         # Database operations
│   │   ├── water-data.ts       # Water meter data & analysis
│   │   └── auth.ts             # Authentication
│   ├── sql/                    # SQL schema and data files
│   ├── scripts/                # Utility scripts
│   ├── hooks/                  # Custom React hooks
│   └── __tests__/              # Test files
├── docs/                       # Documentation
├── App_Logo/                   # Branding assets
├── .github/workflows/          # GitHub Actions CI/CD
├── .vscode/                    # VS Code settings
├── .claude/                    # AI assistant configurations
├── vercel.json                 # Vercel deployment config
├── CHANGELOG.md                # Version history
└── README.md                   # This file
```

---

## 🚀 Getting Started

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
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to `http://localhost:3000`

---

## 📊 Key Features

### 1. STP Operations Dashboard
- Daily flow rate tracking
- Chemical usage monitoring (chlorine, coagulants, etc.)
- Maintenance schedule and alerts
- Compliance reporting

### 2. Water Tracking
- **Water Hierarchy:** 350+ meter hierarchy (L1→L2→L3→L4)
- **Daily Reports:** Zone-wise consumption and loss analysis
- **Loss Detection:** Automated water loss percentage calculations

### 3. Electricity Monitoring
- Zone-wise consumption
- Cost analysis and monthly billing reconciliation

### 4. Contractor Management
- AMC (Annual Maintenance Contract) tracking
- Vendor performance monitoring

### 5. Asset Management
- Equipment registers
- Lifecycle tracking

### 6. Reporting & Analytics
- Automated monthly reports
- Trend analysis with interactive charts
- Export capabilities

---

## 📱 Usage

### Daily Operations Checklist

1. **Morning:** Log STP readings (flow, pH, chemicals)
2. **Midday:** Check utility consumption alerts
3. **Evening:** Review maintenance tasks and vendor updates
4. **Weekly:** Generate consumption reports for management

### Common Tasks

**View Water Consumption:**
1. Navigate to "Water" section
2. Select "Daily Report" or "Water Hierarchy"
3. Filter by zone and time period
4. View consumption graphs and loss analysis

**Check STP Operations:**
1. Go to "STP" section
2. View daily operations log
3. Monitor treatment metrics and charts

---

## 🔧 Development

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm test` | Run unit tests |
| `npm run lint` | Run ESLint |

### Running Tests
```bash
npm test
```

### Building for Production
```bash
npm run build
```

### Deployment
Automatic deployment to Vercel on push to `main` branch via GitHub Actions.

---

## 📈 Roadmap

### Phase 1: Core Features (Completed ✅)
- [x] STP operations tracking
- [x] Water meter hierarchy with daily reports
- [x] Electricity monitoring
- [x] Dashboard with KPI cards
- [x] Vercel deployment
- [x] Dark mode support

### Phase 2: Enhanced Tracking (In Progress 🚧)
- [ ] Real-time alerts for abnormal readings
- [ ] Mobile-responsive optimizations
- [ ] Multi-user access with roles
- [ ] Advanced data visualization

### Phase 3: Automation (Planned 📋)
- [ ] Auto-email weekly reports to management
- [ ] SMS alerts for critical failures
- [ ] Integration with smart meters (Tadoom)
- [ ] Predictive maintenance using ML

---

## 🤝 Contributing

This is a private project for Muscat Bay operations. If you're part of the team:

1. Create a feature branch: `git checkout -b feature/new-feature`
2. Commit changes: `git commit -m 'Add new feature'`
3. Push to branch: `git push origin feature/new-feature`
4. Open a Pull Request

---

## 📝 License

Proprietary - Muscat Bay (Saraya Bandar Jissah SAOC)

---

## 👤 Author

**Abdulrahim AlBalushi**  
*Assets & Operations Manager*  
Muscat Bay (Saraya Bandar Jissah SAOC)

---

## 📞 Support

For questions or issues:
- **Internal:** Contact Operations Team
- **Technical Issues:** Create a GitHub issue
- **Urgent:** Email operations@muscatbay.om

---

## 🙏 Acknowledgments

- Muscat Bay Management Team
- VP Abdullah AlNasiri
- External contractors and vendors (Gulf Experts, Kalhat, OWATCO, Tadoom, National Rocks)

---

## 📚 Additional Resources

- [Application Documentation](./app/README.md) - Detailed app structure
- [Architecture Overview](./app/ARCHITECTURE.md) - System design
- [Design System](./app/DESIGN_SYSTEM.md) - UI styling guide
- [Changelog](./CHANGELOG.md) - Version history and updates
- [SQL Reference](./app/sql/README.md) - Database schema files

---

**Last Updated:** January 2026  
**Version:** 1.0.0  
**Status:** 🟢 Active Development
