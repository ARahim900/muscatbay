
import Airtable from 'airtable';

// Initialize Airtable with your API key
const AIRTABLE_API_KEY = 'pat2zFuAV14DXXGNQ.c4c7a6d62fe4c1f48008245b18c93bbdebc9d408bcb1c44543896b508bca5775'; 
export const AIRTABLE_BASE_ID = 'appbUreNO4vvslMme';

// Initialize the Airtable base
const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

// Constants for table IDs - using the correct table ID from the URL
export const WATER_TABLE_ID = 'tblR7Yq40GnRh8esd';

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
    
    const records = await base(tableIdOrName)
      .select(finalOptions)
      .all();
    
    console.log(`Successfully fetched ${records.length} records from "${tableIdOrName}"`);
    
    return records.map(record => ({
      id: record.id,
      ...record.fields
    }));
  } catch (error) {
    console.error(`Error fetching data from ${tableIdOrName}:`, error);
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
