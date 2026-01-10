// Script to discover Water System table schema
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load env vars
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

const supabase = createClient(supabaseUrl, supabaseKey);

async function discoverSchema() {
    console.log('\n=== Discovering Water System Table Schema ===\n');

    // Try to get a single row to see all columns
    const { data, error } = await supabase
        .from('Water System')
        .select('*')
        .limit(1);

    if (error) {
        console.log('Error:', error.message);
    } else if (data && data.length > 0) {
        console.log('Table has data. Columns found:');
        const columns = Object.keys(data[0]);
        columns.forEach(col => {
            console.log(`  - ${col}: ${typeof data[0][col]} (example: ${JSON.stringify(data[0][col]).substring(0, 50)})`);
        });
        console.log('\nTotal columns:', columns.length);
        console.log('\nFull sample record:');
        console.log(JSON.stringify(data[0], null, 2));
    } else {
        console.log('Table exists but is empty.');
        console.log('Checking table info...');

        // Try to insert a test row to see column names
        const testRecord = { test: 'value' };
        const { error: insertError } = await supabase
            .from('Water System')
            .insert(testRecord);

        if (insertError) {
            console.log('Insert error reveals schema info:', insertError.message);
        }
    }

    // Also check count
    const { count, error: countError } = await supabase
        .from('Water System')
        .select('*', { count: 'exact', head: true });

    console.log('\nTotal rows in table:', count || 0);
}

discoverSchema().catch(console.error);
