# Local SQL tests

```bash
npm run test:sql:local
```

Applies the two production-security migrations to a **throwaway local
PostgreSQL 16 cluster** and asserts how they behave. No Supabase project, no
network, no cost, and it cannot touch live data.

Requires the PostgreSQL 16 server binaries — on Debian/Ubuntu
`apt-get install -y postgresql-16`. Set `PG_BIN` if they live elsewhere.

## Why this exists

These migrations decide two things that are invisible to TypeScript tests and
expensive to get wrong:

- **who can read and write what** (`20260901_invitation_only_security_and_rls.sql`)
- **when an open operational incident may be closed** (`20260901_operational_alert_incidents.sql`)

A Supabase preview branch would exercise them, but it is billed hourly and was
declined. A local cluster runs the same PL/pgSQL and the same policy engine.

## What is stubbed, and what is not

`00-supabase-stubs.sql` supplies **identity and structure only**: `auth.users`,
a session-settable `auth.uid()`, the `storage` schema, the four Supabase roles,
and the core tables the migration's preflight requires.

Every **rule** under test — the `mb_*` role helpers, the RLS policies, the
grants, the invitation trigger — comes from the real migration files. Stubbing
those would make the tests agree with themselves rather than with production.

## Coverage

`rls-roles.test.sql` (31 assertions) runs as the `authenticated` and `anon`
database roles PostgREST actually uses:

| area | asserted |
|---|---|
| Invitation gate | an uninvited identity cannot be created; the Before-User-Created hook returns 403 for uninvited, revoked and expired invitations, and admits an invited email case-insensitively; accepting consumes the invitation |
| Viewer | reads operational data; insert is rejected; update and delete change nothing |
| Contractor | reads only the modules in `module_scope`; everything else reads as empty |
| Operator | inserts and updates operational data; delete changes nothing |
| Admin | deletes |
| Uninvited session | a valid `auth.uid()` with no profile row sees nothing |
| `anon` | reads nothing; may submit a *pending* professional application only, and cannot read it back |
| Escalation | a user may edit their own profile but cannot change their own role or widen their own module scope |
| Unlisted tables | fail-closed |

`alert-incidents.test.sql` (21 assertions) covers the incident lifecycle:
escalation keeps its acknowledgement, a module read on incomplete evidence
cannot close anything, a `NULL` resolution grant resolves nothing, per-agreement
incidents resolve independently, a returning condition opens a separate episode,
and only `service_role` may execute the reconciler.

## What this does NOT replace

There is no PostgREST here, so nothing HTTP-level is verified — JWT parsing, the
REST error surface, `Prefer` headers. Run `npm run test:rls:staging` against a
real project before applying anything to production.

## Reading a failure

Two different denials look different on purpose:

- a missing **GRANT** raises `permission denied` — the statement is rejected;
- an **RLS policy** whose `USING` clause matches no row silently affects zero
  rows on `UPDATE`/`DELETE`, and returns an empty set on `SELECT`.

Tests assert the right one for each case. An assertion that expects an
exception where RLS actually returns zero rows would pass for the wrong reason.
