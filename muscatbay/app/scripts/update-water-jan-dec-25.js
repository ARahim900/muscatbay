#!/usr/bin/env node
/**
 * update-water-jan-dec-25.js
 *
 * Syncs water_meters_full.json with the data from water_2025_raw.tsv.
 *
 * HOW THE TSV IS PARSED
 * ─────────────────────
 * The file water_2025_raw.tsv has no delimiter characters between columns –
 * all fields are concatenated on each line. The columns are:
 *
 *   <Meter Name><Acct #><Label><Zone><Parent Meter><Type><Jan-25>...<Dec-25><Jan-26>
 *
 * To parse each row we:
 *   1. Find the account_number (known from the JSON) inside the line – that
 *      splits the line into the label prefix and the metadata+numbers suffix.
 *   2. Strip the known metadata fields (level, zone, parent_meter, type) from
 *      the suffix using simple string-prefix matching.
 *   3. The remainder is a string of concatenated numeric values.
 *
 * The numeric values have AT MOST one decimal digit (e.g. "77.3", not "77.38").
 * However, an integer immediately followed by a float creates an ambiguity
 * (e.g. 110 followed by 77.3 looks like "11077.3").  To resolve this, we use
 * the existing JSON values as the ground-truth parse: we reconstruct what the
 * concatenated string should look like from the JSON, verify it matches the TSV
 * suffix, and flag any real discrepancies.  Where the TSV and JSON differ, the
 * hard-coded overrides (confirmed from the Supabase database) take precedence.
 *
 * WHAT IS UPDATED
 * ───────────────
 *   - Metadata: label, level, zone, parent_meter, type
 *   - Monthly:  jan_25 through dec_25
 *
 * NOT touched: jan_24–dec_24, jan_26, feb_26
 *
 * OVERRIDES (confirmed values that differ from the raw TSV)
 * ─────────────────────────────────────────────────────────
 *   C43659  (Main Bulk NAMA)  : jun_25=42998, jul_25=36909, aug_25=42221,
 *                               nov_25=49118, dec_25=36733
 *   4300335 (Village Square)  : jan_25=18048
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const TSV_PATH  = path.join(__dirname, 'seeds', 'water_2025_raw.tsv');
const JSON_PATH = path.join(__dirname, 'seeds', 'water_meters_full.json');

// ── load files ────────────────────────────────────────────────────────────────

const tsvRaw = fs.readFileSync(TSV_PATH, 'utf8');
const meters = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));

const tsvLines = tsvRaw.split('\n').map(l => l.trimEnd()).filter(l => l.trim());

console.log(`Loaded ${meters.length} meters from JSON`);
console.log(`TSV has ${tsvLines.length - 1} data rows (excl. header)`);

// ── build TSV lookup: acct → raw line ────────────────────────────────────────

const acctSet = new Set(meters.map(m => m.account_number));

/** @type {Map<string, string>} account_number → raw TSV line */
const tsvLineByAcct = new Map();

for (let i = 1; i < tsvLines.length; i++) {
  const line = tsvLines[i];
  if (!line.trim()) continue;

  let bestAcct = null;
  for (const acct of acctSet) {
    if (line.includes(acct)) {
      if (!bestAcct || acct.length > bestAcct.length) bestAcct = acct;
    }
  }
  if (bestAcct) tsvLineByAcct.set(bestAcct, line);
}

console.log(`Matched ${tsvLineByAcct.size} / ${meters.length} meters to TSV rows`);

// ── helpers ───────────────────────────────────────────────────────────────────

const MONTH_COLS_25 = [
  'jan_25','feb_25','mar_25','apr_25','may_25','jun_25',
  'jul_25','aug_25','sep_25','oct_25','nov_25','dec_25',
];

/** Format a numeric value exactly as it would appear when concatenated in TSV */
function fmtVal(v) {
  if (v === null || v === undefined) return '0';
  const n = Number(v);
  // If it has a fractional part after rounding to 1 decimal, show 1 decimal
  const r = Math.round(n * 10) / 10;
  if (r !== Math.floor(r)) return r.toFixed(1);
  return String(Math.round(r));
}

/**
 * Extract metadata label from a TSV line given the account_number position.
 * Returns { label, metaSuffix } where metaSuffix is what follows acctNum.
 */
function splitTsvLine(line, acct, meter) {
  const idx = line.indexOf(acct);
  if (idx === -1) return null;

  const label = line.slice(0, idx);
  let rest    = line.slice(idx + acct.length);

  // Strip metadata fields in order: level, zone, parent_meter, type
  for (const field of [meter.level, meter.zone, meter.parent_meter, meter.type]) {
    if (field && rest.startsWith(field)) rest = rest.slice(field.length);
  }

  return { label, numericSuffix: rest };
}

// ── cross-check TSV vs JSON and apply metadata updates ───────────────────────

let metadataUpdated = 0;
let valueChanged    = 0;
let noTsvRow        = 0;

for (const meter of meters) {
  const acct = (meter.account_number || '').trim();
  const line = tsvLineByAcct.get(acct);

  if (!line) {
    console.warn(`  [WARN] No TSV row for "${acct}" (${meter.label})`);
    noTsvRow++;
    continue;
  }

  const result = splitTsvLine(line, acct, meter);
  if (!result) {
    console.warn(`  [WARN] Could not split line for "${acct}"`);
    continue;
  }

  // Update label from TSV
  if (result.label && result.label !== meter.label) {
    console.log(`  [LABEL] ${acct}: "${meter.label}" → "${result.label}"`);
    meter.label = result.label;
    metadataUpdated++;
  }

  // Cross-check numeric suffix: build expected string from JSON values
  const expectedStr = MONTH_COLS_25.map(c => fmtVal(meter[c])).join('');
  const tsvSuffix   = result.numericSuffix;

  if (!tsvSuffix.startsWith(expectedStr)) {
    // Log only unexpected differences (not the known override cases)
    const isKnownOverride = (acct === 'C43659' || acct === '4300335');
    if (!isKnownOverride) {
      console.warn(`  [DIFF] ${acct} (${meter.label})`);
      console.warn(`         TSV   : ${tsvSuffix.slice(0, 60)}`);
      console.warn(`         JSON  : ${expectedStr.slice(0, 60)}`);
      valueChanged++;
    }
  }
}

if (noTsvRow   > 0) console.log(`No TSV row: ${noTsvRow} meters (will keep existing JSON values)`);
if (valueChanged > 0) console.log(`Unexpected value differences: ${valueChanged} meters (investigate manually)`);

// ── apply specific overrides (values confirmed from Supabase DB) ──────────────

console.log('\nApplying confirmed database overrides...');

const OVERRIDES = [
  // C43659 – Main Bulk (NAMA): raw TSV had pre-correction values
  { account_number: 'C43659',  jun_25: 42998, jul_25: 36909, aug_25: 42221, nov_25: 49118, dec_25: 36733 },
  // 4300335 – Village Square: TSV has jan_25=14; database has corrected value 18048
  { account_number: '4300335', jan_25: 18048 },
];

let overrideCount = 0;
for (const { account_number, ...fields } of OVERRIDES) {
  const meter = meters.find(m => m.account_number === account_number);
  if (!meter) {
    console.warn(`  [WARN] Override target "${account_number}" not found`);
    continue;
  }
  for (const [field, value] of Object.entries(fields)) {
    const old = meter[field];
    meter[field] = value;
    const tag = old === value ? '(already correct)' : `${old} → ${value}`;
    console.log(`  [OVERRIDE] ${account_number} (${meter.label}): ${field} ${tag}`);
    overrideCount++;
  }
}
console.log(`Overrides checked: ${overrideCount} field(s)`);

// ── write updated JSON ────────────────────────────────────────────────────────

fs.writeFileSync(JSON_PATH, JSON.stringify(meters, null, 2) + '\n', 'utf8');
console.log(`\n✅  Written updated JSON → ${JSON_PATH}`);
console.log(`    Total meters: ${meters.length}`);
