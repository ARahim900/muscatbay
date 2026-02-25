#!/usr/bin/env node
/**
 * Smart Daily Water Upload Script
 * ================================
 * 
 * Two modes:
 * 
 * MODE 1: Upload zone-level loss summary CSV
 *   Format: zone,day,date,l2_total_m3,l3_total_m3,loss_m3,loss_percent,month
 *   Target table: water_loss_daily
 * 
 * MODE 2: Upload individual meter daily readings CSV
 *   Format: account_number,[meter_name],day_1,day_2,...,day_31
 *   The system matches each meter by account_number in the Water System table,
 *   auto-detects zone/level/type, and:
 *     a) Inserts into water_daily_consumption
 *     b) Auto-calculates zone-level L2 vs L3+L4 loss and inserts into water_loss_daily
 * 
 * Usage:
 *   node scripts/upload-daily-water.js <csv_path> <month> [--mode zone|meter]
 * 
 * Examples:
 *   node scripts/upload-daily-water.js ../Feb2026_Water_Loss_Daily.csv Feb-26 --mode zone
 *   node scripts/upload-daily-water.js ../all_meters_feb26.csv Feb-26 --mode meter
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// ─────────────── Load Supabase credentials ───────────────
const envPath = path.join(__dirname, '..', '.env.local');
let supabaseUrl = '', supabaseKey = '';
if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
        const [key, ...valParts] = line.split('=');
        const val = valParts.join('=').trim();
        if (key.trim() === 'NEXT_PUBLIC_SUPABASE_URL') supabaseUrl = val;
        if (key.trim() === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') supabaseKey = val;
    }
}

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ─────────────── Zone name mapping ───────────────
// CSV zone codes → display names used in the DB
const ZONE_CODE_TO_DISPLAY = {
    'Zone_01_(FM)': 'Zone FM',
    'Zone_03_(A)': 'Zone 3A',
    'Zone_03_(B)': 'Zone 3B',
    'Zone_05': 'Zone 5',
    'Zone_08': 'Zone 08',
    'Zone_VS': 'Village Square',
    'Zone_SC': 'Sales Center',
};

// Reverse mapping for lookups
const ZONE_DISPLAY_TO_CODE = Object.fromEntries(
    Object.entries(ZONE_CODE_TO_DISPLAY).map(([k, v]) => [v, k])
);

// Month format conversion: "2026-02" → { month: "Feb-26", year: 2026 }
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function parseMonthField(rawMonth) {
    // If already in "Feb-26" format, parse it
    if (rawMonth.includes('-') && rawMonth.length <= 6 && !rawMonth.startsWith('20')) {
        const [mon, yr] = rawMonth.split('-');
        return { month: rawMonth, year: parseInt('20' + yr) };
    }
    // "2026-02" format
    if (rawMonth.match(/^\d{4}-\d{2}$/)) {
        const [year, monthNum] = rawMonth.split('-');
        const monthName = MONTH_NAMES[parseInt(monthNum) - 1];
        return { month: `${monthName}-${year.slice(2)}`, year: parseInt(year) };
    }
    // Fallback
    return { month: rawMonth, year: 2026 };
}

function resolveZoneName(rawZone) {
    // If it's already a display name, return it
    if (Object.values(ZONE_CODE_TO_DISPLAY).includes(rawZone)) return rawZone;
    // If it's a zone code, convert
    if (ZONE_CODE_TO_DISPLAY[rawZone]) return ZONE_CODE_TO_DISPLAY[rawZone];
    // Try fuzzy match
    const lower = rawZone.toLowerCase();
    for (const [code, display] of Object.entries(ZONE_CODE_TO_DISPLAY)) {
        if (code.toLowerCase() === lower || display.toLowerCase() === lower) return display;
    }
    return rawZone; // Return as-is if no match
}

// ─────────────── CSV Parser ───────────────
function parseCSV(content) {
    const lines = content.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = line.split(',').map(v => v.trim());
        const row = {};
        headers.forEach((h, idx) => {
            row[h] = values[idx] || '';
        });
        rows.push(row);
    }
    return rows;
}

// ─────────────── Auto-detect CSV mode ───────────────
function detectMode(headers) {
    const lowerHeaders = headers.map(h => h.toLowerCase());

    // Zone-level CSV has: zone, day, date, l2_total_m3, l3_total_m3, loss_m3
    if (lowerHeaders.includes('l2_total_m3') || lowerHeaders.includes('loss_m3')) {
        return 'zone';
    }

    // Meter-level CSV has: account_number and day_1, day_2, etc.
    if (lowerHeaders.includes('account_number') && lowerHeaders.some(h => h.match(/^day_?\d+$/))) {
        return 'meter';
    }

    // Default to zone if has "zone" and "day" columns
    if (lowerHeaders.includes('zone') && lowerHeaders.includes('day')) {
        return 'zone';
    }

    return null;
}

// ═══════════════════════════════════════════════════════
// MODE 1: Upload zone-level loss summary CSV
// ═══════════════════════════════════════════════════════

async function uploadZoneLevelData(csvPath, monthArg) {
    console.log('\n📋 MODE: Zone-Level Water Loss Upload');
    console.log('─'.repeat(50));

    const content = fs.readFileSync(csvPath, 'utf8');
    const rows = parseCSV(content);

    if (rows.length === 0) {
        console.error('❌ No data rows found');
        return;
    }

    console.log(`📊 Parsed ${rows.length} rows from CSV`);

    // Prepare records
    const records = [];
    const zoneStats = {};

    for (const row of rows) {
        // Parse month
        const rawMonth = monthArg || row.month || row.Month || '';
        const { month, year } = parseMonthField(rawMonth);

        // Resolve zone name
        const rawZone = row.zone || row.Zone || '';
        const zone = resolveZoneName(rawZone);

        const day = parseInt(row.day || row.Day || '0');
        const date = row.date || row.Date || `${year}-${String(MONTH_NAMES.indexOf(month.split('-')[0]) + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        const l2 = row.l2_total_m3 !== '' ? parseFloat(row.l2_total_m3) : null;
        const l3 = row.l3_total_m3 !== '' ? parseFloat(row.l3_total_m3) : null;
        const lossM3 = row.loss_m3 !== '' ? parseFloat(row.loss_m3) : (l2 !== null && l3 !== null ? l2 - l3 : null);
        const lossPct = row.loss_percent !== '' ? parseFloat(row.loss_percent) : (l2 && l2 > 0 && lossM3 !== null ? (lossM3 / l2) * 100 : null);

        records.push({
            zone,
            day,
            date,
            l2_total_m3: l2,
            l3_total_m3: l3,
            loss_m3: lossM3,
            loss_percent: lossPct !== null ? Math.round(lossPct * 100) / 100 : null,
            month,
            year,
        });

        if (!zoneStats[zone]) zoneStats[zone] = { count: 0, minDay: 99, maxDay: 0 };
        zoneStats[zone].count++;
        zoneStats[zone].minDay = Math.min(zoneStats[zone].minDay, day);
        zoneStats[zone].maxDay = Math.max(zoneStats[zone].maxDay, day);
    }

    // Show summary before upload
    console.log('\n  Zone Summary:');
    for (const [zone, stats] of Object.entries(zoneStats)) {
        console.log(`  ✓ ${zone.padEnd(20)} → ${stats.count} days (Day ${stats.minDay}-${stats.maxDay})`);
    }

    // Delete existing data for this month/year to avoid duplicates
    const { month, year } = parseMonthField(monthArg || rows[0].month);
    console.log(`\n🗑️  Clearing existing data for ${month} ${year}...`);

    const { error: deleteError } = await supabase
        .from('water_loss_daily')
        .delete()
        .eq('month', month)
        .eq('year', year);

    if (deleteError) {
        console.log(`  ⚠️  Delete error (may be OK if no data): ${deleteError.message}`);
    }

    // Upload in batches
    console.log(`\n📤 Uploading ${records.length} records...`);
    const BATCH = 50;
    let uploaded = 0;

    for (let i = 0; i < records.length; i += BATCH) {
        const batch = records.slice(i, i + BATCH);
        const { error } = await supabase.from('water_loss_daily').insert(batch);

        if (error) {
            console.error(`  ❌ Batch ${Math.floor(i / BATCH) + 1} error: ${error.message}`);
        } else {
            uploaded += batch.length;
            console.log(`  ✅ Batch ${Math.floor(i / BATCH) + 1}: ${batch.length} records uploaded`);
        }
    }

    console.log(`\n✅ Done! ${uploaded}/${records.length} records uploaded to water_loss_daily`);
}

// ═══════════════════════════════════════════════════════
// MODE 2: Upload individual meter daily readings CSV
// ═══════════════════════════════════════════════════════

async function uploadMeterLevelData(csvPath, monthArg) {
    console.log('\n📋 MODE: Individual Meter Daily Readings Upload');
    console.log('─'.repeat(50));

    const content = fs.readFileSync(csvPath, 'utf8');
    const rows = parseCSV(content);

    if (rows.length === 0) {
        console.error('❌ No data rows found');
        return;
    }

    console.log(`📊 Parsed ${rows.length} meter rows from CSV`);

    // Step 1: Load ALL meters from Supabase "Water System" table
    console.log('\n🔍 Loading meter registry from Water System table...');
    const { data: allMeters, error: metersError } = await supabase
        .from('Water System')
        .select('*');

    if (metersError || !allMeters || allMeters.length === 0) {
        console.error(`❌ Failed to load meters: ${metersError?.message || 'No meters found'}`);
        return;
    }

    console.log(`  ✅ Loaded ${allMeters.length} meters from registry`);

    // Build lookup by account number
    const meterLookup = {};
    for (const m of allMeters) {
        meterLookup[m.account_number] = m;
    }

    // Step 2: Match CSV rows to registered meters
    const { month, year } = parseMonthField(monthArg);
    const matched = [];
    const unmatched = [];

    for (const row of rows) {
        const acct = row.account_number || row.Account || row.AccountNumber || '';
        const registeredMeter = meterLookup[acct];

        if (!registeredMeter) {
            unmatched.push(acct);
            continue;
        }

        // Build daily readings
        const dailyData = {
            meter_name: registeredMeter.label,
            account_number: acct,
            label: registeredMeter.level,
            zone: registeredMeter.zone,
            parent_meter: registeredMeter.parent_meter,
            type: registeredMeter.type,
            month,
            year,
        };

        // Parse day_1 through day_31
        for (let d = 1; d <= 31; d++) {
            const val = row[`day_${d}`] || row[`Day_${d}`] || row[`Day ${d}`] || row[`d${d}`] || null;
            dailyData[`day_${d}`] = val !== null && val !== '' ? parseFloat(val) : null;
        }

        matched.push({
            record: dailyData,
            meter: registeredMeter,
        });
    }

    // Step 3: Report matching results grouped by zone
    const zoneGroups = {};
    for (const { record, meter } of matched) {
        const zone = meter.zone;
        if (!zoneGroups[zone]) zoneGroups[zone] = { L1: [], L2: [], L3: [], L4: [], DC: [] };
        const level = meter.level || 'L3';
        if (!zoneGroups[zone][level]) zoneGroups[zone][level] = [];
        zoneGroups[zone][level].push({ record, meter });
    }

    console.log(`\n  📊 Matched: ${matched.length} meters | Unmatched: ${unmatched.length}`);

    if (unmatched.length > 0 && unmatched.length <= 10) {
        console.log(`  ⚠️  Unmatched accounts: ${unmatched.join(', ')}`);
    } else if (unmatched.length > 10) {
        console.log(`  ⚠️  ${unmatched.length} unmatched accounts (first 5: ${unmatched.slice(0, 5).join(', ')}...)`);
    }

    console.log('\n  Zone Breakdown:');
    console.log('  ' + '─'.repeat(60));
    console.log('  Zone                 | L1  | L2  | L3   | L4   | DC  | Total');
    console.log('  ' + '─'.repeat(60));

    for (const [zone, levels] of Object.entries(zoneGroups).sort((a, b) => a[0].localeCompare(b[0]))) {
        const displayZone = ZONE_CODE_TO_DISPLAY[zone] || zone;
        const counts = {
            L1: (levels.L1 || []).length,
            L2: (levels.L2 || []).length,
            L3: (levels.L3 || []).length,
            L4: (levels.L4 || []).length,
            DC: (levels.DC || []).length,
        };
        const total = Object.values(counts).reduce((s, v) => s + v, 0);
        console.log(`  ${displayZone.padEnd(22)} | ${String(counts.L1).padEnd(3)} | ${String(counts.L2).padEnd(3)} | ${String(counts.L3).padEnd(4)} | ${String(counts.L4).padEnd(4)} | ${String(counts.DC).padEnd(3)} | ${total}`);
    }

    // Step 4: Upload individual meter readings to water_daily_consumption
    console.log(`\n📤 Uploading ${matched.length} meter records to water_daily_consumption...`);

    // Clear existing data for this month
    const { error: delConsError } = await supabase
        .from('water_daily_consumption')
        .delete()
        .eq('month', month)
        .eq('year', year);

    if (delConsError) {
        console.log(`  ⚠️  Delete error: ${delConsError.message}`);
    }

    const meterRecords = matched.map(m => m.record);
    const BATCH = 50;
    let uploadedMeters = 0;

    for (let i = 0; i < meterRecords.length; i += BATCH) {
        const batch = meterRecords.slice(i, i + BATCH);
        const { error } = await supabase.from('water_daily_consumption').insert(batch);
        if (error) {
            console.error(`  ❌ Batch ${Math.floor(i / BATCH) + 1}: ${error.message}`);
        } else {
            uploadedMeters += batch.length;
        }
    }
    console.log(`  ✅ ${uploadedMeters} meter records uploaded`);

    // Step 5: Auto-calculate zone-level L2 vs L3+L4 loss per day
    console.log('\n📊 Calculating zone-level daily loss summaries...');

    const lossSummaries = [];

    for (const [zone, levels] of Object.entries(zoneGroups)) {
        const displayZone = ZONE_CODE_TO_DISPLAY[zone] || zone;

        // Find the max day with data
        let maxDay = 0;
        for (const levelMeters of Object.values(levels)) {
            for (const { record } of levelMeters) {
                for (let d = 1; d <= 31; d++) {
                    if (record[`day_${d}`] !== null && record[`day_${d}`] !== undefined) {
                        maxDay = Math.max(maxDay, d);
                    }
                }
            }
        }

        for (let day = 1; day <= maxDay; day++) {
            // L2 total for this zone on this day
            const l2Total = (levels.L2 || []).reduce((sum, { record }) => {
                const val = record[`day_${day}`];
                return sum + (val !== null && val !== undefined ? val : 0);
            }, 0);

            // L3 + L4 total (excluding building bulks)
            const l3Total = [...(levels.L3 || []), ...(levels.L4 || [])].reduce((sum, { record, meter }) => {
                // Skip building bulk meters (they're intermediate, not end-user)
                if (meter.type && meter.type.includes('Building_Bulk')) return sum;
                const val = record[`day_${day}`];
                return sum + (val !== null && val !== undefined ? val : 0);
            }, 0);

            const loss = l2Total - l3Total;
            const lossPct = l2Total > 0 ? (loss / l2Total) * 100 : 0;

            const dateStr = `${year}-${String(MONTH_NAMES.indexOf(month.split('-')[0]) + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

            lossSummaries.push({
                zone: displayZone,
                day,
                date: dateStr,
                l2_total_m3: Math.round(l2Total * 100) / 100,
                l3_total_m3: Math.round(l3Total * 100) / 100,
                loss_m3: Math.round(loss * 100) / 100,
                loss_percent: Math.round(lossPct * 100) / 100,
                month,
                year,
            });
        }
    }

    // Upload loss summaries
    if (lossSummaries.length > 0) {
        console.log(`\n📤 Uploading ${lossSummaries.length} zone-level loss records to water_loss_daily...`);

        const { error: delLossError } = await supabase
            .from('water_loss_daily')
            .delete()
            .eq('month', month)
            .eq('year', year);

        if (delLossError) {
            console.log(`  ⚠️  Delete error: ${delLossError.message}`);
        }

        let uploadedLoss = 0;
        for (let i = 0; i < lossSummaries.length; i += BATCH) {
            const batch = lossSummaries.slice(i, i + BATCH);
            const { error } = await supabase.from('water_loss_daily').insert(batch);
            if (error) {
                console.error(`  ❌ Batch error: ${error.message}`);
            } else {
                uploadedLoss += batch.length;
            }
        }
        console.log(`  ✅ ${uploadedLoss} zone-level loss records uploaded`);
    }

    console.log('\n✅ Smart upload complete!');
}

// ═══════════════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════════════

async function main() {
    const args = process.argv.slice(2);

    if (args.length < 2) {
        console.log(`
📋 Smart Daily Water Upload Script
${'═'.repeat(40)}

Usage:
  node scripts/upload-daily-water.js <csv_path> <month> [--mode zone|meter]

Arguments:
  csv_path   Path to the CSV file
  month      Month in "Feb-26" or "2026-02" format

Options:
  --mode zone    Upload zone-level loss summary (auto-detected)
  --mode meter   Upload individual meter readings (auto-detected)

The mode is auto-detected from the CSV headers if not specified.

Examples:
  # Zone-level loss summary (columns: zone,day,date,l2_total_m3,l3_total_m3,...)
  node scripts/upload-daily-water.js ../Feb2026_Water_Loss_Daily.csv Feb-26

  # Individual meter readings (columns: account_number,day_1,day_2,...,day_31)
  node scripts/upload-daily-water.js ../all_meters_feb26.csv Feb-26 --mode meter
`);
        process.exit(0);
    }

    const csvPath = path.resolve(args[0]);
    const monthArg = args[1];
    let mode = null;

    // Parse --mode flag
    const modeIdx = args.indexOf('--mode');
    if (modeIdx !== -1 && args[modeIdx + 1]) {
        mode = args[modeIdx + 1].toLowerCase();
    }

    // Validate file exists
    if (!fs.existsSync(csvPath)) {
        console.error(`❌ File not found: ${csvPath}`);
        process.exit(1);
    }

    // Auto-detect mode if not specified
    if (!mode) {
        const content = fs.readFileSync(csvPath, 'utf8');
        const firstLine = content.split('\n')[0];
        const headers = firstLine.split(',').map(h => h.trim());
        mode = detectMode(headers);

        if (!mode) {
            console.error('❌ Could not auto-detect CSV format. Use --mode zone or --mode meter');
            process.exit(1);
        }
        console.log(`🔍 Auto-detected mode: ${mode}`);
    }

    console.log(`\n${'═'.repeat(60)}`);
    console.log(`📊 SMART DAILY WATER UPLOAD`);
    console.log(`   File: ${path.basename(csvPath)}`);
    console.log(`   Month: ${monthArg}`);
    console.log(`   Mode: ${mode}`);
    console.log(`${'═'.repeat(60)}`);

    if (mode === 'zone') {
        await uploadZoneLevelData(csvPath, monthArg);
    } else if (mode === 'meter') {
        await uploadMeterLevelData(csvPath, monthArg);
    } else {
        console.error(`❌ Unknown mode: ${mode}. Use 'zone' or 'meter'`);
    }
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
