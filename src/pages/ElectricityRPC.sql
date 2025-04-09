
-- This SQL will need to be executed manually in the Supabase SQL Editor
CREATE OR REPLACE FUNCTION refresh_electricity_consumption_views()
RETURNS void AS $$
BEGIN
  -- Refresh electricity_consumption_by_type view
  DROP VIEW IF EXISTS electricity_consumption_by_type CASCADE;
  
  CREATE OR REPLACE VIEW electricity_consumption_by_type AS
  SELECT 
    type,
    SUM("April-24") as apr_24,
    SUM("May-24") as may_24,
    SUM("June-24") as jun_24,
    SUM("July-24") as jul_24,
    SUM("August-24") as aug_24,
    SUM("September-24") as sep_24,
    SUM("October-24") as oct_24,
    SUM("November-24") as nov_24,
    SUM("December-24") as dec_24,
    SUM("January-25") as jan_25,
    SUM("February-25") as feb_25,
    SUM("March-25") as mar_25,
    (SUM("April-24") + SUM("May-24") + SUM("June-24") + 
     SUM("July-24") + SUM("August-24") + SUM("September-24") + 
     SUM("October-24") + SUM("November-24") + SUM("December-24") + 
     SUM("January-25") + SUM("February-25") + SUM("March-25")) as total
  FROM "MB-Electrical"
  GROUP BY type
  ORDER BY total DESC;
  
  -- Refresh electricity_consumption_by_zone view
  DROP VIEW IF EXISTS electricity_consumption_by_zone CASCADE;
  
  CREATE OR REPLACE VIEW electricity_consumption_by_zone AS
  SELECT 
    zone,
    SUM("April-24") as apr_24,
    SUM("May-24") as may_24,
    SUM("June-24") as jun_24,
    SUM("July-24") as jul_24,
    SUM("August-24") as aug_24,
    SUM("September-24") as sep_24,
    SUM("October-24") as oct_24,
    SUM("November-24") as nov_24,
    SUM("December-24") as dec_24,
    SUM("January-25") as jan_25,
    SUM("February-25") as feb_25,
    SUM("March-25") as mar_25,
    (SUM("April-24") + SUM("May-24") + SUM("June-24") + 
     SUM("July-24") + SUM("August-24") + SUM("September-24") + 
     SUM("October-24") + SUM("November-24") + SUM("December-24") + 
     SUM("January-25") + SUM("February-25") + SUM("March-25")) as total
  FROM "MB-Electrical"
  GROUP BY zone
  ORDER BY total DESC;
  
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- Update the global refresh function to include electricity views
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
  PERFORM refresh_electricity_consumption_views();
  
  -- Check and refresh STP views
  SELECT EXISTS (
    SELECT FROM pg_matviews WHERE matviewname = 'stp_performance_metrics'
  ) INTO view_exists;
  IF view_exists THEN
    REFRESH MATERIALIZED VIEW stp_performance_metrics;
  END IF;
  
  RETURN;
END;
$$ LANGUAGE plpgsql;
