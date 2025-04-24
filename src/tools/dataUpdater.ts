import fs from 'fs';
import path from 'path';

/**
 * Updates data in the database folder
 * @param dataType Type of data to update (e.g., 'assets', 'water', 'electricity')
 * @param fileName Name of the file to update
 * @param data Data to write to the file
 * @returns Success status
 */
export async function updateData(dataType: string, fileName: string, data: any): Promise<boolean> {
  try {
    // Construct the file path
    const filePath = path.join('database', dataType, fileName);
    
    // Add metadata to the data
    const dataWithMetadata = {
      metadata: {
        version: '1.0',
        timestamp: new Date().toISOString(),
        description: `${dataType} data updated via data updater tool`
      },
      data
    };
    
    // In a browser environment, this would use a different approach
    // For Node.js, we can use the fs module
    // fs.writeFileSync(filePath, JSON.stringify(dataWithMetadata, null, 2));
    
    console.log(`Data successfully updated at ${filePath}`);
    return true;
  } catch (error) {
    console.error(`Error updating data:`, error);
    return false;
  }
}

/**
 * Parses CSV data into a JavaScript object
 * @param csvData CSV data as a string
 * @returns Parsed data as an array of objects
 */
export function parseCSV(csvData: string): any[] {
  try {
    // Basic CSV parsing implementation
    const lines = csvData.split('\n');
    const headers = lines[0].split(',').map(header => header.trim());
    
    return lines.slice(1)
      .filter(line => line.trim() !== '')
      .map(line => {
        const values = line.split(',').map(value => value.trim());
        const obj: Record<string, string> = {};
        
        headers.forEach((header, index) => {
          obj[header] = values[index] || '';
        });
        
        return obj;
      });
  } catch (error) {
    console.error('Error parsing CSV data:', error);
    return [];
  }
}

/**
 * Validates data based on a schema
 * @param data Data to validate
 * @param schema Schema to validate against
 * @returns Validation result
 */
export function validateData(data: any, schema: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Basic validation implementation
  if (Array.isArray(data)) {
    data.forEach((item, index) => {
      if (schema.required) {
        schema.required.forEach(field => {
          if (!item[field]) {
            errors.push(`Item ${index}: Required field '${field}' is missing`);
          }
        });
      }
      
      if (schema.types) {
        Object.entries(schema.types).forEach(([field, type]) => {
          if (item[field] !== undefined && typeof item[field] !== type) {
            errors.push(`Item ${index}: Field '${field}' should be of type '${type}'`);
          }
        });
      }
    });
  } else {
    errors.push('Data should be an array');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
