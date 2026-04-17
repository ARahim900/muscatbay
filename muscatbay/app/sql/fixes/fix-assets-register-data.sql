-- ============================================================
-- Fix Assets_Register_Database data quality issues
-- Run this once in Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Enable replica identity so UPDATE/DELETE work with realtime
ALTER TABLE "Assets_Register_Database" REPLICA IDENTITY FULL;

-- 2. Compute Current_Age_Years from Install_Year where missing
UPDATE "Assets_Register_Database"
SET "Current_Age_Years" = EXTRACT(YEAR FROM NOW())::INTEGER - CAST("Install_Year" AS INTEGER)
WHERE "Current_Age_Years" IS NULL
  AND "Install_Year" IS NOT NULL;

-- 3. Compute ERL_Years from Life_Expectancy_Years - Current_Age_Years where missing
UPDATE "Assets_Register_Database"
SET "ERL_Years" = GREATEST(0, "Life_Expectancy_Years" - "Current_Age_Years")
WHERE "ERL_Years" IS NULL
  AND "Life_Expectancy_Years" IS NOT NULL
  AND "Current_Age_Years" IS NOT NULL;

-- 4. Normalise Is_Asset_Active: 'Yes' → 'Y'
UPDATE "Assets_Register_Database"
SET "Is_Asset_Active" = 'Y'
WHERE "Is_Asset_Active" = 'Yes';

-- Verify results
SELECT
  COUNT(*) AS total_rows,
  COUNT("Current_Age_Years") AS rows_with_age,
  COUNT("ERL_Years") AS rows_with_erl,
  COUNT(CASE WHEN "Is_Asset_Active" = 'Y' THEN 1 END) AS active_y_count,
  COUNT(CASE WHEN "Is_Asset_Active" = 'Yes' THEN 1 END) AS active_yes_remaining
FROM "Assets_Register_Database";
