# Security & Data Remediation — action checklist (2026-07-18)

Companion to the application/storage audit. This lists the steps that must be
done **by the project owner in the Supabase/GitHub dashboards** — they cannot
and should not be automated from a code change. The code + SQL in this PR is the
other half; nothing here has been applied.

> **Automation safety (verified):** none of the steps below interrupt the daily
> STP/water syncs or the monthly rebuilds. Those write via `service_role` or
> `SECURITY DEFINER` functions, which bypass RLS. **Do not rotate the anon key**
> — it is public by design and is embedded in the two daily cron headers and the
> client bundle; rotating it would log everyone out and break both crons.

---

## Order of operations

### 1. Rotate the leaked `service_role` key  — 🔴 urgent
The `service_role` key was committed to the **public** repo (now removed from
`HEAD`, but still in git history). Rotating it makes every leaked copy useless.

1. Supabase Dashboard → **Project Settings → API Keys** → roll / regenerate the
   `service_role` key.
2. **Edge functions need no change** — they read `SUPABASE_SERVICE_ROLE_KEY` from
   Supabase's managed environment, which updates automatically on rotation.
   After rolling, trigger `sync-grafana-water` and `stp-daily-report-submission`
   once and confirm they still return `success: true`.
3. **Manual scripts** (`scripts/water-update-apr26.mjs`,
   `scripts/stp-restore-missing-data.mjs`) now read the key from the environment.
   Supply the new key at run time:
   ```bash
   SUPABASE_SERVICE_ROLE_KEY=<new-key> node scripts/water-update-apr26.mjs
   ```

### 2. Apply the RLS hardening migration  — 🔴 urgent
Review and run `muscatbay/app/sql/migrations/20260718_security_hardening.sql` in
the SQL editor. Deploy it **together with** the app code in this PR (the
`lib/rbac.ts` role change) so existing users keep access. After applying:
- Confirm you can still log in and load every module.
- Confirm the daily syncs still write (they use `service_role`).

### 3. Purge the key from git history  — 🟠 recommended (after step 1)
Rotation already neutralises the key; this is hygiene so it is not re-discovered.
Use `git filter-repo` (or BFG) to strip the two script files' old contents, then
force-push. Coordinate with any collaborators first.

### 4. Fix the future-dated STP record  — 🟠 recommended
1. Delete the stray row (it will otherwise keep distorting STP charts):
   ```sql
   delete from public.stp_operations   where date = '2027-05-06';
   delete from public.stp_daily_reports where date = '2027-05-06';
   ```
2. **Correct the source record in AITable** (datasheet `dsteHeHSeZ59QTougo`) —
   otherwise the daily sync re-imports it.
3. When you next redeploy `stp-daily-report-submission` / `sync-stp-aitable`, add
   a guard that rejects dates after today so this cannot recur.

### 5. Enter the missing June-2026 NAMA reading  — 🟠 recommended
Add the `2026-06` main-bulk value for meter `C43659` (any surface: the
`Water System` view `jun_26` column or the base table). June water balance then
appears automatically.

### 6. Auth & Edge-Function hardening  — 🔵 when convenient
- Auth settings → enable **Leaked password protection**.
- Confirm **signup restrictions** (allow-list your domain / require email
  confirmation) so strangers can't self-register.
- Delete the leftover `stp-debug` edge function; set `verify_jwt = true` on the
  sync functions and move the AITable tokens into function secrets.
- Optionally address the low-severity advisor items (pin function `search_path`,
  drop duplicate/unused indexes, review the 4 SECURITY DEFINER views).

---

## What changed in the code (this PR)
- `scripts/water-update-apr26.mjs`, `scripts/stp-restore-missing-data.mjs` — read
  `SUPABASE_SERVICE_ROLE_KEY` from the environment instead of a hardcoded key.
- `lib/rbac.ts` — `normalizeRole` now defaults to `viewer` (was `admin`); legacy
  `'user'` is grandfathered to `admin` so no one is locked out.
- `app/settings/page.tsx`, `lib/auth.ts` — avatar uploads validate type/size,
  surface failures (no more false "success"), and delete the previous avatar.
- `sql/migrations/20260718_security_hardening.sql` — the RLS/role/storage
  migration (review-then-apply; see step 2).
