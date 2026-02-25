// Script to test Water System table connection
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load env vars from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envLines = envContent.split('\n');

let supabaseUrl = '';
let supabaseKey = '';

envLines.forEach(line => {
    const [key, ...valueParts] = line.split('=');
    const value = valueParts.join('=').trim();
    if (key === 'NEXT_PUBLIC_SUPABASE_URL') supabaseUrl = value;
    if (key === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') supabaseKey = value;
});

console.log('Supabase URL:', supabaseUrl ? 'FOUND' : 'NOT FOUND');
console.log('Supabase Key:', supabaseKey ? 'FOUND' : 'NOT FOUND');

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testWaterSystem() {
    console.log('\n=== Testing Water System Table ===\n');

    // Test with exact table name from code
    console.log('1. Testing table name: "Water System"');
    let { data, error } = await supabase
        .from('Water System')
        .select('*')
        .limit(5);

    if (error) {
        console.log('   ERROR:', error.message);
    } else {
        console.log('   SUCCESS! Found', data?.length || 0, 'records');
        if (data && data.length > 0) {
            console.log('   Sample columns:', Object.keys(data[0]).slice(0, 8).join(', '));
        }
    }

    // Try alternative names
    const altNames = ['water_system', 'WaterSystem', 'water_meters', 'Water_System'];
    for (const tableName of altNames) {
        console.log(`\n2. Testing table name: "${tableName}"`);
        let { data: altData, error: altError } = await supabase
            .from(tableName)
            .select('*')
            .limit(5);

        if (altError) {
            console.log('   ERROR:', altError.message);
        } else {
            console.log('   SUCCESS! Found', altData?.length || 0, 'records');
            if (altData && altData.length > 0) {
                console.log('   Sample columns:', Object.keys(altData[0]).slice(0, 8).join(', '));
            }
        }
    }

    // List all tables
    console.log('\n=== Listing Available Tables ===\n');
    const { data: tables, error: tablesError } = await supabase
        .rpc('get_table_names')
        .select('*');

    if (tablesError) {
        console.log('Could not list tables via RPC:', tablesError.message);
        console.log('Trying known tables...');

        // Try known working tables
        const knownTables = ['stp_operations', 'mb_assets', 'Contractor_Tracker', 'electricity_meters'];
        for (const t of knownTables) {
            const { data: tData, error: tError } = await supabase.from(t).select('*').limit(1);
            console.log(`  ${t}:`, tError ? 'NOT FOUND' : 'EXISTS');
        }
    } else {
        console.log('Available tables:', tables);
    }
}

testWaterSystem().catch(console.error);
