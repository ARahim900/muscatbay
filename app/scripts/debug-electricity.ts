import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Connecting to Supabase...');
console.log('URL:', url);
console.log('Key length:', key?.length);

if (!url || !key) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(url, key);

async function test() {
    console.log('Fetching electricity_meters...');
    const { data: meters, error: metersError } = await supabase
        .from('electricity_meters')
        .select('*');

    if (metersError) {
        console.error('Error fetching meters:', metersError);
    } else {
        console.log(`Found ${meters?.length} meters`);
        if (meters && meters.length > 0) {
            console.log('Sample meter:', meters[0]);
        }
    }

    console.log('Fetching electricity_readings...');
    const { data: readings, error: readingsError } = await supabase
        .from('electricity_readings')
        .select('*')
        .limit(5);

    if (readingsError) {
        console.error('Error fetching readings:', readingsError);
    } else {
        console.log(`Found ${readings?.length} readings (limit 5)`);
        if (readings && readings.length > 0) {
            console.log('Sample reading:', readings[0]);
        }
    }
}

test();
