-- ================================================
-- WATER SYSTEM TABLE SETUP FOR SUPABASE
-- Run this SQL in your Supabase SQL Editor
-- Dashboard: https://supabase.com/dashboard/project/YOUR-PROJECT/sql/new
-- ================================================

-- 1. Create the Water System table
-- Note: Table name has a space to match the existing code in supabase.ts
CREATE TABLE IF NOT EXISTS "Water System" (
    id SERIAL PRIMARY KEY,
    label TEXT NOT NULL,
    account_number TEXT NOT NULL UNIQUE,
    level TEXT NOT NULL CHECK (level IN ('L1', 'L2', 'L3', 'L4', 'DC', 'N/A')),
    zone TEXT NOT NULL,
    parent_meter TEXT,
    type TEXT NOT NULL,
    -- Monthly consumption columns (Jan-25 to Dec-25)
    jan_25 NUMERIC(10, 2),
    feb_25 NUMERIC(10, 2),
    mar_25 NUMERIC(10, 2),
    apr_25 NUMERIC(10, 2),
    may_25 NUMERIC(10, 2),
    jun_25 NUMERIC(10, 2),
    jul_25 NUMERIC(10, 2),
    aug_25 NUMERIC(10, 2),
    sep_25 NUMERIC(10, 2),
    oct_25 NUMERIC(10, 2),
    nov_25 NUMERIC(10, 2),
    dec_25 NUMERIC(10, 2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE "Water System" ENABLE ROW LEVEL SECURITY;

-- 3. Create a policy to allow public read access (using anon key)
CREATE POLICY "Allow public read access on Water System"
ON "Water System"
FOR SELECT
USING (true);

-- 4. Create an index for faster queries
CREATE INDEX IF NOT EXISTS idx_water_system_zone ON "Water System" (zone);
CREATE INDEX IF NOT EXISTS idx_water_system_level ON "Water System" (level);
CREATE INDEX IF NOT EXISTS idx_water_system_account ON "Water System" (account_number);

-- 5. Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_water_system_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Create a trigger to auto-update the timestamp
DROP TRIGGER IF EXISTS water_system_updated_at ON "Water System";
CREATE TRIGGER water_system_updated_at
    BEFORE UPDATE ON "Water System"
    FOR EACH ROW
    EXECUTE FUNCTION update_water_system_timestamp();

-- ================================================
-- SAMPLE DATA INSERT
-- This inserts the water meter data matching the mock data
-- ================================================

-- Insert all water meters data
INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type, jan_25, feb_25, mar_25, apr_25, may_25, jun_25, jul_25, aug_25, sep_25, oct_25, nov_25) VALUES
-- L1 - Main Source
('Main Bulk (NAMA)', 'C43659', 'L1', 'Main Bulk', 'NAMA', 'Main BULK', 32580, 44043, 34915, 46039, 58425, 41840, 41475, 41743, 42088, 46049, 47347),

-- L2 - Zone Bulks
('ZONE 8 (Bulk Zone 8)', '4300342', 'L2', 'Zone_08', 'Main Bulk (NAMA)', 'Zone Bulk', 1547, 1498, 2605, 3203, 2937, 3142, 3542, 3840, 3385, 14550, NULL),
('ZONE 3A (Bulk Zone 3A)', '4300343', 'L2', 'Zone_03_(A)', 'Main Bulk (NAMA)', 'Zone Bulk', 4235, 4273, 3591, 4041, 4898, 6484, 6440, 6212, 6075, 7219, 5208),
('ZONE 3B (Bulk Zone 3B)', '4300344', 'L2', 'Zone_03_(B)', 'Main Bulk (NAMA)', 'Zone Bulk', 3256, 2962, 3331, 2157, 3093, 3231, 3243, 2886, 3466, 5467, 11824),
('ZONE 5 (Bulk Zone 5)', '4300345', 'L2', 'Zone_05', 'Main Bulk (NAMA)', 'Zone Bulk', 4267, 4231, 3862, 3737, 3849, 4116, 3497, 3968, 3823, 4218, 4433),
('ZONE FM ( BULK ZONE FM )', '4300346', 'L2', 'Zone_01_(FM)', 'Main Bulk (NAMA)', 'Zone Bulk', 2008, 1740, 1880, 1880, 1693, 1659, 1974, 2305, 1966, 2002, 2059),
('Village Square (Zone Bulk)', '4300335', 'L2', 'Zone_VS', 'Main Bulk (NAMA)', 'Zone Bulk', 14, 12, 21, 13, 21, 19, 60, 77, 75, 122, 126),
('Sales Center Common Building', '4300295', 'L2', 'Zone_SC', 'Main Bulk (NAMA)', 'Zone Bulk', 76, 68, 37, 67, 63, 55, 60, 61, 82, 78, 78),

-- DC - Direct Connections
('Hotel Main Building', '4300334', 'DC', 'Direct Connection', 'Main Bulk (NAMA)', 'Retail', 18048, 19482, 22151, 27676, 26963, 17379, 14713, 16249, 16249, 18876, 18876),
('Al Adrak Camp', '4300348', 'DC', 'Direct Connection', 'Main Bulk (NAMA)', 'Retail', 1038, 702, 1161, 1000, 1228, 1015, 972, 924, 769, 879, 875),
('Al Adrak Company', '4300349', 'DC', 'Direct Connection', 'Main Bulk (NAMA)', 'Retail', 0, 0, 0, 0, 0, 1758, 1802, 1511, 1776, 1687, 1448),
('Community Mgmt - Technical Zone, STP', '4300336', 'DC', 'Direct Connection', 'Main Bulk (NAMA)', 'MB_Common', 29, 37, 25, 35, 29, 53, 50, 56, 50, 62, 42),
('Building (Security)', '4300297', 'DC', 'Direct Connection', 'Main Bulk (NAMA)', 'MB_Common', 17, 18, 13, 16, 16, 13, 19, 16, 16, 20, 25),
('Building (ROP)', '4300299', 'DC', 'Direct Connection', 'Main Bulk (NAMA)', 'MB_Common', 23, 21, 19, 20, 20, 17, 22, 20, 20, 23, 31),
('PHASE 02, MAIN ENTRANCE', '4300338', 'DC', 'Direct Connection', 'Main Bulk (NAMA)', 'MB_Common', 11, 8, 6, 7, 6, 6, 7, 8, 7, 12, 10),
('Irrigation Tank 01 (Inlet)', '4300323', 'DC', 'Direct Connection', 'Main Bulk (NAMA)', 'IRR_Servies', 0, 0, 0, 0, 2, 0, 1, 0, 0, 0, 0),
('Irrigation- Controller UP', '4300340', 'DC', 'Direct Connection', 'Main Bulk (NAMA)', 'IRR_Servies', 0, 0, 0, 1000, 313, 491, 554, 272, 266, 181, 328),
('Irrigation- Controller DOWN', '4300341', 'DC', 'Direct Connection', 'Main Bulk (NAMA)', 'IRR_Servies', 159, 239, 283, 411, 910, 511, 611, 394, 0, 0, 0),

-- L3 - Zone FM Buildings
('Building FM', '4300296', 'L3', 'Zone_01_(FM)', 'ZONE FM ( BULK ZONE FM )', 'MB_Common', 37, 39, 49, 40, 41, 32, 44, 40, 34, 39, 44),
('Building B1', '4300300', 'L3', 'Zone_01_(FM)', 'ZONE FM ( BULK ZONE FM )', 'Retail', 228, 225, 235, 253, 233, 144, 229, 298, 256, 265, 250),
('Building B2', '4300301', 'L3', 'Zone_01_(FM)', 'ZONE FM ( BULK ZONE FM )', 'Retail', 236, 213, 202, 187, 199, 171, 191, 240, 212, 248, 256),
('Building B3', '4300302', 'L3', 'Zone_01_(FM)', 'ZONE FM ( BULK ZONE FM )', 'Retail', 169, 165, 132, 134, 160, 151, 170, 149, 156, 210, 257),
('Building B4', '4300303', 'L3', 'Zone_01_(FM)', 'ZONE FM ( BULK ZONE FM )', 'Retail', 108, 108, 148, 148, 121, 149, 159, 179, 201, 175, 169),
('Building B5', '4300304', 'L3', 'Zone_01_(FM)', 'ZONE FM ( BULK ZONE FM )', 'Retail', 1, 2, 1, 1, 0, 179, 62, 54, 39, 42, 37),
('Building B6', '4300305', 'L3', 'Zone_01_(FM)', 'ZONE FM ( BULK ZONE FM )', 'Retail', 254, 228, 268, 281, 214, 194, 196, 210, 210, 229, 231),
('Building B7', '4300306', 'L3', 'Zone_01_(FM)', 'ZONE FM ( BULK ZONE FM )', 'Retail', 178, 190, 174, 201, 200, 154, 192, 155, 158, 200, 201),
('Building B8', '4300307', 'L3', 'Zone_01_(FM)', 'ZONE FM ( BULK ZONE FM )', 'Retail', 268, 250, 233, 0, 413, 213, 62, 84, 371, 579, 281),
('Building CIF/CB', '4300324', 'L3', 'Zone_01_(FM)', 'ZONE FM ( BULK ZONE FM )', 'Retail', 420, 331, 306, 307, 284, 241, 443, 731, 484, 274, 270),

-- L3 - Zone 3A Villas
('Z3-31 (Villa)', '4300052', 'L3', 'Zone_03_(A)', 'ZONE 3A (BULK ZONE 3A)', 'Residential (Villa)', 165, 133, 30, 306, 527, 240, 109, 235, 205, 242, 233),
('Z3-35 (Villa)', '4300075', 'L3', 'Zone_03_(A)', 'ZONE 3A (BULK ZONE 3A)', 'Residential (Villa)', 65, 61, 52, 74, 68, 86, 70, 65, 65, 79, 74),
('Z3-36 (Villa)', '4300084', 'L3', 'Zone_03_(A)', 'ZONE 3A (BULK ZONE 3A)', 'Residential (Villa)', 81, 83, 69, 83, 170, 166, 157, 115, 103, 89, 87),
('Z3-42 (Villa)', '4300002', 'L3', 'Zone_03_(A)', 'ZONE 3A (BULK ZONE 3A)', 'Residential (Villa)', 32, 46, 19, 62, 87, 59, 53, 65, 44, 25, 24),

-- L3 - Zone 3A Building Bulks
('D-44 Building Bulk Meter', '4300178', 'L3', 'Zone_03_(A)', 'ZONE 3A (BULK ZONE 3A)', 'D_Building_Bulk', 180, 198, 92, 87, 62, 49, 52, 59, 60, 68, 66),
('D-45 Building Bulk Meter', '4300179', 'L3', 'Zone_03_(A)', 'ZONE 3A (BULK ZONE 3A)', 'D_Building_Bulk', 20, 32, 44, 56, 55, 10, 12, 11, 35, 29, 39),
('D-46 Building Bulk Meter', '4300180', 'L3', 'Zone_03_(A)', 'ZONE 3A (BULK ZONE 3A)', 'D_Building_Bulk', 61, 46, 29, 68, 69, 55, 65, 85, 114, 134, 68),
('D-47 Building Bulk Meter', '4300181', 'L3', 'Zone_03_(A)', 'ZONE 3A (BULK ZONE 3A)', 'D_Building_Bulk', 103, 70, 55, 69, 57, 83, 121, 62, 72, 96, 83),
('D-51 Building Bulk Meter', '4300185', 'L3', 'Zone_03_(A)', 'ZONE 3A (BULK ZONE 3A)', 'D_Building_Bulk', 92, 108, 152, 166, 111, 100, 149, 154, 164, 202, 107),
('D-74 Building Bulk Meter', '4300177', 'L3', 'Zone_03_(A)', 'ZONE 3A (BULK ZONE 3A)', 'D_Building_Bulk', 41, 35, 36, 54, 51, 62, 101, 106, 128, 116, 66),
('D-75 Building Bulk Meter', '4300176', 'L3', 'Zone_03_(A)', 'ZONE 3A (BULK ZONE 3A)', 'D_Building_Bulk', 63, 60, 66, 71, 59, 62, 67, 101, 66, 65, 64),

-- L4 - D-44 Apartments
('Z3-44(1A)', '4300030', 'L4', 'Zone_03_(A)', 'D-44 Building Bulk Meter', 'Residential (Apart)', 11, 11, 10, 6, 11, 8, 2, 7, 9, 9, 11),
('Z3-44(2A)', '4300032', 'L4', 'Zone_03_(A)', 'D-44 Building Bulk Meter', 'Residential (Apart)', 9, 3, 5, 10, 7, 2, 3, 5, 6, 7, 3),
('Z3-44(5)', '4300034', 'L4', 'Zone_03_(A)', 'D-44 Building Bulk Meter', 'Residential (Apart)', 118, 139, 38, 25, 6, 6, 9, 8, 7, 4, 1),
('Z3-44(6)', '4300035', 'L4', 'Zone_03_(A)', 'D-44 Building Bulk Meter', 'Residential (Apart)', 34, 37, 31, 37, 35, 32, 37, 38, 37, 40, 44),
('D 44-Building Common', '4300144', 'L4', 'Zone_03_(A)', 'D-44 Building Bulk Meter', 'D_Building_Common', 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1),

-- L3 - Zone 3B Villas
('Z3-3 (Villa)', '4300088', 'L3', 'Zone_03_(B)', 'ZONE 3B (BULK ZONE 3B)', 'Residential (Villa)', 66, 59, 63, 73, 176, 192, 136, 118, 106, 119, 96),
('Z3-8 (Villa)', '4300105', 'L3', 'Zone_03_(B)', 'ZONE 3B (BULK ZONE 3B)', 'Residential (Villa)', 83, 106, 196, 358, 414, 346, 132, 54, 48, 53, 54),
('Z3-12 (Villa)', '4300076', 'L3', 'Zone_03_(B)', 'ZONE 3B (BULK ZONE 3B)', 'Residential (Villa)', 73, 59, 54, 181, 178, 249, 188, 179, 161, 77, 114),

-- L3 - Zone 3B Building Bulks
('D-52 Building Bulk Meter', '4300186', 'L3', 'Zone_03_(B)', 'ZONE 3B (BULK ZONE 3B)', 'D_Building_Bulk', 40, 35, 25, 37, 48, 46, 52, 47, 26, 104, 41),
('D-53 Building Bulk Meter', '4300311', 'L3', 'Zone_03_(B)', 'ZONE 3B (BULK ZONE 3B)', 'D_Building_Bulk', 18, 27, 26, 39, 21, 27, 26, 30, 45, 94, 106),
('D-54 Building Bulk Meter', '4300312', 'L3', 'Zone_03_(B)', 'ZONE 3B (BULK ZONE 3B)', 'D_Building_Bulk', 63, 52, 66, 95, 51, 55, 76, 55, 50, 45, 67),

-- L3 - Zone 5 Villas
('Z5-3', '4300170', 'L3', 'Zone_05', 'ZONE 5 (Bulk Zone 5)', 'Residential (Villa)', 149, 86, 67, 100, 70, 82, 95, 100, 135, 120, 114),
('Z5-13', '4300058', 'L3', 'Zone_05', 'ZONE 5 (Bulk Zone 5)', 'Residential (Villa)', 72, 106, 89, 120, 109, 115, 155, 146, 123, 168, 67),
('Z5-17', '4300001', 'L3', 'Zone_05', 'ZONE 5 (Bulk Zone 5)', 'Residential (Villa)', 112, 80, 81, 90, 58, 72, 88, 74, 103, 84, 83),
('Z5-22', '4300163', 'L3', 'Zone_05', 'ZONE 5 (Bulk Zone 5)', 'Residential (Villa)', 15, 40, 186, 243, 201, 186, 192, 175, 80, 108, 78),
('Z5-30', '4300147', 'L3', 'Zone_05', 'ZONE 5 (Bulk Zone 5)', 'Residential (Villa)', 65, 87, 71, 113, 203, 238, 212, 155, 76, 73, 110),

-- L3 - Zone 8 Villas
('Z8-5', '4300287', 'L3', 'Zone_08', 'BULK ZONE 8', 'Residential (Villa)', 208, 341, 313, 336, 325, 236, 224, 98, 326, 203, 155),
('Z8-12', '4300196', 'L3', 'Zone_08', 'BULK ZONE 8', 'Residential (Villa)', 236, 192, 249, 267, 295, 386, 466, 550, 302, 233, 199),
('Z8-15', '4300198', 'L3', 'Zone_08', 'BULK ZONE 8', 'Residential (Villa)', 99, 61, 70, 125, 112, 121, 123, 126, 106, 107, 129),
('Z8-17', '4300200', 'L3', 'Zone_08', 'BULK ZONE 8', 'Residential (Villa)', 164, 162, 171, 207, 238, 211, 192, 200, 177, 206, 200),

-- L3 - Village Square & Sales Center
('Coffee 2 (GF Shop No.594 A)', '4300329', 'L3', 'Zone_VS', 'Village Square (Zone Bulk)', 'Retail', 2, 3, 5, 5, 5, 4, 9, 5, 15, 10, 11),
('Laundry Services', '4300332', 'L3', 'Zone_VS', 'Village Square (Zone Bulk)', 'Retail', 33, 25, 22, 0, 44, 28, 44, 42, 42, 49, 61),
('Sale Centre Caffe & Bar', '4300328', 'L3', 'Zone_SC', 'Sale Centre (Zone Bulk)', 'Retail', 0, 2, 3, 5, 12, 5, 20, 33, 27, 43, 40);

-- ================================================
-- VERIFICATION QUERIES
-- Run these to verify the data was inserted correctly
-- ================================================

-- Count total meters
-- SELECT COUNT(*) as total_meters FROM "Water System";

-- Count by level
-- SELECT level, COUNT(*) as count FROM "Water System" GROUP BY level ORDER BY level;

-- Count by zone
-- SELECT zone, COUNT(*) as count FROM "Water System" GROUP BY zone ORDER BY zone;

-- ================================================
-- Done! Your Water System table is now ready for use.
-- ================================================
