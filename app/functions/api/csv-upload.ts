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
    const parentMeterIdx = findColumnIndex(headerLower, ['parent_meter', 'parentmeter', 'parent']);
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
 * Filter CSV rows to only include meters that are configured in the system
 * @param rows - Parsed CSV rows
 * @returns Object with filtered rows and skip count
 */
export async function filterMetersByConfiguration(
    rows: CSVWaterConsumptionRow[]
): Promise<{ validRows: CSVWaterConsumptionRow[]; skippedCount: number }> {
    // Get all configured meters from database
    const configuredMeters = await getWaterMetersFromSupabase();

    // Create sets of valid identifiers
    const validAccountNumbers = new Set(
        configuredMeters.map(m => m.accountNumber?.toLowerCase().trim()).filter(Boolean)
    );
    const validMeterNames = new Set(
        configuredMeters.map(m => m.label?.toLowerCase().trim()).filter(Boolean)
    );

    const validRows: CSVWaterConsumptionRow[] = [];
    let skippedCount = 0;

    for (const row of rows) {
        const accountLower = row.accountNumber?.toLowerCase().trim();
        const nameLower = row.meterName?.toLowerCase().trim();

        // Check if meter is in our configured list
        const isValid =
            (accountLower && validAccountNumbers.has(accountLower)) ||
            (nameLower && validMeterNames.has(nameLower));

        if (isValid) {
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
            meter_name: row.meterName,
            account_number: row.accountNumber,
            month: row.month,
            year: row.year,
        };

        // Only include metadata fields if CSV provided non-empty values
        // This prevents overwriting existing data with null
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

        result.success = imported > 0;
        console.log(`[CSV Upload] Complete! Imported: ${imported}, Skipped: ${skippedCount}`);

    } catch (err) {
        result.errors.push(`Processing error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }

    return result;
}
