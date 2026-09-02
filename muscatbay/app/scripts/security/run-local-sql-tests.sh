#!/usr/bin/env bash
#
# Run the SQL migration tests against a throwaway local PostgreSQL cluster.
#
# WHY THIS EXISTS
#   The alert-incident migration decides when an open operational incident may
#   be closed. Getting that wrong makes a critical alert disappear without
#   anyone fixing anything, and no amount of TypeScript testing exercises the
#   PL/pgSQL that actually does it. A Supabase preview branch would, but it is
#   billed by the hour; a local cluster costs nothing and never touches live
#   data.
#
# WHAT IT IS NOT
#   `sql/tests/00-supabase-stubs.sql` supplies IDENTITY and STRUCTURE only —
#   `auth.users`, `auth.uid()`, `storage`, the Supabase roles and the core
#   tables the migration's preflight requires. Every rule under test (role
#   helpers, RLS policies, grants, triggers) comes from the real migration
#   files, so the tests cannot agree with a re-statement of themselves.
#
#   It is still not a substitute for a staging apply: it does not run
#   PostgREST, so HTTP-level behaviour (JWT parsing, the REST error surface,
#   `Prefer` headers) is unverified. That remains `npm run test:rls:staging`
#   against a real project.
#
# USAGE
#   ./scripts/security/run-local-sql-tests.sh
#
# Requires the PostgreSQL 16 server binaries (Debian/Ubuntu:
# `apt-get install -y postgresql-16`). Set PG_BIN to override the location.

set -euo pipefail

PG_BIN="${PG_BIN:-/usr/lib/postgresql/16/bin}"
PG_PORT="${PG_PORT:-55432}"
SOCKET_DIR="${SOCKET_DIR:-/tmp}"
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
WORK_DIR="$(mktemp -d)"
PGDATA="$WORK_DIR/pgdata"

if [ ! -x "$PG_BIN/initdb" ]; then
    echo "PostgreSQL server binaries not found at $PG_BIN" >&2
    echo "Install them (apt-get install -y postgresql-16) or set PG_BIN." >&2
    exit 1
fi

cleanup() {
    "$PG_BIN/pg_ctl" -D "$PGDATA" stop -m immediate >/dev/null 2>&1 || true
    rm -rf "$WORK_DIR"
}
trap cleanup EXIT

echo "→ initialising a throwaway cluster in $PGDATA"
"$PG_BIN/initdb" -D "$PGDATA" -U postgres --auth=trust >"$WORK_DIR/initdb.log" 2>&1

echo "→ starting PostgreSQL on port $PG_PORT"
"$PG_BIN/pg_ctl" -D "$PGDATA" -o "-p $PG_PORT -k $SOCKET_DIR" -l "$WORK_DIR/server.log" -w start >/dev/null

run() { psql -h "$SOCKET_DIR" -p "$PG_PORT" -U postgres -v ON_ERROR_STOP=1 -q -f "$1"; }

echo "→ applying Supabase stand-ins"
run "$APP_DIR/sql/tests/00-supabase-stubs.sql"

# Order matters: the invitation/RLS migration defines the mb_* role helpers that
# the alert-incident policy references.
echo "→ applying migration: 20260901_invitation_only_security_and_rls.sql"
run "$APP_DIR/sql/migrations/20260901_invitation_only_security_and_rls.sql"

echo "→ applying migration: 20260901_operational_alert_incidents.sql"
run "$APP_DIR/sql/migrations/20260901_operational_alert_incidents.sql"

echo "→ running sql/tests/rls-roles.test.sql"
run "$APP_DIR/sql/tests/rls-roles.test.sql"

echo "→ running sql/tests/alert-incidents.test.sql"
run "$APP_DIR/sql/tests/alert-incidents.test.sql"

echo "✓ local SQL tests passed"
