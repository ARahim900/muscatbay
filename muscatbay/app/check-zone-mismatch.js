#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

let supabaseUrl = '', supabaseKey = '';
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
        const [key, ...valParts] = line.split('=');
        const val = valParts.join('=').trim();
        if (key.trim() === 'NEXT_PUBLIC_SUPABASE_URL') supabaseUrl = val;
        if (key.trim() === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') supabaseKey = val;
    }
}

if (!supabaseUrl || !supabaseKey) { console.error('❌ Missing creds'); process.exit(1); }

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMismatch() {
    console.log('🔍 Checking zone naming in water_loss_daily for Feb-26 2026...\n');

    const { data, error } = await supabase
        .from('water_loss_daily')
        .select('zone, month, year, day')
        .eq('month', 'Feb-26')
        .eq('year', 2026);

    if (error) { console.error('Error:', error.message); return; }

    const zoneStats = {};
    for (const row of data) {
        if (!zoneStats[row.zone]) zoneStats[row.zone] = { count: 0, maxDay: 0, minDay: 99 };
        zoneStats[row.zone].count++;
        zoneStats[row.zone].maxDay = Math.max(zoneStats[row.zone].maxDay, row.day);
        zoneStats[row.zone].minDay = Math.min(zoneStats[row.zone].minDay, row.day);
    }

    console.log('Zone                    | Rows | Min Day | Max Day');
    console.log('-'.repeat(55));
    for (const [zone, stats] of Object.entries(zoneStats).sort((a, b) => b[1].maxDay - a[1].maxDay)) {
        console.log(`${zone.padEnd(24)}| ${String(stats.count).padEnd(5)}| ${String(stats.minDay).padEnd(8)}| ${stats.maxDay}`);
    }

    const knownMappings = {
        'Zone_03_(A)': 'Zone 3A', 'Zone_03_(B)': 'Zone 3B', 'Zone_05': 'Zone 5',
        'Zone_08': 'Zone 08', 'Zone_01_(FM)': 'Zone FM', 'Zone_VS': 'Village Square', 'Zone_SC': 'Sales Center',
        'Direct Connection': '(unknown - not mapped)'
    };

    console.log('\n🔎 Mismatch Detection:');
    let hasMismatch = false;
    for (const [wrongName, correctName] of Object.entries(knownMappings)) {
        if (zoneStats[wrongName] && zoneStats[correctName]) {
            console.log(`  ⚠️  DUPLICATE: "${wrongName}" (${zoneStats[wrongName].count} rows, max day ${zoneStats[wrongName].maxDay}) AND "${correctName}" (${zoneStats[correctName].count} rows, max day ${zoneStats[correctName].maxDay})`);
            hasMismatch = true;
        } else if (zoneStats[wrongName]) {
            console.log(`  ⚠️  WRONG NAME: "${wrongName}" (${zoneStats[wrongName].count} rows, day ${zoneStats[wrongName].minDay}-${zoneStats[wrongName].maxDay}) — should be "${correctName}"`);
            hasMismatch = true;
        }
    }

    if (!hasMismatch) console.log('  ✅ No zone naming mismatches found');
    else console.log('\n✅ CONFIRMED: Zone naming mismatch is real and causing data gaps.');
}

checkMismatch().catch(err => { console.error('Fatal:', err); process.exit(1); });
