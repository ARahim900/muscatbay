const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

function readEnv(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split(/\r?\n/).filter(Boolean);
    const env = {};
    for (const line of lines) {
        const m = line.match(/^\s*([^=]+)=([\s\S]*)$/);
        if (m) env[m[1].trim()] = m[2].trim();
    }
    return env;
}

(async function main() {
    try {
        const envPath = path.resolve(__dirname, '..', '..', '.env.local');
        if (!fs.existsSync(envPath)) {
            console.error('.env.local not found at', envPath);
            process.exit(2);
        }
        const env = readEnv(envPath);
        const url = env.NEXT_PUBLIC_SUPABASE_URL;
        const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (!url || !key) {
            console.error('Supabase URL or anon key missing in .env.local');
            process.exit(2);
        }

        console.log('Connecting to Supabase:', url);
        console.log('='.repeat(60));
        const supabase = createClient(url, key);

        // List of known tables to check
        const tables = [
            'Water System',
            'stp_operations',
            'electricity_meters',
            'electricity_readings',
            'mb_assets',
            'Contractor_Tracker',
            'amc_contractor_summary',
            'amc_contractor_details',
            'amc_contractor_expiry',
            'amc_contractor_pricing',
            'amc_contracts',
            'amc_expiry',
            'amc_contacts',
            'amc_pricing'
        ];

        const results = {};

        for (const table of tables) {
            const { data, error, count } = await supabase
                .from(table)
                .select('*', { count: 'exact' })
                .limit(3);

            if (error) {
                results[table] = { status: 'ERROR', message: error.message || error.code };
            } else {
                const columns = data && data.length > 0 ? Object.keys(data[0]) : [];
                results[table] = {
                    status: 'OK',
                    count: count || data?.length || 0,
                    columns: columns,
                    sample: data?.[0] || null
                };
            }
        }

        // Output results
        console.log('\n📊 DATABASE DISCOVERY REPORT');
        console.log('='.repeat(60));

        for (const [table, info] of Object.entries(results)) {
            console.log(`\n📁 Table: ${table}`);
            if (info.status === 'ERROR') {
                console.log(`   ❌ Error: ${info.message}`);
            } else {
                console.log(`   ✅ Status: OK`);
                console.log(`   📈 Record Count: ${info.count}`);
                console.log(`   📋 Columns (${info.columns.length}): ${info.columns.join(', ')}`);
                if (info.sample) {
                    console.log(`   📝 Sample Record:`);
                    console.log(JSON.stringify(info.sample, null, 6).split('\n').map(l => '      ' + l).join('\n'));
                }
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log('Discovery complete!');
        process.exit(0);
    } catch (err) {
        console.error('Unexpected error:', err && err.message ? err.message : err);
        process.exit(1);
    }
})();
