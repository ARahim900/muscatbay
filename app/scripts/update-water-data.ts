/**
 * @fileoverview Water System Data Update Script
 * Updates the "Water System" table in Supabase with new consumption data
 *
 * Usage:
 *   npx tsx scripts/update-water-data.ts
 *
 * Before running:
 *   1. Fill in the WATER_DATA array below with your meter data
 *   2. Ensure .env.local has NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
    console.error('Missing Supabase credentials. Check .env.local file.');
    process.exit(1);
}

const supabase = createClient(url, key);

/**
 * Water meter data structure matching Supabase "Water System" table
 */
interface WaterMeterRecord {
    account_number: string;
    label: string;
    level: string;
    zone: string;
    parent_meter: string;
    type: string;
    jan_25: number | null;
    feb_25: number | null;
    mar_25: number | null;
    apr_25: number | null;
    may_25: number | null;
    jun_25: number | null;
    jul_25: number | null;
    aug_25: number | null;
    sep_25: number | null;
    oct_25: number | null;
    nov_25: number | null;
    dec_25: number | null;
    jan_26: number | null;
    feb_26: number | null;
}

/**
 * Sanitize consumption value - convert negative values to 0
 * Negative values indicate meter reading errors
 */
function sanitizeValue(value: number | null | undefined): number | null {
    if (value === null || value === undefined) return null;
    return value < 0 ? 0 : value;
}

/**
 * Sanitize all consumption values in a record
 */
function sanitizeRecord(record: WaterMeterRecord): WaterMeterRecord {
    return {
        ...record,
        jan_25: sanitizeValue(record.jan_25),
        feb_25: sanitizeValue(record.feb_25),
        mar_25: sanitizeValue(record.mar_25),
        apr_25: sanitizeValue(record.apr_25),
        may_25: sanitizeValue(record.may_25),
        jun_25: sanitizeValue(record.jun_25),
        jul_25: sanitizeValue(record.jul_25),
        aug_25: sanitizeValue(record.aug_25),
        sep_25: sanitizeValue(record.sep_25),
        oct_25: sanitizeValue(record.oct_25),
        nov_25: sanitizeValue(record.nov_25),
        dec_25: sanitizeValue(record.dec_25),
        jan_26: sanitizeValue(record.jan_26),
        feb_26: sanitizeValue(record.feb_26),
    };
}

// =============================================================================
// WATER METER DATA - FILL IN YOUR DATA BELOW
// =============================================================================
// Format: { account_number, label, level, zone, parent_meter, type, jan_25, feb_25, ..., jan_26, feb_26 }
// Note: Negative values will be automatically converted to 0

const WATER_DATA: WaterMeterRecord[] = [
    // Example records - replace with your actual data:
    // {
    //     account_number: 'C43659',
    //     label: 'Main Bulk NAMA',
    //     level: 'L1',
    //     zone: 'Main',
    //     parent_meter: '',
    //     type: 'Bulk',
    //     jan_25: 32580, feb_25: 44043, mar_25: 34915, apr_25: 46039, may_25: 58425, jun_25: 41840,
    //     jul_25: 41475, aug_25: 41743, sep_25: 42088, oct_25: 46049, nov_25: 47347, dec_25: 45922,
    //     jan_26: 41320, feb_26: null
    // },

    // PASTE YOUR DATA HERE - Each record should follow the format above
    // The account_number is the unique identifier used for upsert operations
];

// =============================================================================

async function getCurrentData() {
    console.log('Fetching current water meter data...');
    const { data, error } = await supabase
        .from('Water System')
        .select('*')
        .order('level')
        .order('label');

    if (error) {
        console.error('Error fetching current data:', error.message);
        return null;
    }

    console.log(`Found ${data?.length || 0} existing meters`);
    return data;
}

async function updateWaterData() {
    console.log('='.repeat(60));
    console.log('WATER SYSTEM DATA UPDATE');
    console.log('='.repeat(60));
    console.log(`Connecting to: ${url}`);
    console.log();

    // Check if data is provided
    if (WATER_DATA.length === 0) {
        console.log('No data to update. Please fill in the WATER_DATA array.');
        console.log('See the example records in the script for the correct format.');
        return;
    }

    // Show current data
    const currentData = await getCurrentData();
    if (currentData) {
        console.log('\nCurrent meter levels distribution:');
        const levels: Record<string, number> = {};
        currentData.forEach(m => {
            levels[m.level] = (levels[m.level] || 0) + 1;
        });
        console.table(levels);
    }

    // Sanitize and prepare data
    console.log(`\nPreparing ${WATER_DATA.length} records for update...`);
    const sanitizedData = WATER_DATA.map(sanitizeRecord);

    // Check for any values that were sanitized
    let sanitizedCount = 0;
    sanitizedData.forEach((record, idx) => {
        const original = WATER_DATA[idx];
        const months = ['jan_25', 'feb_25', 'mar_25', 'apr_25', 'may_25', 'jun_25',
                       'jul_25', 'aug_25', 'sep_25', 'oct_25', 'nov_25', 'dec_25',
                       'jan_26', 'feb_26'] as const;
        months.forEach(month => {
            const origVal = original[month];
            if (origVal !== null && origVal !== undefined && origVal < 0) {
                console.log(`  Sanitized: ${record.label} (${record.account_number}) ${month}: ${origVal} → 0`);
                sanitizedCount++;
            }
        });
    });

    if (sanitizedCount > 0) {
        console.log(`\nTotal values sanitized: ${sanitizedCount}`);
    }

    // Perform upsert (update if exists, insert if new)
    console.log('\nUpdating Supabase...');

    // Process in batches of 50 to avoid rate limits
    const batchSize = 50;
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < sanitizedData.length; i += batchSize) {
        const batch = sanitizedData.slice(i, i + batchSize);

        const { data, error } = await supabase
            .from('Water System')
            .upsert(batch, {
                onConflict: 'account_number',
                ignoreDuplicates: false
            })
            .select();

        if (error) {
            console.error(`Batch ${Math.floor(i/batchSize) + 1} error:`, error.message);
            errorCount += batch.length;
        } else {
            successCount += data?.length || batch.length;
            console.log(`Batch ${Math.floor(i/batchSize) + 1}: ${batch.length} records processed`);
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('UPDATE COMPLETE');
    console.log('='.repeat(60));
    console.log(`Records updated: ${successCount}`);
    if (errorCount > 0) {
        console.log(`Records with errors: ${errorCount}`);
    }

    // Verify the update
    console.log('\nVerifying update...');
    const verifyData = await getCurrentData();
    if (verifyData) {
        console.log(`Total meters in database: ${verifyData.length}`);
    }
}

// Run the update
updateWaterData().catch(console.error);
