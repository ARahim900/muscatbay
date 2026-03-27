"use client";

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  FolderOpen,
  FolderClosed,
  FileCode2,
  FileJson,
  FileText,
  FileSpreadsheet,
  File,
  Database,
  ChevronDown,
  ChevronRight,
  Layers,
  LayoutGrid,
  Code2,
  Boxes,
  Plug,
  Library,
  TestTube2,
  Wrench,
  Image,
  Settings2,
  BookOpen,
  Braces,
  type LucideIcon,
} from "lucide-react";

// ─── File type config ───────────────────────────────────────────────────────
interface FileTypeConfig {
  color: string;
  bgColor: string;
  darkBgColor: string;
  icon: LucideIcon;
}

const FILE_TYPE_MAP: Record<string, FileTypeConfig> = {
  tsx: { color: "#3B82F6", bgColor: "#EFF6FF", darkBgColor: "rgba(59,130,246,0.15)", icon: FileCode2 },
  ts: { color: "#2563EB", bgColor: "#DBEAFE", darkBgColor: "rgba(37,99,235,0.15)", icon: FileCode2 },
  js: { color: "#EAB308", bgColor: "#FEF9C3", darkBgColor: "rgba(234,179,8,0.15)", icon: Braces },
  jsx: { color: "#EAB308", bgColor: "#FEF9C3", darkBgColor: "rgba(234,179,8,0.15)", icon: Braces },
  css: { color: "#8B5CF6", bgColor: "#F5F3FF", darkBgColor: "rgba(139,92,246,0.15)", icon: FileCode2 },
  json: { color: "#10B981", bgColor: "#D1FAE5", darkBgColor: "rgba(16,185,129,0.15)", icon: FileJson },
  sql: { color: "#F97316", bgColor: "#FFF7ED", darkBgColor: "rgba(249,115,22,0.15)", icon: Database },
  csv: { color: "#14B8A6", bgColor: "#CCFBF1", darkBgColor: "rgba(20,184,166,0.15)", icon: FileSpreadsheet },
  tsv: { color: "#14B8A6", bgColor: "#CCFBF1", darkBgColor: "rgba(20,184,166,0.15)", icon: FileSpreadsheet },
  md: { color: "#6366F1", bgColor: "#E0E7FF", darkBgColor: "rgba(99,102,241,0.15)", icon: FileText },
  mjs: { color: "#EAB308", bgColor: "#FEF9C3", darkBgColor: "rgba(234,179,8,0.15)", icon: Braces },
  png: { color: "#EC4899", bgColor: "#FCE7F3", darkBgColor: "rgba(236,72,153,0.15)", icon: Image },
  svg: { color: "#EC4899", bgColor: "#FCE7F3", darkBgColor: "rgba(236,72,153,0.15)", icon: Image },
  ico: { color: "#EC4899", bgColor: "#FCE7F3", darkBgColor: "rgba(236,72,153,0.15)", icon: Image },
  html: { color: "#EF4444", bgColor: "#FEE2E2", darkBgColor: "rgba(239,68,68,0.15)", icon: FileCode2 },
  txt: { color: "#6B7280", bgColor: "#F3F4F6", darkBgColor: "rgba(107,114,128,0.15)", icon: FileText },
};

function getFileConfig(filename: string): FileTypeConfig {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  return FILE_TYPE_MAP[ext] || {
    color: "#6B7280",
    bgColor: "#F3F4F6",
    darkBgColor: "rgba(107,114,128,0.15)",
    icon: File,
  };
}

function getExtension(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  return ext;
}

// ─── Category data ──────────────────────────────────────────────────────────
interface FileCategory {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  accentColor: string;
  accentBg: string;
  darkAccentBg: string;
  path: string;
  files: string[];
}

const FILE_CATEGORIES: FileCategory[] = [
  {
    id: "pages",
    name: "Pages & Routes",
    description: "Next.js App Router page components",
    icon: LayoutGrid,
    accentColor: "#3B82F6",
    accentBg: "#EFF6FF",
    darkAccentBg: "rgba(59,130,246,0.12)",
    path: "app/",
    files: [
      "page.tsx — Dashboard",
      "layout.tsx — Root Layout",
      "globals.css — Global Styles",
      "favicon.ico",
      "water/page.tsx",
      "electricity/page.tsx",
      "stp/page.tsx",
      "contractors/page.tsx",
      "assets/page.tsx",
      "hvac/page.tsx",
      "firefighting/page.tsx",
      "pest-control/page.tsx",
      "settings/page.tsx",
      "login/page.tsx",
      "signup/page.tsx",
      "forgot-password/page.tsx",
      "auth/callback/route.ts",
      "file-organizer/page.tsx",
    ],
  },
  {
    id: "ui-components",
    name: "UI Components",
    description: "Core reusable UI elements (shadcn/ui based)",
    icon: Boxes,
    accentColor: "#8B5CF6",
    accentBg: "#F5F3FF",
    darkAccentBg: "rgba(139,92,246,0.12)",
    path: "components/ui/",
    files: [
      "alert-dialog.tsx",
      "avatar.tsx",
      "badge.tsx",
      "button.tsx",
      "calendar.tsx",
      "card.tsx",
      "combobox.tsx",
      "dialog.tsx",
      "dropdown-menu.tsx",
      "error-boundary.tsx",
      "field.tsx",
      "input-group.tsx",
      "input.tsx",
      "label.tsx",
      "popover.tsx",
      "scroll-area.tsx",
      "select.tsx",
      "separator.tsx",
      "sheet.tsx",
      "slider.tsx",
      "table.tsx",
      "textarea.tsx",
      "toast-provider.tsx",
    ],
  },
  {
    id: "shared-components",
    name: "Shared Components",
    description: "Cross-page common components",
    icon: Layers,
    accentColor: "#10B981",
    accentBg: "#D1FAE5",
    darkAccentBg: "rgba(16,185,129,0.12)",
    path: "components/shared/",
    files: [
      "breadcrumbs.tsx",
      "filter-tabs.tsx",
      "loading-spinner.tsx",
      "page-header.tsx",
      "page-status-bar.tsx",
      "scroll-animation.tsx",
      "skeleton.tsx",
      "stats-grid.tsx",
      "tab-navigation.tsx",
      "data-table/index.ts",
      "data-table/active-filter-pills.tsx",
      "data-table/multi-select-dropdown.tsx",
      "data-table/sort-icon.tsx",
      "data-table/status-badge.tsx",
      "data-table/table-pagination.tsx",
      "data-table/table-toolbar.tsx",
    ],
  },
  {
    id: "layout-components",
    name: "Layout Components",
    description: "Sidebar, topbar, and navigation wrappers",
    icon: LayoutGrid,
    accentColor: "#4E4456",
    accentBg: "#FAF5FF",
    darkAccentBg: "rgba(78,68,86,0.2)",
    path: "components/layout/",
    files: [
      "sidebar.tsx",
      "sidebar-context.tsx",
      "topbar.tsx",
      "navbar.tsx",
      "bottom-nav.tsx",
      "client-layout.tsx",
      "layout-router.tsx",
    ],
  },
  {
    id: "chart-components",
    name: "Chart Components",
    description: "Liquid-style data visualizations",
    icon: Code2,
    accentColor: "#00D2B3",
    accentBg: "#F0FDFA",
    darkAccentBg: "rgba(0,210,179,0.12)",
    path: "components/charts/",
    files: [
      "chart-container.tsx",
      "liquid-area-chart.tsx",
      "liquid-bar-chart.tsx",
      "liquid-progress-ring.tsx",
      "liquid-tooltip.tsx",
    ],
  },
  {
    id: "domain-components",
    name: "Domain Components",
    description: "Feature-specific UI components",
    icon: Plug,
    accentColor: "#0EA5E9",
    accentBg: "#E0F2FE",
    darkAccentBg: "rgba(14,165,233,0.12)",
    path: "components/{domain}/",
    files: [
      "water/BuildingConsumptionReport.tsx",
      "water/CSVUploadDialog.tsx",
      "water/DailyWaterReport.tsx",
      "water/anomaly-alerts.tsx",
      "water/circular-gauge.tsx",
      "water/date-range-picker.tsx",
      "water/meter-table.tsx",
      "water/type-filter-pills.tsx",
      "water/water-database-table.tsx",
      "water/water-loss-gauge.tsx",
      "water/zone-tabs.tsx",
      "gulf-expert/overview-tab.tsx",
      "gulf-expert/equipment-tab.tsx",
      "gulf-expert/findings-tab.tsx",
      "gulf-expert/compressors-tab.tsx",
      "gulf-expert/quotations-tab.tsx",
      "gulf-expert/recurring-tab.tsx",
      "gulf-expert/types.ts",
      "auth/auth-provider.tsx",
      "pwa/register-sw.tsx",
      "NotificationProvider.tsx",
      "providers.tsx",
    ],
  },
  {
    id: "entities",
    name: "Data Entities",
    description: "TypeScript interfaces and transform functions",
    icon: Database,
    accentColor: "#F97316",
    accentBg: "#FFF7ED",
    darkAccentBg: "rgba(249,115,22,0.12)",
    path: "entities/",
    files: [
      "index.ts",
      "asset.ts",
      "contractor.ts",
      "electricity.ts",
      "fire-safety.ts",
      "stp.ts",
      "water.ts",
    ],
  },
  {
    id: "api-functions",
    name: "API Functions",
    description: "Backend data fetching layer",
    icon: Plug,
    accentColor: "#6366F1",
    accentBg: "#E0E7FF",
    darkAccentBg: "rgba(99,102,241,0.12)",
    path: "functions/",
    files: [
      "index.ts",
      "supabase-client.ts",
      "api/index.ts",
      "api/assets.ts",
      "api/contractors.ts",
      "api/csv-upload.ts",
      "api/electricity.ts",
      "api/stp.ts",
      "api/water.ts",
    ],
  },
  {
    id: "lib",
    name: "Shared Libraries",
    description: "Utilities, config, and helper modules",
    icon: Library,
    accentColor: "#EAB308",
    accentBg: "#FEF9C3",
    darkAccentBg: "rgba(234,179,8,0.12)",
    path: "lib/",
    files: [
      "README.md",
      "auth.ts",
      "config.ts",
      "export-utils.ts",
      "filter-preferences.ts",
      "mock-data.ts",
      "supabase.ts",
      "utils.ts",
      "validation.ts",
      "water-accounts.ts",
      "water-data.ts",
    ],
  },
  {
    id: "hooks",
    name: "Custom Hooks",
    description: "React hooks for data and UI logic",
    icon: Code2,
    accentColor: "#EC4899",
    accentBg: "#FCE7F3",
    darkAccentBg: "rgba(236,72,153,0.12)",
    path: "hooks/",
    files: [
      "useDashboardData.ts",
      "useNotifications.ts",
      "useSTPData.ts",
      "useScrollAnimation.ts",
      "useSupabaseRealtime.ts",
    ],
  },
  {
    id: "scripts",
    name: "Scripts & Tooling",
    description: "Data seeding, utilities, and maintenance scripts",
    icon: Wrench,
    accentColor: "#78716C",
    accentBg: "#F5F5F4",
    darkAccentBg: "rgba(120,113,108,0.15)",
    path: "scripts/",
    files: [
      "README.md",
      "check-assets-register.js",
      "check-assets-register.ts",
      "check-daily-water-data.js",
      "clear-water-data.js",
      "debug-electricity.ts",
      "fix-electricity-readings.ts",
      "fix-negative-water-values.ts",
      "gen-mar26-loss-daily.js",
      "gen-water-data.js",
      "reset-electricity.ts",
      "run-electricity-update-jan-feb-26.js",
      "run-update-feb-26.js",
      "update-water-data.ts",
      "upload-daily-water.js",
      "upload-dbuilding-q1.js",
      "upload-dc-meters-q1.js",
      "verify-electricity.ts",
      "verify-nov-dec.ts",
      "seeds/gen-data-2024.js",
      "seeds/gen-data-2024-p2.js",
      "seeds/gen-data-2025.js",
      "seeds/gen-data-2025-p2.js",
      "seeds/insert-contractors.js",
      "seeds/parse-water-data.js",
      "seeds/seed-amc.js",
      "seeds/seed-contractor-tracker.js",
      "seeds/seed-water-final.js",
      "seeds/seed-water-full.js",
      "seeds/seed-water-jan26.js",
      "seeds/seed-water-system.js",
      "utils/check-contractor-tracker.js",
      "utils/check-supabase.js",
      "utils/debug-contractor.js",
      "utils/debug-rls.js",
      "utils/discover-all-tables.js",
      "utils/discover-columns.js",
      "utils/discover-contractor-tracker.js",
      "utils/discover-water-schema.js",
      "utils/full-debug.js",
      "utils/generate-stp-inserts.js",
      "tests/test-contractor-tracker.js",
      "tests/test-final.js",
      "tests/test-new-supabase.js",
      "tests/test-pricing.js",
      "tests/test-supabase.js",
      "tests/test-water-system.js",
      "tests/verify-amc.js",
    ],
  },
  {
    id: "sql",
    name: "SQL & Database",
    description: "Schema, migrations, seed data, and fixes",
    icon: Database,
    accentColor: "#F97316",
    accentBg: "#FFF7ED",
    darkAccentBg: "rgba(249,115,22,0.12)",
    path: "sql/",
    files: [
      "README.md",
      "schema/amc-setup.sql",
      "schema/create-amc-tables.sql",
      "schema/electricity-setup.sql",
      "schema/profiles_table.sql",
      "schema/stp_operations_table.sql",
      "schema/supabase-setup.sql",
      "schema/supabase-user-setup.sql",
      "schema/water_loss_daily_table.sql",
      "schema/water_system_table.sql",
      "data/amc-correct-data.sql",
      "data/contractor-data.sql",
      "data/stp_operations_data.sql",
      "data/water_complete_part1.sql",
      "data/water_daily_consumption_feb26.sql",
      "data/water_daily_consumption_jan26.sql",
      "data/water_loss_daily_complete.sql",
      "migrations/add_2024_columns.sql",
      "migrations/create_professional_applications.sql",
      "migrations/enable_realtime.sql",
      "migrations/update_electricity_jan_feb_26.sql",
      "migrations/update_electricity_nov_dec_25.sql",
      "migrations/update_stp_feb_26.sql",
      "migrations/update_stp_jan_26.sql",
      "migrations/update_stp_nov_dec_25.sql",
      "migrations/update_water_dec25.sql",
      "migrations/update_water_jan26.sql",
      "fixes/final_fix_missing_tables.sql",
      "fixes/fix_all_rls_policies.sql",
      "fixes/fix_electricity_rls.sql",
      "fixes/fix_storage_permissions.sql",
      "fixes/fix_unique_constraint.sql",
      "fixes/fix_water_daily_consumption_rls.sql",
      "fixes/fix_water_rls.sql",
      "cleanup/clear_all_water_data.sql",
      "storage/grafana_uploads_bucket.sql",
    ],
  },
  {
    id: "tests",
    name: "Unit Tests",
    description: "Vitest test suites",
    icon: TestTube2,
    accentColor: "#22C55E",
    accentBg: "#F0FDF4",
    darkAccentBg: "rgba(34,197,94,0.12)",
    path: "__tests__/",
    files: [
      "lib/config.test.ts",
      "lib/supabase.test.ts",
      "lib/validation.test.ts",
    ],
  },
  {
    id: "config",
    name: "Configuration",
    description: "Project configuration and tooling",
    icon: Settings2,
    accentColor: "#6B7280",
    accentBg: "#F3F4F6",
    darkAccentBg: "rgba(107,114,128,0.15)",
    path: "/",
    files: [
      "package.json",
      "package-lock.json",
      "tsconfig.json",
      "next.config.ts",
      "tailwind.config.ts",
      "postcss.config.mjs",
      "eslint.config.mjs",
      "vitest.config.ts",
      "middleware.ts",
      "components.json",
      "vercel.json",
      "next-env.d.ts",
      "setupTests.ts",
      ".env.example",
      ".env.local",
      ".env.production",
      ".gitignore",
      ".vercelignore",
    ],
  },
  {
    id: "public",
    name: "Public Assets",
    description: "Static files, icons, and PWA manifest",
    icon: Image,
    accentColor: "#EC4899",
    accentBg: "#FCE7F3",
    darkAccentBg: "rgba(236,72,153,0.12)",
    path: "public/",
    files: [
      "logo.png",
      "mb-logo.png",
      "admin-profile.png",
      "favicon.ico",
      "next.svg",
      "vercel.svg",
      "globe.svg",
      "file.svg",
      "window.svg",
      "manifest.json",
      "sw.js",
      "theme-init.js",
      "_redirects",
    ],
  },
  {
    id: "docs",
    name: "Documentation",
    description: "Architecture and reference docs",
    icon: BookOpen,
    accentColor: "#6366F1",
    accentBg: "#E0E7FF",
    darkAccentBg: "rgba(99,102,241,0.12)",
    path: "/",
    files: [
      "README.md",
      "ARCHITECTURE.md",
      "DESIGN_SYSTEM.md",
      "FOLDER_STRUCTURE.md",
      "DEPENDENCIES.md",
      "AUTHENTICATION_AUDIT_REPORT.md",
      "CHANGELOG.md",
      "CONTRIBUTING.md",
      "db-discovery-report.txt",
    ],
  },
];

// ─── Data files category ────────────────────────────────────────────────────
const DATA_FILES_CATEGORY: FileCategory = {
  id: "data-files",
  name: "Data Files",
  description: "CSV, TSV, and JSON seed/raw data files",
  icon: FileSpreadsheet,
  accentColor: "#14B8A6",
  accentBg: "#CCFBF1",
  darkAccentBg: "rgba(20,184,166,0.12)",
  path: "scripts/",
  files: [
    "scripts/d_building_feb_26.csv",
    "scripts/d_building_jan_26.csv",
    "scripts/d_building_mar_26.csv",
    "scripts/dc_meters_feb_26.csv",
    "scripts/dc_meters_jan_26.csv",
    "scripts/dc_meters_mar_26.csv",
    "scripts/test_water_upload.csv",
    "scripts/water-data-template.csv",
    "scripts/water-data-update.sql",
    "scripts/water-system-setup.sql",
    "seeds/data_2024_full.json",
    "seeds/data_2024_part1.json",
    "seeds/data_2025_part1.json",
    "seeds/water_2024_raw.tsv",
    "seeds/water_2025_raw.tsv",
    "seeds/water_meters_full.json",
    "seeds/water_meters_jan26.json",
  ],
};

const ALL_CATEGORIES = [...FILE_CATEGORIES, DATA_FILES_CATEGORY];

// ─── Summary stats ──────────────────────────────────────────────────────────
function computeStats(categories: FileCategory[]) {
  const totalFiles = categories.reduce((sum, c) => sum + c.files.length, 0);
  const extCounts: Record<string, number> = {};
  categories.forEach((c) =>
    c.files.forEach((f) => {
      const name = f.includes("—") ? f.split("—")[0].trim() : f;
      const ext = getExtension(name);
      if (ext) extCounts[ext] = (extCounts[ext] || 0) + 1;
    })
  );
  const topExts = Object.entries(extCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  return { totalFiles, totalCategories: categories.length, topExts };
}

// ─── CategoryCard component ─────────────────────────────────────────────────
function CategoryCard({
  category,
  searchQuery,
}: {
  category: FileCategory;
  searchQuery: string;
}) {
  const [expanded, setExpanded] = useState(false);

  const filteredFiles = useMemo(() => {
    if (!searchQuery) return category.files;
    const q = searchQuery.toLowerCase();
    return category.files.filter((f) => f.toLowerCase().includes(q));
  }, [category.files, searchQuery]);

  // Auto-expand when search matches
  const isAutoExpanded = searchQuery.length > 0 && filteredFiles.length > 0;
  const isOpen = expanded || isAutoExpanded;

  if (searchQuery && filteredFiles.length === 0) return null;

  const Icon = category.icon;

  return (
    <div
      className="glass-card group/card transition-all duration-300"
      style={{ borderLeft: `3px solid ${category.accentColor}` }}
    >
      {/* Card Header */}
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className="w-full flex items-center gap-4 p-4 sm:p-5 text-left hover:bg-gray-50/50 dark:hover:bg-white/[0.03] transition-colors rounded-t-xl"
        aria-expanded={isOpen}
      >
        {/* Icon container */}
        <div
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover/card:scale-105"
          style={{ backgroundColor: category.accentBg }}
        >
          <Icon className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: category.accentColor }} />
        </div>

        {/* Title + description */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100">
              {category.name}
            </h3>
            <Badge
              variant="secondary"
              className="text-[10px] sm:text-xs px-2 py-0.5 font-medium"
              style={{
                backgroundColor: category.accentBg,
                color: category.accentColor,
              }}
            >
              {filteredFiles.length} file{filteredFiles.length !== 1 ? "s" : ""}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 truncate">
            {category.description}
          </p>
          <p className="text-[10px] sm:text-xs text-muted-foreground/60 font-mono mt-0.5">
            {category.path}
          </p>
        </div>

        {/* Expand chevron */}
        <div className="flex-shrink-0 text-muted-foreground transition-transform duration-200">
          {isOpen ? (
            <ChevronDown className="w-5 h-5" />
          ) : (
            <ChevronRight className="w-5 h-5" />
          )}
        </div>
      </button>

      {/* Expanded file list */}
      {isOpen && (
        <div
          className="border-t border-gray-100 dark:border-slate-700/50 px-4 sm:px-5 pb-4 pt-3"
          style={{
            animation: "slideDown 0.25s ease-out forwards",
          }}
        >
          <ul className="space-y-1">
            {filteredFiles.map((file, i) => {
              const displayName = file.includes("—") ? file.split("—")[0].trim() : file;
              const label = file.includes("—") ? file.split("—")[1].trim() : null;
              const config = getFileConfig(displayName);
              const ext = getExtension(displayName);
              const FileIcon = config.icon;

              return (
                <li
                  key={`${category.id}-${file}-${i}`}
                  className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors group/file"
                  style={{
                    animationDelay: `${i * 20}ms`,
                    animation: "fadeInUp 0.3s ease-out forwards",
                    opacity: 0,
                  }}
                >
                  <FileIcon
                    className="w-4 h-4 flex-shrink-0 transition-transform group-hover/file:scale-110"
                    style={{ color: config.color }}
                  />
                  <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-mono truncate flex-1">
                    {displayName}
                  </span>
                  {label && (
                    <span className="text-[10px] sm:text-xs text-muted-foreground/70 hidden sm:inline">
                      {label}
                    </span>
                  )}
                  {ext && (
                    <span
                      className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wider flex-shrink-0"
                      style={{
                        backgroundColor: config.bgColor,
                        color: config.color,
                      }}
                    >
                      .{ext}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────
export default function FileOrganizerPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const stats = useMemo(() => computeStats(ALL_CATEGORIES), []);

  const visibleCategories = useMemo(() => {
    if (!searchQuery) return ALL_CATEGORIES;
    const q = searchQuery.toLowerCase();
    return ALL_CATEGORIES.filter((c) =>
      c.name.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.files.some((f) => f.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  return (
    <div className="space-y-6 sm:space-y-7 md:space-y-8 w-full">
      <PageHeader
        title="File Organizer"
        description="Browse and explore the complete application file structure"
      />

      {/* Summary Stats Bar */}
      <div className="glass-card p-4 sm:p-5 animate-in fade-in duration-500">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          {/* Total Files */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
              <FileCode2 className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                {stats.totalFiles}
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Total Files</p>
            </div>
          </div>

          {/* Categories */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center">
              <FolderOpen className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                {stats.totalCategories}
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Categories</p>
            </div>
          </div>

          {/* Divider */}
          <div className="hidden sm:block w-px h-10 bg-gray-200 dark:bg-slate-700" />

          {/* Top file types */}
          <div className="flex flex-wrap gap-2">
            {stats.topExts.map(([ext, count]) => {
              const config = getFileConfig(`file.${ext}`);
              return (
                <span
                  key={ext}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-medium transition-transform hover:scale-105"
                  style={{
                    backgroundColor: config.bgColor,
                    color: config.color,
                  }}
                >
                  <span className="uppercase font-semibold">.{ext}</span>
                  <span className="opacity-70">×{count}</span>
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Search & View Toggle */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search files, folders, or categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all"
            id="file-search-input"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              ×
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 bg-gray-100 dark:bg-slate-800 rounded-lg p-1">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-md transition-all ${
              viewMode === "grid"
                ? "bg-white dark:bg-slate-700 shadow-sm text-gray-900 dark:text-white"
                : "text-muted-foreground hover:text-gray-700 dark:hover:text-gray-300"
            }`}
            aria-label="Grid view"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-md transition-all ${
              viewMode === "list"
                ? "bg-white dark:bg-slate-700 shadow-sm text-gray-900 dark:text-white"
                : "text-muted-foreground hover:text-gray-700 dark:hover:text-gray-300"
            }`}
            aria-label="List view"
          >
            <FolderClosed className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search results count */}
      {searchQuery && (
        <p className="text-sm text-muted-foreground">
          Found{" "}
          <span className="font-semibold text-gray-900 dark:text-white">
            {visibleCategories.reduce(
              (sum, c) =>
                sum +
                c.files.filter((f) =>
                  f.toLowerCase().includes(searchQuery.toLowerCase())
                ).length,
              0
            )}
          </span>{" "}
          file{visibleCategories.length !== 1 ? "s" : ""} across{" "}
          <span className="font-semibold text-gray-900 dark:text-white">
            {visibleCategories.length}
          </span>{" "}
          categories
        </p>
      )}

      {/* Category Cards Grid */}
      <div
        className={
          viewMode === "grid"
            ? "grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5"
            : "flex flex-col gap-4"
        }
      >
        {visibleCategories.map((category, i) => (
          <div
            key={category.id}
            style={{
              animationDelay: `${i * 60}ms`,
              animation: "fadeInUp 0.4s ease-out forwards",
              opacity: 0,
            }}
          >
            <CategoryCard category={category} searchQuery={searchQuery} />
          </div>
        ))}
      </div>

      {/* Empty state */}
      {searchQuery && visibleCategories.length === 0 && (
        <div className="glass-card p-12 text-center">
          <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No files found
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            No files match &quot;{searchQuery}&quot;. Try a different search term.
          </p>
          <button
            onClick={() => setSearchQuery("")}
            className="text-sm font-medium text-secondary hover:underline"
          >
            Clear search
          </button>
        </div>
      )}

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            max-height: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            max-height: 2000px;
            transform: translateY(0);
          }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
