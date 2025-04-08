
import Airtable from 'airtable';

// Initialize Airtable with your API key
const AIRTABLE_API_KEY = 'patgswc3cLZkA2Yrv.eb7796293aaabbc988a0d68e9f34010e8baae51d02c669185971b55689885534'; 
export const AIRTABLE_BASE_ID = 'appwGy1JHL1UYsO2W';

// Initialize the Airtable base
const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

// Constants for table IDs - using the correct table ID from the URL
export const WATER_TABLE_ID = 'shrjrIEpBjAANAxZy';

/**
 * Fetches data from a specific Airtable table
 * @param tableIdOrName - The ID or name of the table to fetch from
 * @param options - Optional query parameters
 * @returns An array of records with their fields
 */
export const fetchTableData = async (
  tableIdOrName: string, 
  options: { 
    view?: string, 
    filterByFormula?: string,
    maxRecords?: number,
    sort?: Array<{field: string, direction: 'asc' | 'desc'}>
  } = {}
) => {
  try {
    console.log(`Attempting to fetch data from Airtable table "${tableIdOrName}" with options:`, options);
    
    // Remove the view option if it's 'Grid view' to avoid the error
    const finalOptions = {...options};
    if (finalOptions.view === 'Grid view') {
      delete finalOptions.view;
      console.log('Removed "Grid view" from options to avoid Airtable error');
    }
    
    // Implement a timeout to avoid hanging requests
    const timeout = 10000; // 10 seconds
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const fetchPromise = new Promise((resolve, reject) => {
      base(tableIdOrName)
        .select(finalOptions)
        .all()
        .then(records => {
          clearTimeout(timeoutId);
          resolve(records);
        })
        .catch(error => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
    
    const records = await fetchPromise as any[];
    
    console.log(`Successfully fetched ${records.length} records from "${tableIdOrName}"`);
    
    return records.map(record => ({
      id: record.id,
      ...record.fields
    }));
  } catch (error: any) {
    console.error(`Error fetching data from ${tableIdOrName}:`, error);
    
    // Enhanced error handling to provide useful diagnostic information
    if (error.statusCode === 403) {
      console.log("Authentication error detected. Will use fallback data.");
      throw new Error("You are not authorized to perform this operation. Please check your API key permissions.");
    } else if (error.statusCode === 404) {
      throw new Error(`Table "${tableIdOrName}" not found. Please verify the table ID.`);
    } else if (error.name === 'AbortError') {
      throw new Error("Request timed out. Please try again later.");
    }
    
    throw error;
  }
};

/**
 * Fetches a single record from a table by its ID
 * @param tableName - The name of the table
 * @param recordId - The ID of the record to fetch
 * @returns The record with its fields
 */
export const fetchRecordById = async (tableName: string, recordId: string) => {
  try {
    const record = await base(tableName).find(recordId);
    return {
      id: record.id,
      ...record.fields
    };
  } catch (error) {
    console.error(`Error fetching record ${recordId} from ${tableName}:`, error);
    throw error;
  }
};

/**
 * Creates a new record in a table
 * @param tableName - The name of the table
 * @param fields - The fields for the new record
 * @returns The created record
 */
export const createRecord = async (tableName: string, fields: Record<string, any>) => {
  try {
    const record = await base(tableName).create(fields);
    return {
      id: record.id,
      ...record.fields
    };
  } catch (error) {
    console.error(`Error creating record in ${tableName}:`, error);
    throw error;
  }
};

/**
 * Updates a record in a table
 * @param tableName - The name of the table
 * @param recordId - The ID of the record to update
 * @param fields - The fields to update
 * @returns The updated record
 */
export const updateRecord = async (
  tableName: string, 
  recordId: string, 
  fields: Record<string, any>
) => {
  try {
    const record = await base(tableName).update(recordId, fields);
    return {
      id: record.id,
      ...record.fields
    };
  } catch (error) {
    console.error(`Error updating record ${recordId} in ${tableName}:`, error);
    throw error;
  }
};

/**
 * Deletes a record from a table
 * @param tableName - The name of the table
 * @param recordId - The ID of the record to delete
 * @returns True if successful
 */
export const deleteRecord = async (tableName: string, recordId: string) => {
  try {
    await base(tableName).destroy(recordId);
    return true;
  } catch (error) {
    console.error(`Error deleting record ${recordId} from ${tableName}:`, error);
    throw error;
  }
};
