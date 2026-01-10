-- ================================================
-- ELECTRICITY METERS DATA UPDATE - Nov-25 & Dec-25
-- ================================================
-- Run this script in your Supabase SQL Editor
-- Project: Muscat Bay Facility Management
-- Date: January 2026
-- Purpose: Add Nov-25 and Dec-25 readings for all meters
-- ================================================

-- First, remove any existing Nov-25 and Dec-25 readings to avoid duplicates
DELETE FROM electricity_readings WHERE month IN ('Nov-25', 'Dec-25');

-- ================================================
-- INSERT NOV-25 AND DEC-25 READINGS
-- ================================================

-- Beachwell readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Nov-25', 30159), ('Dec-25', 17344)
) AS readings(month, consumption)
WHERE name = 'Beachwell';

-- ROP Building readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Nov-25', 2084), ('Dec-25', 1308)
) AS readings(month, consumption)
WHERE name = 'ROP Building';

-- Security Building readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Nov-25', 5180), ('Dec-25', 6995)
) AS readings(month, consumption)
WHERE name = 'Security Building';

-- Central Park readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Nov-25', 18028), ('Dec-25', 22191)
) AS readings(month, consumption)
WHERE name = 'Central Park';

-- Village Square readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Nov-25', 4798), ('Dec-25', 4425)
) AS readings(month, consumption)
WHERE name = 'Village Square';

-- D Building 51 readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Nov-25', 1308), ('Dec-25', 916)
) AS readings(month, consumption)
WHERE name = 'D Building 51';

-- D Building 45 readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Nov-25', 725), ('Dec-25', 629)
) AS readings(month, consumption)
WHERE name = 'D Building 45';

-- D Building 48 readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Nov-25', 1060), ('Dec-25', 748)
) AS readings(month, consumption)
WHERE name = 'D Building 48';

-- D Building 75 readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Nov-25', 1940), ('Dec-25', 1127)
) AS readings(month, consumption)
WHERE name = 'D Building 75';

-- D Building 50 readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Nov-25', 1142), ('Dec-25', 809)
) AS readings(month, consumption)
WHERE name = 'D Building 50';

-- D Building 74 readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Nov-25', 607), ('Dec-25', 429)
) AS readings(month, consumption)
WHERE name = 'D Building 74';

-- D Building 47 readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Nov-25', 989), ('Dec-25', 977)
) AS readings(month, consumption)
WHERE name = 'D Building 47';

-- D Building 52 readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Nov-25', 1300), ('Dec-25', 912)
) AS readings(month, consumption)
WHERE name = 'D Building 52';

-- D Building 46 readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Nov-25', 1691), ('Dec-25', 1010)
) AS readings(month, consumption)
WHERE name = 'D Building 46';

-- D Building 44 readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Nov-25', 1141), ('Dec-25', 650)
) AS readings(month, consumption)
WHERE name = 'D Building 44';

-- D Building 49 readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Nov-25', 1137), ('Dec-25', 805)
) AS readings(month, consumption)
WHERE name = 'D Building 49';

-- D Building 62 readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Nov-25', 1220), ('Dec-25', 722)
) AS readings(month, consumption)
WHERE name = 'D Building 62';

-- D Building 53 readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Nov-25', 1375), ('Dec-25', 1224)
) AS readings(month, consumption)
WHERE name = 'D Building 53';

-- D Building 54 readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Nov-25', 1030), ('Dec-25', 842)
) AS readings(month, consumption)
WHERE name = 'D Building 54';

-- D Building 55 readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Nov-25', 1090), ('Dec-25', 751)
) AS readings(month, consumption)
WHERE name = 'D Building 55';

-- D Building 56 readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Nov-25', 1725), ('Dec-25', 1076)
) AS readings(month, consumption)
WHERE name = 'D Building 56';

-- D Building 57 readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Nov-25', 1515), ('Dec-25', 1498)
) AS readings(month, consumption)
WHERE name = 'D Building 57';

-- D Building 58 readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Nov-25', 1517), ('Dec-25', 1104)
) AS readings(month, consumption)
WHERE name = 'D Building 58';

-- D Building 59 readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Nov-25', 1193), ('Dec-25', 921)
) AS readings(month, consumption)
WHERE name = 'D Building 59';

-- D Building 60 readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Nov-25', 1843), ('Dec-25', 1082)
) AS readings(month, consumption)
WHERE name = 'D Building 60';

-- D Building 61 readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Nov-25', 1455), ('Dec-25', 733)
) AS readings(month, consumption)
WHERE name = 'D Building 61';

-- Actuator DB 02 readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Nov-25', 172), ('Dec-25', 382)
) AS readings(month, consumption)
WHERE name = 'Actuator DB 02';

-- Actuator DB 04 readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Nov-25', 240), ('Dec-25', 255)
) AS readings(month, consumption)
WHERE name = 'Actuator DB 04';

-- Actuator DB 03 readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Nov-25', 141), ('Dec-25', 136)
) AS readings(month, consumption)
WHERE name = 'Actuator DB 03';

-- Actuator DB 05 readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Nov-25', 18), ('Dec-25', 18)
) AS readings(month, consumption)
WHERE name = 'Actuator DB 05';

-- Actuator DB 06 readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Nov-25', 46), ('Dec-25', 46)
) AS readings(month, consumption)
WHERE name = 'Actuator DB 06';

-- Helipad readings (all zeros)
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Nov-25', 0), ('Dec-25', 0)
) AS readings(month, consumption)
WHERE name = 'Helipad';

-- Actuator DB 01 (Z8) readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Nov-25', 3), ('Dec-25', 3)
) AS readings(month, consumption)
WHERE name = 'Actuator DB 01 (Z8)';

-- Guard House readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Nov-25', 1077), ('Dec-25', 816)
) AS readings(month, consumption)
WHERE name = 'Guard House';

-- Zone-3 landscape light 17 readings (all zeros)
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Nov-25', 0), ('Dec-25', 0)
) AS readings(month, consumption)
WHERE name = 'Zone-3 landscape light 17';

-- Zone-3 landscape light 21 readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Nov-25', 67), ('Dec-25', 70)
) AS readings(month, consumption)
WHERE name = 'Zone-3 landscape light 21';

-- Zone-3 landscape light 22 readings (all zeros)
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Nov-25', 0), ('Dec-25', 0)
) AS readings(month, consumption)
WHERE name = 'Zone-3 landscape light 22';

-- Irrigation Tank 03 readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Nov-25', 1304), ('Dec-25', 851)
) AS readings(month, consumption)
WHERE name = 'Irrigation Tank 03';

-- Irrigation Tank 01 readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Nov-25', 2781), ('Dec-25', 2678)
) AS readings(month, consumption)
WHERE name = 'Irrigation Tank 01';

-- Irrigation Tank 02 readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Nov-25', 1950), ('Dec-25', 1323)
) AS readings(month, consumption)
WHERE name = 'Irrigation Tank 02';

-- Irrigation Tank 04 readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Nov-25', 796), ('Dec-25', 294)
) AS readings(month, consumption)
WHERE name = 'Irrigation Tank 04';

-- Lifting Station 04 readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Nov-25', 401), ('Dec-25', 487)
) AS readings(month, consumption)
WHERE name = 'Lifting Station 04';

-- Lifting Station 02 readings (all zeros)
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Nov-25', 0), ('Dec-25', 0)
) AS readings(month, consumption)
WHERE name = 'Lifting Station 02';

-- Lifting Station 05 readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Nov-25', 2816), ('Dec-25', 2983)
) AS readings(month, consumption)
WHERE name = 'Lifting Station 05';

-- Lifting Station 03 readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Nov-25', 65), ('Dec-25', 71)
) AS readings(month, consumption)
WHERE name = 'Lifting Station 03';

-- Pumping Station 05 readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Nov-25', 2653), ('Dec-25', 2773)
) AS readings(month, consumption)
WHERE name = 'Pumping Station 05';

-- Pumping Station 04 readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Nov-25', 915), ('Dec-25', 924)
) AS readings(month, consumption)
WHERE name = 'Pumping Station 04';

-- Pumping Station 03 readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Nov-25', 67), ('Dec-25', 68)
) AS readings(month, consumption)
WHERE name = 'Pumping Station 03';

-- Pumping Station 01 readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Nov-25', 2439), ('Dec-25', 2195)
) AS readings(month, consumption)
WHERE name = 'Pumping Station 01';

-- Bank muscat readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Nov-25', 69), ('Dec-25', 744)
) AS readings(month, consumption)
WHERE name = 'Bank muscat';

-- CIF kitchen readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Nov-25', 13920), ('Dec-25', 13586)
) AS readings(month, consumption)
WHERE name = 'CIF kitchen';

-- OUA Store (BTU Meter) readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Nov-25', 1242), ('Dec-25', 1948)
) AS readings(month, consumption)
WHERE name = 'OUA Store (BTU Meter)';

-- Street Light FP 05 readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Nov-25', 1690), ('Dec-25', 1418)
) AS readings(month, consumption)
WHERE name = 'Street Light FP 05';

-- Street Light FP 03 readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Nov-25', 2100), ('Dec-25', 2048)
) AS readings(month, consumption)
WHERE name = 'Street Light FP 03';

-- Street Light FP 02 readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Nov-25', 2739), ('Dec-25', 2619)
) AS readings(month, consumption)
WHERE name = 'Street Light FP 02';

-- Street Light FP 04 readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Nov-25', 2092), ('Dec-25', 1653)
) AS readings(month, consumption)
WHERE name = 'Street Light FP 04';

-- Street Light FP 01 (Z8) readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Nov-25', 3581), ('Dec-25', 3518)
) AS readings(month, consumption)
WHERE name = 'Street Light FP 01 (Z8)';

-- ================================================
-- VERIFICATION QUERIES
-- ================================================

-- Check Nov-25 readings count
SELECT COUNT(*) as nov_25_count FROM electricity_readings WHERE month = 'Nov-25';

-- Check Dec-25 readings count  
SELECT COUNT(*) as dec_25_count FROM electricity_readings WHERE month = 'Dec-25';

-- Check total readings count
SELECT COUNT(*) as total_readings FROM electricity_readings;

-- Sample verification - Show Nov-25 and Dec-25 readings
SELECT m.name, m.meter_type, r.month, r.consumption
FROM electricity_meters m
JOIN electricity_readings r ON m.id = r.meter_id
WHERE r.month IN ('Nov-25', 'Dec-25')
ORDER BY m.name, r.month
LIMIT 20;

-- ================================================
-- SUCCESS MESSAGE
-- ================================================
-- If all queries above execute successfully, you should see:
-- - nov_25_count: 58 (number of meters with Nov-25 readings)
-- - dec_25_count: 58 (number of meters with Dec-25 readings)
-- The frontend will automatically pick up the new data!
