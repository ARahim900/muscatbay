// Script to discover exact column names in Water System table
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load env vars
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');

let supabaseUrl = '';
let supabaseKey = '';

envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    const value = valueParts.join('=').trim();
    if (key === 'NEXT_PUBLIC_SUPABASE_URL') supabaseUrl = value;
    if (key === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') supabaseKey = value;
});

const supabase = createClient(supabaseUrl, supabaseKey);

async function testColumns() {
    console.log('\n=== Testing Different Column Name Formats ===\n');

    // Try different column name patterns
    const testPatterns = [
        // Pattern 1: Snake case (what we expect)
        { label: 'Test', account_number: 'TEST001', level: 'L1', zone: 'Test', parent_meter: 'None', type: 'Test' },
        // Pattern 2: Title case with spaces
        { Label: 'Test', 'Account Number': 'TEST001', Level: 'L1', Zone: 'Test', 'Parent Meter': 'None', Type: 'Test' },
        // Pattern 3: Camel case  
        { label: 'Test', accountNumber: 'TEST001', level: 'L1', zone: 'Test', parentMeter: 'None', type: 'Test' },
        // Pattern 4: Mixed format
        { Label: 'Test', Account_Number: 'TEST001', Level: 'L1', Zone: 'Test', Parent_Meter: 'None', Type: 'Test' },
    ];

    for (let i = 0; i < testPatterns.length; i++) {
        console.log(`\nTesting pattern ${i + 1}:`, Object.keys(testPatterns[i]).slice(0, 4).join(', '));

        const { data, error } = await supabase
            .from('Water System')
            .insert(testPatterns[i])
            .select();

        if (error) {
            // Parse error message to find expected column names
            const match = error.message.match(/Could not find the '([^']+)' column/);
            if (match) {
                console.log(`   Column '${match[1]}' doesn't exist`);
            } else {
                console.log('   Error:', error.message.substring(0, 100));
            }
        } else {
            console.log('   SUCCESS! Found matching column format.');
            console.log('   Columns:', Object.keys(testPatterns[i]).join(', '));

            // Clean up test data
            if (data && data[0]?.id) {
                await supabase.from('Water System').delete().eq('id', data[0].id);
            }
            return testPatterns[i];
        }
    }

    console.log('\n=== None of the patterns matched ===');
    console.log('The table may have completely different column names or may need to be recreated.');
    console.log('\nPlease run the SQL script in Supabase SQL Editor:');
    console.log('File: app/sql/water_system_table.sql');

    return null;
}

testColumns().catch(console.error);
