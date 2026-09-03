# Muscat Bay web app — technical quality audit

**Date:** 2026-09-03 · **Scope:** `muscatbay/app` (routes, components, hooks, lib, functions) plus a one-paragraph look at `mobile/` · **Method:** static code review, all findings verified in source; repo checks run on a clean install (`eslint` 0 errors, `tsc --noEmit` clean, Vitest 334/334); the design ESLint rule additionally run over every folder to measure migration debt.

This is a code-level audit, not a design critique. Nothing was fixed; each finding names the command that should address it.

---

## Audit Health Score

| # | Dimension | Score | Key finding |
|---|-----------|-------|-------------|
| 1 | Accessibility | 3 | Seven design-system selects/inputs remove the focus outline with no replacement; teal `#A1D1D5` used as text on light surfaces (1.67:1) |
| 2 | Performance | 3 | Every realtime row change triggers a full multi-page refetch with no debounce |
| 3 | Responsive Design | 3 | Dialogs sit at `z-50` beneath the `z-[100]` mobile dock |
| 4 | Theming | 2 | Two token systems coexist; legacy `@theme` block silently shadows three v2 tokens; 1,280 design-rule violations outside Water |
| 5 | Anti-Patterns | 1 | Two live tickers, four KPI tile styles, cursor glow on every tile, a gradient + WebGL + glass login panel |
| **Total** | | **12/20** | **Acceptable (significant work needed)** |

---

## Anti-Patterns Verdict

**Fail on the project's own rules; pass on "does this read as generic AI output".** The module pages (Water, STP, Electricity, HVAC, Fire, Contractors, Assets) do not look AI-generated: no emoji, no gradient text, no glow blobs, no bounce easing, sparklines carry real trend data, icons are 16/20 px, fonts are declared once. The two most-seen screens are the problem:

- **Tickers still exist** on the Dashboard (`app/page.tsx:283` via `components/dashboard/dashboard-ticker.tsx:165`) and STP Plant Watch (`components/stp/plant-watch.tsx:336`). `DESIGN_SYSTEM.md` §7 orders their removal and CLAUDE.md rule 7 says they "do not exist". Water removed its own copy, so the app is now inconsistent with itself.
- **Hero-metric template** on the command deck (`components/dashboard/command-deck.tsx:238-300`): 11 px uppercase label, count-up number, `bg-white/10` hairline lattice, cursor-tracked teal sheen.
- **Four KPI tile styles** while the design system says one: `StatsGrid` (canonical), the deck cell, `SummaryStat` in `components/shared/findings-register.tsx:132-137` (3 px coloured top stripe), `HealthCard` in `components/shared/inspection.tsx:160`. `components/shared/hierarchy-stat-card.tsx` is dead code awaiting deletion approval.
- **Login page** (`app/login/page.tsx:202-283`): diagonal gradient, radial overlay, Three.js particle field, glass logo tile, four identical translucent feature rows with coloured left rails, `shadow-lg shadow-primary/25` button, "Welcome back". Everything the aesthetic direction lists as an anti-reference, on one screen.
- **Decorative glow** `.mb-glow` (`app/globals.css:1178-1207`) on every KPI tile, deck cell and dashboard chart card, self-described in the CSS as "decorative only".

---

## Executive Summary

- **Audit Health Score: 12/20 (Acceptable).**
- **Issues:** 0 P0 · 12 P1 · 19 P2 · 9 P3.
- **Top five**
  1. Focus outline removed on the design-system select and six Water controls, with no `focus-visible` ring (WCAG 2.4.7).
  2. Legacy `@theme inline` block in `globals.css` (lines 60, 71, 88) redefines `--color-primary`, `--color-card`, `--color-sidebar` after `design-tokens.css`, so edits to the v2 tokens for those three never take effect.
  3. Realtime hook fires a full refetch per changed row (`hooks/useSupabaseRealtime.ts:107-132`); a nightly sync of hundreds of rows means hundreds of overlapping fetches on every open tablet.
  4. Dialogs render under the mobile dock (`components/ui/dialog.tsx:33,53` `z-50` vs `components/layout/bottom-nav.tsx:388` `z-[100]`), and `DialogContent` has no `max-h`/scroll so the contract PDF dialog clips its footer on phones.
  5. Saturated legacy status hexes (`#22c55e`, `#f59e0b`, `#ef4444`, `app/globals.css:196-199`) have no dark override and colour the icon and status glyph on the app-wide KPI tile; at 2.2:1 on white they fail non-text contrast in light mode.
- **Next steps:** run `/harden` (focus rings, dialog stacking, refetch debounce), then `/normalize` (collapse the two token systems, retire the tickers and extra KPI tiles), then `/adapt` (touch widths, satellite iframe), then `/polish`.

---

## Detailed Findings by Severity

### P1 — Major (fix before release)

**[P1] Focus outline removed with no replacement**
- Location: `components/ui/date-range-picker.tsx:45` (shared `select` class, used at :72, :81); `components/water/monthly/water-monthly-dashboard.tsx:193, 539, 1173`; `components/water/daily-report/daily-database.tsx:57`; `components/water/daily-report/inline-shared.tsx:269, 322`
- Category: Accessibility
- Impact: `outline-none` is a utility and beats both `@layer base` fallbacks (`design-tokens.css:172`, `globals.css:1452-1465`), so keyboard and switch users have no visible focus on these controls. This is on the one migrated page.
- WCAG: 2.4.7 Focus Visible
- Recommendation: replace `outline-none` with `focus-visible:ring-2 focus-visible:ring-ring`, as `daily-water-report.tsx:105` already does.
- Suggested command: `/harden`

**[P1] Teal `#A1D1D5` used as text on light surfaces (1.67:1)**
- Location: `app/electricity/page.tsx:831`; `app/contractors/page.tsx:1057`; `app/page.tsx:388`; `components/shared/findings-register.tsx:368, 420`; `components/firefighting/firefighting-ui.tsx:42, 51`; `components/layout/topbar.tsx:157`; `components/layout/bottom-nav.tsx:226, 319`; `app/login/page.tsx:228`
- Category: Accessibility
- Impact: captions, "Clear filters" buttons and role labels are unreadable in light mode for executives. The codebase already knows the rule (`--secondary-foreground: #1F2937`); these are leaks. Dark-mode uses pass (11.9:1).
- WCAG: 1.4.3 Contrast (Minimum)
- Recommendation: swap `text-secondary` on light surfaces for `text-secondary-foreground` or `text-muted`.
- Suggested command: `/harden`

**[P1] Saturated legacy `--status-*` tokens on the KPI tile, no dark variant**
- Location: `app/globals.css:196-199`; consumed by `components/shared/stats-grid.tsx:54-57, 67-72`, `components/ui/toast-provider.tsx:31-49`, `components/shared/empty-state.tsx:28-38`; 55 uses app-wide
- Category: Theming / Accessibility
- Impact: the tile icon and status glyph render at 2.15–2.28:1 on white. A text label always sits alongside, so it is not colour-only, but the glyph is the promised shape cue and is nearly invisible in light mode. `DESIGN_SYSTEM.md` §2.2 specifies muted `#2E7D42` / `#9A6B00` / `#B03A2E`, which pass.
- WCAG: 1.4.11 Non-text Contrast
- Recommendation: repoint `--status-normal/warning/danger/info` at `--color-success/warning/danger/info`; fixes every page at once and gains dark variants.
- Suggested command: `/normalize`

**[P1] `text-white/40–/55` body text on sidebar and deck**
- Location: `components/dashboard/command-deck.tsx:170, 235, 249, 266, 319`; `components/layout/sidebar.tsx:222, 248`
- Category: Accessibility
- Impact: 2.9–4.3:1 on `#4E4456` / `#423846` at 10–11 px. Night-shift operators on dimmed tablets lose the "vs prev." and role labels. `/65` and above pass everywhere.
- WCAG: 1.4.3
- Recommendation: raise to `text-white/70` minimum; use `text-caption` size.
- Suggested command: `/harden`

**[P1] Ticker strips still mounted, and no touch-reachable pause**
- Location: `components/shared/inspection.tsx:255-282`; `app/globals.css:1616-1713`; mounted at `app/page.tsx:283` and `components/stp/plant-watch.tsx:336`
- Category: Anti-Pattern / Accessibility
- Impact: a 36 s infinite marquee pauses only on `:hover`/`:focus-within`, which tablets do not have. Also the rule-7 violation above.
- WCAG: 2.2.2 Pause, Stop, Hide
- Recommendation: remove both tickers per `DESIGN_SYSTEM.md` §7; render the same figures as a static `StatsGrid` row (Electricity already did this on 2026-09-03).
- Suggested command: `/distill`

**[P1] Dialogs stack beneath the mobile dock**
- Location: `components/ui/dialog.tsx:33, 53` (`z-50`); `components/layout/bottom-nav.tsx:388` (`z-[100]`), :199 (`z-[95]`), :207 (`z-[97]`)
- Category: Responsive
- Impact: on phones the contract PDF dialog (`app/contractors/page.tsx:1172`) and asset text dialog (`components/assets/truncated-text.tsx:71`) have the dock floating over their footer; the dock intercepts taps meant for dialog buttons.
- Recommendation: raise dialog overlay and content above `z-[100]`, or hide the dock while a dialog is open.
- Suggested command: `/harden`

**[P1] `DialogContent` has no height cap or internal scroll**
- Location: `components/ui/dialog.tsx:53`; worst case `app/contractors/page.tsx:1172` (`max-h-[90vh]`, no `overflow-y-auto`, inner `iframe h-[65vh]` at :1236)
- Category: Responsive
- Impact: header + search + 65vh iframe + footer inside `p-6` exceeds 90vh on a 667 px phone; footer is clipped. Every future dialog inherits the gap.
- Recommendation: add `max-h-[calc(100dvh-2rem)] overflow-y-auto` to the base `DialogContent`.
- Suggested command: `/harden`

**[P1] Realtime change triggers a full refetch per row, no debounce**
- Location: `hooks/useSupabaseRealtime.ts:107-132`; `app/water/page.tsx:354-359` → `functions/api/water.ts:220-420`
- Category: Performance
- Impact: a batch insert of N rows fires N overlapping full fetches (count + parallel 1000-row pages) on every open tablet, with out-of-order `setState` risk on slow Wi-Fi.
- Recommendation: coalesce in the hook with a ~500 ms trailing debounce and drop duplicates while a fetch is in flight.
- Suggested command: `/optimize`

**[P1] Electricity reader downloads the whole readings history; STP `.limit(1500)` is silently capped**
- Location: `functions/api/electricity.ts:59-78` (no month predicate; filtered client-side at `app/electricity/page.tsx:352-380`); `functions/api/stp.ts:21-25` (`.limit(1500)` exceeds PostgREST's 1000-row `max_rows`)
- Category: Performance
- Impact: every Electricity visit moves the entire history; STP may truncate silently, the exact bug the electricity file's own comment warns about.
- Recommendation: server-side month range filter for electricity; `.range()` pagination in `stp.ts` (the pattern `water.ts:225-243` already uses).
- Suggested command: `/optimize`

**[P1] Legacy `@theme` block shadows three v2 tokens**
- Location: `app/globals.css:60` (`--color-primary: var(--primary)`), :71 (`--color-card: var(--card)`), :88 (`--color-sidebar: var(--sidebar)`), declared after the `design-tokens.css` import at :11
- Category: Theming
- Impact: values match today, so nothing is visibly wrong, but any edit to those three in `design-tokens.css` is silently ignored. 212 legacy custom properties (`:root` :157-386, `.dark` :386-484) sit beside ~50 v2 tokens; only discipline prevents drift.
- Recommendation: delete the three shadowing lines or alias them to the v2 tokens.
- Suggested command: `/normalize`

**[P1] Chart series colours are not theme-aware**
- Location: `app/design-tokens.css:127-133` (`--color-chart-1: #4E4456`, no `.dark` value); legacy `--chart-1…4`, `--chart-loss`, `--chart-brand` at `app/globals.css:134-155` with only `--chart-5` and `--chart-axis` redefined in `.dark`
- Category: Theming
- Impact: brand purple `#4E4456` on dark card `#16141B` is ~1.6:1; primary-series bars vanish in the control room's primary theme. `components/ui/chart-frame.tsx:21-37` reads `var(--color-*)` at paint time, so a token fix propagates automatically.
- Recommendation: add `.dark` values for the chart series (e.g. `--mb-purple-light` or a lifted violet for series 1).
- Suggested command: `/colorize`

**[P1] Four KPI tile implementations against a one-tile rule**
- Location: `components/shared/stats-grid.tsx:124` (canonical); `components/dashboard/command-deck.tsx:238-300`; `components/shared/findings-register.tsx:132-137`; `components/shared/inspection.tsx:160`; dead `components/shared/hierarchy-stat-card.tsx`
- Category: Anti-Pattern
- Impact: CLAUDE.md rule 5 and `DESIGN_SYSTEM.md` §6 require one tile. Each extra style is a second place for colour, size and status rules to drift.
- Recommendation: render deck cells and `SummaryStat` through `StatsGrid`; delete `hierarchy-stat-card.tsx` once the owner approves.
- Suggested command: `/extract`

### P2 — Minor (fix in next pass)

**[P2] Muted text on `bg-component` at 4.31:1 in light mode** — `design-tokens.css:23, 26`; hit on hover in `components/ui/mb-button.tsx:18`, `inline-shared.tsx:292, 308`, `components/water/date-range-picker.tsx:467`. Transient. Bump `--mb-muted-l` to `#616874`. WCAG 1.4.3. `/harden`

**[P2] Recharts charts without a text alternative** — 14 chart files, only 6 wrap in `role="img"` + `aria-label`; `components/ui/chart-frame.tsx` adds none. Electricity/STP/HVAC trend charts have no adjacent table. WCAG 1.1.1. Add `role="img"` and an `aria-label` slot to `ChartFrame`. `/harden`

**[P2] Weak focus rings** — 14× `focus:ring-primary/30` (~1.9:1 on white), 6× `focus-visible:ring-primary/50` in `components/shared/tab-navigation.tsx:248, 297`. Global `--ring #4A8E93` passes; prefer `ring-ring`. WCAG 1.4.11. `/harden`

**[P2] Heading hierarchy skips** — `app/electricity/page.tsx:926` h1→h3; `app/firefighting/page.tsx:791` orphan h4; `components/shared/stats-grid.tsx:164` renders every KPI value as `<h3>` (design system says `<p>`, never a heading). WCAG 1.3.1. `/typeset`

**[P2] Tables without caption or `aria-label`** — `components/contractors/renewals.tsx:233`, `components/contractors/pricing.tsx:134`, `components/hvac/overview-tab.tsx:278`. Water tables do this correctly. `/harden`

**[P2] Custom listbox mis-described** — `components/shared/data-table/multi-select-dropdown.tsx:124-166`: `role="option"` on `<label>`, no Escape, no arrow keys. `command-palette.tsx:133-147` shows the right pattern. `/harden`

**[P2] Icon-only controls 28–32 px wide on tablets** — the coarse-pointer floor (`globals.css:1424-1445`) enforces height only. `components/alerts/alerts-feed.tsx:211-216` (`w-8`), `components/layout/sidebar.tsx:229` (`w-7`, visible exactly on the 768–1024 band), `components/water/daily-report/inline-shared.tsx:276, 291-292, 322`. Gloved users miss. Add `min-inline-size: 44px` for icon-only buttons on coarse pointers. `/adapt`

**[P2] Slider thumbs 20×20 with no touch floor** — `components/water/date-range-picker.tsx:165, 184, 198` (`role="slider"` is not in the global selector list, track is `touch-none`). `/adapt`

**[P2] Satellite iframe has no media queries** — `public/satellite/index.html`: zero `@media`; `#left` fixed 280 px (:189); embed fixed 720 px (`design-tokens.css:160`). On a 768 px tablet the panel takes 36 % of the map; on phones the frame exceeds the viewport under topbar + dock. `PROJECT_STATUS.md` records the responsive Stage 3 as unmerged. `/adapt`

**[P2] 140 uses of `text-[10px]`/`text-[11px]`** — e.g. `stats-grid.tsx:161, 195, 212`, `plant-watch.tsx:181-198`, `command-deck.tsx:249-252`, `topbar.tsx:69`. Below the 11 px floor and the `text-caption` step; hard to read in night-shift lighting. `/typeset`

**[P2] Demo-data module bundled and executed on live pages** — `lib/mock-data.ts:199, 230` runs generators at module evaluation and adds 400–700 ms artificial delays (:407-433); statically imported by `app/electricity/page.tsx:4`, `app/stp/page.tsx:4`, `app/assets/page.tsx:4`, `hooks/useDashboardData.ts:5`. Lazy-import behind the `!configured` branch. `/optimize`

**[P2] Layout-property transitions on the chrome** — `components/layout/sidebar.tsx:174` `transition-[width]`, `client-layout.tsx:39` `transition-[margin-inline-start]`, `topbar.tsx:57` `transition-[inset-inline-start]`, plus `globals.css:863` `will-change: inset-inline-start` (non-compositable, buys nothing). Whole-page reflow for 200 ms on collapse. `/optimize`

**[P2] Unmemoised derived arrays in large renders** — `components/water/monthly/water-monthly-dashboard.tsx:559-562, 722-725` and inline `data={…map()}` at :624, 787, 943, 1097 (defeats Recharts' shallow memo, re-animates on every tab switch); `app/contractors/page.tsx:65-97, 503-505`. `/optimize`

**[P2] Infinite animations never pause offscreen** — `.mb-ticker-track` (`globals.css:1631`) and `pulse-dot` animating `box-shadow` (`globals.css:1210-1216`, paint not composite). Constant compositing on battery tablets. `/optimize`

**[P2] Cursor-tracked glow and arbitrary hover shadows on tiles** — `.mb-glow` (`globals.css:1178-1207`) on `stats-grid.tsx:218`, `command-deck.tsx:286`, four uses in `dashboard-charts.tsx`; `hover:shadow-[0_6px_18px_-10px_…]` at `stats-grid.tsx:218` breaks the two-shadow rule. `/quieter`

**[P2] Login marketing panel** — `app/login/page.tsx:202-283, 364, 407, 427`: gradient, radial overlay, WebGL field (well-contained: lg-only, low-power, disposed), glass tile, four identical feature rows with left rails, glowing inputs and button. `/distill`

**[P2] Nested cards** — `app/firefighting/page.tsx:371→387, 651→661, 772→789`; `app/settings/page.tsx:332→365, 388→455`; `components/dashboard/command-deck.tsx:161/213`. `/arrange`

**[P2] Hard-coded shadows on shared chrome** — `stats-grid.tsx:218`, `topbar.tsx:57`, `bottom-nav.tsx:392` (`shadow-[…]` with literal rgba + `dark:shadow-[…]`); `shadow-card` already flips per theme. `/normalize`

**[P2] Status tokens used as saturated backgrounds** — `app/assets/page.tsx:204-205` progress bars `bg-[var(--status-danger)]`; `bottom-nav.tsx:435`, `notification-bell.tsx:67` badge fills. `/normalize`

**[P2] Design-rule debt: 1,280 violations in 85 files outside Water** — measured with the repo's own `eslint.design-rules.mjs` over every folder. By rule: raw type sizes 565, arbitrary values 408, stock shadow/radius 307. By folder: `components/shared` 231, `components/layout` 97, `app/contractors` 88, `components/hvac` 81, `app/firefighting` 75, `app/stp` 65, `components/electricity` 60. **`components/shared` and `components/layout` are not on the migration schedule** in `eslint.config.mjs:15-18`, yet Water depends on them, so Water can regress through them. `/normalize`

**[P2] Mobile app is a fork of the pre-v2 palette** — `mobile/src/global.css` and `mobile/src/theme/tokens.ts` transcribe the legacy `#22c55e`-style status colours and cite the superseded `BRAND_DESIGN.md` as authoritative; five stray hexes. The v2 status colours will not reach mobile without manual re-transcription. `/normalize`

### P3 — Polish

- **Unused dependencies and orphan asset** — `react-is`, `dotenv` not imported; `@types/three` in `dependencies`; `public/admin-profile.png` (328 kB) unreferenced; `public/logo.png` and `mb-logo.png` 168 kB each precached raw by `public/sw.js:49`. `/optimize`
- **One realtime channel per alert rule** — `hooks/useNotifications.ts:294-316`; `useSupabaseRealtime` already shows the one-channel pattern. `/optimize`
- **Unguarded `animate-spin`/`animate-in`** in 13 places (`app/login/page.tsx:328, 336`, `app/settings/page.tsx:324`) — safe because of the global kill-switch, inconsistent with the `motion-safe:` convention. `/animate`
- **Toasts auto-dismiss with no hover-to-persist** — `components/ui/toast-provider.tsx:59-63`. `/harden`
- **Skeleton blocks stack to 600 px+ on phones** — `components/shared/skeleton.tsx:111`, `app/page.tsx:46-47, 103-104`. `/adapt`
- **Chart heights as literals** — `components/stp/stp-trend-charts.tsx:109, 150, 181` instead of `h-chart`/`h-chart-lg`. `/normalize`
- **Two versions of two primitives** — `components/ui/button.tsx` + `mb-button.tsx`, `badge.tsx` + `mb-badge.tsx`; Water renders two `variant="primary"` Export buttons in one view (`water-monthly-dashboard.tsx:1166, 1323`), breaking rule 6 on the migrated page. `/extract`
- **Third status vocabulary** — `components/shared/data-table/status-badge.tsx:33-51` uses `--badge-green/red/amber/blue` beside `--status-*` and `--color-success*`; dead `lib/config.ts:107-116` `CHART_COLORS` carries saturated hexes and an off-brand gold. `/normalize`
- **Redundant copy and stale comments** — subtitles restating titles (`app/stp/page.tsx:964-965`, `app/contractors/page.tsx:661-662`, `app/electricity/page.tsx:732`, `app/page.tsx:174`); comments still cite Inter (`page-header.tsx:59`, `command-deck.tsx:174`, `globals.css:377`). `/clarify`

---

## Patterns & Systemic Issues

1. **Two token systems, one enforcement scope.** Every non-Water page reads from 212 legacy custom properties while the design system defines ~50. The design lint covers Water only, and the shared/layout folders Water depends on are not scheduled for it. This is the root of the theming, most contrast and most anti-pattern findings.
2. **Saturated Tailwind-500 status colours survive in the legacy layer** (`#22c55e`, `#f59e0b`, `#ef4444`, `#3b82f6`, `#10B981`, `#f97316`) and reach the KPI tile, toasts, empty states and mobile. One token repoint fixes them all.
3. **Height-only touch floor.** The coarse-pointer rule enforces 44 px height but not width, so every icon-only control is tall and narrow on tablets.
4. **Stacking contexts assigned ad hoc.** Dock 100, sheet 97, backdrop 95, dialog 50, with no z-index scale in the tokens.
5. **Readers fetch everything, filter in the browser.** Electricity and (capped) STP mirror the pre-fix water reader; the water fix (`count` + `.range()` pages) is the template.
6. **Migration sequence leaves the most-seen screens last.** Login is not on the schedule at all, and the Dashboard is second; both carry the heaviest anti-pattern load.

---

## Positive Findings

- **Accessibility floor is well above typical.** 44 px coarse-pointer minimum on every interactive role (`globals.css:1421-1440`); real ARIA tabs with roving tabindex, arrow keys and a `<select>` fallback (`components/shared/tab-navigation.tsx:187-293`); hand-rolled focus trap, Escape, `inert` on the mobile sheets (`bottom-nav.tsx:143-190`); 57 live regions; `scope="col"` by default on every `TableHead`; sortable headers are real buttons inside `<th aria-sort>`; every input labelled; skip link; every iframe titled. Zero clickable divs without a role.
- **Never colour-only is enforced in code**, with comments citing 1.4.1 (`stats-grid.tsx:62-73`, `status-chip.tsx`, `SeverityLegend`).
- **Reduced motion is respected everywhere**: `lib/motion.ts:39` checked at animation time in all seven GSAP files, `useChartMotion` on every Recharts series, a CSS kill-switch (`design-tokens.css:174`).
- **Zero Tailwind palette classes** anywhere in the web app; zero `select('*')`; zero `<img>`; zero literal colours in inline `style` (except the CSS-less `global-error.tsx`, which is deliberate).
- **Performance discipline is documented, not accidental**: paginated readers past the 1000-row cap (`water.ts`, `gulf-expert.ts`, `assets.ts`), `next/dynamic` with sized skeletons for every chart-heavy view and maplibre, Three.js gated to lg + not Data Saver + not reduced-motion and disposed on unmount, rAF-throttled pointer handling, `@tanstack/react-virtual` on the long tables, `.card-elevated` transitioning only `box-shadow` with a comment saying why.
- **Service worker is correct for days-long control-room sessions**: network-first navigation, cache-first only for content-hashed `/_next/static`, auth and API never cached, versioned purge, update check every 30 min and on `visibilitychange`.
- **`design-tokens.css` is well-built**: raw → semantic → `@theme inline static` layering, `@custom-variant dark` bound to the class, AA-verified status pairs, shadows that flip per theme; `ChartFrame` resolves colours at paint time so a theme toggle needs no re-render.
- **Water is genuinely clean**: 0 design-rule hits, correct captions on all six tables, `rounded-pill`/`shadow-card`/`text-caption` throughout.
- **Repo checks are green** on a clean install: ESLint 0 errors, `tsc --noEmit` clean, 334/334 tests.

---

## Recommended Actions

1. **[P1] `/harden`** — restore `focus-visible` rings on the seven `outline-none` controls; fix teal-on-light and `text-white/40–55` contrast; raise dialog z-index above the dock and give `DialogContent` a `max-h` + `overflow-y-auto`; add `role="img"` + `aria-label` to `ChartFrame`; captions on the three uncaptioned tables.
2. **[P1] `/optimize`** — debounce the realtime refetch in `useSupabaseRealtime`; server-side month filter for `electricity.ts` and `.range()` in `stp.ts`; lazy-import `lib/mock-data.ts`; pause infinite animations offscreen; drop the layout-property transitions and the useless `will-change`.
3. **[P1] `/normalize`** — remove the three shadowing `--color-*` lines in `globals.css`; repoint legacy `--status-*` at the v2 status tokens; add `components/shared/**` and `components/layout/**` to the design-lint scope now; replace hard-coded shadows with `shadow-card`; retire the third status vocabulary and dead `CHART_COLORS`.
4. **[P1] `/distill`** — remove the Dashboard and STP tickers per `DESIGN_SYSTEM.md` §7; flatten the login panel to the "capability list, no figures" the 2026-07-25 review already called for.
5. **[P1] `/extract`** — route the deck cell and `SummaryStat` through `StatsGrid`; delete `hierarchy-stat-card.tsx` and the duplicate `button`/`badge` primitives once the owner approves.
6. **[P1] `/colorize`** — add dark-mode values for the chart series tokens so purple series stop vanishing on dark cards.
7. **[P2] `/adapt`** — add `min-inline-size: 44px` for icon-only controls on coarse pointers and include `[role="slider"]`; media queries for the satellite `#left` panel and a shorter embed below `md`.
8. **[P2] `/typeset`** — replace the 140 `text-[10px]`/`[11px]` with `text-caption`; KPI values as `<p>` not `<h3>`; fix the two heading skips.
9. **[P2] `/quieter`** — strip `.mb-glow` and the arbitrary hover shadow from tiles and chart cards.
10. **[P2] `/arrange`** — flatten the nested cards on Fire Safety, Settings and the deck.
11. **[P3] `/clarify`** — remove subtitles that restate titles; correct the stale Inter comments.
12. **`/polish`** — final pass after the above, then re-run `/audit`.
