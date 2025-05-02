
export interface ParsedCsvRow {
  [key: string]: any;
}

export interface CsvParseResult<T> {
  data: T[];
  errors: any[];
  meta: {
    delimiter: string;
    linebreak: string;
    aborted: boolean;
    truncated: boolean;
    cursor: number;
    fields: string[];
  };
}

/**
 * Process raw water data from CSV
 * @param rawData Raw data from CSV
 * @returns Processed water data
 */
export function processWaterData(rawData: ParsedCsvRow[]): ParsedCsvRow[] {
  if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
    console.warn('Invalid or empty raw data provided to processWaterData')
    return []
  }
  
  const processedData = rawData
    .filter(row => row && typeof row === 'object' && Object.keys(row).length > 0)
    .map(row => {
      const processed: ParsedCsvRow = { ...row }
      
      // Convert meter readings to numbers
      const monthColumns = Object.keys(row).filter(key => 
        /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-\d{2}$/.test(key)
      )
      
      monthColumns.forEach(month => {
        processed[month] = typeof row[month] === 'number' ? row[month] : 
                          typeof row[month] === 'string' && row[month].trim() !== '' ? 
                          Number(row[month].replace(/,/g, '')) : 0
      })
      
      return processed
    })
  
  return processedData
}

/**
 * Parse CSV data with specified configuration
 * @param csvText CSV text content
 * @param config Parse configuration
 * @returns Parse result
 */
export function parseCsvData<T = ParsedCsvRow>(
  csvText: string, 
  config: { header: boolean; dynamicTyping: boolean; skipEmptyLines: boolean }
): CsvParseResult<ParsedCsvRow> {
  if (!(window as any).Papa) {
    throw new Error('PapaParse library not available')
  }
  
  return (window as any).Papa.parse(csvText, config)
}
