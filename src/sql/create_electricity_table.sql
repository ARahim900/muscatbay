
-- Note: This SQL script needs to be run manually in the Supabase SQL Editor

-- First, check if the MB-Electrical table exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'MB-Electrical') THEN
    -- Create the table if it doesn't exist
    CREATE TABLE "public"."MB-Electrical" (
      "SL:no." BIGINT,
      "Unit Number (Muncipality)" TEXT,
      "Muscat Bay Number" TEXT,
      "Electrical Meter Account No" TEXT,
      "Zone" TEXT,
      "Type" TEXT,
      "April-24" TEXT,
      "May-24" TEXT,
      "June-24" TEXT,
      "July-24" TEXT,
      "August-24" TEXT,
      "September-24" TEXT,
      "October-24" TEXT,
      "November-24" TEXT,
      "December-24" TEXT,
      "January-25" TEXT,
      "February-25" TEXT,
      "March-25" TEXT
    );
    
    -- Add some sample data
    INSERT INTO "public"."MB-Electrical" (
      "Electrical Meter Account No", "Zone", "Type", "January-25", "February-25"
    ) VALUES
      ('12345', 'Zone 1', 'Residential', '120', '115'),
      ('23456', 'Zone 2', 'Commercial', '350', '375'),
      ('34567', 'Zone 3', 'Retail', '220', '245');
      
    RAISE NOTICE 'MB-Electrical table created with sample data';
  ELSE
    RAISE NOTICE 'MB-Electrical table already exists';
  END IF;
END $$;
