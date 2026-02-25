/**
 * Seed script: Upload all 350 water meters with 2024 + 2025 data to Supabase
 * Covers Jan-24 through Jan-26 (25 months)
 * 
 * Usage: node scripts/seeds/seed-water-full.js
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load env vars
const envPath = path.join(__dirname, '..', '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
let supabaseUrl = '', supabaseKey = '';
envContent.split('\n').forEach(line => {
    const [key, ...v] = line.split('=');
    const val = v.join('=').trim();
    if (key === 'NEXT_PUBLIC_SUPABASE_URL') supabaseUrl = val;
    if (key === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') supabaseKey = val;
});
const supabase = createClient(supabaseUrl, supabaseKey);

// Read the JSON data file
const dataPath = path.join(__dirname, 'water_meters_full.json');
const meters = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

async function addColumns() {
    console.log('Adding 2024 columns if missing...');
    const months2024 = ['jan_24', 'feb_24', 'mar_24', 'apr_24', 'may_24', 'jun_24', 'jul_24', 'aug_24', 'sep_24', 'oct_24', 'nov_24', 'dec_24'];

    // We can't run raw SQL via the JS client with anon key,
    // so we'll just attempt the insert and handle column errors
    console.log('Note: If 2024 columns don\'t exist, run sql/migrations/add_2024_columns.sql in Supabase SQL Editor first.\n');
}

async function seedData() {
    console.log('=== Seeding Water System Table (Full 2024-2026 Data) ===\n');
    console.log(`Total meters: ${meters.length}`);

    // Clear existing data
    console.log('\nClearing existing data...');
    const { error: delErr } = await supabase.from('Water System').delete().gte('id', 0);
    if (delErr) console.log('Delete note:', delErr.message);
    else console.log('Cleared.');

    // Insert in batches of 20
    console.log('\nInserting meters...');
    const batchSize = 20;
    let ok = 0;
    let failed = 0;

    for (let i = 0; i < meters.length; i += batchSize) {
        const batch = meters.slice(i, i + batchSize);
        const batchNum = Math.floor(i / batchSize) + 1;

        const { data, error } = await supabase.from('Water System').insert(batch).select();
        if (error) {
            console.error(`Batch ${batchNum} error:`, error.message);
            failed += batch.length;

            if (error.message.includes('jan_24') || error.message.includes('feb_24')) {
                console.error('\n❌ 2024 columns missing! Run this in Supabase SQL Editor:');
                console.error('Run: sql/migrations/add_2024_columns.sql\n');
                return;
            }
        } else {
            ok += (data?.length || 0);
            process.stdout.write(`  Batch ${batchNum}: ${data?.length || 0} records (${ok} total)\r`);
        }
    }

    console.log(`\n\n=== Done: ${ok}/${meters.length} inserted (${failed} failed) ===`);

    // Verify
    const { count } = await supabase.from('Water System').select('*', { count: 'exact', head: true });
    console.log(`Verification: ${count || 0} records in database`);
    console.log(count >= 350 ? '\n✅ SUCCESS!' : '\n⚠️  Some records may be missing.');
}

addColumns().then(() => seedData()).catch(console.error);
