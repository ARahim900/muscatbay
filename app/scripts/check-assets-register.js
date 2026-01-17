/**
 * Script to check the Assets_Register_Database table in Supabase
 * Run with: node scripts/check-assets-register.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkAssetsRegisterDatabase() {
    console.log('🔍 Checking Assets_Register_Database table...\n');

    try {
        // Try to fetch first 5 records to see structure
        const { data, error, count } = await supabase
            .from('Assets_Register_Database')
            .select('*', { count: 'exact' })
            .limit(5);

        if (error) {
            console.error('❌ Error fetching from Assets_Register_Database:');
            console.error('   Code:', error.code);
            console.error('   Message:', error.message);
            console.error('   Details:', error.details);
            console.error('   Hint:', error.hint);
            return;
        }

        console.log('✅ Table exists and is accessible!');
        console.log(`📊 Total records: ${count || 'unknown'}\n`);

        if (data && data.length > 0) {
            console.log('📋 Column names (schema):');
            const columns = Object.keys(data[0]);
            columns.forEach((col, idx) => {
                console.log(`   ${idx + 1}. ${col}`);
            });

            console.log('\n📝 Sample record (first row):');
            console.log(JSON.stringify(data[0], null, 2));
        } else {
            console.log('⚠️ Table exists but has no data!');
        }

    } catch (err) {
        console.error('❌ Unexpected error:', err);
    }
}

checkAssetsRegisterDatabase();
