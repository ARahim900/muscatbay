// Test script to verify the NEW Supabase tables
// Run with: node scripts/test-new-supabase.js

const { createClient } = require('@supabase/supabase-js');

// Credentials come from the environment — never hardcode keys in the repo.
// Usage: NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_ANON_KEY=... node scripts/tests/test-new-supabase.js
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) {
    throw new Error('Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY before running this script.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    console.log('========================================');
    console.log('Testing NEW AMC Contractor Tables');
    console.log('Project: utnlgeuqajmwibqmdmgt');
    console.log('========================================\n');

    // Test 1: Check amc_contractor_summary table
    console.log('1. Testing amc_contractor_summary table...');
    const { data: summary, error: summaryError } = await supabase
        .from('amc_contractor_summary')
        .select('*')
        .limit(5);

    if (summaryError) {
        console.log('   ❌ Error:', summaryError.message);
    } else {
        console.log('   ✅ amc_contractor_summary accessible');
        console.log('   Records found:', summary?.length || 0);
        if (summary && summary.length > 0) {
            console.log('   First contractor:', summary[0].contractor);
        }
    }

    // Test 2: Check amc_contractor_details table
    console.log('\n2. Testing amc_contractor_details table...');
    const { data: details, error: detailsError } = await supabase
        .from('amc_contractor_details')
        .select('*')
        .limit(5);

    if (detailsError) {
        console.log('   ❌ Error:', detailsError.message);
    } else {
        console.log('   ✅ amc_contractor_details accessible');
        console.log('   Records found:', details?.length || 0);
    }

    // Test 3: Check amc_contractor_expiry table
    console.log('\n3. Testing amc_contractor_expiry table...');
    const { data: expiry, error: expiryError } = await supabase
        .from('amc_contractor_expiry')
        .select('*')
        .limit(5);

    if (expiryError) {
        console.log('   ❌ Error:', expiryError.message);
    } else {
        console.log('   ✅ amc_contractor_expiry accessible');
        console.log('   Records found:', expiry?.length || 0);
    }

    // Test 4: Check amc_contractor_pricing table
    console.log('\n4. Testing amc_contractor_pricing table...');
    const { data: pricing, error: pricingError } = await supabase
        .from('amc_contractor_pricing')
        .select('*')
        .limit(5);

    if (pricingError) {
        console.log('   ❌ Error:', pricingError.message);
    } else {
        console.log('   ✅ amc_contractor_pricing accessible');
        console.log('   Records found:', pricing?.length || 0);
    }

    console.log('\n========================================');
    console.log('Summary:');
    console.log('  amc_contractor_summary:', summary?.length || 0, 'records');
    console.log('  amc_contractor_details:', details?.length || 0, 'records');
    console.log('  amc_contractor_expiry:', expiry?.length || 0, 'records');
    console.log('  amc_contractor_pricing:', pricing?.length || 0, 'records');
    console.log('========================================');
}

testConnection().catch(console.error);
