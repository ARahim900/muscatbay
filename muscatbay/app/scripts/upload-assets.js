#!/usr/bin/env node
/**
 * Upload Assets Register Data to Supabase
 *
 * Usage: node scripts/upload-assets.js
 *
 * Prerequisites:
 * 1. Ensure .env.local has NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
 * 2. Place assets-register-data.tsv in the scripts/ directory
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// ─────────────── Load environment variables ───────────────
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Prefer service_role key for full table access (bypasses RLS)
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing Supabase credentials in .env.local');
    console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)');
    process.exit(1);
}

console.log('Using key type:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'service_role' : 'anon');
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─────────────── Configuration ───────────────
const TABLE_NAME = 'Assets_Register_Database';
const BATCH_SIZE = 100;
const TSV_PATH = path.resolve(__dirname, 'assets-register-data.tsv');

// Columns that should be parsed as integers
const INTEGER_COLUMNS = [
    'Quantity',
    'Install_Year',
    'Life_Expectancy_Years',
    'Current_Age_Years',
    'ERL_Years',
    'Source_Row',
];

// Columns that should be parsed as booleans
const BOOLEAN_COLUMNS = [
    'Tag_Duplicate_Flag',
];

// ─────────────── TSV Parser ───────────────
function parseTSV(content) {
    const lines = content.trim().split('\n');
    if (lines.length < 2) {
        return { headers: [], rows: [] };
    }

    const headers = lines[0].split('\t').map(h => h.trim());
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = line.split('\t');
        const row = {};

        headers.forEach((header, idx) => {
            const rawValue = (values[idx] || '').trim();
            row[header] = parseValue(header, rawValue);
        });

        rows.push(row);
    }

    return { headers, rows };
}

// ─────────────── Value Parsing ───────────────
function parseValue(column, rawValue) {
    // Empty strings become null
    if (rawValue === '' || rawValue === undefined || rawValue === null) {
        return null;
    }

    // Integer columns
    if (INTEGER_COLUMNS.includes(column)) {
        const parsed = parseInt(rawValue, 10);
        return isNaN(parsed) ? null : parsed;
    }

    // Boolean columns
    if (BOOLEAN_COLUMNS.includes(column)) {
        if (rawValue.toLowerCase() === 'true') return true;
        if (rawValue.toLowerCase() === 'false') return false;
        return false; // default
    }

    // Everything else stays as a string (or null if empty)
    return rawValue;
}

// ─────────────── Main Upload Logic ───────────────
async function main() {
    const startTime = Date.now();

    console.log('='.repeat(60));
    console.log('  ASSETS REGISTER UPLOAD');
    console.log('  Table: ' + TABLE_NAME);
    console.log('  File:  ' + path.basename(TSV_PATH));
    console.log('='.repeat(60));

    // Step 1: Read the TSV file
    console.log('\n[1/4] Reading TSV file...');

    if (!fs.existsSync(TSV_PATH)) {
        console.error('  File not found: ' + TSV_PATH);
        console.error('  Place assets-register-data.tsv in the scripts/ directory');
        process.exit(1);
    }

    const content = fs.readFileSync(TSV_PATH, 'utf8');
    console.log('  File size: ' + (Buffer.byteLength(content, 'utf8') / 1024).toFixed(1) + ' KB');

    // Step 2: Parse the TSV data
    console.log('\n[2/4] Parsing TSV data...');

    const { headers, rows } = parseTSV(content);

    if (rows.length === 0) {
        console.error('  No data rows found in TSV file');
        process.exit(1);
    }

    console.log('  Columns found: ' + headers.length);
    console.log('  Records parsed: ' + rows.length);

    // Validate expected columns exist
    const expectedColumns = [
        'Asset_UID', 'Asset_Tag', 'Asset_Name', 'Asset_Description',
        'Discipline', 'Category', 'Subcategory', 'System_Area',
        'Location_Name', 'Location_Tag', 'Building', 'Floor_Area', 'Zone',
        'Manufacturer_Brand', 'Model', 'Country_Of_Origin', 'Capacity_Size',
        'Quantity', 'Install_Date', 'Install_Year',
        'PPM_Frequency', 'PPM_Interval', 'Is_Asset_Active',
        'Life_Expectancy_Years', 'Current_Age_Years', 'ERL_Years',
        'Condition', 'Status', 'Supplier_Vendor', 'AMC_Contractor',
        'Responsibility_Owner', 'Notes_Remarks',
        'Tag_Duplicate_Flag', 'Source_Sheet', 'Source_Row',
    ];

    const missingColumns = expectedColumns.filter(col => !headers.includes(col));
    if (missingColumns.length > 0) {
        console.warn('  WARNING: Missing expected columns: ' + missingColumns.join(', '));
    }

    const extraColumns = headers.filter(col => !expectedColumns.includes(col));
    if (extraColumns.length > 0) {
        console.log('  Extra columns in TSV (will be included): ' + extraColumns.join(', '));
    }

    // Show a quick data summary
    const nonNullCounts = {};
    for (const col of headers) {
        nonNullCounts[col] = rows.filter(r => r[col] !== null).length;
    }
    console.log('\n  Column fill rates:');
    for (const col of headers) {
        const pct = ((nonNullCounts[col] / rows.length) * 100).toFixed(0);
        const bar = pct >= 90 ? '[FULL]' : pct >= 50 ? '[PARTIAL]' : '[SPARSE]';
        console.log('    ' + col.padEnd(28) + ' ' + String(nonNullCounts[col]).padStart(5) + '/' + rows.length + ' (' + pct + '%) ' + bar);
    }

    // Step 3: Delete existing data
    console.log('\n[3/4] Clearing existing data from ' + TABLE_NAME + '...');

    const { error: deleteError, count: deleteCount } = await supabase
        .from(TABLE_NAME)
        .delete()
        .neq('Asset_UID', '__never_match__'); // Delete all rows (Supabase requires a filter)

    if (deleteError) {
        console.error('  DELETE failed: ' + deleteError.message);
        console.error('  Aborting upload to prevent duplicate data.');
        process.exit(1);
    }

    console.log('  Existing rows deleted' + (deleteCount !== null ? ' (' + deleteCount + ' rows)' : ''));

    // Step 4: Upload in batches
    console.log('\n[4/4] Uploading ' + rows.length + ' records in batches of ' + BATCH_SIZE + '...');

    const totalBatches = Math.ceil(rows.length / BATCH_SIZE);
    let totalUploaded = 0;
    let totalFailed = 0;
    const failedBatches = [];

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;
        const batch = rows.slice(i, i + BATCH_SIZE);

        const { error: insertError } = await supabase
            .from(TABLE_NAME)
            .insert(batch);

        if (insertError) {
            console.error('  Batch ' + batchNum + '/' + totalBatches + ' FAILED (' + batch.length + ' records): ' + insertError.message);
            totalFailed += batch.length;
            failedBatches.push({
                batch: batchNum,
                startRow: i + 1,
                endRow: i + batch.length,
                error: insertError.message,
            });
        } else {
            totalUploaded += batch.length;
            console.log('  Batch ' + batchNum + '/' + totalBatches + ' OK (' + batch.length + ' records) - Total: ' + totalUploaded + '/' + rows.length);
        }
    }

    // ─────────────── Summary ───────────────
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log('\n' + '='.repeat(60));
    console.log('  UPLOAD COMPLETE');
    console.log('='.repeat(60));
    console.log('  Records parsed:   ' + rows.length);
    console.log('  Records uploaded: ' + totalUploaded);
    console.log('  Records failed:   ' + totalFailed);
    console.log('  Batches total:    ' + totalBatches);
    console.log('  Time elapsed:     ' + elapsed + 's');

    if (failedBatches.length > 0) {
        console.log('\n  Failed batch details:');
        for (const fb of failedBatches) {
            console.log('    Batch ' + fb.batch + ' (rows ' + fb.startRow + '-' + fb.endRow + '): ' + fb.error);
        }
    }

    if (totalFailed > 0) {
        console.log('\n  Some records failed to upload. Review the errors above.');
        process.exit(1);
    } else {
        console.log('\n  All records uploaded successfully!');
    }
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
