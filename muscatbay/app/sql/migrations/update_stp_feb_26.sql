-- STP Operations Update: February 2026
-- Run this SQL in your Supabase SQL Editor
-- This script adds/updates STP data up to Feb 27, 2026

-- First, delete any existing records for this date range to avoid duplicates
DELETE FROM stp_operations
WHERE date >= '2026-02-01' AND date <= '2026-02-28';

-- Insert February 2026 data
INSERT INTO stp_operations (date, tanker_trips, inlet_sewage, tse_for_irrigation, generated_income, water_savings, total_impact, monthly_volume_input, monthly_volume_output, monthly_income, monthly_savings) VALUES
('2026-02-01', 13, 692, 565, 59, 745.8, 804.8, NULL, NULL, NULL, NULL),
('2026-02-02', 9, 538, 562, 41, 741.84, 782.84, NULL, NULL, NULL, NULL),
('2026-02-03', 12, 619, 550, 54, 726.0, 780.0, NULL, NULL, NULL, NULL),
('2026-02-05', 17, 605, 596, 77, 786.72, 863.72, NULL, NULL, NULL, NULL),
('2026-02-06', 13, 685, 619, 59, 817.08, 876.08, NULL, NULL, NULL, NULL),
('2026-02-07', 14, 630, 614, 63, 810.48, 873.48, NULL, NULL, NULL, NULL),
('2026-02-08', 14, 632, 614, 63, 810.48, 873.48, NULL, NULL, NULL, NULL),
('2026-02-09', 17, 634, 632, 77, 834.24, 911.24, NULL, NULL, NULL, NULL),
('2026-02-10', 16, 663, 620, 72, 818.4, 890.4, NULL, NULL, NULL, NULL),
('2026-02-11', 16, 654, 607, 72, 801.24, 873.24, NULL, NULL, NULL, NULL),
('2026-02-12', 16, 621, 612, 72, 807.84, 879.84, NULL, NULL, NULL, NULL),
('2026-02-13', 11, 562, 597, 50, 788.04, 838.04, NULL, NULL, NULL, NULL),
('2026-02-14', 16, 770, 626, 72, 826.32, 898.32, NULL, NULL, NULL, NULL),
('2026-02-15', 18, 709, 616, 81, 813.12, 894.12, NULL, NULL, NULL, NULL),
('2026-02-16', 13, 658, 640, 59, 844.8, 903.8, NULL, NULL, NULL, NULL),
('2026-02-17', 14, 582, 525, 63, 693.0, 756.0, NULL, NULL, NULL, NULL),
('2026-02-18', 5, 550, 562, 23, 741.84, 764.84, NULL, NULL, NULL, NULL),
('2026-02-19', 12, 555, 656, 54, 865.92, 919.92, NULL, NULL, NULL, NULL),
('2026-02-20', 6, 436, 394, 27, 520.08, 547.08, NULL, NULL, NULL, NULL),
('2026-02-21', 10, 551, 534, 45, 704.88, 749.88, NULL, NULL, NULL, NULL),
('2026-02-22', 12, 544, 539, 54, 711.48, 765.48, NULL, NULL, NULL, NULL),
('2026-02-23', 11, 614, 496, 50, 654.72, 704.72, NULL, NULL, NULL, NULL),
('2026-02-24', 7, 509, 484, 32, 638.88, 670.88, NULL, NULL, NULL, NULL),
('2026-02-25', 11, 629, 522, 50, 689.04, 739.04, NULL, NULL, NULL, NULL),
('2026-02-26', 10, 576, 502, 45, 662.64, 707.64, NULL, NULL, NULL, NULL),
('2026-02-27', 10, 530, 598, 45, 789.36, 834.36, NULL, NULL, NULL, NULL);

-- Verify inserted data
SELECT COUNT(*) as total_records, MIN(date) as earliest_date, MAX(date) as latest_date
FROM stp_operations
WHERE date >= '2026-02-01' AND date <= '2026-02-28';
