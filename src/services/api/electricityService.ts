
import { airtableApi } from './apiClient';
import { toast } from 'sonner';

// Constants for API configuration
export const ELECTRICITY_TABLE_ID = 'MB-Electrical';
export const AIRTABLE_BASE_ID = 'appXc7nHxnpVdoBxn';

// Interface for filter parameters
interface FetchElectricityParams {
  maxRecords?: number;
  view?: string;
  filterByFormula?: string;
  sort?: Array<{ field: string; direction: 'asc' | 'desc' }>;
}

// Main function to fetch electricity data
export const fetchElectricityData = async <T>(params: FetchElectricityParams = {}) => {
  try {
    const endpoint = `${AIRTABLE_BASE_ID}/${ELECTRICITY_TABLE_ID}`;
    
    // Construct query parameters
    const queryParams: Record<string, string> = {};
    
    if (params.maxRecords) {
      queryParams.maxRecords = params.maxRecords.toString();
    }
    
    if (params.view) {
      queryParams.view = params.view;
    }
    
    if (params.filterByFormula) {
      queryParams.filterByFormula = params.filterByFormula;
    }
    
    if (params.sort && params.sort.length > 0) {
      const sortParam = params.sort.map(item => 
        `{${item.field}}%20${item.direction}`
      ).join(',');
      queryParams.sort = sortParam;
    }
    
    // Make the API request with the configured parameters
    const response = await airtableApi.get<{ records: Array<{ id: string; fields: T }> }>(
      endpoint,
      queryParams
    );
    
    if (response.error) {
      throw new Error(response.error.message);
    }
    
    // Transform the response to a more usable format
    const formattedData = response.data?.records.map(record => ({
      id: record.id,
      ...record.fields
    })) || [];
    
    return formattedData;
  } catch (error) {
    console.error('Error fetching electricity data:', error);
    toast.error(`Failed to fetch electricity data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
};

// Function to refresh electricity views in the database
export const refreshElectricityViews = async () => {
  try {
    const response = await airtableApi.post('rpc/refresh_electricity_views');
    
    if (response.error) {
      throw new Error(response.error.message);
    }
    
    return true;
  } catch (error) {
    console.error('Error refreshing electricity views:', error);
    toast.error(`Failed to refresh electricity views: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
};

// Function to fetch a small subset of data (useful for checking connectivity)
export const checkElectricityDataConnection = async () => {
  return fetchElectricityData({ maxRecords: 1 });
};
