
/**
 * Data update utility for Muscat Bay operations web application
 * 
 * This utility provides functions for updating JSON data in the database folder
 * Note: This is a client-side utility that would typically be part of a build process
 * or admin tool. In a production environment, you would use a backend API to update data.
 */
import { updateData } from '@/services/dataService';

/**
 * Updates data in a JSON file
 * @param dataType Type of data to update (electricity, water, stp, assets, etc.)
 * @param fileName Filename to update without path or extension
 * @param newData New data to write
 * @returns Promise with the success status
 */
export async function updateDatabaseFile<T>(
  dataType: 'electricity' | 'water' | 'stp' | 'assets' | 'property' | 'expenses',
  fileName: string,
  newData: T
): Promise<{ success: boolean; message?: string }> {
  try {
    const path = `${dataType}/${fileName}.json`;
    
    // Create metadata for the update
    const metadata = {
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      description: `${dataType} data updated by dataUpdater utility`,
    };
    
    // Combine metadata and data
    const fileData = {
      metadata,
      data: newData
    };
    
    // Use the dataService to update the file
    return await updateData(path, fileData);
  } catch (error) {
    console.error(`Error updating ${dataType}/${fileName}.json:`, error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

/**
 * Parse CSV data from clipboard
 * @param csvData CSV data string (optional - if omitted, will try to read from clipboard)
 * @param onSuccess Callback function on successful parsing
 * @param onError Callback function on parsing error
 */
export async function parseCSVFromClipboard<T>(
  csvData?: string,
  onSuccess?: (data: T[]) => void,
  onError?: (error: string) => void
): Promise<T[] | undefined> {
  try {
    // Get data from clipboard if not provided
    const data = csvData || await readFromClipboard();
    
    if (!data) {
      onError?.('No data found in clipboard');
      return;
    }
    
    // Split into rows and parse
    const rows = data.trim().split('\n');
    const headers = rows[0].split(',').map(h => h.trim());
    
    const parsedData = rows.slice(1).map(row => {
      const values = row.split(',').map(v => v.trim());
      const rowData: Record<string, string | number> = {};
      
      headers.forEach((header, i) => {
        // Try to convert numeric values
        const value = values[i];
        const numericValue = parseFloat(value);
        rowData[header] = isNaN(numericValue) ? value : numericValue;
      });
      
      return rowData as unknown as T;
    });
    
    if (onSuccess) {
      onSuccess(parsedData);
    }
    
    return parsedData;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error parsing CSV data';
    console.error('Error parsing CSV data:', error);
    
    if (onError) {
      onError(errorMessage);
    }
    
    return undefined;
  }
}

/**
 * Read text from clipboard
 * @returns Promise with clipboard text
 */
async function readFromClipboard(): Promise<string> {
  try {
    return await navigator.clipboard.readText();
  } catch (error) {
    console.error('Failed to read clipboard contents:', error);
    throw new Error('Failed to access clipboard. Please check permissions or paste data directly.');
  }
}

/**
 * Validate data structure against a schema
 * @param data Data to validate
 * @param schema Schema to validate against
 * @returns Validation result
 */
export function validateData<T>(
  data: unknown,
  schema: Record<string, { type: string; required: boolean }>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Data must be an object'] };
  }
  
  // Validate each field against the schema
  Object.entries(schema).forEach(([field, rules]) => {
    const value = (data as Record<string, unknown>)[field];
    
    // Check required fields
    if (rules.required && (value === undefined || value === null)) {
      errors.push(`Missing required field: ${field}`);
      return;
    }
    
    // Skip type validation for undefined optional fields
    if (value === undefined) {
      return;
    }
    
    // Check type
    const actualType = Array.isArray(value) ? 'array' : typeof value;
    if (actualType !== rules.type) {
      errors.push(`Field ${field} should be of type ${rules.type}, but got ${actualType}`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
}
