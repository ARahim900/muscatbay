/**
 * Module registry — the mobile counterpart of the web app's sidebar.
 *
 * Keys are `ModuleKey` values from `@/lib/rbac`, so navigation visibility is
 * driven by exactly the same role model as the website (and the same Supabase
 * RLS policies behind it). Adding a module here without adding it to
 * `ROLE_MODULES` on the web is a compile error, which is the point.
 *
 * Accent colours come from BRAND_DESIGN.md §2.8 and are used ONLY for the
 * module icon and its chart series — never for page chrome.
 */
import {
  Bug,
  Droplets,
  Flame,
  Package,
  Users,
  Waves,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react-native';

import type { ModuleKey } from '@/lib/rbac';
import { MODULE_COLORS } from '~/theme/tokens';

/** An embedded (WebView) view of a dense analytical page in the web app. */
export interface EmbeddedView {
  /** Stable id used in the `/embed/[view]` route. */
  id: string;
  title: string;
  /** Path on the web app, appended to WEB_APP_ORIGIN. */
  path: string;
  /** One line telling the operator why this one is not native yet. */
  note: string;
}

export interface ModuleDefinition {
  key: Exclude<ModuleKey, 'dashboard' | 'settings'>;
  title: string;
  /** What the module is for, in an operator's words. */
  blurb: string;
  icon: LucideIcon;
  accent: string;
  /** Dense pages that still render as the web app inside a WebView. */
  embeds: EmbeddedView[];
}

export const MODULES: ModuleDefinition[] = [
  {
    key: 'water',
    title: 'Water',
    blurb: 'Zone bulk vs sub-meter balance, system loss against the 15% target.',
    icon: Droplets,
    accent: MODULE_COLORS.water,
    embeds: [
      {
        id: 'water-monthly',
        title: 'Monthly water balance',
        path: '/water',
        note: 'A1/A2/A3 balance across every zone and month — a wide cross-tab that has no honest phone-native form yet.',
      },
      {
        id: 'water-daily',
        title: 'Daily consumption',
        path: '/water?tab=daily',
        note: 'Per-day, per-zone readings from the Grafana pipeline.',
      },
    ],
  },
  {
    key: 'electricity',
    title: 'Electricity',
    blurb: 'Meter-level consumption and load anomalies across the community.',
    icon: Zap,
    accent: MODULE_COLORS.electricity,
    embeds: [
      {
        id: 'electricity-meters',
        title: 'Meter table',
        path: '/electricity',
        note: 'Every meter against every billed month — a table too wide to make native yet.',
      },
    ],
  },
  {
    key: 'stp',
    title: 'STP Plant',
    blurb: 'Inlet sewage, TSE recovery for irrigation and tanker trips.',
    icon: Waves,
    accent: MODULE_COLORS.stp,
    embeds: [
      {
        id: 'stp-operations',
        title: 'Operations log',
        path: '/stp',
        note: 'The full daily operations log with its per-day breakdown.',
      },
    ],
  },
  {
    key: 'contractors',
    title: 'Contractors',
    blurb: 'Contract register, service scope and expiry exposure.',
    icon: Users,
    accent: MODULE_COLORS.contractors,
    embeds: [
      {
        id: 'contractors-register',
        title: 'Contract register',
        path: '/contractors',
        note: 'Full register with pricing columns and contract PDFs.',
      },
    ],
  },
  {
    key: 'hvac',
    title: 'HVAC',
    blurb: 'PPM findings, recurring issues and contractor communications.',
    icon: Wrench,
    accent: MODULE_COLORS.hvac,
    embeds: [
      {
        id: 'hvac-findings',
        title: 'PPM findings',
        path: '/hvac',
        note: 'Gulf Expert PPM findings with their filter and quotation views.',
      },
    ],
  },
  {
    key: 'assets',
    title: 'Assets',
    blurb: 'Asset register by category, condition and location.',
    icon: Package,
    accent: MODULE_COLORS.assets,
    embeds: [
      {
        id: 'assets-register',
        title: 'Asset register',
        path: '/assets',
        note: 'Full register with its multi-column filters.',
      },
    ],
  },
  {
    key: 'pest-control',
    title: 'Pest Control',
    blurb: 'Treatment coverage and reported activity across the community.',
    icon: Bug,
    accent: MODULE_COLORS.pest,
    embeds: [
      {
        id: 'pest-control',
        title: 'Pest control',
        path: '/pest-control',
        note: 'The web module in full.',
      },
    ],
  },
  {
    key: 'firefighting',
    title: 'Fire Safety',
    blurb: 'Equipment register, PPM activity and open safety issues.',
    icon: Flame,
    accent: MODULE_COLORS.fire,
    embeds: [
      {
        id: 'fire-equipment',
        title: 'Equipment & issues',
        path: '/firefighting',
        note: 'Equipment register, PPM schedule and quotations.',
      },
    ],
  },
];

export const MODULES_BY_KEY = new Map(MODULES.map((m) => [m.key as string, m]));

export function findEmbeddedView(id: string): { module: ModuleDefinition; view: EmbeddedView } | null {
  for (const module of MODULES) {
    const view = module.embeds.find((e) => e.id === id);
    if (view) return { module, view };
  }
  return null;
}
