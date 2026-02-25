-- =====================================================
-- CLEAR ALL WATER DATA FROM SUPABASE
-- Run this in Supabase SQL Editor to wipe all water tables clean
-- This does NOT drop the tables — only deletes all rows
-- =====================================================

-- 1. Clear daily water loss data
DELETE FROM water_loss_daily;

-- 2. Clear monthly water loss summaries
DELETE FROM water_loss_summary;

-- 3. Clear daily water consumption readings
DELETE FROM water_daily_consumption;

-- 4. Clear the main water system (monthly meter data)
DELETE FROM "Water System";

-- Verify all tables are empty
SELECT 'Water System' AS table_name, COUNT(*) AS row_count FROM "Water System"
UNION ALL
SELECT 'water_loss_daily', COUNT(*) FROM water_loss_daily
UNION ALL
SELECT 'water_loss_summary', COUNT(*) FROM water_loss_summary
UNION ALL
SELECT 'water_daily_consumption', COUNT(*) FROM water_daily_consumption;
