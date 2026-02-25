/**
 * Clear All Water Data from Supabase
 * 
 * This script connects to Supabase using the project's env vars
 * and deletes all rows from the 4 water-related tables.
 * 
 * Usage: node scripts/clear-water-data.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials. Ensure .env.local has NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const WATER_TABLES = [
    { name: 'water_loss_daily', filter: 'id', op: 'gt', val: 0 },
    { name: 'water_loss_summary', filter: 'id', op: 'gt', val: 0 },
    { name: 'water_daily_consumption', filter: 'id', op: 'gt', val: 0 },
    { name: 'Water System', filter: 'id', op: 'gt', val: 0 },
];

async function clearWaterData() {
    console.log('🗑️  Starting water data cleanup...\n');

    for (const table of WATER_TABLES) {
        try {
            // First check how many rows exist
            const { count, error: countError } = await supabase
                .from(table.name)
                .select('*', { count: 'exact', head: true });

            if (countError) {
                console.log(`⚠️  Table "${table.name}": ${countError.message} (table may not exist)`);
                continue;
            }

            console.log(`📊 Table "${table.name}": ${count} rows found`);

            if (count === 0) {
                console.log(`   ✅ Already empty, skipping.\n`);
                continue;
            }

            // Delete all rows (Supabase requires a filter, so we use id > 0)
            const { error: deleteError } = await supabase
                .from(table.name)
                .delete()
                .gt(table.filter, table.val);

            if (deleteError) {
                console.error(`   ❌ Error deleting from "${table.name}": ${deleteError.message}`);
            } else {
                console.log(`   ✅ Deleted ${count} rows from "${table.name}"\n`);
            }
        } catch (err) {
            console.error(`   ❌ Exception on "${table.name}":`, err.message);
        }
    }

    // Verify all tables are empty
    console.log('\n📋 Verification:');
    for (const table of WATER_TABLES) {
        try {
            const { count, error } = await supabase
                .from(table.name)
                .select('*', { count: 'exact', head: true });

            if (error) {
                console.log(`   "${table.name}": ⚠️ ${error.message}`);
            } else {
                const status = count === 0 ? '✅' : '❌';
                console.log(`   "${table.name}": ${status} ${count} rows`);
            }
        } catch (err) {
            console.log(`   "${table.name}": ⚠️ ${err.message}`);
        }
    }

    console.log('\n🎉 Water data cleanup complete!');
    console.log('   The app will now fall back to static/mock data until you re-upload.');
}

clearWaterData().catch(console.error);
