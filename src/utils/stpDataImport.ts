
import { fetchData } from '@/services/dataService';
import { STPDailyData } from '@/types/stp';

/**
 * Imports STP data from a CSV file
 * @param file CSV file to import
 * @returns Promise with imported data or error
 */
export const importSTPData = async (file: File): Promise<{ success: boolean; message: string; data?: any }> => {
  try {
    // Read the file
    const fileContent = await readFileAsText(file);
    
    // Parse the CSV data
    const parsedData = parseCSV(fileContent);
    
    // Process the data
    const processedData = processData(parsedData);
    
    return {
      success: true,
      message: `Successfully imported ${processedData.length} records`,
      data: processedData
    };
  } catch (error) {
    console.error('Error importing STP data:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to import data'
    };
  }
};

/**
 * Reads a file as text
 * @param file File to read
 * @returns Promise with file content
 */
const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

/**
 * Parses CSV data
 * @param csvContent CSV content as string
 * @returns Array of objects with CSV data
 */
const parseCSV = (csvContent: string): Record<string, string>[] => {
  try {
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',').map(header => header.trim());
    
    return lines.slice(1)
      .filter(line => line.trim() !== '')
      .map(line => {
        const values = line.split(',').map(val => val.trim());
        const record: Record<string, string> = {};
        
        headers.forEach((header, index) => {
          record[header] = values[index] || '';
        });
        
        return record;
      });
  } catch (error) {
    throw new Error('Invalid CSV format');
  }
};

/**
 * Processes parsed CSV data into STPDailyData format
 * @param records Parsed CSV records
 * @returns Processed data in STPDailyData format
 */
const processData = (records: Record<string, string>[]): Partial<STPDailyData>[] => {
  return records.map(record => {
    // Map CSV fields to STPDailyData fields
    // This would need to be adjusted based on your actual CSV structure
    return {
      id: generateId(),
      date: record['Date'] || new Date().toISOString().split('T')[0],
      tankerTrips: parseInt(record['Tanker Trips'] || '0'),
      expectedVolumeTankers: parseFloat(record['Expected Volume Tankers'] || '0'),
      directSewageMB: parseFloat(record['Direct Sewage MB'] || '0'),
      totalInfluent: parseFloat(record['Total Influent'] || '0'),
      totalWaterProcessed: parseFloat(record['Total Water Processed'] || '0'),
      tseToIrrigation: parseFloat(record['TSE To Irrigation'] || '0'),
      bod: parseFloat(record['BOD'] || '0'),
      cod: parseFloat(record['COD'] || '0'),
      tss: parseFloat(record['TSS'] || '0'),
      ph: parseFloat(record['pH'] || '0'),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  });
};

/**
 * Generates a unique ID
 * @returns Unique ID
 */
const generateId = (): string => {
  return 'stp-' + Math.random().toString(36).substring(2, 9);
};
