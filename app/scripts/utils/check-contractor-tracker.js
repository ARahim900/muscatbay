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

    const res = await supabase.from('Contractor_Tracker').select('*', { count: 'exact' }).limit(10);
    if (res.error) {
      console.error('Error querying Contractor_Tracker:', res.error.message || res.error.code);
      process.exit(0);
    }

    console.log('\n=== Contractor_Tracker ===');
    console.log('Count:', res.count || 0);
    console.log('Sample rows:', JSON.stringify(res.data || [], null, 2));

    process.exit(0);
  } catch (err) {
    console.error('Unexpected error:', err && err.message ? err.message : err);
    process.exit(1);
  }
})();
