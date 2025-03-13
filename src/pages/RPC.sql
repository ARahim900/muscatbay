
-- This SQL will need to be executed manually in the Supabase SQL Editor
CREATE OR REPLACE FUNCTION refresh_water_consumption_views()
RETURNS void AS $$
BEGIN
  -- Refresh water_consumption_by_type view
  REFRESH MATERIALIZED VIEW IF EXISTS water_consumption_by_type;
  
  -- If not a materialized view, we'll simulate a refresh by recreating it
  DROP VIEW IF EXISTS water_consumption_by_type CASCADE;
  
  CREATE OR REPLACE VIEW water_consumption_by_type AS
  SELECT 
    type,
    SUM(jan_24) as jan_24,
    SUM(feb_24) as feb_24,
    SUM(mar_24) as mar_24,
    SUM(apr_24) as apr_24,
    SUM(may_24) as may_24,
    SUM(jun_24) as jun_24,
    SUM(jul_24) as jul_24,
    SUM(aug_24) as aug_24,
    SUM(sep_24) as sep_24,
    SUM(oct_24) as oct_24,
    SUM(nov_24) as nov_24,
    SUM(dec_24) as dec_24,
    SUM(jan_25) as jan_25,
    SUM(feb_25) as feb_25,
    SUM(total) as total
  FROM water_distribution_master
  GROUP BY type
  ORDER BY total DESC;
  
  -- Refresh water_consumption_by_zone view
  REFRESH MATERIALIZED VIEW IF EXISTS water_consumption_by_zone;
  
  -- If not a materialized view, we'll simulate a refresh by recreating it
  DROP VIEW IF EXISTS water_consumption_by_zone CASCADE;
  
  CREATE OR REPLACE VIEW water_consumption_by_zone AS
  SELECT 
    zone,
    SUM(jan_24) as jan_24,
    SUM(feb_24) as feb_24,
    SUM(mar_24) as mar_24,
    SUM(apr_24) as apr_24,
    SUM(may_24) as may_24,
    SUM(jun_24) as jun_24,
    SUM(jul_24) as jul_24,
    SUM(aug_24) as aug_24,
    SUM(sep_24) as sep_24,
    SUM(oct_24) as oct_24,
    SUM(nov_24) as nov_24,
    SUM(dec_24) as dec_24,
    SUM(jan_25) as jan_25,
    SUM(feb_25) as feb_25,
    SUM(total) as total
  FROM water_distribution_master
  WHERE type != 'Zone Bulk' AND type != 'Main BULK'
  GROUP BY zone
  ORDER BY total DESC;
  
  RETURN;
END;
$$ LANGUAGE plpgsql;
