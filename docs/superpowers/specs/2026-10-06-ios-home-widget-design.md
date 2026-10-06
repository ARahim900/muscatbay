# iOS Home Screen water widget — design

Date: 2026-10-06 · Owner approval: "A" (water), "yes go ahead" (design) — 2026-10-06

## Goal

The day's water position on the iPhone Home Screen without opening the app:
the same figures the Water → Daily page shows, refreshed through the day.

## Decisions already made by the owner

- Content: **Water** (option A).
- **Home Screen only** — no Lock Screen widget (30-Sep-2026). iPhone offers
  system widgets only on the Home Screen and Today View. iPadOS also offers a
  small widget on its Lock Screen; that location is marked disfavoured
  (`disfavoredLocations`), which is the strongest exclusion iOS allows.
- Feed approach 1: a small read-only feed on muscatbay.work, keyed per device.

## What it shows

Day = the latest day with any reading in the latest month that has readings —
the Daily page's own default (`buildDailyGrid().latestDay`), never "yesterday"
from the clock.

| Size   | Content |
|--------|---------|
| Small  | Zone supply (Σ zone bulk L2, m³) · loss % in its severity colour · day label |
| Medium | Small content + worst zone (largest L2 − ΣL3: name, m³, %) + meters read "N of M" |

- Figures come from `processReport` / `computeBriefing` — the functions the
  Daily page uses — so the widget and the page cannot disagree.
- Supply is distribution level (Σ L2): the daily data has no L1/NAMA account.
- **Partial**: when any zone L2/L3 meter has no reading that day the widget
  says "partial". Missing readings are never filled.
- Severity colour: `dailySeverity(lossM3, lossPct)` → success #84B59F,
  warning #E8C064, danger #D67A7A; "check" uses info #6B9AC4.
- Tap → app opens on `/water?view=daily`.
- Appearance: brand neutrals, Deep Purple #4E4456 eyebrow, follows light/dark;
  tinted/clear modes use `widgetAccentable` on the key figure.

## Architecture

```
Widget (WidgetKit, Swift)
  └─ GET https://www.muscatbay.work/api/widget/water   Authorization: Bearer <device key>
        └─ Next route handler (server)
              ├─ rpc widget_water_latest(p_token)  ← anon key; SECURITY DEFINER
              │     validates key hash, owner role, returns latest month's rows
              └─ processReport + computeBriefing (shared, framework-free) → JSON
```

### Database (Supabase utnlgeuqajmwibqmdmgt)

- `public.widget_tokens(id, user_id, token_hash, label, created_at,
  last_used_at, revoked_at)` — RLS on; owner may select / revoke own rows; no
  direct insert. Only the SHA-256 of a key is stored.
- `create_widget_token(p_label)` — authenticated, requires water read access;
  revokes the caller's previous key with the same label, returns a new 256-bit
  key once.
- `widget_water_latest(p_token)` — anon + authenticated; returns null unless the
  key is live and its owner still has water read access (same rule as
  `mb_can_read_module('water')`); returns `{month, year, rows[account_number,
  day_1..day_31]}` for the latest month with any reading.

### Website (muscatbay/app)

- `components/water/daily-report/report-data.ts`: `processReport` and its types
  moved out of the `"use client"` file so the server can use them; re-exported
  from `inline-shared.tsx` (no caller changes).
- `lib/widget/water-summary.ts`: rows → widget summary (pure, unit-tested).
- `app/api/widget/water/route.ts`: bearer key → RPC → summary JSON;
  401 for a bad key, 503 on database error, `Cache-Control: no-store`.
- `components/providers/widget-pairing.tsx`: in the app only
  (`window.MuscatBayNative.widget` present), signed in, not yet paired →
  `create_widget_token('iPhone widget')` → `ReactNativeWebView.postMessage`.

### App (mobile-shell, Expo 57)

- Merges `feat/mobile-testflight` (fc184be) into main.
- `@bacons/apple-targets` 5.0.0: `targets/water-widget` (Swift, iOS 17+),
  App Group `group.work.muscatbay.app`.
- `App.tsx`: injects `window.MuscatBayNative = {widget:{paired}}`; on a
  `widget-token` message from an in-app host, stores the key in the App Group
  and reloads the widget; handles `muscatbayshell://water/daily` → loads
  `/water?view=daily`.
- Widget: timeline refresh every 30 min (iOS may stretch it); caches the last
  good summary and shows "as of hh:mm" when the feed is unreachable; no key →
  "Open Muscat Bay once to connect"; 401 → flags the App Group so the app
  re-pairs on next open.

## Out of scope

Lock Screen widgets, interactive widget buttons, electricity/STP figures, push
notifications (next phase), revoking keys from the UI.

## Testing

- Unit: summary built from fixture rows equals `computeBriefing` for the same
  day; partial and no-data cases; route rejects missing/unknown keys.
- DB: advisors clean after migration; key round-trip verified with SQL.
- Simulator: small + medium, light/dark, no-key, partial; tap opens Daily.
- Ship: website PR → merge on green; app PR → merge; EAS build 1.1 → TestFlight.
