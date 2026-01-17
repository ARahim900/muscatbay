/**
 * Test script to verify Assets_Register_Database connection works
 * Run with: node scripts/test-assets-api.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAssetsAPI() {
    console.log('🧪 Testing Assets API with new table...\n');

    try {
        // Test pagination (page 1, 25 items)
        const { data, error, count } = await supabase
            .from('Assets_Register_Database')
            .select('*', { count: 'exact' })
            .order('Asset_Name', { ascending: true })
            .range(0, 24);

        if (error) {
            console.error('❌ API Test Failed:', error);
            return;
        }

        console.log('✅ API Test Passed!');
        console.log(`📊 Total Assets: ${count}`);
        console.log(`📄 Fetched ${data.length} assets on page 1\n`);

        // Show first 3 transformed examples
        console.log('📝 First 3 assets (transformed format):');
        data.slice(0, 3).forEach((asset, idx) => {
            console.log(`\n${idx + 1}. ${asset.Asset_Name}`);
            console.log(`   Tag: ${asset.Asset_Tag}`);
            console.log(`   Type: ${asset.Discipline || asset.Category}`);
            console.log(`   Location: ${asset.Location_Name || asset.Zone}`);
            console.log(`   Active: ${asset.Is_Asset_Active}`);
        });

        // Test search
        console.log('\n🔍 Testing search for "HVAC"...');
        const { data: searchData, count: searchCount } = await supabase
            .from('Assets_Register_Database')
            .select('*', { count: 'exact' })
            .or('Asset_Name.ilike.%HVAC%,Discipline.ilike.%HVAC%')
            .limit(3);

        console.log(`   Found ${searchCount} results for "HVAC"`);

    } catch (err) {
        console.error('❌ Unexpected error:', err);
    }
}

testAssetsAPI();
