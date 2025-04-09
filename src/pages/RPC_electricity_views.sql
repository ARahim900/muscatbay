
-- This SQL will need to be executed manually in the Supabase SQL Editor
CREATE OR REPLACE FUNCTION refresh_electricity_views()
RETURNS void AS $$
BEGIN
  -- Recreate electricity_consumption_by_type view
  DROP VIEW IF EXISTS electricity_consumption_by_type;
  
  CREATE OR REPLACE VIEW electricity_consumption_by_type AS
  SELECT 
    type,
    SUM("January-25") as jan_25,
    SUM("February-25") as feb_25,
    SUM("March-25") as mar_25,
    SUM("April-24") as apr_24,
    SUM("May-24") as may_24,
    SUM("June-24") as jun_24,
    SUM("July-24") as jul_24,
    SUM("August-24") as aug_24,
    SUM("September-24") as sep_24,
    SUM("October-24") as oct_24,
    SUM("November-24") as nov_24,
    SUM("December-24") as dec_24
  FROM "MB-Electrical"
  GROUP BY type
  ORDER BY type;
  
  -- Recreate electricity_consumption_by_zone view
  DROP VIEW IF EXISTS electricity_consumption_by_zone;
  
  CREATE OR REPLACE VIEW electricity_consumption_by_zone AS
  SELECT 
    zone,
    SUM("January-25") as jan_25,
    SUM("February-25") as feb_25,
    SUM("March-25") as mar_25,
    SUM("April-24") as apr_24,
    SUM("May-24") as may_24,
    SUM("June-24") as jun_24,
    SUM("July-24") as jul_24,
    SUM("August-24") as aug_24,
    SUM("September-24") as sep_24,
    SUM("October-24") as oct_24,
    SUM("November-24") as nov_24,
    SUM("December-24") as dec_24
  FROM "MB-Electrical"
  GROUP BY zone
  ORDER BY zone;
  
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- Add this function to the refresh_all_materialized_views function
CREATE OR REPLACE FUNCTION refresh_all_materialized_views()
RETURNS void AS $$
DECLARE
  view_exists boolean;
BEGIN
  -- Check and refresh water views
  SELECT EXISTS (
    SELECT FROM pg_matviews WHERE matviewname = 'water_consumption_by_type'
  ) INTO view_exists;
  IF view_exists THEN
    REFRESH MATERIALIZED VIEW water_consumption_by_type;
  END IF;
  
  SELECT EXISTS (
    SELECT FROM pg_matviews WHERE matviewname = 'water_consumption_by_zone'
  ) INTO view_exists;
  IF view_exists THEN
    REFRESH MATERIALIZED VIEW water_consumption_by_zone;
  END IF;
  
  -- Check and refresh electricity views
  SELECT EXISTS (
    SELECT FROM pg_matviews WHERE matviewname = 'electricity_consumption_by_type'
  ) INTO view_exists;
  IF view_exists THEN
    REFRESH MATERIALIZED VIEW electricity_consumption_by_type;
  END IF;
  
  SELECT EXISTS (
    SELECT FROM pg_matviews WHERE matviewname = 'electricity_consumption_by_zone'
  ) INTO view_exists;
  IF view_exists THEN
    REFRESH MATERIALIZED VIEW electricity_consumption_by_zone;
  END IF;
  
  -- Check and refresh STP views
  SELECT EXISTS (
    SELECT FROM pg_matviews WHERE matviewname = 'stp_performance_metrics'
  ) INTO view_exists;
  IF view_exists THEN
    REFRESH MATERIALIZED VIEW stp_performance_metrics;
  END IF;
  
  -- Also call the refresh functions for regular views
  PERFORM refresh_water_consumption_views();
  PERFORM refresh_electricity_views();
  
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION refresh_electricity_views() TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_electricity_views() TO anon;
