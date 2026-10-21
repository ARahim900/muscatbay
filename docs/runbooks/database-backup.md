# Database backup and restore

The Supabase project (`utnlgeuqajmwibqmdmgt`) is on the **free plan**: Supabase
keeps **no backups** of it and offers no point-in-time recovery. The only
backups are the ones this repository makes.

| Item | Value |
|---|---|
| Job | `.github/workflows/db-backup.yml` ("Database backup") |
| Schedule | Daily 02:17 Muscat time; can also be run by hand (Actions → Database backup → Run workflow) |
| What | Supabase's documented three-file dump: `roles.sql`, `schema.sql`, `data.sql`, plus `SHA256SUMS` |
| Covers | Every table in `public`, user accounts (`auth`), storage file *records*, cron jobs |
| Does **not** cover | Uploaded files themselves (profile photos in Storage), secrets in Supabase Vault, Edge Function code (that is in this repo) |
| Kept | 30 days, as an encrypted workflow artifact |
| Encryption | AES-256 (GnuPG, symmetric) with `BACKUP_PASSPHRASE`. The repo is public — never upload a dump unencrypted |

## One-time setup (owner)

Two repository secrets, in GitHub → **Settings → Secrets and variables →
Actions → New repository secret**:

1. **`SUPABASE_DB_URL`** — Supabase dashboard → project → **Connect** →
   **Session pooler** connection string (host `aws-…pooler.supabase.com`,
   port `5432`), with the database password filled in. Do **not** use the
   "Direct connection" string: that host is IPv6-only and GitHub's runners
   cannot reach it. If the password contains `@ : / ? # %`, percent-encode
   those characters. If you do not know the database password it can be
   reset under **Project Settings → Database** — but first check whether
   anything else logs in with it (for example a Grafana PostgreSQL data
   source); a reset breaks those connections until they are updated.
2. **`BACKUP_PASSPHRASE`** — a long random passphrase (20+ characters). Store
   it in your password manager **before** saving it here. Without it no
   backup can ever be opened.

Then run the job once by hand and check it goes green.

## Download and open a backup

```bash
# List recent runs, then download one artifact (needs the GitHub CLI)
gh run list --repo ARahim900/muscatbay --workflow "Database backup" --limit 5
gh run download <run-id> --repo ARahim900/muscatbay

# Decrypt (asks for BACKUP_PASSPHRASE), unpack, verify
gpg --decrypt muscatbay-db-<stamp>.tar.gz.gpg | tar -xzf -
cd <stamp> && shasum -a 256 -c SHA256SUMS
```

## Restore

Restore into a **new** Supabase project first, check it, and only then decide
whether to point the app at it. Never restore over the live project without
that check. With the unpacked backup folder and the new project's Session
pooler connection string:

```bash
node scripts/restore-db-backup.mjs <unpacked-backup-folder> "<new project's connection string>"
```

Use the script, not Supabase's plain `psql --file roles.sql --file schema.sql
--file data.sql` command: on this project that command **fails** (found by the
first test restore, 2026-10-21). The script fixes two things and is otherwise
the same restore:

1. Three rules were added to the live database `NOT VALID` — they check new
   rows only. Eight live contracts predate `contractor_contract_pdf_url_approved`
   (their Drive links end in `/view`, not `/preview`), so applying the rule
   before the data aborts the load. The script loads data first, then adds the
   rules back, still `NOT VALID`, as on the live project.
2. Empty platform tables (e.g. `storage.buckets_vectors`) are rejected with
   "permission denied" on a fresh project. An empty table carries nothing, so
   the script skips them.

It runs as one transaction — it restores everything or changes nothing — and
needs `psql` (macOS: `brew install libpq`; set
`HOMEBREW_NO_INSTALLED_DEPENDENTS_CHECK=1` first, or Homebrew may upgrade
unrelated packages and break Node). Afterwards: set the new project's URL and
anon key in Vercel, re-upload Storage files if needed, and re-create any Vault
secrets and Edge Function secrets.

## Test the backups

A backup that has never been restored is a hope, not a backup. Once a quarter,
restore the latest one into a scratch Supabase project (or a local
`supabase start` stack, on non-default ports if another local project is
running) with the script above, and compare row counts for a few key tables
(`stp_operations`, `water_monthly_consumption`, `master_assets_register`,
`auth.users`) against the live project.

## When the plan changes

If the organisation moves to Supabase **Pro**, Supabase adds daily backups
(7 days) of its own; point-in-time recovery is a further paid add-on. Keep
this job running anyway: it is an off-platform copy that survives a deleted
project or a locked account.

## Test log

| Date | Backup | Result |
|---|---|---|
| 2026-10-21 | `muscatbay-db-20261021T0439Z` (first run) | Decrypted and checksum-verified on the owner's Mac; restored into a local Supabase stack (Postgres 17) with `scripts/restore-db-backup.mjs`. Row counts match the backup: `auth.users` 9, `master_assets_register` 3,061, `stp_operations` 792, `water_monthly_consumption` 11,279, `storage.objects` 14; 113 tables with data; 80 of 80 public tables with RLS, 157 policies. |
