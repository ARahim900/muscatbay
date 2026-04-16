-- Reset Assets Register Database
-- Run this in Supabase SQL Editor to clear all existing asset data
-- Then use the upload script (scripts/upload-assets.js) to re-populate

-- Step 1: Delete all existing rows
DELETE FROM "Assets_Register_Database";

-- Step 2: Verify the table is empty
SELECT COUNT(*) as remaining_rows FROM "Assets_Register_Database";
