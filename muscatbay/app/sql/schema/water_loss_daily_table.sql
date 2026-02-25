-- =====================================================
-- Water Loss Daily Table Creation Script
-- Run this script in Supabase SQL Editor
-- =====================================================

-- Drop existing table if it exists
DROP TABLE IF EXISTS water_loss_daily;

-- Create the water_loss_daily table
CREATE TABLE water_loss_daily (
    id SERIAL PRIMARY KEY,
    zone TEXT NOT NULL,
    day INTEGER NOT NULL CHECK (day >= 1 AND day <= 31),
    date DATE NOT NULL,
    l2_total_m3 DECIMAL(10, 2),
    l3_total_m3 DECIMAL(10, 2),
    loss_m3 DECIMAL(10, 2),
    loss_percent DECIMAL(10, 2),  -- Increased precision for large negative values
    month TEXT NOT NULL,
    year INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint to prevent duplicate entries
    UNIQUE(zone, day, month, year)
);

-- Enable Row Level Security
ALTER TABLE water_loss_daily ENABLE ROW LEVEL SECURITY;

-- Create policies for anonymous access (needed for public app)
CREATE POLICY "Allow anonymous read access" ON water_loss_daily 
    FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anonymous insert" ON water_loss_daily 
    FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anonymous update" ON water_loss_daily 
    FOR UPDATE TO anon USING (true);

CREATE POLICY "Allow anonymous delete" ON water_loss_daily 
    FOR DELETE TO anon USING (true);

-- Create policies for authenticated users
CREATE POLICY "Allow authenticated read access" ON water_loss_daily 
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert" ON water_loss_daily 
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update" ON water_loss_daily 
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated delete" ON water_loss_daily 
    FOR DELETE TO authenticated USING (true);

-- =====================================================
-- INSERT SAMPLE DATA (January 2026)
-- Based on user's provided data
-- =====================================================

INSERT INTO water_loss_daily (zone, day, date, l2_total_m3, l3_total_m3, loss_m3, loss_percent, month, year) VALUES
-- Zone FM data
('Zone FM', 1, '2026-01-01', 72, 65.96, 6.04, 8.4, 'Jan-26', 2026),
('Zone FM', 2, '2026-01-02', 67, 65, 2, 3.0, 'Jan-26', 2026),
('Zone FM', 3, '2026-01-03', 64, 53.53, 10.47, 16.4, 'Jan-26', 2026),
('Zone FM', 4, '2026-01-04', 77, 65.30, 11.70, 15.2, 'Jan-26', 2026),
('Zone FM', 5, '2026-01-05', 74, 57.56, 16.44, 22.2, 'Jan-26', 2026),
('Zone FM', 6, '2026-01-06', 80, 64.11, 15.89, 19.9, 'Jan-26', 2026),
('Zone FM', 7, '2026-01-07', 73, 52.91, 20.09, 27.5, 'Jan-26', 2026),
('Zone FM', 8, '2026-01-08', 68, 54.12, 13.88, 20.4, 'Jan-26', 2026),
('Zone FM', 9, '2026-01-09', 71, 55.42, 15.58, 21.9, 'Jan-26', 2026),
('Zone FM', 10, '2026-01-10', 72, 52.72, 19.28, 26.8, 'Jan-26', 2026),
('Zone FM', 11, '2026-01-11', 75, 62.77, 12.23, 16.3, 'Jan-26', 2026),
('Zone FM', 12, '2026-01-12', 72, 56.02, 15.98, 22.2, 'Jan-26', 2026),
('Zone FM', 13, '2026-01-13', 71, 72.22, -1.22, -1.7, 'Jan-26', 2026),
('Zone FM', 14, '2026-01-14', 66, 58.85, 7.15, 10.8, 'Jan-26', 2026),
('Zone FM', 15, '2026-01-15', 68, 53.97, 14.03, 20.6, 'Jan-26', 2026),
('Zone FM', 16, '2026-01-16', 70, 50.27, 19.73, 28.2, 'Jan-26', 2026),
('Zone FM', 17, '2026-01-17', 68, 52.07, 15.93, 23.4, 'Jan-26', 2026),
('Zone FM', 18, '2026-01-18', 18, 26.52, -8.52, -47.3, 'Jan-26', 2026),
('Zone FM', 19, '2026-01-19', 60, 47.67, 12.33, 20.6, 'Jan-26', 2026),

-- Zone 3A data
('Zone 3A', 1, '2026-01-01', 91, 74.95, 16.05, 17.6, 'Jan-26', 2026),
('Zone 3A', 2, '2026-01-02', 89, 56.57, 32.43, 36.4, 'Jan-26', 2026),
('Zone 3A', 3, '2026-01-03', 89, 42.13, 46.87, 52.7, 'Jan-26', 2026),
('Zone 3A', 4, '2026-01-04', 86, 41.80, 44.20, 51.4, 'Jan-26', 2026),
('Zone 3A', 5, '2026-01-05', 87, 34.15, 52.85, 60.7, 'Jan-26', 2026),
('Zone 3A', 6, '2026-01-06', 88, 44.88, 43.12, 49.0, 'Jan-26', 2026),
('Zone 3A', 7, '2026-01-07', 85, 28.61, 56.39, 66.3, 'Jan-26', 2026),
('Zone 3A', 8, '2026-01-08', 90, 31.42, 58.58, 65.1, 'Jan-26', 2026),
('Zone 3A', 9, '2026-01-09', 91, 46.18, 44.82, 49.3, 'Jan-26', 2026),
('Zone 3A', 10, '2026-01-10', 92, 31.62, 60.38, 65.6, 'Jan-26', 2026),
('Zone 3A', 11, '2026-01-11', 100, 46.55, 53.45, 53.5, 'Jan-26', 2026),
('Zone 3A', 12, '2026-01-12', 97, 41.51, 55.49, 57.2, 'Jan-26', 2026),
('Zone 3A', 13, '2026-01-13', 94, 41.55, 52.45, 55.8, 'Jan-26', 2026),
('Zone 3A', 14, '2026-01-14', 88, 50.13, 37.87, 43.0, 'Jan-26', 2026),
('Zone 3A', 15, '2026-01-15', 87, 52.45, 34.55, 39.7, 'Jan-26', 2026),

-- Zone 08 data (Bulk meter has no readings - L2 = 0, L3 = sum of villa meters)
-- L3 totals calculated from Z8-1 through Z8-22 villa consumption data
('Zone 08', 1, '2026-01-01', 0, 41.08, -41.08, 0, 'Jan-26', 2026),
('Zone 08', 2, '2026-01-02', 0, 14.89, -14.89, 0, 'Jan-26', 2026),
('Zone 08', 3, '2026-01-03', 0, 42.73, -42.73, 0, 'Jan-26', 2026),
('Zone 08', 4, '2026-01-04', 0, 18.22, -18.22, 0, 'Jan-26', 2026),
('Zone 08', 5, '2026-01-05', 0, 41.83, -41.83, 0, 'Jan-26', 2026),
('Zone 08', 6, '2026-01-06', 0, 40.55, -40.55, 0, 'Jan-26', 2026),
('Zone 08', 7, '2026-01-07', 0, 46.06, -46.06, 0, 'Jan-26', 2026),
('Zone 08', 8, '2026-01-08', 0, 40.28, -40.28, 0, 'Jan-26', 2026),
('Zone 08', 9, '2026-01-09', 0, 12.87, -12.87, 0, 'Jan-26', 2026),
('Zone 08', 10, '2026-01-10', 0, 41.75, -41.75, 0, 'Jan-26', 2026),
('Zone 08', 11, '2026-01-11', 0, 25.22, -25.22, 0, 'Jan-26', 2026),
('Zone 08', 12, '2026-01-12', 0, 48.00, -48.00, 0, 'Jan-26', 2026),
('Zone 08', 13, '2026-01-13', 0, 19.87, -19.87, 0, 'Jan-26', 2026),
('Zone 08', 14, '2026-01-14', 0, 21.90, -21.90, 0, 'Jan-26', 2026),
('Zone 08', 15, '2026-01-15', 0, 38.75, -38.75, 0, 'Jan-26', 2026),
('Zone 08', 16, '2026-01-16', 0, 14.45, -14.45, 0, 'Jan-26', 2026),
('Zone 08', 17, '2026-01-17', 0, 33.21, -33.21, 0, 'Jan-26', 2026),
('Zone 08', 18, '2026-01-18', 0, 34.25, -34.25, 0, 'Jan-26', 2026),
('Zone 08', 19, '2026-01-19', 0, 68.75, -68.75, 0, 'Jan-26', 2026),

-- Zone 3B data
('Zone 3B', 1, '2026-01-01', 189, 56.85, 132.15, 69.9, 'Jan-26', 2026),
('Zone 3B', 2, '2026-01-02', 153, 79.97, 73.03, 47.7, 'Jan-26', 2026),
('Zone 3B', 3, '2026-01-03', 146, 77.27, 68.73, 47.1, 'Jan-26', 2026),
('Zone 3B', 4, '2026-01-04', 145, 72.06, 72.94, 50.3, 'Jan-26', 2026),
('Zone 3B', 5, '2026-01-05', 128, 57.21, 70.79, 55.3, 'Jan-26', 2026),

-- Zone 5 data
('Zone 5', 1, '2026-01-01', 57, 21.11, 35.89, 63.0, 'Jan-26', 2026),
('Zone 5', 2, '2026-01-02', 21, 28.16, -7.16, -34.1, 'Jan-26', 2026),
('Zone 5', 3, '2026-01-03', 146, 51, 95, 65.1, 'Jan-26', 2026),
('Zone 5', 4, '2026-01-04', 96, 36.05, 59.95, 62.4, 'Jan-26', 2026),
('Zone 5', 5, '2026-01-05', 81, 33.08, 47.92, 59.2, 'Jan-26', 2026),
('Zone 5', 6, '2026-01-06', 90, 25.37, 64.63, 71.8, 'Jan-26', 2026),
('Zone 5', 7, '2026-01-07', 94, 27.77, 66.23, 70.5, 'Jan-26', 2026),
('Zone 5', 8, '2026-01-08', 79, 27.17, 51.83, 65.6, 'Jan-26', 2026),
('Zone 5', 9, '2026-01-09', 87, 54.37, 32.63, 37.5, 'Jan-26', 2026),
('Zone 5', 10, '2026-01-10', 91, 59.04, 31.96, 35.1, 'Jan-26', 2026),
('Zone 5', 11, '2026-01-11', 93, 127.30, -34.30, -36.9, 'Jan-26', 2026),
('Zone 5', 12, '2026-01-12', 95, 34.57, 60.43, 63.6, 'Jan-26', 2026),

-- Sales Center data
('Sales Center', 1, '2026-01-01', 0, 1.38, -1.38, 0, 'Jan-26', 2026),
('Sales Center', 2, '2026-01-02', 0.02, 1.34, -1.32, -6600, 'Jan-26', 2026),
('Sales Center', 3, '2026-01-03', 0.01, 0.04, -0.03, -300, 'Jan-26', 2026),
('Sales Center', 4, '2026-01-04', 0.08, 1.42, -1.34, -1675, 'Jan-26', 2026),
('Sales Center', 5, '2026-01-05', 0.05, 1.24, -1.19, -2380, 'Jan-26', 2026),
('Sales Center', 6, '2026-01-06', 5.04, 1.84, 3.20, 63.5, 'Jan-26', 2026),
('Sales Center', 7, '2026-01-07', 5.08, 1.17, 3.91, 77.0, 'Jan-26', 2026),
('Sales Center', 8, '2026-01-08', 5.43, 1.42, 4.01, 73.8, 'Jan-26', 2026),
('Sales Center', 9, '2026-01-09', 4.45, 0.03, 4.42, 99.3, 'Jan-26', 2026),
('Sales Center', 10, '2026-01-10', 5.82, 2.32, 3.50, 60.1, 'Jan-26', 2026),
('Sales Center', 11, '2026-01-11', 5.49, 1.42, 4.07, 74.1, 'Jan-26', 2026),
('Sales Center', 12, '2026-01-12', 5.04, 1.17, 3.87, 76.8, 'Jan-26', 2026),
('Sales Center', 13, '2026-01-13', 5.24, 2.45, 2.79, 53.2, 'Jan-26', 2026),
('Sales Center', 14, '2026-01-14', 5.49, 0.03, 5.46, 99.5, 'Jan-26', 2026),
('Sales Center', 15, '2026-01-15', 2.45, 0.03, 2.42, 98.8, 'Jan-26', 2026),
('Sales Center', 16, '2026-01-16', 4.99, 59.03, -54.04, -1082.8, 'Jan-26', 2026),
('Sales Center', 17, '2026-01-17', 0, 56.48, -56.48, 0, 'Jan-26', 2026),
('Sales Center', 18, '2026-01-18', 2.85, 0.45, 2.40, 84.2, 'Jan-26', 2026),

-- Village Square data
('Village Square', 1, '2026-01-01', 5, 2.03, 2.97, 59.4, 'Jan-26', 2026),
('Village Square', 2, '2026-01-02', 4, 2.31, 1.69, 42.3, 'Jan-26', 2026),
('Village Square', 3, '2026-01-03', 4, 2.88, 1.12, 28.0, 'Jan-26', 2026),
('Village Square', 4, '2026-01-04', 4, 2.33, 1.67, 41.8, 'Jan-26', 2026),
('Village Square', 5, '2026-01-05', 5, 2.54, 2.46, 49.2, 'Jan-26', 2026),
('Village Square', 6, '2026-01-06', 54.6, 2.22, 52.38, 95.9, 'Jan-26', 2026),
('Village Square', 7, '2026-01-07', 4, 3.37, 0.63, 15.8, 'Jan-26', 2026),
('Village Square', 8, '2026-01-08', 4, 2.13, 1.87, 46.8, 'Jan-26', 2026),
('Village Square', 9, '2026-01-09', 5, 2.03, 2.97, 59.4, 'Jan-26', 2026),
('Village Square', 10, '2026-01-10', 3, 2.33, 0.67, 22.3, 'Jan-26', 2026),
('Village Square', 11, '2026-01-11', 4.5, 2.13, 2.37, 52.7, 'Jan-26', 2026),
('Village Square', 12, '2026-01-12', 4, 2.33, 1.67, 41.8, 'Jan-26', 2026),
('Village Square', 13, '2026-01-13', 3.5, 2.04, 1.46, 41.7, 'Jan-26', 2026),
('Village Square', 14, '2026-01-14', 4, 2.21, 1.79, 44.8, 'Jan-26', 2026),
('Village Square', 15, '2026-01-15', 4, 2.03, 1.97, 49.3, 'Jan-26', 2026),
('Village Square', 16, '2026-01-16', 4, 3.33, 0.67, 16.8, 'Jan-26', 2026),
('Village Square', 17, '2026-01-17', 12, 3.12, 8.88, 74.0, 'Jan-26', 2026),
('Village Square', 18, '2026-01-18', 12, 3.21, 8.79, 73.3, 'Jan-26', 2026);

-- Create index for faster queries
CREATE INDEX idx_water_loss_daily_zone_date ON water_loss_daily(zone, date);
CREATE INDEX idx_water_loss_daily_month_year ON water_loss_daily(month, year);

-- Verify the data was inserted
SELECT zone, COUNT(*) as days_recorded FROM water_loss_daily GROUP BY zone ORDER BY zone;
