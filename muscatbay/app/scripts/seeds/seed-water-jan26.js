// Seed script: Push all 350 water meters (Jan-25 to Jan-26) to Supabase
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

// Read compact JSON data: array of arrays
// [label, account_number, level, zone, parent_meter, type, jan25..jan26]
const dataPath = path.join(__dirname, 'water_meters_jan26.json');
const rawData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

const FIELDS = ['label', 'account_number', 'level', 'zone', 'parent_meter', 'type'];
const MONTHS = ['jan_25', 'feb_25', 'mar_25', 'apr_25', 'may_25', 'jun_25', 'jul_25', 'aug_25', 'sep_25', 'oct_25', 'nov_25', 'dec_25', 'jan_26'];

const WATER_METERS = rawData.map(row => {
    const obj = {};
    FIELDS.forEach((f, i) => obj[f] = row[i]);
    MONTHS.forEach((m, i) => obj[m] = row[FIELDS.length + i]);
    return obj;
});

async function seedData() {
    console.log('=== Seeding Water System Table (Jan-26 Update) ===\n');
    console.log(`Total meters: ${WATER_METERS.length}`);
    console.log('\nIMPORTANT: Ensure jan_26 column exists. If not, run in Supabase SQL Editor:');
    console.log('ALTER TABLE "Water System" ADD COLUMN IF NOT EXISTS jan_26 INTEGER;\n');

    // Clear existing data
    console.log('Clearing existing data...');
    const { error: delErr } = await supabase.from('Water System').delete().gte('id', 0);
    if (delErr) console.log('Delete issue:', delErr.message);
    else console.log('Cleared.');

    // Insert in batches
    console.log('\nInserting meters...');
    const batchSize = 20;
    let ok = 0;
    for (let i = 0; i < WATER_METERS.length; i += batchSize) {
        const batch = WATER_METERS.slice(i, i + batchSize);
        const { data, error } = await supabase.from('Water System').insert(batch).select();
        if (error) {
            console.error(`Batch ${Math.floor(i / batchSize) + 1} error:`, error.message);
            if (error.message.includes('jan_26')) {
                console.error('\n❌ Column jan_26 missing! Run the ALTER TABLE SQL first.\n');
                return;
            }
        } else {
            ok += (data?.length || 0);
            console.log(`Batch ${Math.floor(i / batchSize) + 1}: ${data?.length || 0} records`);
        }
    }
    console.log(`\n=== Done: ${ok}/${WATER_METERS.length} inserted ===`);

    const { count } = await supabase.from('Water System').select('*', { count: 'exact', head: true });
    console.log(`Verification: ${count || 0} records`);
    console.log(count > 0 ? '\n✅ SUCCESS!' : '\n❌ Failed.');
}

seedData().catch(console.error);
