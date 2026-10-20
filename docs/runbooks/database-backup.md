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
that check. With the new project's Session pooler connection string:

```bash
psql \
  --single-transaction \
  --variable ON_ERROR_STOP=1 \
  --file roles.sql \
  --file schema.sql \
  --command 'SET session_replication_role = replica' \
  --file data.sql \
  --dbname "<new project's connection string>"
```

`session_replication_role = replica` stops triggers firing while the rows load
(it is the restore command in Supabase's own backup guide). Afterwards: set the
new project's URL and anon key in Vercel, re-upload Storage files if needed,
and re-create any Vault secrets and Edge Function secrets.

## Test the backups

A backup that has never been restored is a hope, not a backup. Once a quarter,
restore the latest one into a scratch Supabase project (or a local
`supabase start` stack) and compare row counts for a few key tables
(`stp_operations`, `water_monthly_consumption`, `master_assets_register`,
`auth.users`) against the live project.

## When the plan changes

If the organisation moves to Supabase **Pro**, Supabase adds daily backups
(7 days) of its own; point-in-time recovery is a further paid add-on. Keep
this job running anyway: it is an off-platform copy that survives a deleted
project or a locked account.
