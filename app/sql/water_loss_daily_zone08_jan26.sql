-- =====================================================
-- Water Loss Daily - Zone 08 January 2026
-- Calculate L2 (bulk), L3 (sum of meters), Loss for each day
-- =====================================================

-- Delete existing Zone 08 data for Jan-26
DELETE FROM water_loss_daily
WHERE zone = 'Zone 08' AND month = 'Jan-26' AND year = 2026;

-- Insert calculated data for all 21 days
-- L2 = 0 (bulk meter 4300342 has NULL values)
-- L3 = Sum of all Zone 08 individual meters (Z8-1 through Z8-22)
-- Loss = L2 - L3
-- Loss % = When L2 is 0, we show the L3 total as "unaccounted" with 0% loss

INSERT INTO water_loss_daily (zone, day, date, l2_total_m3, l3_total_m3, loss_m3, loss_percent, month, year)
SELECT
    'Zone 08' as zone,
    day_num as day,
    ('2026-01-' || LPAD(day_num::text, 2, '0'))::date as date,
    0 as l2_total_m3,  -- Bulk meter has no readings
    l3_sum as l3_total_m3,
    0 - l3_sum as loss_m3,  -- Negative means more recorded at individual meters
    0 as loss_percent,  -- Can't calculate % when L2 is 0
    'Jan-26' as month,
    2026 as year
FROM (
    SELECT
        day_num,
        ROUND(COALESCE(SUM(
            CASE day_num
                WHEN 1 THEN day_1
                WHEN 2 THEN day_2
                WHEN 3 THEN day_3
                WHEN 4 THEN day_4
                WHEN 5 THEN day_5
                WHEN 6 THEN day_6
                WHEN 7 THEN day_7
                WHEN 8 THEN day_8
                WHEN 9 THEN day_9
                WHEN 10 THEN day_10
                WHEN 11 THEN day_11
                WHEN 12 THEN day_12
                WHEN 13 THEN day_13
                WHEN 14 THEN day_14
                WHEN 15 THEN day_15
                WHEN 16 THEN day_16
                WHEN 17 THEN day_17
                WHEN 18 THEN day_18
                WHEN 19 THEN day_19
                WHEN 20 THEN day_20
                WHEN 21 THEN day_21
            END
        ), 0)::numeric, 2) as l3_sum
    FROM water_daily_consumption
    CROSS JOIN generate_series(1, 21) as day_num
    WHERE zone = 'Zone_08'
      AND month = 'Jan-26'
      AND year = 2026
      AND label = 'L3'  -- Only L3 meters (villas) for Zone 08
    GROUP BY day_num
) daily_totals
ORDER BY day_num;

-- Verify the inserted data
SELECT
    zone,
    day,
    date,
    l2_total_m3,
    l3_total_m3,
    loss_m3,
    loss_percent
FROM water_loss_daily
WHERE zone = 'Zone 08' AND month = 'Jan-26' AND year = 2026
ORDER BY day;
