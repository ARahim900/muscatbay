/**
 * Parse raw water meter data from TSV files and generate JSON for seeding
 * Usage: node scripts/seeds/parse-water-data.js
 */
const fs = require('fs');
const path = require('path');

const data2024Path = path.join(__dirname, 'water_2024_raw.tsv');
const data2025Path = path.join(__dirname, 'water_2025_raw.tsv');
const outputPath = path.join(__dirname, 'water_meters_full.json');

function parseTSV(content, months) {
    const lines = content.trim().split('\n');
    // Skip header line
    const records = [];
    for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split('\t');
        if (cols.length < 7) continue;

        const record = {
            meter_name: cols[0]?.trim() || '',
            account_number: cols[1]?.trim() || '',
            label: cols[2]?.trim() || '',
            zone: cols[3]?.trim() || '',
            parent_meter: cols[4]?.trim() || '',
            type: cols[5]?.trim() || '',
        };

        // Parse month values starting from column 6
        months.forEach((month, idx) => {
            const raw = cols[6 + idx]?.trim() || '0';
            const val = parseFloat(raw);
            record[month] = isNaN(val) ? null : val;
        });

        records.push(record);
    }
    return records;
}

const MONTHS_2024 = [
    'jan_24', 'feb_24', 'mar_24', 'apr_24', 'may_24', 'jun_24',
    'jul_24', 'aug_24', 'sep_24', 'oct_24', 'nov_24', 'dec_24'
];

const MONTHS_2025 = [
    'jan_25', 'feb_25', 'mar_25', 'apr_25', 'may_25', 'jun_25',
    'jul_25', 'aug_25', 'sep_25', 'oct_25', 'nov_25', 'dec_25', 'jan_26'
];

// Parse both files
const raw2024 = fs.readFileSync(data2024Path, 'utf-8');
const raw2025 = fs.readFileSync(data2025Path, 'utf-8');

const records2024 = parseTSV(raw2024, MONTHS_2024);
const records2025 = parseTSV(raw2025, MONTHS_2025);

console.log(`Parsed ${records2024.length} meters from 2024 data`);
console.log(`Parsed ${records2025.length} meters from 2025 data`);

// Merge by account_number - 2025 data is the primary, 2024 adds month columns
const merged = new Map();

// Start with 2025 data (has the most up-to-date meter names etc + jan_26)
for (const r of records2025) {
    merged.set(r.account_number, { ...r });
}

// Merge 2024 month values in
for (const r of records2024) {
    const existing = merged.get(r.account_number);
    if (existing) {
        // Add 2024 months to the existing record
        MONTHS_2024.forEach(m => {
            existing[m] = r[m];
        });
    } else {
        // Meter only in 2024 data - add with null 2025 values
        const newRecord = { ...r };
        MONTHS_2025.forEach(m => { newRecord[m] = null; });
        merged.set(r.account_number, newRecord);
    }
}

// Convert to array, removing meter_name (not a Supabase column name - it's stored as label)
// Actually, looking at the schema, the table uses: label, account_number, level, zone, parent_meter, type
// The user data has: Meter Name, Acct #, Label, Zone, Parent Meter, Type
// So: label in user data = level in schema (L1, L2, L3, L4, DC, N/A)
// meter_name in user data = label in schema (the descriptive name)
const result = [];
for (const [acct, record] of merged) {
    const row = {
        label: record.meter_name,        // Meter Name -> label (displayed name)
        account_number: record.account_number,
        level: record.label,              // Label column = L1/L2/L3/L4/DC/N/A -> level
        zone: record.zone,
        parent_meter: record.parent_meter,
        type: record.type,
    };

    // Add all month columns
    [...MONTHS_2024, ...MONTHS_2025].forEach(m => {
        row[m] = record[m] !== undefined ? record[m] : null;
    });

    result.push(row);
}

fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
console.log(`\nWrote ${result.length} meters to ${outputPath}`);
console.log('Months covered: Jan-24 through Jan-26 (25 months)');
