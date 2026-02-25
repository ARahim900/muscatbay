/**
 * @fileoverview Fix Negative Water Values Script
 * Identifies and fixes all negative consumption values in the Water System table
 *
 * Usage: npx tsx scripts/fix-negative-water-values.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('='.repeat(60));
console.log('WATER SYSTEM - FIX NEGATIVE VALUES');
console.log('='.repeat(60));

if (!url || !key) {
    console.error('Missing Supabase credentials. Check .env.local file.');
    process.exit(1);
}

console.log('Connecting to Supabase...');
console.log(`URL: ${url}`);

const supabase = createClient(url, key);

const monthColumns = [
    'jan_25', 'feb_25', 'mar_25', 'apr_25', 'may_25', 'jun_25',
    'jul_25', 'aug_25', 'sep_25', 'oct_25', 'nov_25', 'dec_25',
    'jan_26', 'feb_26'
] as const;

interface WaterMeterRow {
    id: number;
    account_number: string;
    label: string;
    level: string;
    [key: string]: number | string | null;
}

async function findNegativeValues(): Promise<{ meter: WaterMeterRow; month: string; value: number }[]> {
    console.log('\nFetching all water meters...');

    const { data, error } = await supabase
        .from('Water System')
        .select('*');

    if (error) {
        console.error('Error fetching data:', error.message);
        return [];
    }

    if (!data || data.length === 0) {
        console.log('No water meters found in database.');
        return [];
    }

    console.log(`Found ${data.length} meters total.`);

    const negatives: { meter: WaterMeterRow; month: string; value: number }[] = [];

    for (const meter of data as WaterMeterRow[]) {
        for (const month of monthColumns) {
            const value = meter[month] as number | null;
            if (value !== null && value < 0) {
                negatives.push({ meter, month, value });
            }
        }
    }

    return negatives;
}

async function fixNegativeValues(negatives: { meter: WaterMeterRow; month: string; value: number }[]): Promise<number> {
    if (negatives.length === 0) {
        return 0;
    }

    // Group by meter id
    const meterUpdates = new Map<number, Record<string, number>>();

    for (const { meter, month } of negatives) {
        if (!meterUpdates.has(meter.id)) {
            meterUpdates.set(meter.id, {});
        }
        meterUpdates.get(meter.id)![month] = 0;
    }

    let fixedCount = 0;

    for (const [meterId, updates] of meterUpdates) {
        const { error } = await supabase
            .from('Water System')
            .update(updates)
            .eq('id', meterId);

        if (error) {
            console.error(`Error updating meter ${meterId}:`, error.message);
        } else {
            fixedCount += Object.keys(updates).length;
        }
    }

    return fixedCount;
}

async function main() {
    // Step 1: Find negative values
    const negatives = await findNegativeValues();

    if (negatives.length === 0) {
        console.log('\n✓ No negative values found in the database!');
        console.log('The Water System data is clean.');
        return;
    }

    // Display negative values
    console.log(`\n⚠ Found ${negatives.length} negative value(s):\n`);
    console.log('-'.repeat(80));
    console.log('| Level | Label                          | Account    | Month   | Value      |');
    console.log('-'.repeat(80));

    for (const { meter, month, value } of negatives) {
        const label = (meter.label || '').substring(0, 30).padEnd(30);
        const account = (meter.account_number || '').padEnd(10);
        const level = (meter.level || '').padEnd(5);
        const monthDisplay = month.replace('_', '-').toUpperCase().padEnd(7);
        const valueDisplay = value.toLocaleString().padStart(10);
        console.log(`| ${level} | ${label} | ${account} | ${monthDisplay} | ${valueDisplay} |`);
    }
    console.log('-'.repeat(80));

    // Step 2: Fix negative values
    console.log('\nFixing negative values (setting to 0)...');
    const fixedCount = await fixNegativeValues(negatives);

    console.log(`\n✓ Fixed ${fixedCount} negative value(s)!`);

    // Step 3: Verify
    console.log('\nVerifying fix...');
    const remaining = await findNegativeValues();

    if (remaining.length === 0) {
        console.log('✓ Verification successful! No negative values remain.');
    } else {
        console.log(`⚠ Warning: ${remaining.length} negative value(s) still remain.`);
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('SUMMARY');
    console.log('='.repeat(60));
    console.log(`Negative values found: ${negatives.length}`);
    console.log(`Negative values fixed: ${fixedCount}`);
    console.log(`Remaining issues: ${remaining.length}`);
}

main().catch(console.error);
