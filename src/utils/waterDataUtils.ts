
import { WaterData, CSVRowData } from '@/types/water';
import { toast } from '@/components/ui/use-toast';

// Function to parse CSV data from clipboard
export const parseCSVFromClipboard = async (
  text?: string, 
  onSuccess?: (data: WaterData[]) => void, 
  onError?: (message: string) => void
): Promise<void> => {
  try {
    // Get text from clipboard or use provided text
    const clipboardText = text || await navigator.clipboard.readText();
    
    if (!clipboardText.trim()) {
      if (onError) onError("No data found on clipboard");
      return;
    }
    
    // Split into rows and remove any empty rows
    const rows = clipboardText.split('\n')
      .map(row => row.trim())
      .filter(row => row.length > 0);
    
    if (rows.length < 2) {
      if (onError) onError("Invalid data format: Expected header row and at least one data row");
      return;
    }
    
    // Parse header row
    const headers = rows[0].split(',').map(header => header.trim());
    
    // Check required headers
    const requiredHeaders = ['Zone', 'Type', 'Parent Meter'];
    const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
    
    if (missingHeaders.length > 0) {
      if (onError) onError(`Missing required headers: ${missingHeaders.join(', ')}`);
      return;
    }
    
    // Parse data rows
    const csvData: CSVRowData[] = [];
    for (let i = 1; i < rows.length; i++) {
      const values = rows[i].split(',').map(value => value.trim());
      
      // Skip rows with incorrect number of columns
      if (values.length !== headers.length) continue;
      
      const rowData: Record<string, any> = {};
      headers.forEach((header, index) => {
        rowData[header] = values[index];
      });
      
      csvData.push(rowData as CSVRowData);
    }
    
    // Transform to WaterData format
    const waterData: WaterData[] = csvData.map((row, index) => {
      // Extract monthly values
      const monthlyData: Record<string, number> = {};
      Object.entries(row).forEach(([key, value]) => {
        if (key.includes('_') && !isNaN(Number(value))) {
          monthlyData[key] = Number(value);
        }
      });
      
      // Calculate total
      const total = Object.values(monthlyData).reduce((sum, val) => sum + val, 0);
      
      return {
        meter_label: row['Meter Label'] || `Meter-${index}`,
        account_number: row['Acct #'] || '',
        zone: row.Zone || 'Unknown',
        type: row.Type || 'Unknown',
        parent_meter: row['Parent Meter'] || null,
        ...monthlyData,
        total
      };
    });
    
    if (onSuccess) onSuccess(waterData);
    
  } catch (error) {
    console.error("Error parsing clipboard data:", error);
    if (onError) onError(error instanceof Error ? error.message : "Unknown error parsing data");
  }
};

// Function to save water data
export const saveWaterData = async (data: WaterData[]): Promise<{success: boolean; message: string}> => {
  try {
    // This would normally save to an API or database
    // For now, we'll just simulate success
    console.log('Saving water data:', data);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      message: `Successfully imported ${data.length} water data records`
    };
  } catch (error) {
    console.error("Error saving water data:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error saving data"
    };
  }
};

// Function to validate water data
export const validateWaterData = (data: WaterData[]): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Check if data array is empty
  if (!data || data.length === 0) {
    errors.push("No water data records provided");
    return { valid: false, errors };
  }
  
  // Validate each record
  data.forEach((record, index) => {
    if (!record.meter_label) {
      errors.push(`Record #${index + 1}: Missing meter label`);
    }
    
    if (!record.zone) {
      errors.push(`Record #${index + 1}: Missing zone`);
    }
    
    if (!record.type) {
      errors.push(`Record #${index + 1}: Missing type`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
};
