-- =====================================================
-- Water System Schema Update: Add Jan-26 Column
-- Run this in Supabase SQL Editor BEFORE running the seed script
-- =====================================================

ALTER TABLE "Water System" ADD COLUMN IF NOT EXISTS jan_26 INTEGER;
