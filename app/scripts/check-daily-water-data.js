#!/usr/bin/env node
/**
 * Check Daily Water Data in Supabase
 * Queries water_loss_daily and water_daily_consumption tables
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

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
    console.log('='.repeat(60));
    console.log('📊 DAILY WATER DATA CHECK');
    console.log('='.repeat(60));

    // 1. Check water_loss_daily table
    console.log('\n📋 TABLE: water_loss_daily');
    console.log('-'.repeat(40));

    const { data: lossData, error: lossError } = await supabase
        .from('water_loss_daily')
        .select('*')
        .order('zone', { ascending: true })
        .order('day', { ascending: true });

    if (lossError) {
        console.log(`  ❌ Error: ${lossError.message}`);
    } else if (!lossData || lossData.length === 0) {
        console.log('  ⚠️  No data found in water_loss_daily');
    } else {
        console.log(`  ✅ Total records: ${lossData.length}`);

        // Group by zone and month
        const zoneMonths = {};
        for (const row of lossData) {
            const key = `${row.zone} | ${row.month} ${row.year}`;
            if (!zoneMonths[key]) zoneMonths[key] = { count: 0, minDay: 99, maxDay: 0 };
            zoneMonths[key].count++;
            zoneMonths[key].minDay = Math.min(zoneMonths[key].minDay, row.day);
            zoneMonths[key].maxDay = Math.max(zoneMonths[key].maxDay, row.day);
        }

        console.log('\n  Zone / Month Summary:');
        console.log('  ' + '-'.repeat(55));
        console.log('  Zone                  | Month     | Days   | Range');
        console.log('  ' + '-'.repeat(55));
        for (const [key, val] of Object.entries(zoneMonths)) {
            const [zone, monthYear] = key.split(' | ');
            console.log(`  ${zone.padEnd(22)} | ${monthYear.padEnd(9)} | ${String(val.count).padEnd(6)} | Day ${val.minDay}-${val.maxDay}`);
        }
    }

    // 2. Check water_daily_consumption table
    console.log('\n\n📋 TABLE: water_daily_consumption');
    console.log('-'.repeat(40));

    const { data: consumptionData, error: consumptionError } = await supabase
        .from('water_daily_consumption')
        .select('id, meter_name, account_number, label, zone, parent_meter, type, month, year, created_at')
        .order('meter_name', { ascending: true })
        .limit(500);

    if (consumptionError) {
        console.log(`  ❌ Error: ${consumptionError.message}`);
        if (consumptionError.message.includes('does not exist')) {
            console.log('  ℹ️  Table does not exist yet. It needs to be created.');
        }
    } else if (!consumptionData || consumptionData.length === 0) {
        console.log('  ⚠️  No data found in water_daily_consumption');
    } else {
        console.log(`  ✅ Total records: ${consumptionData.length}${consumptionData.length >= 500 ? '+' : ''}`);

        // Group by month/year
        const monthGroups = {};
        const typeGroups = {};
        const zoneGroups = {};
        for (const row of consumptionData) {
            const mk = `${row.month} ${row.year}`;
            monthGroups[mk] = (monthGroups[mk] || 0) + 1;
            if (row.type) typeGroups[row.type] = (typeGroups[row.type] || 0) + 1;
            if (row.zone) zoneGroups[row.zone] = (zoneGroups[row.zone] || 0) + 1;
        }

        console.log('\n  By Month:');
        for (const [k, v] of Object.entries(monthGroups)) {
            console.log(`    ${k}: ${v} meters`);
        }

        console.log('\n  By Type:');
        for (const [k, v] of Object.entries(typeGroups).sort((a, b) => b[1] - a[1])) {
            console.log(`    ${k}: ${v}`);
        }

        console.log('\n  By Zone:');
        for (const [k, v] of Object.entries(zoneGroups).sort((a, b) => b[1] - a[1])) {
            console.log(`    ${k}: ${v}`);
        }

        // Show sample record
        console.log('\n  Sample record:');
        console.log('  ', JSON.stringify(consumptionData[0], null, 2).split('\n').join('\n  '));
    }

    // 3. Check Water System (monthly) table
    console.log('\n\n📋 TABLE: Water System (monthly meters)');
    console.log('-'.repeat(40));

    const { data: wsData, error: wsError } = await supabase
        .from('Water System')
        .select('id, label, account_number, level, zone, type')
        .limit(5);

    if (wsError) {
        console.log(`  ❌ Error: ${wsError.message}`);
    } else {
        const { count } = await supabase.from('Water System').select('*', { count: 'exact', head: true });
        console.log(`  ✅ Total meters: ${count || wsData.length}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Check complete');
}

checkData().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
