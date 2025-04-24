
import { supabase } from '@/integrations/supabase/client';
import { WaterData } from '@/types/water';
import { parse } from 'date-fns';

export const parseCSVFromClipboard = async (
  clipboardData: string | undefined,
  onSuccess: (transformedData: WaterData[]) => void,
  onError: (errorMessage: string) => void
) => {
  try {
    const text = clipboardData || await navigator.clipboard.readText();
    const lines = text.split('\n');
    const headers = lines[0].split(',').map(header => header.trim());
    
    const data = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(value => value.trim());
      if (values.length !== headers.length) continue;
      
      const item: any = {};
      for (let j = 0; j < headers.length; j++) {
        item[headers[j]] = values[j];
      }
      data.push(item);
    }
    
    const transformedData = data.map(row => {
      // Create an object that matches the WaterData structure
      const waterDataEntry: WaterData = {
        meter_label: row['Meter Label'] || row['Meter_Label'] || row['MeterLabel'] || 'N/A',
        account_number: row['Acct #'] || row['Acct#'] || row['AccountNumber'] || 'N/A',
        zone: row['Zone'] || 'N/A',
        type: row['Type'] || 'N/A',
        parent_meter: row['Parent Meter'] || row['ParentMeter'] || '',
        jan_24: 0,
        feb_24: 0,
        mar_24: 0,
        apr_24: 0,
        may_24: 0,
        jun_24: 0,
        jul_24: 0,
        aug_24: 0,
        sep_24: 0,
        oct_24: 0,
        nov_24: 0,
        dec_24: 0,
        jan_25: 0,
        feb_25: 0,
        mar_25: 0,
        total: 0
      };
      
      // Populate the monthly readings
      headers.forEach(header => {
        if (header.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i)) {
          const match = header.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-(\d{2})$/i);
          if (match) {
            const month = match[1].toLowerCase();
            const year = match[2];
            const fieldName = `${month}_${year}` as keyof WaterData;
            
            if (fieldName in waterDataEntry && row[header]) {
              (waterDataEntry as any)[fieldName] = parseFloat(row[header]) || 0;
            }
          }
        }
      });
      
      // Calculate total
      waterDataEntry.total = Object.keys(waterDataEntry)
        .filter(key => key.match(/^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)_\d{2}$/))
        .reduce((sum, key) => sum + ((waterDataEntry as any)[key] || 0), 0);
      
      return waterDataEntry;
    });
    
    onSuccess(transformedData);
  } catch (error) {
    console.error("Error parsing CSV data:", error);
    onError(error instanceof Error ? error.message : "Failed to parse CSV data from clipboard.");
  }
};

export const saveWaterData = async (data: WaterData[]): Promise<{ success: boolean; message: string }> => {
  try {
    // First, validate the data
    if (!Array.isArray(data) || data.length === 0) {
      return { 
        success: false, 
        message: "Invalid data format. Please ensure you're importing valid water data." 
      };
    }
    
    // Insert data into water_distribution_master table
    const waterDistributionEntries = data.map(item => ({
      meter_label: item.meter_label,
      account_number: item.account_number,
      zone: item.zone,
      type: item.type,
      parent_meter: item.parent_meter || null,
      jan_24: item.jan_24 || 0,
      feb_24: item.feb_24 || 0,
      mar_24: item.mar_24 || 0,
      apr_24: item.apr_24 || 0,
      may_24: item.may_24 || 0,
      jun_24: item.jun_24 || 0,
      jul_24: item.jul_24 || 0,
      aug_24: item.aug_24 || 0,
      sep_24: item.sep_24 || 0,
      oct_24: item.oct_24 || 0,
      nov_24: item.nov_24 || 0,
      dec_24: item.dec_24 || 0,
      jan_25: item.jan_25 || 0,
      feb_25: item.feb_25 || 0,
      mar_25: item.mar_25 || 0,
      total: item.total || 0
    }));
    
    // Check if we already have any of these meters in the database
    const { data: existingMeters, error: metersError } = await supabase
      .from('water_distribution_master')
      .select('meter_label');
    
    if (metersError) {
      console.error("Error checking existing meters:", metersError);
      return { 
        success: false, 
        message: "Database error when checking existing meters." 
      };
    }
    
    // Filter out already existing meters
    const existingMeterLabels = new Set((existingMeters || []).map(m => m.meter_label));
    const metersToInsert = waterDistributionEntries.filter(item => !existingMeterLabels.has(item.meter_label));
    
    // Insert new meters
    if (metersToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('water_distribution_master')
        .insert(metersToInsert as any);
      
      if (insertError) {
        console.error("Error inserting new meters:", insertError);
        return { 
          success: false, 
          message: "Failed to insert new water meters. " + insertError.message 
        };
      }
    }
    
    return { 
      success: true, 
      message: `Successfully imported ${metersToInsert.length} water meter readings.` 
    };
  } catch (error) {
    console.error("Error in saveWaterData:", error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : "Unknown error occurred" 
    };
  }
};
