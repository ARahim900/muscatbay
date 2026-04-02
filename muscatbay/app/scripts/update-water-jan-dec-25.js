#!/usr/bin/env node
/**
 * update-water-jan-dec-25.js
 *
 * Reads water_2025_raw.tsv and updates water_meters_full.json with:
 *   - jan_25 through dec_25 consumption values
 *   - label, level, zone, parent_meter, type metadata fields
 *
 * Then applies specific overrides confirmed from the Supabase database.
 *
 * Does NOT touch jan_24–dec_24 or jan_26 values.
 */

const fs = require('fs');
const path = require('path');

const TSV_PATH  = path.join(__dirname, 'seeds', 'water_2025_raw.tsv');
const JSON_PATH = path.join(__dirname, 'seeds', 'water_meters_full.json');

// ── helpers ──────────────────────────────────────────────────────────────────

function parseNum(s) {
  if (s === undefined || s === null || s.trim() === '') return null;
  const n = parseFloat(s.trim());
  return isNaN(n) ? null : n;
}

// ── load files ────────────────────────────────────────────────────────────────

const tsvRaw  = fs.readFileSync(TSV_PATH, 'utf8');
const meters  = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));

// ── parse TSV ────────────────────────────────────────────────────────────────
// Expected columns (0-based index):
//   0  Meter Name   → label
//   1  Acct #       → account_number (key for matching)
//   2  Label        → level
//   3  Zone         → zone
//   4  Parent Meter → parent_meter
//   5  Type         → type
//   6  Jan-25       → jan_25
//   7  Feb-25       → feb_25
//   8  Mar-25       → mar_25
//   9  Apr-25       → apr_25
//  10  May-25       → may_25
//  11  Jun-25       → jun_25
//  12  Jul-25       → jul_25
//  13  Aug-25       → aug_25
//  14  Sep-25       → sep_25
//  15  Oct-25       → oct_25
//  16  Nov-25       → nov_25
//  17  Dec-25       → dec_25
//  18  Jan-26       → (ignored – not updated)

const MONTH_COLS = [
  'jan_25', 'feb_25', 'mar_25', 'apr_25', 'may_25', 'jun_25',
  'jul_25', 'aug_25', 'sep_25', 'oct_25', 'nov_25', 'dec_25',
];

const lines = tsvRaw.split('\n').filter(l => l.trim() !== '');
const header = lines[0].split('\t');
console.log(`TSV header (${header.length} columns): ${header.join(' | ')}`);

// Build a map from account_number → TSV row data
const tsvMap = new Map();
for (let i = 1; i < lines.length; i++) {
  const cols = lines[i].split('\t');
  const acct = (cols[1] || '').trim();
  if (!acct) continue;
  tsvMap.set(acct, cols);
}
console.log(`TSV rows parsed: ${tsvMap.size}`);

// ── apply TSV updates to JSON ─────────────────────────────────────────────────

let updated = 0;
let notFound = 0;

for (const meter of meters) {
  const acct = (meter.account_number || '').trim();
  const row  = tsvMap.get(acct);

  if (!row) {
    console.warn(`  [WARN] No TSV row found for account_number "${acct}" (${meter.label})`);
    notFound++;
    continue;
  }

  // Update metadata
  const newLabel  = (row[0] || '').trim();
  const newLevel  = (row[2] || '').trim();
  const newZone   = (row[3] || '').trim();
  const newParent = (row[4] || '').trim();
  const newType   = (row[5] || '').trim();

  if (newLabel)  meter.label        = newLabel;
  if (newLevel)  meter.level        = newLevel;
  if (newZone)   meter.zone         = newZone;
  if (newParent) meter.parent_meter = newParent;
  if (newType)   meter.type         = newType;

  // Update jan_25 – dec_25
  MONTH_COLS.forEach((col, idx) => {
    const rawVal = row[6 + idx];        // columns 6–17 in TSV
    const parsed = parseNum(rawVal);
    meter[col] = parsed;                // null if blank/missing
  });

  updated++;
}

console.log(`\nUpdated: ${updated} meters`);
if (notFound > 0) console.warn(`Not found in TSV: ${notFound} meters`);

// ── apply specific overrides (confirmed from Supabase database) ───────────────

const OVERRIDES = [
  // C43659 – Main Bulk (NAMA)
  { account_number: 'C43659', jun_25: 42998, jul_25: 36909, aug_25: 42221, nov_25: 49118, dec_25: 36733 },
  // 4300335 – Village Square
  { account_number: '4300335', jan_25: 18048 },
];

let overrideCount = 0;
for (const override of OVERRIDES) {
  const { account_number, ...fields } = override;
  const meter = meters.find(m => m.account_number === account_number);
  if (!meter) {
    console.warn(`  [WARN] Override target "${account_number}" not found in JSON`);
    continue;
  }
  for (const [field, value] of Object.entries(fields)) {
    const oldVal = meter[field];
    meter[field] = value;
    console.log(`  [OVERRIDE] ${account_number} (${meter.label}): ${field} ${oldVal} → ${value}`);
    overrideCount++;
  }
}
console.log(`\nOverrides applied: ${overrideCount} field(s)`);

// ── write updated JSON ────────────────────────────────────────────────────────

fs.writeFileSync(JSON_PATH, JSON.stringify(meters, null, 2) + '\n', 'utf8');
console.log(`\n✅ Written updated JSON to ${JSON_PATH}`);
console.log(`   Total meters in file: ${meters.length}`);
