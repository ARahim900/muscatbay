#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, 'seeds', 'water_meters_full.json');
const targetPath = path.join(__dirname, '..', 'lib', 'water-data.ts');

const raw = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
console.log(`Read ${raw.length} meters`);

const MONTHS = [
    'Jan-24', 'Feb-24', 'Mar-24', 'Apr-24', 'May-24', 'Jun-24', 'Jul-24', 'Aug-24', 'Sep-24', 'Oct-24', 'Nov-24', 'Dec-24',
    'Jan-25', 'Feb-25', 'Mar-25', 'Apr-25', 'May-25', 'Jun-25', 'Jul-25', 'Aug-25', 'Sep-25', 'Oct-25', 'Nov-25', 'Dec-25',
    'Jan-26', 'Feb-26'
];

const DB_COLS = [
    'jan_24', 'feb_24', 'mar_24', 'apr_24', 'may_24', 'jun_24', 'jul_24', 'aug_24', 'sep_24', 'oct_24', 'nov_24', 'dec_24',
    'jan_25', 'feb_25', 'mar_25', 'apr_25', 'may_25', 'jun_25', 'jul_25', 'aug_25', 'sep_25', 'oct_25', 'nov_25', 'dec_25',
    'jan_26', 'feb_26'
];

function esc(s) { return (s || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'"); }

function formatMeter(m) {
    const vals = DB_COLS.map(col => {
        const v = m[col];
        return (v === null || v === undefined || v === '') ? 'null' : v;
    });
    const label = esc(m.label);
    const acct = m.account_number || '';
    const level = m.level || 'N/A';
    const zone = esc(m.zone);
    const parent = esc(m.parent_meter);
    const type = esc(m.type);
    return `  { label: '${label}', accountNumber: '${acct}', level: '${level}', zone: '${zone}', parentMeter: '${parent}', type: '${type}', consumption: c([${vals.join(', ')}]) }`;
}

// Read current file
const src = fs.readFileSync(targetPath, 'utf8');

// Find boundaries
const startTag = 'export const WATER_METERS: WaterMeter[] = [';
const endTag = '\n// =============================================================================\n// DYNAMIC DATA SUPPORT';

const si = src.indexOf(startTag);
const ei = src.indexOf(endTag);

if (si === -1 || ei === -1) { console.error('Markers not found'); process.exit(1); }

// Find the end of WATER_METERS array (the "];" after the last entry)
const arrayEnd = src.lastIndexOf('];', ei);

const before = src.substring(0, si);
const after = src.substring(arrayEnd + 2); // skip '];'

const entries = raw.map(formatMeter).join(',\n');
const newContent = before + startTag + '\n' + entries + '\n];' + after;

fs.writeFileSync(targetPath, newContent, 'utf8');
console.log(`✅ Updated water-data.ts with ${raw.length} meters`);
