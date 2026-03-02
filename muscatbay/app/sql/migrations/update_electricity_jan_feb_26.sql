-- ================================================
-- ELECTRICITY METERS DATA UPDATE (Jan-26, Feb-26)
-- ================================================
-- Run this script in your Supabase SQL Editor

-- Step 1: Remove existing Jan-26 and Feb-26 data to prevent duplicates
DELETE FROM electricity_readings WHERE month IN ('Jan-26', 'Feb-26');

-- Step 2: Insert the newly provided valid data
-- Beachwell readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Jan-26', 16247.0),
    ('Feb-26', 38806.0)
) AS readings(month, consumption)
WHERE name = 'Beachwell';

-- ROP Building readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Jan-26', 75472.0),
    ('Feb-26', 76771.0)
) AS readings(month, consumption)
WHERE name = 'ROP Building';

-- Security Building readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Jan-26', 195192.0),
    ('Feb-26', 199711.0)
) AS readings(month, consumption)
WHERE name = 'Security Building';

-- Central Park readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Jan-26', 1088385.0),
    ('Feb-26', 1108274.0)
) AS readings(month, consumption)
WHERE name = 'Central Park';

-- Village Square readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Jan-26', 268033.0),
    ('Feb-26', 272517.0)
) AS readings(month, consumption)
WHERE name = 'Village Square';

-- D Building 51 readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Jan-26', 106817.0),
    ('Feb-26', 107583.0)
) AS readings(month, consumption)
WHERE name = 'D Building 51';

-- D Building 45 readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Jan-26', 89093.0),
    ('Feb-26', 89616.0)
) AS readings(month, consumption)
WHERE name = 'D Building 45';

-- D Building 48 readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Jan-26', 104394.0),
    ('Feb-26', 105000.0)
) AS readings(month, consumption)
WHERE name = 'D Building 48';

-- D Building 75 readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Jan-26', 97063.0),
    ('Feb-26', 97656.0)
) AS readings(month, consumption)
WHERE name = 'D Building 75';

-- D Building 50 readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Jan-26', 101870.0),
    ('Feb-26', 102472.0)
) AS readings(month, consumption)
WHERE name = 'D Building 50';

-- D Building 74 readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Jan-26', 82111.0),
    ('Feb-26', 82493.0)
) AS readings(month, consumption)
WHERE name = 'D Building 74';

-- D Building 47 readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Jan-26', 105194.0),
    ('Feb-26', 106100.0)
) AS readings(month, consumption)
WHERE name = 'D Building 47';

-- D Building 52 readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Jan-26', 111193.0),
    ('Feb-26', 112004.0)
) AS readings(month, consumption)
WHERE name = 'D Building 52';

-- D Building 46 readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Jan-26', 101905.0),
    ('Feb-26', 102629.0)
) AS readings(month, consumption)
WHERE name = 'D Building 46';

-- D Building 44 readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Jan-26', 95930.0),
    ('Feb-26', 96566.0)
) AS readings(month, consumption)
WHERE name = 'D Building 44';

-- D Building 49 readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Jan-26', 89394.0),
    ('Feb-26', 89849.0)
) AS readings(month, consumption)
WHERE name = 'D Building 49';

-- D Building 62 readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Jan-26', 88446.0),
    ('Feb-26', 89175.0)
) AS readings(month, consumption)
WHERE name = 'D Building 62';

-- D Building 53 readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Jan-26', 22724.0),
    ('Feb-26', 23668.0)
) AS readings(month, consumption)
WHERE name = 'D Building 53';

-- D Building 54 readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Jan-26', 22226.0),
    ('Feb-26', 22943.0)
) AS readings(month, consumption)
WHERE name = 'D Building 54';

-- D Building 55 readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Jan-26', 24072.0),
    ('Feb-26', 24629.0)
) AS readings(month, consumption)
WHERE name = 'D Building 55';

-- D Building 56 readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Jan-26', 30389.0),
    ('Feb-26', 31367.0)
) AS readings(month, consumption)
WHERE name = 'D Building 56';

-- D Building 57 readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Jan-26', 30910.0),
    ('Feb-26', 32215.0)
) AS readings(month, consumption)
WHERE name = 'D Building 57';

-- D Building 58 readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Jan-26', 22101.0),
    ('Feb-26', 22869.0)
) AS readings(month, consumption)
WHERE name = 'D Building 58';

-- D Building 59 readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Jan-26', 23982.0),
    ('Feb-26', 24812.0)
) AS readings(month, consumption)
WHERE name = 'D Building 59';

-- D Building 60 readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Jan-26', 24382.0),
    ('Feb-26', 25177.0)
) AS readings(month, consumption)
WHERE name = 'D Building 60';

-- D Building 61 readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Jan-26', 28755.0),
    ('Feb-26', 29501.0)
) AS readings(month, consumption)
WHERE name = 'D Building 61';

-- Actuator DB 02 readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Jan-26', 2800.0),
    ('Feb-26', 3190.0)
) AS readings(month, consumption)
WHERE name = 'Actuator DB 02';

-- Actuator DB 04 readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Jan-26', 11567.0),
    ('Feb-26', 11825.0)
) AS readings(month, consumption)
WHERE name = 'Actuator DB 04';

-- Actuator DB 03 readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Jan-26', 2000.0),
    ('Feb-26', 2129.0)
) AS readings(month, consumption)
WHERE name = 'Actuator DB 03';

-- Actuator DB 05 readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Jan-26', 213.0),
    ('Feb-26', 230.0)
) AS readings(month, consumption)
WHERE name = 'Actuator DB 05';

-- Actuator DB 06 readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Jan-26', 867.0),
    ('Feb-26', 912.0)
) AS readings(month, consumption)
WHERE name = 'Actuator DB 06';

-- Helipad readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Jan-26', 14.0),
    ('Feb-26', 14.0)
) AS readings(month, consumption)
WHERE name = 'Helipad';

-- Actuator DB 01 (Z8) readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Jan-26', 621.0),
    ('Feb-26', 635.0)
) AS readings(month, consumption)
WHERE name = 'Actuator DB 01 (Z8)';

-- Guard House readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Jan-26', 47863.0),
    ('Feb-26', 48768.0)
) AS readings(month, consumption)
WHERE name = 'Guard House';

-- Zone-3 landscape light 21 readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Jan-26', 708.0),
    ('Feb-26', 762.0)
) AS readings(month, consumption)
WHERE name = 'Zone-3 landscape light 21';

-- Zone-3 landscape light 22 readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Jan-26', 14.0),
    ('Feb-26', 20.0)
) AS readings(month, consumption)
WHERE name = 'Zone-3 landscape light 22';

-- Irrigation Tank 03 readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Jan-26', 77588.0),
    ('Feb-26', 78439.0)
) AS readings(month, consumption)
WHERE name = 'Irrigation Tank 03';

-- Irrigation Tank 01 readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Jan-26', 142166.0),
    ('Feb-26', 144853.0)
) AS readings(month, consumption)
WHERE name = 'Irrigation Tank 01';

-- Irrigation Tank 02 readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Jan-26', 158849.0)
) AS readings(month, consumption)
WHERE name = 'Irrigation Tank 02';

-- Irrigation Tank 04 readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Jan-26', 9192.0),
    ('Feb-26', 9434.0)
) AS readings(month, consumption)
WHERE name = 'Irrigation Tank 04';

-- Lifting Station 04 readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Jan-26', 39688.0),
    ('Feb-26', 40564.0)
) AS readings(month, consumption)
WHERE name = 'Lifting Station 04';

-- Lifting Station 02 readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Jan-26', 7729.0),
    ('Feb-26', 7729.0)
) AS readings(month, consumption)
WHERE name = 'Lifting Station 02';

-- Lifting Station 05 readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Jan-26', 108984.0),
    ('Feb-26', 109035.0)
) AS readings(month, consumption)
WHERE name = 'Lifting Station 05';

-- Lifting Station 03 readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Jan-26', 10406.0),
    ('Feb-26', 10468.0)
) AS readings(month, consumption)
WHERE name = 'Lifting Station 03';

-- Pumping Station 05 readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Jan-26', 93494.0),
    ('Feb-26', 96705.0)
) AS readings(month, consumption)
WHERE name = 'Pumping Station 05';

-- Pumping Station 04 readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Jan-26', 11282.0),
    ('Feb-26', 12085.0)
) AS readings(month, consumption)
WHERE name = 'Pumping Station 04';

-- Pumping Station 03 readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Jan-26', 1706.0),
    ('Feb-26', 1769.0)
) AS readings(month, consumption)
WHERE name = 'Pumping Station 03';

-- Pumping Station 01 readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Jan-26', 81667.0),
    ('Feb-26', 83870.0)
) AS readings(month, consumption)
WHERE name = 'Pumping Station 01';

-- Street Light FP 05 readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Jan-26', 36078.0),
    ('Feb-26', 37616.0)
) AS readings(month, consumption)
WHERE name = 'Street Light FP 05';

-- Street Light FP 03 readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Jan-26', 24136.0),
    ('Feb-26', 26169.0)
) AS readings(month, consumption)
WHERE name = 'Street Light FP 03';

-- Street Light FP 02 readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Jan-26', 27623.0),
    ('Feb-26', 30038.0)
) AS readings(month, consumption)
WHERE name = 'Street Light FP 02';

-- Street Light FP 04 readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Jan-26', 29445.0),
    ('Feb-26', 31117.0)
) AS readings(month, consumption)
WHERE name = 'Street Light FP 04';

-- Street Light FP 01 (Z8) readings
INSERT INTO electricity_readings (meter_id, month, consumption)
SELECT id, month, consumption FROM electricity_meters, 
(VALUES 
    ('Jan-26', 40009.0),
    ('Feb-26', 43294.0)
) AS readings(month, consumption)
WHERE name = 'Street Light FP 01 (Z8)';

-- Verify inserted data
SELECT month, COUNT(*) as reading_count 
FROM electricity_readings 
WHERE month IN ('Jan-26', 'Feb-26')
GROUP BY month
ORDER BY month;
