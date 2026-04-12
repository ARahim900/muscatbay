
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyData() {
    console.log('Verifying Nov/Dec 2025 data...');

    const { data, error } = await supabase
        .from('electricity_readings')
        .select('month, consumption')
        .in('month', ['Nov-25', 'Dec-25']);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`Found ${data.length} records for Nov-25 and Dec-25.`);

    const { count, error: countError } = await supabase
        .from('electricity_readings')
        .select('*', { count: 'exact', head: true });

    console.log('Total readings count:', count);


    // Group by month
    type ReadingRow = { month: string; consumption: number };
    const counts = ((data ?? []) as ReadingRow[]).reduce<Record<string, number>>((acc, curr) => {
        acc[curr.month] = (acc[curr.month] || 0) + 1;
        return acc;
    }, {});

    console.log('Counts per month:', counts);
}

verifyData();
