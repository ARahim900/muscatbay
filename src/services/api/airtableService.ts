
import { airtableApi } from './apiClient';
import { toast } from 'sonner';

// Airtable base ID
export const AIRTABLE_BASE_ID = 'appwGy1JHL1UYsO2W';

// Constants for table IDs
export const WATER_TABLE_ID = 'shrjrIEpBjAANAxZy';
export const ELECTRICITY_TABLE_ID = 'shrpAtmnZhxfZ87Ue';

interface AirtableListRecordsOptions {
  view?: string;
  filterByFormula?: string;
  maxRecords?: number;
  sort?: Array<{field: string, direction: 'asc' | 'desc'}>;
}

// Define types for Airtable responses
interface AirtableRecord {
  id: string;
  fields: Record<string, any>;
}

interface AirtableResponse {
  records: AirtableRecord[];
}

/**
 * Fetches data from a specific Airtable table
 * @param tableIdOrName - The ID or name of the table to fetch from
 * @param options - Optional query parameters
 * @returns An array of records with their fields
 */
export const fetchTableData = async (
  tableIdOrName: string,
  options: AirtableListRecordsOptions = {}
) => {
  try {
    console.log(`Attempting to fetch data from Airtable table "${tableIdOrName}" with options:`, options);
    
    // Remove the view option if it's 'Grid view' to avoid the error
    const finalOptions = {...options};
    if (finalOptions.view === 'Grid view') {
      delete finalOptions.view;
      console.log('Removed "Grid view" from options to avoid Airtable error');
    }
    
    // Construct the Airtable endpoint
    const endpoint = `${AIRTABLE_BASE_ID}/${tableIdOrName}`;
    
    // Convert options to Airtable API parameters
    const params: Record<string, string> = {};
    
    if (finalOptions.view) params.view = finalOptions.view;
    if (finalOptions.filterByFormula) params.filterByFormula = finalOptions.filterByFormula;
    if (finalOptions.maxRecords) params.maxRecords = finalOptions.maxRecords.toString();
    
    if (finalOptions.sort && finalOptions.sort.length > 0) {
      params.sort = JSON.stringify(finalOptions.sort.map(s => ({
        field: s.field,
        direction: s.direction
      })));
    }
    
    // Make the API request
    const response = await airtableApi.get<AirtableResponse>(endpoint, params, {
      useCache: true,
      cacheTTL: 600, // Cache for 10 minutes
      version: 'v0' // Airtable API is v0
    });
    
    if (response.error) {
      throw response.error;
    }
    
    // Extract records from the Airtable response format
    const records = response.data?.records || [];
    
    console.log(`Successfully fetched ${records.length} records from "${tableIdOrName}"`);
    
    return records.map(record => ({
      id: record.id,
      ...record.fields
    }));
  } catch (error: any) {
    console.error(`Error fetching data from ${tableIdOrName}:`, error);
    
    // Enhanced error handling to provide useful diagnostic information
    let errorMessage = 'An unknown error occurred';
    
    if (error.statusCode === 403) {
      errorMessage = "You are not authorized to perform this operation. Please check your API key permissions.";
    } else if (error.statusCode === 404) {
      errorMessage = `Table "${tableIdOrName}" not found. Please verify the table ID.`;
    } else if (error.name === 'AbortError') {
      errorMessage = "Request timed out. Please try again later.";
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    toast.error(`Failed to fetch data: ${errorMessage}`);
    throw new Error(errorMessage);
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
    const endpoint = `${AIRTABLE_BASE_ID}/${tableName}/${recordId}`;
    
    const response = await airtableApi.get<AirtableRecord>(endpoint, {}, {
      version: 'v0' // Airtable API is v0
    });
    
    if (response.error) {
      throw response.error;
    }
    
    if (!response.data) {
      throw new Error('No record found');
    }
    
    return {
      id: response.data.id,
      ...response.data.fields
    };
  } catch (error) {
    console.error(`Error fetching record ${recordId} from ${tableName}:`, error);
    toast.error(`Could not fetch record: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    const endpoint = `${AIRTABLE_BASE_ID}/${tableName}`;
    
    const response = await airtableApi.post<{records: AirtableRecord[]}>(endpoint, {
      records: [{ fields }]
    }, {
      version: 'v0' // Airtable API is v0
    });
    
    if (response.error) {
      throw response.error;
    }
    
    if (!response.data || !response.data.records || response.data.records.length === 0) {
      throw new Error('No record was created');
    }
    
    const record = response.data.records[0];
    
    return {
      id: record.id,
      ...record.fields
    };
  } catch (error) {
    console.error(`Error creating record in ${tableName}:`, error);
    toast.error(`Could not create record: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    const endpoint = `${AIRTABLE_BASE_ID}/${tableName}`;
    
    const response = await airtableApi.patch<{records: AirtableRecord[]}>(endpoint, {
      records: [{ 
        id: recordId,
        fields 
      }]
    }, {
      version: 'v0' // Airtable API is v0
    });
    
    if (response.error) {
      throw response.error;
    }
    
    if (!response.data || !response.data.records || response.data.records.length === 0) {
      throw new Error('No record was updated');
    }
    
    const record = response.data.records[0];
    
    return {
      id: record.id,
      ...record.fields
    };
  } catch (error) {
    console.error(`Error updating record ${recordId} in ${tableName}:`, error);
    toast.error(`Could not update record: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    const endpoint = `${AIRTABLE_BASE_ID}/${tableName}/${recordId}`;
    
    const response = await airtableApi.delete(endpoint, {
      version: 'v0' // Airtable API is v0
    });
    
    if (response.error) {
      throw response.error;
    }
    
    return true;
  } catch (error) {
    console.error(`Error deleting record ${recordId} from ${tableName}:`, error);
    toast.error(`Could not delete record: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
};
