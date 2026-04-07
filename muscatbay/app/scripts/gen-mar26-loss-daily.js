#!/usr/bin/env node
/**
 * Generate water_loss_daily for Mar-26
 * Reads meter records from water_daily_consumption and calculates
 * zone-level L2 vs L3+L4 summaries, then inserts into water_loss_daily.
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load env
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
if (!supabaseUrl || !supabaseKey) { console.error('❌ Missing Supabase credentials'); process.exit(1); }

const supabase = createClient(supabaseUrl, supabaseKey);

const MONTH = 'Mar-26';
const YEAR = 2026;

// Normalise zone codes → display names used in the app
const ZONE_MAP = {
    'Zone_01_(FM)': 'Zone FM',
    'Zone FM': 'Zone FM',
    'Zone_03_(A)': 'Zone 3A',
    'Zone 3A': 'Zone 3A',
    'Zone_03_(B)': 'Zone 3B',
    'Zone 3B': 'Zone 3B',
    'Zone_05': 'Zone 5',
    'Zone 5': 'Zone 5',
    'Zone_08': 'Zone 08',
    'Zone 08': 'Zone 08',
    'Zone_VS': 'Village Square',
    'Village Square': 'Village Square',
};

function resolveZone(raw) { return ZONE_MAP[raw] || raw; }

async function main() {
    console.log('='.repeat(60));
    console.log(`📊 Generating water_loss_daily for ${MONTH}`);
    console.log('='.repeat(60));

    // Fetch all Mar-26 meter records WITH day columns
    console.log('\n🔍 Fetching meter records from water_daily_consumption...');
    const { data: meters, error } = await supabase
        .from('water_daily_consumption')
        .select('*')
        .eq('month', MONTH)
        .eq('year', YEAR);

    if (error) { console.error('❌', error.message); process.exit(1); }
    if (!meters || meters.length === 0) { console.error('❌ No Mar-26 records found'); process.exit(1); }

    console.log(`✅ ${meters.length} meter records loaded`);

    // Find max day with data
    let maxDay = 0;
    for (const m of meters) {
        for (let d = 1; d <= 31; d++) {
            const val = m[`day_${d}`];
            if (val !== null && val !== undefined) maxDay = Math.max(maxDay, d);
        }
    }
    console.log(`📅 Max day with data: Day ${maxDay}`);

    if (maxDay === 0) { console.error('❌ No day_N columns have data'); process.exit(1); }

    // Group meters by resolved zone
    const byZone = {};
    for (const m of meters) {
        const zone = resolveZone(m.zone);
        if (!byZone[zone]) byZone[zone] = [];
        byZone[zone].push(m);
    }

    console.log('\n  Zone breakdown:');
    for (const [z, list] of Object.entries(byZone)) {
        const l2 = list.filter(m => m.label === 'L2' || m.label === 'L1').length;
        const l3 = list.filter(m => m.label === 'L3' || m.label === 'L4').length;
        console.log(`  ${z.padEnd(20)} → ${list.length} meters (L2/bulk: ${l2}, L3/L4: ${l3})`);
    }

    // Find which days actually have any non-zero data across all meters
    const daysWithData = new Set();
    for (const m of meters) {
        for (let d = 1; d <= maxDay; d++) {
            const v = m[`day_${d}`];
            if (v != null && Number(v) > 0) daysWithData.add(d);
        }
    }
    const activeDays = [...daysWithData].sort((a, b) => a - b);
    console.log(`📅 Days with actual data: ${activeDays.join(', ')}`);

    // Calculate zone-level loss per day (only for days with real data)
    const lossSummaries = [];

    for (const [zone, list] of Object.entries(byZone)) {
        const bulkMeters = list.filter(m => m.label === 'L2' || m.label === 'L1');
        const individualMeters = list.filter(m => {
            if (m.label !== 'L3' && m.label !== 'L4') return false;
            // skip building bulk intermediaries
            if (m.type && (m.type.includes('Building_Bulk') || m.type.includes('D_Building_Bulk'))) return false;
            return true;
        });

        for (const day of activeDays) {
            const l2Total = bulkMeters.reduce((sum, m) => {
                const v = m[`day_${day}`];
                return sum + (v != null ? Number(v) : 0);
            }, 0);

            const l3Total = individualMeters.reduce((sum, m) => {
                const v = m[`day_${day}`];
                return sum + (v != null ? Number(v) : 0);
            }, 0);

            const loss = l2Total - l3Total;
            const lossPct = l2Total > 0 ? (loss / l2Total) * 100 : 0;
            const dateStr = `${YEAR}-03-${String(day).padStart(2, '0')}`;

            lossSummaries.push({
                zone,
                day,
                date: dateStr,
                l2_total_m3: Math.round(l2Total * 100) / 100,
                l3_total_m3: Math.round(l3Total * 100) / 100,
                loss_m3: Math.round(loss * 100) / 100,
                loss_percent: Math.round(lossPct * 100) / 100,
                month: MONTH,
                year: YEAR,
            });
        }
    }

    console.log(`\n📊 Generated ${lossSummaries.length} zone-day records (${Object.keys(byZone).length} zones × ${maxDay} days)`);

    // Show preview
    console.log('\n  Preview (first 7 records):');
    for (const r of lossSummaries.slice(0, 7)) {
        console.log(`  ${r.zone.padEnd(18)} Day ${r.day} → L2: ${r.l2_total_m3} m³, L3: ${r.l3_total_m3} m³, Loss: ${r.loss_m3} m³ (${r.loss_percent}%)`);
    }

    // Clear existing Mar-26 data just in case
    console.log(`\n🗑️  Clearing any existing ${MONTH} data from water_loss_daily...`);
    const { error: delErr } = await supabase
        .from('water_loss_daily')
        .delete()
        .eq('month', MONTH)
        .eq('year', YEAR);
    if (delErr) console.log(`  ⚠️  Delete warning: ${delErr.message}`);

    // Upload in batches
    console.log(`\n📤 Uploading ${lossSummaries.length} records to water_loss_daily...`);
    const BATCH = 50;
    let uploaded = 0;

    for (let i = 0; i < lossSummaries.length; i += BATCH) {
        const batch = lossSummaries.slice(i, i + BATCH);
        const { error: insErr } = await supabase.from('water_loss_daily').insert(batch);
        if (insErr) {
            console.error(`  ❌ Batch ${Math.floor(i / BATCH) + 1}: ${insErr.message}`);
        } else {
            uploaded += batch.length;
            console.log(`  ✅ Batch ${Math.floor(i / BATCH) + 1}: ${batch.length} records`);
        }
    }

    console.log(`\n✅ Done! ${uploaded}/${lossSummaries.length} records inserted into water_loss_daily`);
    console.log(`   Mar-26 daily report should now load in the app.`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
