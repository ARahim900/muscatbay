# Muscat Bay App Technical Audit (2026-04-26)

## Scope
- Repository area audited: `muscatbay/app` (Next.js 16 + React 19 app).
- Checks run: lint, unit tests, production build, and targeted source inspection for a11y/responsive/theming/performance.

## Audit Health Score

| # | Dimension | Score (0-4) | Key Finding |
|---|-----------|-------------|-------------|
| 1 | Accessibility | 2 | Sortable table headers rely on `onClick` in header cells without keyboard interaction support in electricity DB table. |
| 2 | Performance | 2 | React lint errors indicate synchronous state updates in effects and ref access during render, creating avoidable render churn. |
| 3 | Responsive Design | 3 | Mobile touch-target effort is visible (`min-h-[44px]` in water filters), but several wide/sticky table patterns still risk cramped UX on small screens. |
| 4 | Theming | 3 | Tokenized CSS variables exist, but multiple feature files still include direct hex fallbacks / hard-coded colors. |
| 5 | Anti-Patterns | 3 | Interface is mostly domain-specific and non-generic; minor visual-template traces remain in loader/splash gradient patterns. |
| **Total** |  | **13/20** | **Acceptable (significant work needed)** |

## Anti-Patterns Verdict
**Pass with caveats.** The app does **not** read as obvious “AI slop” overall; it is operationally grounded and module-rich. However, there are isolated generic decorative patterns (e.g., gradient/loader flourish usage) that do not add functional value.

## Executive Summary
- Audit Health Score: **13/20 (Acceptable)**.
- Issue distribution: **P0: 0, P1: 4, P2: 4, P3: 2**.
- Top concerns before broader rollout:
  1. Lint gate is failing with 3 errors tied to render/effect anti-patterns.
  2. Unit test suite is failing (2 tests), revealing unstable asset ID transformation.
  3. Production build depends on fetching Google Fonts at build time; build fails in restricted/offline environments.
  4. Keyboard accessibility gaps exist on sortable headers using click-only table-head interactions.

## Detailed Findings by Severity

### P1 (Major)

#### [P1] React hook lint errors block CI quality gate
- **Location**: `app/page.tsx` (`useRef(...).current` read in render), `components/layout/topbar.tsx` (`setMounted(true)` in effect), `components/water/meter-table.tsx` (`setPage(1)` in effect).
- **Category**: Performance / Stability.
- **Impact**: Increases risk of render-loop regressions and inconsistent hydration/runtime behavior; also blocks “lint as gate” pipelines.
- **Standard**: React hook rules / lint compliance.
- **Recommendation**: Refactor these three patterns to avoid synchronous setState in mount effects and avoid render-time ref access patterns flagged by lint.
- **Suggested command**: `/optimize`.

#### [P1] Unit tests failing due to nondeterministic asset IDs
- **Location**: `entities/asset.ts` (`id: db.asset_uid || String(Math.random())`), failing assertions in `__tests__/lib/supabase.test.ts`.
- **Category**: Reliability / Data integrity.
- **Impact**: Same record can get different IDs across runs, causing flaky tests and potentially unstable keyed rendering/client cache behavior.
- **Standard**: Deterministic data transformation expectation.
- **Recommendation**: Use a deterministic fallback (e.g., stable DB ID, asset tag, or hashed composite) instead of `Math.random()`.
- **Suggested command**: `/harden`.

#### [P1] Production build fails when Google Font cannot be fetched
- **Location**: `app/layout.tsx` imports `DM_Sans` via `next/font/google`.
- **Category**: Performance / Delivery resilience.
- **Impact**: Build pipeline can fail in restricted networks/CI without internet; reduces deployment robustness.
- **Standard**: Build reproducibility.
- **Recommendation**: Vendor/local font fallback via `next/font/local`, or ensure CI has outbound access + fallback style strategy.
- **Suggested command**: `/harden`.

#### [P1] Sortable table headers are mouse-first and not keyboard-first
- **Location**: `app/electricity/page.tsx` sortable `TableHead` cells use `onClick` without button semantics.
- **Category**: Accessibility.
- **Impact**: Keyboard and assistive-tech users cannot reliably trigger sort interactions.
- **WCAG/Standard**: WCAG 2.1.1 Keyboard; WCAG 4.1.2 Name/Role/Value.
- **Recommendation**: Wrap sortable labels in `<button>` (or equivalent control), preserve visible focus states, expose `aria-sort` state.
- **Suggested command**: `/harden`.

### P2 (Minor)

#### [P2] Warning debt is high (65 lint warnings)
- **Location**: Multiple files across `app/`, `components/`, `hooks/`, `functions/`.
- **Category**: Code quality / maintainability.
- **Impact**: Real issues get buried; developers ignore lint over time.
- **Recommendation**: Triage warnings batch-wise (unused imports, hook deps, unused disable comments) and enforce warning budget.
- **Suggested command**: `/polish`.

#### [P2] Hard-coded color literals coexist with tokens
- **Location**: `lib/water-data.ts`, `components/ui/splash-screen.tsx`, `components/ui/loading-overlay.tsx`, plus fallback literals in feature modules.
- **Category**: Theming consistency.
- **Impact**: Theme drift risk (light/dark and brand consistency), harder global palette updates.
- **Recommendation**: Route UI-facing colors through CSS variables/tokens; reserve hard-coded values for non-UI constants only.
- **Suggested command**: `/normalize`.

#### [P2] Dense sticky data tables likely degrade mobile usability
- **Location**: Water/Electricity table modules with multiple fixed min-width columns and sticky columns.
- **Category**: Responsive design.
- **Impact**: Horizontal scroll and cognitive load on tablet/mobile, especially field use.
- **Recommendation**: Use adaptive column priority, responsive row details, or card/list fallback at smaller breakpoints.
- **Suggested command**: `/adapt`.

#### [P2] Minor touch-target inconsistencies in non-water modules
- **Location**: Water filters include 44px minimums, but pattern not consistently enforced app-wide.
- **Category**: Accessibility / Responsive.
- **Impact**: Inconsistent tap ergonomics for tablet/on-site operators.
- **WCAG/Standard**: Target size best-practice (WCAG 2.5.5 AAA advisory).
- **Recommendation**: Standardize interactive density token/class for minimum control height.
- **Suggested command**: `/normalize`.

### P3 (Polish)

#### [P3] Decorative loader/splash effects can be simplified
- **Location**: `components/ui/splash-screen.tsx`, `components/ui/loading-overlay.tsx`.
- **Category**: Anti-pattern / polish.
- **Impact**: Slightly more visual noise than needed for operations-first context.
- **Recommendation**: Keep motion minimal and information-centric for control-room readability.
- **Suggested command**: `/quieter`.

#### [P3] Inconsistent data color constants between config and design context
- **Location**: `lib/config.ts` uses `#81D8D0` while design context emphasizes `#00D2B3` secondary.
- **Category**: Theming / system consistency.
- **Impact**: Slight brand inconsistency between modules.
- **Recommendation**: Consolidate to one canonical secondary token and migrate references.
- **Suggested command**: `/normalize`.

## Patterns & Systemic Issues
1. **Determinism gap in data mapping**: random IDs in transforms indicate schema-to-UI mapping lacks strict identity rules.
2. **Quality gate fragility**: lint/test/build each have blockers, suggesting pre-merge gates are not yet green by default.
3. **Design-system drift risk**: tokens are present, but direct color literals are still common in feature code.
4. **Table-first interaction model**: data-heavy tables are strong on desktop but need stronger adaptive patterns for field/tablet usage.

## Positive Findings
- Strong modular architecture across domain pages (water, electricity, STP, assets, contractors).
- Good evidence of accessibility intent: meaningful `aria-label` usage and explicit 44px controls in key water interactions.
- Theme foundations are solid with comprehensive CSS variable token setup in global styles.
- Existing automated tests are present and substantial (44 tests), providing a baseline for safe refactoring.

## Recommended Actions (Priority Order)
1. **[P1] `/harden`** — Fix deterministic IDs, keyboard-sort semantics, and resilient font/build strategy.
2. **[P1] `/optimize`** — Resolve render/effect lint errors and high-impact hook anti-patterns.
3. **[P2] `/adapt`** — Redesign dense data tables for mobile/tablet workflows without losing operator speed.
4. **[P2] `/normalize`** — Replace hard-coded UI colors with design tokens and unify secondary accent definitions.
5. **[P2] `/polish`** — Burn down warning debt and clean stale eslint-disable directives.
6. **[P3] `/quieter`** — Tone down non-essential decorative loading visuals.
7. **[P2] `/audit`** — Re-run technical audit after fixes to recalculate score.
