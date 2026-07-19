-- ============================================================================
-- Prevention: keep daily "missing-as-zero" placeholders from recurring
-- Migration: 20260719_daily_placeholder_zero_guard
-- Project:   utnlgeuqajmwibqmdmgt
-- ============================================================================
-- CONTEXT
--   `water_daily_consumption` rows are seeded each month with every day cell = 0
--   (external/manual step), and the `sync-grafana-water` edge function only
--   overwrites its ~153 tracked meters (see PROJECT_STATUS.md §3). Meters off
--   the Grafana feed keep the 0-seed, so the Daily report shows them as a real
--   0.00 instead of "—". The one-time repair for July is in
--   20260719_daily_missing_zero_to_null.sql; this migration stops it recurring.
--
--   Because the seed step is not in this repo, the durable fix here is a small,
--   self-healing maintenance function scheduled just after the daily sync. It
--   only ever turns a placeholder 0 into NULL — never a real reading.
--
-- FUNCTION `null_water_daily_placeholder_zeros()`
--   For the CURRENT month (Oman time, UTC+4):
--     Rule 1 — zone-bulk (L2) + direct-connection (DC) meters whose ENTIRE month
--              reads 0 → all day cells NULL (a whole zone bulk / mains DC cannot
--              truly consume 0 m3 for a month, so an all-zero month is missing).
--     Rule 2 — day cells for days AFTER today (strictly future) that read 0 →
--              NULL (no reading can exist yet for a future day).
--   Both rules are guarded so a positive reading and an existing NULL are never
--   touched. Apartments/L3 are deliberately left alone (a vacant unit can read 0).
-- ============================================================================

CREATE OR REPLACE FUNCTION public.null_water_daily_placeholder_zeros()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  cur_month text := to_char((now() AT TIME ZONE 'Asia/Muscat')::date, 'Mon-YY');
  cur_year  int  := extract(year FROM (now() AT TIME ZONE 'Asia/Muscat'))::int;
  cur_day   int  := extract(day  FROM (now() AT TIME ZONE 'Asia/Muscat'))::int;
  d         int;
  set_sql   text := '';
BEGIN
  -- Rule 1: bulk (L2) + DC meters whose entire current month is 0 -> all NULL
  UPDATE water_daily_consumption t SET
    day_1=NULL,day_2=NULL,day_3=NULL,day_4=NULL,day_5=NULL,day_6=NULL,day_7=NULL,day_8=NULL,
    day_9=NULL,day_10=NULL,day_11=NULL,day_12=NULL,day_13=NULL,day_14=NULL,day_15=NULL,day_16=NULL,
    day_17=NULL,day_18=NULL,day_19=NULL,day_20=NULL,day_21=NULL,day_22=NULL,day_23=NULL,day_24=NULL,
    day_25=NULL,day_26=NULL,day_27=NULL,day_28=NULL,day_29=NULL,day_30=NULL,day_31=NULL
  WHERE t.month = cur_month AND t.year = cur_year
    AND t.account_number IN (
      -- L2 zone bulks
      '4300346','4300343','4300344','4300345','4300342','4300335',
      -- DC meters
      '4300294','4300297','4300299','4300323','4300334','4300336',
      '4300338','4300340','4300341','4300348','4300349','4300295')
    AND NOT EXISTS (
      SELECT 1 FROM jsonb_each_text(to_jsonb(t)) e
      WHERE e.key ~ '^day_[0-9]+$'
        AND (e.value IS NULL OR NOT (e.value ~ '^-?[0-9.]+$') OR e.value::numeric <> 0)
    );

  -- Rule 2: strictly-future days (> today, Oman) that read 0 -> NULL
  IF cur_day < 31 THEN
    FOR d IN (cur_day + 1)..31 LOOP
      set_sql := set_sql || format('day_%s = CASE WHEN day_%s = 0 THEN NULL ELSE day_%s END,', d, d, d);
    END LOOP;
    set_sql := left(set_sql, length(set_sql) - 1);  -- strip trailing comma
    EXECUTE format(
      'UPDATE water_daily_consumption SET %s WHERE month = %L AND year = %s',
      set_sql, cur_month, cur_year
    );
  END IF;
END;
$$;

COMMENT ON FUNCTION public.null_water_daily_placeholder_zeros() IS
  'Turns daily missing-as-zero placeholders into NULL for the current month '
  '(all-zero bulk/DC rows + strictly-future-day zeros). Safe: only ever 0->NULL. '
  'Scheduled by pg_cron job null-water-daily-placeholders, 02:30 UTC.';

-- Schedule just after the 02:00 UTC Grafana sync (idempotent by job name).
SELECT cron.schedule(
  'null-water-daily-placeholders',
  '30 2 * * *',
  $$SELECT public.null_water_daily_placeholder_zeros();$$
);

-- To remove:  SELECT cron.unschedule('null-water-daily-placeholders');
