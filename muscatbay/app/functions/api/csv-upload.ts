/**
 * @fileoverview CSV Upload API Functions
 * Functions for uploading, parsing, and importing water consumption CSV data
 * @module functions/api/csv-upload
 */

import { getSupabaseClient } from '../supabase-client';
import { getWaterMetersFromSupabase } from './water';

/**
 * Result of a CSV import operation
 */
export interface ImportResult {
    success: boolean;
    imported: number;
    skipped: number;
    errors: string[];
    storagePath?: string;
}

/**
 * Parsed row from water consumption CSV
 */
export interface CSVWaterConsumptionRow {
    meterName: string;
    accountNumber: string;
    label?: string;
    zone?: string;
    parentMeter?: string;
    type?: string;
    month: string;
    year: number;
    dailyReadings: Record<number, number | null>;
}

/**
 * Upload CSV file to Supabase Storage (optional - for backup purposes)
 * @param file - The CSV file to upload
 * @param month - Month identifier (e.g., "Jan-26")
 * @param year - Year (e.g., 2026)
 * @returns Path in storage where file was saved, or null if storage is not available
 */
export async function uploadCSVToStorage(
    file: File,
    month: string,
    year: number
): Promise<string | null> {
    const client = getSupabaseClient();
    if (!client) {
        console.warn('[CSV Storage] Supabase client not configured, skipping storage backup');
        return null;
    }

    try {
        const timestamp = Date.now();
        const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const storagePath = `water/${year}/${month}/${timestamp}_${sanitizedFilename}`;

        const { data, error } = await client.storage
            .from('grafana-uploads')
            .upload(storagePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            // Storage is optional - just log a warning and continue
            console.warn('[CSV Storage] Storage backup skipped:', error.message);
            return null;
        }

        console.log(`[CSV Storage] File backed up to: ${data.path}`);
        return data.path;
    } catch (err) {
        // Storage is optional - don't fail the import if storage fails
        console.warn('[CSV Storage] Storage backup failed:', err);
        return null;
    }
}

/**
 * Parse month code from READING_MNTH format (e.g., "12026" = Jan 2026)
 * Format: MMYYYY where MM is 1-12
 */
function parseReadingMonth(readingMonth: string): { month: string; year: number } | null {
    const trimmed = readingMonth?.trim();
    if (!trimmed || trimmed.length < 5) return null;

    // Format: MYYYY or MMYYYY (e.g., 12026 = Jan 2026, 122025 = Dec 2025)
    // Month is 1-2 digits, year is 4 digits
    let monthNum: number;
    let year: number;

    if (trimmed.length === 5) {
        // Single digit month: M + YYYY (e.g., 12026)
        monthNum = parseInt(trimmed[0], 10);
        year = parseInt(trimmed.slice(1), 10);
    } else if (trimmed.length === 6) {
        // Double digit month: MM + YYYY (e.g., 122025)
        monthNum = parseInt(trimmed.slice(0, 2), 10);
        year = parseInt(trimmed.slice(2), 10);
    } else {
        return null;
    }

    if (isNaN(monthNum) || isNaN(year) || monthNum < 1 || monthNum > 12) {
        return null;
    }

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const yearShort = year.toString().slice(-2);
    const month = `${monthNames[monthNum - 1]}-${yearShort}`;

    return { month, year };
}

/**
 * Strip BOM (Byte Order Mark) from string content.
 * Excel and Windows tools often add a BOM character (\uFEFF) at the start of CSV files,
 * which breaks header parsing if not removed.
 */
function stripBOM(content: string): string {
    if (content.charCodeAt(0) === 0xFEFF) {
        return content.slice(1);
    }
    return content;
}

/**
 * Parse CSV content into structured water consumption rows
 * Supports two formats:
 * 1. Standard format: meter_name, account_number, ..., day_1, day_2, ...
 * 2. Pivot format: ACCOUNT_NUMBER, READING_MNTH, 1, 2, 3, ... 31
 *
 * @param csvContent - Raw CSV string content
 * @param month - Default month for the data (e.g., "Jan-26") - can be overridden by READING_MNTH
 * @param year - Default year for the data (e.g., 2026) - can be overridden by READING_MNTH
 * @returns Array of parsed rows
 */
export function parseCSV(
    csvContent: string,
    month: string,
    year: number
): CSVWaterConsumptionRow[] {
    const cleanContent = stripBOM(csvContent);
    const lines = cleanContent.trim().split('\n');
    if (lines.length < 2) {
        return [];
    }

    // Parse header to find column indices
    const header = parseCSVLine(lines[0]);
    const headerLower = header.map(h => h.toLowerCase().trim());
    const headerTrimmed = header.map(h => h.trim());

    // Find column indices - support multiple column name formats
    const meterNameIdx = findColumnIndex(headerLower, ['meter_name', 'metername', 'meter name', 'name']);
    const accountNumberIdx = findColumnIndex(headerLower, ['account_number', 'accountnumber', 'account', 'acct #', 'acct#', 'acct', 'acct no', 'meter_id', 'meterid']);
    const labelIdx = findColumnIndex(headerLower, ['label', 'level']);
    const zoneIdx = findColumnIndex(headerLower, ['zone']);
    const parentMeterIdx = findColumnIndex(headerLower, ['parent_meter', 'parentmeter', 'parent', 'parent meter']);
    const typeIdx = findColumnIndex(headerLower, ['type', 'meter_type']);

    // Check for pivot format with READING_MNTH column
    const readingMonthIdx = findColumnIndex(headerLower, ['reading_mnth', 'reading_month', 'readingmnth', 'readingmonth']);
    const isPivotFormat = readingMonthIdx >= 0;

    // Find day columns - support both formats:
    // 1. Standard: day_1, day_2, etc.
    // 2. Pivot: just numbers 1, 2, 3, ... 31
    const dayColumns: Record<number, number> = {};
    headerTrimmed.forEach((col, idx) => {
        // Try standard format first (day_1, day_2, etc.)
        const matchStandard = col.toLowerCase().match(/^day[_\s]?(\d+)$/);
        if (matchStandard) {
            const dayNum = parseInt(matchStandard[1], 10);
            if (dayNum >= 1 && dayNum <= 31) {
                dayColumns[dayNum] = idx;
            }
            return;
        }

        // Try pivot format (just the number)
        const numericValue = parseInt(col, 10);
        if (!isNaN(numericValue) && numericValue >= 1 && numericValue <= 31 && col === numericValue.toString()) {
            dayColumns[numericValue] = idx;
        }
    });

    // Require at least meter identifier column
    if (accountNumberIdx === -1 && meterNameIdx === -1) {
        console.warn('CSV missing required meter identification column');
        return [];
    }

    // Log detected format
    const dayColumnCount = Object.keys(dayColumns).length;
    console.log(`[CSV Parse] Format: ${isPivotFormat ? 'Pivot' : 'Standard'}, Day columns found: ${dayColumnCount}`);

    const rows: CSVWaterConsumptionRow[] = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = parseCSVLine(line);

        const accountNumber = accountNumberIdx >= 0 ? values[accountNumberIdx]?.trim() || '' : '';
        const meterName = meterNameIdx >= 0 ? values[meterNameIdx]?.trim() || '' : '';

        // Skip rows without identifier
        if (!accountNumber && !meterName) continue;

        // Determine month/year - use READING_MNTH if available, otherwise use provided defaults
        let rowMonth = month;
        let rowYear = year;

        if (isPivotFormat && readingMonthIdx >= 0) {
            const readingMonthValue = values[readingMonthIdx];
            const parsed = parseReadingMonth(readingMonthValue);
            if (parsed) {
                rowMonth = parsed.month;
                rowYear = parsed.year;
            }
        }

        // Parse daily readings
        const dailyReadings: Record<number, number | null> = {};
        for (const [day, colIdx] of Object.entries(dayColumns)) {
            const value = values[colIdx];
            if (value !== undefined && value !== null && value.trim() !== '' && value.toUpperCase() !== 'NULL') {
                // Strip commas from numbers (e.g., "2,154.00" → "2154.00")
                const cleaned = value.trim().replace(/,/g, '');
                const parsed = parseFloat(cleaned);
                dailyReadings[parseInt(day, 10)] = isNaN(parsed) ? null : parsed;
            } else {
                dailyReadings[parseInt(day, 10)] = null;
            }
        }

        rows.push({
            meterName,
            accountNumber,
            label: labelIdx >= 0 ? values[labelIdx]?.trim() : undefined,
            zone: zoneIdx >= 0 ? values[zoneIdx]?.trim() : undefined,
            parentMeter: parentMeterIdx >= 0 ? values[parentMeterIdx]?.trim() : undefined,
            type: typeIdx >= 0 ? values[typeIdx]?.trim() : undefined,
            month: rowMonth,
            year: rowYear,
            dailyReadings
        });
    }

    return rows;
}

/**
 * Parse a single CSV/TSV line handling quoted values
 * Auto-detects delimiter (comma or tab)
 */
function parseCSVLine(line: string, delimiter?: string): string[] {
    // Auto-detect delimiter if not provided
    const actualDelimiter = delimiter || (line.includes('\t') ? '\t' : ',');

    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === actualDelimiter && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);

    return result;
}

/**
 * Find column index from multiple possible names
 */
function findColumnIndex(headers: string[], possibleNames: string[]): number {
    for (const name of possibleNames) {
        const idx = headers.indexOf(name);
        if (idx !== -1) return idx;
    }
    return -1;
}

/**
 * Filter CSV rows to only include meters that are configured in the system.
 * Also enriches rows with metadata (meter_name, label, zone, etc.) from
 * the Water System configuration when the CSV doesn't provide these fields.
 * @param rows - Parsed CSV rows
 * @returns Object with filtered rows and skip count
 */
export async function filterMetersByConfiguration(
    rows: CSVWaterConsumptionRow[]
): Promise<{ validRows: CSVWaterConsumptionRow[]; skippedCount: number }> {
    // Get all configured meters from database
    const configuredMeters = await getWaterMetersFromSupabase();

    // Create lookup maps for enrichment
    const meterByAccount = new Map<string, typeof configuredMeters[0]>();
    const meterByName = new Map<string, typeof configuredMeters[0]>();
    for (const m of configuredMeters) {
        if (m.accountNumber) meterByAccount.set(m.accountNumber.toLowerCase().trim(), m);
        if (m.label) meterByName.set(m.label.toLowerCase().trim(), m);
    }

    const validRows: CSVWaterConsumptionRow[] = [];
    let skippedCount = 0;

    for (const row of rows) {
        const accountLower = row.accountNumber?.toLowerCase().trim();
        const nameLower = row.meterName?.toLowerCase().trim();

        // Find matching configured meter
        const configuredMeter =
            (accountLower && meterByAccount.get(accountLower)) ||
            (nameLower && meterByName.get(nameLower)) ||
            null;

        if (configuredMeter) {
            // Enrich row with missing metadata from Water System configuration
            if (!row.meterName) row.meterName = configuredMeter.label || '';
            if (!row.label) row.label = configuredMeter.level || '';
            if (!row.zone) {
                row.zone = configuredMeter.zone || '';
            }
            if (!row.parentMeter) row.parentMeter = configuredMeter.parentMeter || '';
            if (!row.type) row.type = configuredMeter.type || '';

            // Always convert zone code (e.g., "Zone_03_(B)") to display format (e.g., "Zone 3B")
            // to match the format used in water_loss_daily and DailyWaterReport filtering
            if (row.zone) {
                row.zone = resolveZoneDisplay(row.zone) || row.zone;
            }

            validRows.push(row);
        } else {
            skippedCount++;
        }
    }

    console.log(`[CSV Filter] Valid: ${validRows.length}, Skipped: ${skippedCount}`);
    return { validRows, skippedCount };
}

/**
 * Import filtered water consumption data into the database.
 * Uses upsert with fallback to delete+insert if the unique constraint is missing.
 * Only updates metadata fields (label, zone, etc.) if the CSV provides non-empty values.
 * @param rows - Validated rows to import
 * @returns Import result with counts
 */
export async function importWaterConsumptionData(
    rows: CSVWaterConsumptionRow[]
): Promise<{ imported: number; errors: string[] }> {
    const client = getSupabaseClient();
    if (!client) {
        return { imported: 0, errors: ['Supabase client not configured'] };
    }

    if (rows.length === 0) {
        return { imported: 0, errors: [] };
    }

    const errors: string[] = [];
    let imported = 0;

    // Prepare records for upsert - only include metadata fields if they have values
    const records = rows.map(row => {
        const record: Record<string, unknown> = {
            // meter_name: enriched from Water System config, fallback to account_number
            meter_name: row.meterName || row.accountNumber,
            account_number: row.accountNumber,
            month: row.month,
            year: row.year,
        };
        if (row.label) record.label = row.label;
        if (row.zone) record.zone = row.zone;
        if (row.parentMeter) record.parent_meter = row.parentMeter;
        if (row.type) record.type = row.type;

        // Add daily readings
        for (let day = 1; day <= 31; day++) {
            record[`day_${day}`] = row.dailyReadings[day] ?? null;
        }

        return record;
    });

    try {
        // Try upsert first (requires UNIQUE constraint on account_number,month,year)
        const upsertSuccess = await tryUpsertBatch(client, records, errors);

        if (upsertSuccess !== null) {
            imported = upsertSuccess;
        } else {
            // Fallback: delete existing + insert new (when unique constraint is missing)
            console.log('[CSV Import] Upsert failed, using delete+insert fallback...');
            errors.length = 0; // Clear upsert errors
            imported = await fallbackDeleteInsert(client, records, rows, errors);
        }
    } catch (err) {
        errors.push(`Import error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }

    // Detect RLS errors and replace with a clear, actionable message
    const hasRLSError = errors.some(e => e.includes('row-level security policy'));
    if (hasRLSError) {
        const rlsMsg = 'Database security policies are blocking write access. Please run the RLS fix script in the Supabase SQL Editor: sql/fixes/fix_water_daily_consumption_rls.sql';
        errors.length = 0;
        errors.push(rlsMsg);
    }

    console.log(`[CSV Import] Imported: ${imported}, Errors: ${errors.length}`);
    return { imported, errors };
}

/**
 * Try to upsert records in batches.
 * Returns number of imported records, or null if upsert failed due to missing constraint.
 */
async function tryUpsertBatch(
    client: ReturnType<typeof getSupabaseClient>,
    records: Record<string, unknown>[],
    errors: string[]
): Promise<number | null> {
    if (!client) return null;

    let imported = 0;
    const batchSize = 50;

    for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);

        const { error } = await client
            .from('water_daily_consumption')
            .upsert(batch, {
                onConflict: 'account_number,month,year',
                ignoreDuplicates: false
            });

        if (error) {
            // If the error is about missing unique constraint, signal fallback
            if (error.message.includes('unique') ||
                error.message.includes('constraint') ||
                error.message.includes('ON CONFLICT') ||
                error.code === '42P10') {
                console.warn('[CSV Import] Upsert constraint error:', error.message);
                return null; // Signal to use fallback
            }
            errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
        } else {
            imported += batch.length;
        }
    }

    return imported;
}

/**
 * Fallback import: delete existing records for the same account/month/year, then insert.
 * Used when the table doesn't have the required unique constraint for upsert.
 */
async function fallbackDeleteInsert(
    client: ReturnType<typeof getSupabaseClient>,
    records: Record<string, unknown>[],
    rows: CSVWaterConsumptionRow[],
    errors: string[]
): Promise<number> {
    if (!client) return 0;

    let imported = 0;

    // Group rows by month/year for efficient deletion
    const monthYearGroups = new Map<string, Set<string>>();
    for (const row of rows) {
        const key = `${row.month}|${row.year}`;
        if (!monthYearGroups.has(key)) {
            monthYearGroups.set(key, new Set());
        }
        monthYearGroups.get(key)!.add(row.accountNumber);
    }

    // Delete existing records for these account/month/year combinations
    for (const [key, accountNumbers] of monthYearGroups.entries()) {
        const [month, yearStr] = key.split('|');
        const year = parseInt(yearStr, 10);

        const { error: deleteError } = await client
            .from('water_daily_consumption')
            .delete()
            .eq('month', month)
            .eq('year', year)
            .in('account_number', Array.from(accountNumbers));

        if (deleteError) {
            errors.push(`Delete error for ${month}: ${deleteError.message}`);
        }
    }

    // Insert all records in batches
    const batchSize = 50;
    for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);

        const { error } = await client
            .from('water_daily_consumption')
            .insert(batch);

        if (error) {
            errors.push(`Insert batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
        } else {
            imported += batch.length;
        }
    }

    return imported;
}

// =============================================================================
// WATER LOSS DAILY COMPUTATION
// =============================================================================

/**
 * Zone code mapping from Water System format (CSV) to display format (water_loss_daily table).
 * The water_loss_daily table uses display names like "Zone FM", while the
 * Water System / CSV uses codes like "Zone_01_(FM)".
 */
const ZONE_CODE_TO_DISPLAY: Record<string, string> = {
    'zone_01_(fm)': 'Zone FM',
    'zone_03_(a)': 'Zone 3A',
    'zone_03_(b)': 'Zone 3B',
    'zone_05': 'Zone 5',
    'zone_08': 'Zone 08',
    'zone_vs': 'Village Square',
    'zone_sc': 'Sales Center',
};

/**
 * Convert a month string like "Jan-26" + day number to a date string "2026-01-01"
 */
function buildDateString(month: string, year: number, day: number): string {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthPrefix = month.split('-')[0];
    const monthNum = monthNames.indexOf(monthPrefix) + 1;
    return `${year}-${monthNum.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}

/**
 * Resolve a zone string from CSV data to the display format used in water_loss_daily.
 * Handles both the code format (Zone_01_(FM)) and direct display format (Zone FM).
 */
function resolveZoneDisplay(zone: string): string | null {
    if (!zone) return null;
    const lower = zone.toLowerCase().trim();

    // Direct lookup from code format
    const mapped = ZONE_CODE_TO_DISPLAY[lower];
    if (mapped) return mapped;

    // Check if it's already in display format
    const displayValues = Object.values(ZONE_CODE_TO_DISPLAY);
    const existing = displayValues.find(v => v.toLowerCase() === lower);
    if (existing) return existing;

    return null;
}

/**
 * Compute and upsert water_loss_daily records from imported consumption data.
 *
 * After CSV data is imported into water_daily_consumption, the zone analysis
 * (progress rings, chart) in DailyWaterReport reads from the water_loss_daily table.
 * This function aggregates the imported meter data by zone and day to produce
 * the L2 bulk total, L3/L4 individual total, and loss calculations,
 * then upserts them into water_loss_daily.
 *
 * @param rows - The validated CSV rows that were imported
 * @param month - Month identifier (e.g., "Jan-26")
 * @param year - Year (e.g., 2026)
 * @returns Number of records upserted and any errors
 */
async function computeAndUpdateWaterLossDaily(
    rows: CSVWaterConsumptionRow[],
    month: string,
    year: number
): Promise<{ upserted: number; errors: string[] }> {
    const client = getSupabaseClient();
    if (!client) {
        return { upserted: 0, errors: ['Supabase client not configured'] };
    }

    const errors: string[] = [];

    // Group rows by display zone
    const zoneGroups = new Map<string, CSVWaterConsumptionRow[]>();
    for (const row of rows) {
        const displayZone = resolveZoneDisplay(row.zone || '');
        if (!displayZone) continue; // Skip rows with unknown zone

        if (!zoneGroups.has(displayZone)) {
            zoneGroups.set(displayZone, []);
        }
        zoneGroups.get(displayZone)!.push(row);
    }

    if (zoneGroups.size === 0) {
        console.log('[Water Loss] No zone-mapped rows found, skipping water_loss_daily update');
        return { upserted: 0, errors: [] };
    }

    // Find the max day with data across all rows
    let maxDay = 0;
    for (const row of rows) {
        for (let d = 1; d <= 31; d++) {
            if (row.dailyReadings[d] !== null && row.dailyReadings[d] !== undefined) {
                if (d > maxDay) maxDay = d;
            }
        }
    }

    if (maxDay === 0) {
        console.log('[Water Loss] No daily readings found, skipping water_loss_daily update');
        return { upserted: 0, errors: [] };
    }

    // Build water_loss_daily records
    const records: Record<string, unknown>[] = [];

    for (const [displayZone, zoneRows] of zoneGroups.entries()) {
        // Separate L2 (bulk) meters from L3/L4 (individual) meters
        // row.label holds the level: "L2", "L3", "L4", etc.
        const l2Rows = zoneRows.filter(r => (r.label || '').toUpperCase() === 'L2');
        const individualRows = zoneRows.filter(r => {
            const level = (r.label || '').toUpperCase();
            return level !== 'L2' && level !== 'L1'; // L3, L4, DC, etc.
        });

        for (let day = 1; day <= maxDay; day++) {
            // Sum L2 bulk meter readings for this day
            let l2Total = 0;
            let hasL2Data = false;
            for (const r of l2Rows) {
                const val = r.dailyReadings[day];
                if (val !== null && val !== undefined) {
                    l2Total += val;
                    hasL2Data = true;
                }
            }

            // Sum L3/L4 individual meter readings for this day
            let l3Total = 0;
            let hasL3Data = false;
            for (const r of individualRows) {
                const val = r.dailyReadings[day];
                if (val !== null && val !== undefined) {
                    l3Total += val;
                    hasL3Data = true;
                }
            }

            // Only create a record if we have some data for this day
            if (!hasL2Data && !hasL3Data) continue;

            const lossM3 = l2Total - l3Total;
            const lossPercent = l2Total > 0 ? (lossM3 / l2Total) * 100 : 0;
            const dateStr = buildDateString(month, year, day);

            records.push({
                zone: displayZone,
                day,
                date: dateStr,
                l2_total_m3: Math.round(l2Total * 100) / 100,
                l3_total_m3: Math.round(l3Total * 100) / 100,
                loss_m3: Math.round(lossM3 * 100) / 100,
                loss_percent: Math.round(lossPercent * 100) / 100,
                month,
                year,
            });
        }
    }

    if (records.length === 0) {
        console.log('[Water Loss] No loss records to insert');
        return { upserted: 0, errors: [] };
    }

    console.log(`[Water Loss] Upserting ${records.length} water_loss_daily records for ${zoneGroups.size} zones, days 1-${maxDay}`);

    // Upsert in batches
    let upserted = 0;
    const batchSize = 50;

    for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);

        const { error } = await client
            .from('water_loss_daily')
            .upsert(batch, {
                onConflict: 'zone,day,month,year',
                ignoreDuplicates: false
            });

        if (error) {
            console.error(`[Water Loss] Batch upsert error:`, error.message);
            errors.push(`Water loss daily batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
        } else {
            upserted += batch.length;
        }
    }

    console.log(`[Water Loss] Upserted ${upserted}/${records.length} water_loss_daily records`);
    return { upserted, errors };
}

/**
 * Complete CSV import workflow
 * @param file - CSV file to import
 * @param month - Target month (e.g., "Jan-26")
 * @param year - Target year (e.g., 2026)
 * @returns Full import result
 */
export async function processCSVUpload(
    file: File,
    month: string,
    year: number
): Promise<ImportResult> {
    const result: ImportResult = {
        success: false,
        imported: 0,
        skipped: 0,
        errors: []
    };

    try {
        // Step 1: Upload to storage
        console.log('[CSV Upload] Step 1: Uploading to storage...');
        const storagePath = await uploadCSVToStorage(file, month, year);
        if (storagePath) {
            result.storagePath = storagePath;
        }

        // Step 2: Read and parse CSV content
        console.log('[CSV Upload] Step 2: Parsing CSV content...');
        const csvContent = await file.text();
        const parsedRows = parseCSV(csvContent, month, year);

        if (parsedRows.length === 0) {
            result.errors.push('No valid data rows found in CSV. Ensure the file has a header row with an account column ("Acct #", "account_number", or "meter_name") and day columns ("Day 1"..."Day 31", "day_1"..."day_31", or "1"..."31").');
            return result;
        }

        console.log(`[CSV Upload] Parsed ${parsedRows.length} rows from CSV`);

        // Step 3: Filter to only configured meters
        console.log('[CSV Upload] Step 3: Filtering by configured meters...');
        const { validRows, skippedCount } = await filterMetersByConfiguration(parsedRows);
        result.skipped = skippedCount;

        if (validRows.length === 0) {
            result.errors.push(`No matching meters found. ${parsedRows.length} rows were parsed but none matched the Water System configuration. Check that account numbers or meter names in the CSV match the configured meters.`);
            return result;
        }

        // Step 4: Import to database
        console.log('[CSV Upload] Step 4: Importing to database...');
        const { imported, errors } = await importWaterConsumptionData(validRows);
        result.imported = imported;
        result.errors.push(...errors);

        // Step 5: Compute and update water_loss_daily (zone analysis)
        if (imported > 0) {
            console.log('[CSV Upload] Step 5: Computing water loss daily data...');
            const lossResult = await computeAndUpdateWaterLossDaily(validRows, month, year);
            if (lossResult.errors.length > 0) {
                result.errors.push(...lossResult.errors);
            }
            if (lossResult.upserted > 0) {
                console.log(`[CSV Upload] Water loss daily: ${lossResult.upserted} zone-day records updated`);
            }
        }

        result.success = imported > 0;
        console.log(`[CSV Upload] Complete! Imported: ${imported}, Skipped: ${skippedCount}`);

    } catch (err) {
        result.errors.push(`Processing error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }

    return result;
}
