
import { supabase } from '@/integrations/supabase/client';

// Define the interface for electrical consumption data
export interface ElectricityData {
  id?: number;
  name: string;
  account: string;
  type: string;
  zone?: string;
  jan_24?: number;
  feb_24?: number;
  mar_24?: number;
  apr_24?: number;
  may_24?: number;
  jun_24?: number;
  jul_24?: number;
  aug_24?: number;
  sep_24?: number;
  oct_24?: number;
  nov_24?: number;
  dec_24?: number;
  total_24?: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * Fetches all electricity data from Supabase
 */
export const fetchElectricityData = async (): Promise<{ data: ElectricityData[] | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('MB-Electrical')
      .select('*');
    
    if (error) {
      console.error("Error fetching electricity data:", error);
      return { data: null, error: error.message };
    }
    
    // Transform the data to match our interface
    const transformedData: ElectricityData[] = data.map(item => ({
      name: item['Muscat Bay Number'] || '',
      account: item['Electrical Meter Account No'] || '',
      type: item['Type'] || '',
      zone: item['Zone'] || '',
      apr_24: parseFloat(item['April-24'] || '0'),
      may_24: parseFloat(item['May-24'] || '0'),
      jun_24: parseFloat(item['June-24'] || '0'),
      jul_24: parseFloat(item['July-24'] || '0'),
      aug_24: parseFloat(item['August-24'] || '0'),
      sep_24: parseFloat(item['September-24'] || '0'),
      oct_24: parseFloat(item['October-24'] || '0'),
      nov_24: parseFloat(item['November-24'] || '0'),
      dec_24: parseFloat(item['December-24'] || '0'),
      jan_24: parseFloat(item['January-25'] || '0'),
      feb_24: parseFloat(item['February-25'] || '0')
    }));
    
    // Calculate the totals
    transformedData.forEach(item => {
      item.total_24 = [
        'jan_24', 'feb_24', 'mar_24', 'apr_24', 'may_24', 'jun_24',
        'jul_24', 'aug_24', 'sep_24', 'oct_24', 'nov_24', 'dec_24'
      ].reduce((sum, month) => sum + (item[month as keyof ElectricityData] as number || 0), 0);
    });
    
    return { data: transformedData, error: null };
  } catch (error) {
    console.error("Error fetching electricity data:", error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : "Unknown error occurred" 
    };
  }
};

/**
 * Fetches electricity data by type
 */
export const fetchElectricityDataByType = async (type: string): Promise<{ data: ElectricityData[] | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('MB-Electrical')
      .select('*')
      .eq('Type', type);
    
    if (error) {
      console.error(`Error fetching electricity data for type ${type}:`, error);
      return { data: null, error: error.message };
    }
    
    // Transform the data to match our interface
    const transformedData: ElectricityData[] = data.map(item => ({
      name: item['Muscat Bay Number'] || '',
      account: item['Electrical Meter Account No'] || '',
      type: item['Type'] || '',
      zone: item['Zone'] || '',
      apr_24: parseFloat(item['April-24'] || '0'),
      may_24: parseFloat(item['May-24'] || '0'),
      jun_24: parseFloat(item['June-24'] || '0'),
      jul_24: parseFloat(item['July-24'] || '0'),
      aug_24: parseFloat(item['August-24'] || '0'),
      sep_24: parseFloat(item['September-24'] || '0'),
      oct_24: parseFloat(item['October-24'] || '0'),
      nov_24: parseFloat(item['November-24'] || '0'),
      dec_24: parseFloat(item['December-24'] || '0'),
      jan_24: parseFloat(item['January-25'] || '0'),
      feb_24: parseFloat(item['February-25'] || '0')
    }));
    
    // Calculate the totals
    transformedData.forEach(item => {
      item.total_24 = [
        'jan_24', 'feb_24', 'mar_24', 'apr_24', 'may_24', 'jun_24',
        'jul_24', 'aug_24', 'sep_24', 'oct_24', 'nov_24', 'dec_24'
      ].reduce((sum, month) => sum + (item[month as keyof ElectricityData] as number || 0), 0);
    });
    
    return { data: transformedData, error: null };
  } catch (error) {
    console.error(`Error fetching electricity data for type ${type}:`, error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : "Unknown error occurred" 
    };
  }
};

/**
 * Fetches electricity data by zone
 */
export const fetchElectricityDataByZone = async (zone: string): Promise<{ data: ElectricityData[] | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('MB-Electrical')
      .select('*')
      .eq('Zone', zone);
    
    if (error) {
      console.error(`Error fetching electricity data for zone ${zone}:`, error);
      return { data: null, error: error.message };
    }
    
    // Transform the data to match our interface
    const transformedData: ElectricityData[] = data.map(item => ({
      name: item['Muscat Bay Number'] || '',
      account: item['Electrical Meter Account No'] || '',
      type: item['Type'] || '',
      zone: item['Zone'] || '',
      apr_24: parseFloat(item['April-24'] || '0'),
      may_24: parseFloat(item['May-24'] || '0'),
      jun_24: parseFloat(item['June-24'] || '0'),
      jul_24: parseFloat(item['July-24'] || '0'),
      aug_24: parseFloat(item['August-24'] || '0'),
      sep_24: parseFloat(item['September-24'] || '0'),
      oct_24: parseFloat(item['October-24'] || '0'),
      nov_24: parseFloat(item['November-24'] || '0'),
      dec_24: parseFloat(item['December-24'] || '0'),
      jan_24: parseFloat(item['January-25'] || '0'),
      feb_24: parseFloat(item['February-25'] || '0')
    }));
    
    // Calculate the totals
    transformedData.forEach(item => {
      item.total_24 = [
        'jan_24', 'feb_24', 'mar_24', 'apr_24', 'may_24', 'jun_24',
        'jul_24', 'aug_24', 'sep_24', 'oct_24', 'nov_24', 'dec_24'
      ].reduce((sum, month) => sum + (item[month as keyof ElectricityData] as number || 0), 0);
    });
    
    return { data: transformedData, error: null };
  } catch (error) {
    console.error(`Error fetching electricity data for zone ${zone}:`, error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : "Unknown error occurred" 
    };
  }
};

/**
 * Updates electricity data for a specific account
 */
export const updateElectricityData = async (
  account: string,
  updates: Partial<ElectricityData>
): Promise<{ success: boolean; message: string }> => {
  try {
    // Convert our interface back to the database structure
    const dbUpdates: any = {};
    
    if (updates.name) dbUpdates['Muscat Bay Number'] = updates.name;
    if (updates.type) dbUpdates['Type'] = updates.type;
    if (updates.zone) dbUpdates['Zone'] = updates.zone;
    if (updates.apr_24 !== undefined) dbUpdates['April-24'] = updates.apr_24.toString();
    if (updates.may_24 !== undefined) dbUpdates['May-24'] = updates.may_24.toString();
    if (updates.jun_24 !== undefined) dbUpdates['June-24'] = updates.jun_24.toString();
    if (updates.jul_24 !== undefined) dbUpdates['July-24'] = updates.jul_24.toString();
    if (updates.aug_24 !== undefined) dbUpdates['August-24'] = updates.aug_24.toString();
    if (updates.sep_24 !== undefined) dbUpdates['September-24'] = updates.sep_24.toString();
    if (updates.oct_24 !== undefined) dbUpdates['October-24'] = updates.oct_24.toString();
    if (updates.nov_24 !== undefined) dbUpdates['November-24'] = updates.nov_24.toString();
    if (updates.dec_24 !== undefined) dbUpdates['December-24'] = updates.dec_24.toString();
    if (updates.jan_24 !== undefined) dbUpdates['January-25'] = updates.jan_24.toString();
    if (updates.feb_24 !== undefined) dbUpdates['February-25'] = updates.feb_24.toString();
    
    const { error } = await supabase
      .from('MB-Electrical')
      .update(dbUpdates)
      .eq('Electrical Meter Account No', account);
    
    if (error) {
      console.error("Error updating electricity data:", error);
      return { 
        success: false, 
        message: "Failed to update electricity data: " + error.message
      };
    }
    
    return { 
      success: true, 
      message: "Electricity data updated successfully."
    };
  } catch (error) {
    console.error("Error updating electricity data:", error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
};
