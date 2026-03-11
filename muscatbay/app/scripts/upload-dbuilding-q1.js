#!/usr/bin/env node
/**
 * D-Building Q1 2026 Upload Script
 * Upserts daily consumption data for D-Building meters (204 meters × 3 months)
 * Uses upsert to avoid deleting other meters' data
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load Supabase credentials
const envPath = path.join(__dirname, '..', '.env.local');
let supabaseUrl = '', supabaseKey = '';
if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
        const [key, ...valParts] = line.split('=');
        const val = valParts.join('=').trim();
        if (key.trim() === 'NEXT_PUBLIC_SUPABASE_URL') supabaseUrl = val;
        if (key.trim() === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') supabaseKey = val;
    }
}

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function parseCSV(content) {
    const lines = content.trim().split('\n');
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim());
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const values = line.split(',').map(v => v.trim());
        const row = {};
        headers.forEach((h, idx) => {
            row[h] = values[idx] || '';
        });
        rows.push(row);
    }
    return rows;
}

async function uploadCSV(csvPath) {
    const content = fs.readFileSync(csvPath, 'utf8');
    const rows = parseCSV(content);
    if (rows.length === 0) {
        console.error(`  No data in ${path.basename(csvPath)}`);
        return 0;
    }

    const records = rows.map(row => {
        const record = {
            meter_name: row.meter_name,
            account_number: row.account_number,
            label: row.label || null,
            zone: row.zone || null,
            parent_meter: row.parent_meter || null,
            type: row.type || null,
            month: row.month,
            year: parseInt(row.year),
        };
        for (let d = 1; d <= 31; d++) {
            const val = row[`day_${d}`];
            record[`day_${d}`] = val !== undefined && val !== '' ? parseFloat(val) : null;
        }
        return record;
    });

    console.log(`  Parsed ${records.length} records from ${path.basename(csvPath)}`);

    // Upsert in batches of 50
    const BATCH = 50;
    let uploaded = 0;
    let errors = 0;

    for (let i = 0; i < records.length; i += BATCH) {
        const batch = records.slice(i, i + BATCH);
        const { error } = await supabase
            .from('water_daily_consumption')
            .upsert(batch, { onConflict: 'account_number,month,year' });

        if (error) {
            console.error(`  Batch ${Math.floor(i / BATCH) + 1} error: ${error.message}`);
            errors++;
        } else {
            uploaded += batch.length;
        }
    }

    if (errors === 0) {
        console.log(`  ${uploaded} records upserted successfully`);
    } else {
        console.log(`  ${uploaded} records upserted, ${errors} batches failed`);
    }
    return uploaded;
}

async function main() {
    console.log('D-Building Q1 2026 Daily Consumption Upload');
    console.log('='.repeat(50));

    const csvFiles = [
        path.join(__dirname, 'd_building_jan_26.csv'),
        path.join(__dirname, 'd_building_feb_26.csv'),
        path.join(__dirname, 'd_building_mar_26.csv'),
    ];

    let totalUploaded = 0;

    for (const csvFile of csvFiles) {
        if (!fs.existsSync(csvFile)) {
            console.log(`  Skipping ${path.basename(csvFile)} (not found)`);
            continue;
        }
        console.log(`\nUploading ${path.basename(csvFile)}...`);
        const count = await uploadCSV(csvFile);
        totalUploaded += count;
    }

    console.log(`\nDone! ${totalUploaded} total records upserted to water_daily_consumption`);
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
