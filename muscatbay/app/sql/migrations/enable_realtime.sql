-- =============================================================================
-- Enable Supabase Realtime on Water Tables
-- =============================================================================
-- Run this script in the Supabase SQL Editor to enable real-time change events
-- on all water-related tables. Without this, the app's real-time subscriptions
-- will connect but never receive any events.
--
-- This is idempotent — running it multiple times is safe (Supabase ignores
-- duplicates in the publication).
-- =============================================================================

-- Monthly water meter data (Water System table)
ALTER PUBLICATION supabase_realtime ADD TABLE "Water System";

-- Daily consumption readings
ALTER PUBLICATION supabase_realtime ADD TABLE water_daily_consumption;

-- Water loss summary (zone-level monthly)
ALTER PUBLICATION supabase_realtime ADD TABLE water_loss_summary;

-- Water loss daily (zone-level daily)
ALTER PUBLICATION supabase_realtime ADD TABLE water_loss_daily;

-- STP plant daily operations
ALTER PUBLICATION supabase_realtime ADD TABLE stp_operations;

-- Electricity meter readings
ALTER PUBLICATION supabase_realtime ADD TABLE electricity_meters;

-- Contractor tracker
ALTER PUBLICATION supabase_realtime ADD TABLE "Contractor_Tracker";

-- Assets register database
ALTER PUBLICATION supabase_realtime ADD TABLE "Assets_Register_Database";
