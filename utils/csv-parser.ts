
/**
 * CSV Parser Utility
 * This utility wraps PapaParse for CSV parsing with type safety
 */

// Define generic type for parsed CSV rows
export type ParsedCsvRow = Record<string, any>;

// Type for parse configuration
export interface CsvParseConfig {
  header?: boolean;
  dynamicTyping?: boolean;
  skipEmptyLines?: boolean;
  transformHeader?: (header: string) => string;
}

// Type for parse results
export interface CsvParseResult<T = ParsedCsvRow> {
  data: T[];
  errors: Array<{
    type: string;
    code: string;
    message: string;
    row?: number;
  }>;
  meta: {
    delimiter: string;
    linebreak: string;
    aborted: boolean;
    truncated: boolean;
    cursor: number;
  };
}

// Parse CSV string to array of objects
export const parseCsv = <T = ParsedCsvRow>(
  csvString: string, 
  config: CsvParseConfig = {}
): CsvParseResult<T> => {
  // If window is not defined or Papa is not loaded, return an empty result
  if (typeof window === 'undefined' || !window.Papa) {
    console.error('PapaParse is not loaded. Make sure to include the script.');
    return {
      data: [],
      errors: [{
        type: 'Parser',
        code: 'LibraryNotLoaded',
        message: 'PapaParse library is not loaded'
      }],
      meta: {
        delimiter: '',
        linebreak: '',
        aborted: true,
        truncated: false,
        cursor: 0
      }
    };
  }

  // Parse the CSV string
  return window.Papa.parse(csvString, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
    ...config
  });
};

// Import PapaParse from CDN and return a promise
export const loadPapaParseFromCDN = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Cannot load PapaParse in a non-browser environment'));
      return;
    }

    // If PapaParse is already loaded, resolve immediately
    if (window.Papa) {
      resolve();
      return;
    }

    const scriptId = 'papaparse-cdn-script';
    
    // Check if script already exists
    if (document.getElementById(scriptId)) {
      // Script tag exists but hasn't loaded yet
      const existingScript = document.getElementById(scriptId) as HTMLScriptElement;
      existingScript.onload = () => resolve();
      existingScript.onerror = (error: any) => reject(new Error(`Failed to load PapaParse: ${error}`));
      return;
    }

    // Create script element
    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.3.2/papaparse.min.js';
    script.async = true;
    
    // Setup event handlers
    script.onload = () => {
      console.log('PapaParse loaded successfully');
      resolve();
    };
    
    script.onerror = (error: any) => {
      reject(new Error(`Failed to load PapaParse: ${error}`));
    };

    // Append to document body
    document.body.appendChild(script);
  });
};

// Declare global Papa object for TypeScript
declare global {
  interface Window {
    Papa: {
      parse: (
        input: string,
        config?: any
      ) => CsvParseResult;
      unparse: (data: any, config?: any) => string;
    };
  }
}
