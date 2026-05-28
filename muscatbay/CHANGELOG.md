## Changelog

### 2026-05-29
- **Invisible Stability + Security Maintenance (No UI/Theme Changes)**:
  - Fixed command palette lint blocker by keeping the existing behavior and adding an explicit lint-safe reset for active index.
  - Resolved build gate failure in `verify-skills-lock` by removing the stale `impeccable` lock entry that was not part of installed verified skills.
  - Applied `npm audit fix` in `muscatbay/app` to patch vulnerable transitive dependencies without changing product behavior.
  - Re-validated project health with TypeScript, tests, lint, and production build checks after updates.
- **Non-Visual Hardening Pass**:
  - Set `metadataBase` in root layout using `NEXT_PUBLIC_SITE_URL` / `VERCEL_URL` (fixes OG/Twitter URL resolution only; no on-screen UI change).
  - Cleaned safe ESLint warnings (unused imports/variables, dead code) across app, hooks, API helpers, and scripts.
  - Left intentional `react-hooks/exhaustive-deps` warnings in water analytics untouched to avoid behavior changes.
- **Daily Water Report Hydration Fix**:
  - Moved mobile scroll-fade overlay outside `<table>` in zone/DC daily report tables to fix invalid HTML nesting and React hydration errors (no visual change).

### 2026-04-16
- **Assets Register Reset + Excel Source Alignment**:
  - Replaced generated/mixed asset data with a clean import from `Muscat_Bay_Asset_Register_Enhanced.xlsx` (`Master_Asset_Register` sheet).
  - Added `muscatbay/app/scripts/import-assets-from-excel.py` to batch-load the Excel rows directly into `Assets_Register_Database`.
  - Verified import integrity: `3062` rows loaded, `0` duplicate `Asset_UID`, `0` duplicate `Asset_Tag`.
  - Updated import workflow so the database now mirrors the Excel file as the source of truth.
- **Assets Management UX Professional Upgrade**:
  - Enhanced assets domain model to expose operations-grade fields (category, system area, model, PPM frequency, owner, lifecycle/ERL context).
  - Added server-side global summary metrics for operations dashboards (portfolio total, active/working, verification backlog, critical lifecycle risk, disciplines).
  - Upgraded assets page to display management-focused KPIs and a lifecycle risk column, with sorting by risk and clearer discipline/category hierarchy.
  - Verified `/assets` frontend health (`200`) and successful production build after the enhancement.
- **KPI Card Re-Verification + Correction**:
  - Re-validated live Supabase KPI figures and confirmed `Status`-based active count (`212`) was under-reporting portfolio activity.
  - Updated KPI logic to use `Is_Asset_Active = Y` for the Active Assets card and added a separate Working Status KPI for operational clarity.
  - Kept verification and lifecycle-risk cards aligned to `TO VERIFY` and ERL/status risk rules.
  - Rebuilt successfully to confirm the KPI fixes compile and render correctly.
- **Discipline KPI Accuracy Fix**:
  - Fixed the portfolio-wide discipline KPI to paginate across all asset rows instead of only reading the first `1000` records from Supabase.
  - Corrected the unique discipline calculation so the assets summary reflects the full register rather than a partial slice.

### 2026-01-24
- **Codebase Reorganization**: Implemented comprehensive file structure improvements.
  - Organized `/sql` directory into `schema`, `data`, `migrations`, and `fixes` subdirectories.
  - Moved unused example components to `docs/examples/`.
  - Consolidated documentation references.
- **Documentation**: 
  - Added `CONTRIBUTING.md` guide.
  - Updated `Folder_Structure.md` to reflect new organization.
- **Cleanup**: Removed extraneous temporary files and organized data exports.

### 2026-01-13
- Tightened main content container spacing for consistent left/right gutters next to the sidebar.
- Further reduced container padding and increased max width so dashboard cards sit closer to the sidebar while keeping balanced gutters.
- Introduced mobile-first layout shell with clamp-based gutters, removed fixed max width from main content, and made stat grid auto-fit to fill available space on any screen size.
- Removed search box from sidebar navigation bar.
- Fixed content sizing to fully fill screen width by reducing layout-shell padding to minimal values (clamp(8px, 2vw, 24px)) and removing extra padding from page components.
- Updated stats grid to use w-full and reduced minimum card width from 220px to 200px for better space utilization.
 - Further biased layout-shell padding to the right (smaller left padding, slightly larger right padding) so dashboard content visually shifts closer to the sidebar while still keeping a comfortable right gutter on wide screens.