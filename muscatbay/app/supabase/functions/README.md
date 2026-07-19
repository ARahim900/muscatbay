# Supabase Edge Functions

Source mirror of the Edge Functions deployed to Supabase project
`utnlgeuqajmwibqmdmgt`. These run server-side on Supabase's Deno runtime; the
copies here exist for version control and review. Editing a file here does **not**
redeploy it — deploy via the Supabase CLI (`supabase functions deploy <slug>`)
or the dashboard.

## `sync-grafana-water`

Daily water-meter sync. Invoked by the pg_cron job `sync-grafana-water-daily`
(`0 2 * * *`, 02:00 UTC) via `net.http_post`, and manually with a
`{ "snapshot_key": "..." }` body.

**How it works — and its limits (this is why the Daily report can show 0.00):**

- It reads a Grafana snapshot table panel and, for each account in the
  hard-coded `TRACKED_ACCOUNTS` set (~153 meters), `.update()`s that meter's
  `water_daily_consumption` row for the days present in the snapshot.
- It **only `.update()`s** — it never inserts rows and never writes `0`. The
  monthly rows must already exist (they are seeded at month start).
- Meters **not** in `TRACKED_ACCOUNTS`, or tracked meters **missing from a given
  snapshot**, are simply never touched. That includes every direct-connection
  meter except **Sales Center (4300295)** — the labour camps, hotel, security,
  ROP, community/STP, main entrance and the TSE irrigation controllers are read
  manually and loaded through the CSV uploader, not Grafana.
- Because the monthly seed fills day cells with `0` rather than `NULL`, any meter
  this function does not overwrite renders as a **real `0.00`** in the Daily
  report instead of "—" (no reading). The durable fix is to seed un-read days as
  `NULL`; the interim data repair is
  `sql/migrations/20260719_daily_missing_zero_to_null.sql`.
