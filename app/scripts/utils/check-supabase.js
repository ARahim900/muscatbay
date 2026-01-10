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
        const envPath = path.resolve(__dirname, '..', '.env.local');
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
        const supabase = createClient(url, key);

        // Query amc_contracts
        const contractsRes = await supabase.from('amc_contracts').select('*', { count: 'exact' }).limit(5);
        if (contractsRes.error) {
            console.error('Error querying amc_contracts:', contractsRes.error.message || contractsRes.error.code || contractsRes.error);
        } else {
            console.log('\n=== amc_contracts ===');
            console.log('Count:', contractsRes.count || 0);
            console.log('Sample rows:', JSON.stringify(contractsRes.data || [], null, 2));
        }

        // Query amc_expiry
        const expiryRes = await supabase.from('amc_expiry').select('*', { count: 'exact' }).limit(5);
        if (expiryRes.error) {
            console.error('Error querying amc_expiry:', expiryRes.error.message || expiryRes.error.code || expiryRes.error);
        } else {
            console.log('\n=== amc_expiry ===');
            console.log('Count:', expiryRes.count || 0);
            console.log('Sample rows:', JSON.stringify(expiryRes.data || [], null, 2));
        }

        process.exit(0);
    } catch (err) {
        console.error('Unexpected error:', err && err.message ? err.message : err);
        process.exit(1);
    }
})();
