#!/usr/bin/env node
/**
 * Generate a full Water System reload SQL from Airtable CSV exports.
 *
 * Usage:
 *   1. In Airtable, go to each table's Master View → "..." → "Download CSV"
 *   2. Save the 3 files to this script's directory:
 *      - water_26.csv  (from "Water 26" table)
 *      - water_25.csv  (from "Water 25" table)
 *      - water_24.csv  (from "Water 24" table)
 *   3. Run:  node scripts/gen-water-reload-sql.js
 *   4. Output: sql/migrations/full_water_reload.sql
 */

const fs = require('fs');
const path = require('path');

const SCRIPT_DIR = __dirname;
const OUT_PATH = path.join(SCRIPT_DIR, '..', 'sql', 'migrations', 'full_water_reload.sql');

// ─── CSV Parser (simple, handles quoted fields) ──────────────────────────────
function parseCSV(text) {
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length === 0) return [];
    const headers = parseLine(lines[0]);
    return lines.slice(1).map(line => {
        const vals = parseLine(line);
        const obj = {};
        headers.forEach((h, i) => { obj[h.trim()] = (vals[i] || '').trim(); });
        return obj;
    });
}

function parseLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
            else { inQuotes = !inQuotes; }
        } else if (ch === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += ch;
        }
    }
    result.push(current);
    return result;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const esc = s => s ? String(s).replace(/'/g, "''") : '';
const numOrNull = v => {
    if (v === '' || v === undefined || v === null) return 'NULL';
    const n = parseFloat(v);
    return isNaN(n) ? 'NULL' : n;
};

// ─── Month column mappings ───────────────────────────────────────────────────
const M24 = ['Jan-24','Feb-24','Mar-24','Apr-24','May-24','Jun-24','Jul-24','Aug-24','Sep-24','Oct-24','Nov-24','Dec-24'];
const M25 = ['Jan-25','Feb-25','Mar-25','Apr-25','May-25','Jun-25','Jul-25','Aug-25','Sep-25','Oct-25','Nov-25','Dec-25'];
const M26 = ['Jan-26','Feb-26','Mar-26'];
const COL24 = M24.map(m => m.toLowerCase().replace('-', '_'));
const COL25 = M25.map(m => m.toLowerCase().replace('-', '_'));
const COL26 = M26.map(m => m.toLowerCase().replace('-', '_'));

// ─── Load CSVs ───────────────────────────────────────────────────────────────
function loadCSV(filename) {
    const fp = path.join(SCRIPT_DIR, filename);
    if (!fs.existsSync(fp)) {
        console.error(`Missing: ${fp}`);
        console.error(`Download from Airtable Master View → "..." → "Download CSV"`);
        process.exit(1);
    }
    return parseCSV(fs.readFileSync(fp, 'utf8'));
}

console.log('Loading CSV files...');
const w26 = loadCSV('water_26.csv');
const w25 = loadCSV('water_25.csv');
const w24 = loadCSV('water_24.csv');
console.log(`  Water 26: ${w26.length} records`);
console.log(`  Water 25: ${w25.length} records`);
console.log(`  Water 24: ${w24.length} records`);

// Build lookup maps for 25 and 24 by account number
const map25 = new Map();
w25.forEach(r => {
    const acct = String(r['Acct #'] || r['Acct#'] || '').trim();
    if (acct) map25.set(acct, r);
});
const map24 = new Map();
w24.forEach(r => {
    const acct = String(r['Acct #'] || r['Acct#'] || '').trim();
    if (acct) map24.set(acct, r);
});

// ─── Generate SQL ────────────────────────────────────────────────────────────
const allCols = ['label', 'account_number', 'level', 'zone', 'parent_meter', 'type',
    ...COL24, ...COL25, ...COL26];

let sql = `-- =====================================================
-- Water System: FULL RELOAD from Airtable CSVs
-- Generated: ${new Date().toISOString().split('T')[0]}
-- Source: Airtable base appvmeThHxvhcbgcx
-- WARNING: This DELETES all existing data and re-inserts
-- =====================================================

-- Step 1: Delete all existing data
DELETE FROM "Water System";

-- Step 2: Insert all ${w26.length} meters
INSERT INTO "Water System" (${allCols.join(', ')})
VALUES
`;

const rows = [];
for (const r of w26) {
    const acct = String(r['Acct #'] || r['Acct#'] || '').trim();
    if (!acct) continue;

    const r25 = map25.get(acct) || {};
    const r24 = map24.get(acct) || {};

    // Metadata from Water 26 (most current)
    const label = esc(r['Meter Name'] || '');
    const level = esc(r['Label'] || '');
    const zone = esc(r['Zone'] || '');
    const parent = esc(r['Parent Meter'] || '');
    let type = esc(r['Type'] || '');

    // Monthly values
    const v24 = M24.map(m => numOrNull(r24[m]));
    const v25 = M25.map(m => numOrNull(r25[m]));
    const v26 = M26.map(m => numOrNull(r[m]));

    rows.push(`  ('${label}', '${acct}', '${level}', '${zone}', '${parent}', '${type}', ${v24.join(', ')}, ${v25.join(', ')}, ${v26.join(', ')})`);
}

sql += rows.join(',\n') + ';\n\n';
sql += `-- Step 3: Verify\nSELECT level, COUNT(*) as count FROM "Water System" GROUP BY level ORDER BY level;\n`;
sql += `SELECT COUNT(*) as total_meters FROM "Water System";\n`;

// Write output
fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
fs.writeFileSync(OUT_PATH, sql);
console.log(`\nGenerated: ${OUT_PATH}`);
console.log(`Total meters: ${rows.length}`);
console.log(`\nNext: Run this SQL in Supabase SQL Editor`);
