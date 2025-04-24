
/**
 * Core data service for Muscat Bay operations web application
 */

interface FetchOptions {
  signal?: AbortSignal;
  errorMessage?: string;
}

/**
 * Fetches data from the specified path
 * @param path Path to the data file
 * @param options Fetch options
 * @returns Promise with the fetched data
 */
export async function fetchData<T>(path: string, options?: FetchOptions): Promise<T> {
  try {
    // For now, we'll return mock data since we don't have a real API
    // In a real application, this would fetch from an API or database
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return mock data based on the path
    return getMockData(path) as T;
  } catch (error) {
    console.error(`Error fetching data from ${path}:`, error);
    throw new Error(options?.errorMessage || `Failed to fetch data from ${path}`);
  }
}

/**
 * Returns mock data for testing
 * @param path Path to the mock data file
 * @returns Mock data object
 */
function getMockData(path: string): any {
  // Water consumption data
  if (path.includes('water/consumption')) {
    return {
      metadata: {
        version: '1.0',
        timestamp: new Date().toISOString(),
        description: 'Water consumption data for Muscat Bay',
        units: 'm³'
      },
      total: {
        consumption: 48234,
        loss: 2834
      },
      zones: [
        { name: 'Zone A', consumption: 12500, loss: 750 },
        { name: 'Zone B', consumption: 9800, loss: 450 },
        { name: 'Zone C', consumption: 15400, loss: 980 },
        { name: 'Zone D', consumption: 10534, loss: 620 }
      ]
    };
  }
  
  // STP daily data
  if (path.includes('stp/daily-data')) {
    return {
      metadata: {
        version: '1.0',
        timestamp: new Date().toISOString(),
        description: 'STP daily performance data'
      },
      data: [
        {
          date: '2024-02-01',
          bod: 25.4,
          cod: 78.2,
          tss: 30.1,
          tankerTrips: 8,
          totalInfluent: 125.6,
          totalWaterProcessed: 118.4,
          tseToIrrigation: 110.2
        },
        {
          date: '2024-02-02',
          bod: 26.1,
          cod: 80.5,
          tss: 31.5,
          tankerTrips: 7,
          totalInfluent: 118.9,
          totalWaterProcessed: 115.2,
          tseToIrrigation: 108.7
        }
        // More records would be here
      ]
    };
  }
  
  // STP monthly data
  if (path.includes('stp/monthly-data')) {
    return {
      data: [
        {
          month: '2024-01',
          tankerTrips: 220,
          totalInfluent: 3420.5,
          totalWaterProcessed: 3250.8,
          tseToIrrigation: 3100.4,
          bodAvg: 24.8,
          codAvg: 76.5,
          tssAvg: 29.8
        },
        {
          month: '2024-02',
          tankerTrips: 195,
          totalInfluent: 3180.2,
          totalWaterProcessed: 3050.6,
          tseToIrrigation: 2940.2,
          bodAvg: 25.6,
          codAvg: 79.3,
          tssAvg: 30.6
        }
      ]
    };
  }
  
  // Electricity consumption
  if (path.includes('electricity/consumption')) {
    return [
      {
        id: 'elec-001',
        name: 'Main Office',
        type: 'Commercial',
        zone: 'Zone A',
        accountNumber: 'E12345',
        consumption: {
          'Jan-25': 12500,
          'Feb-25': 11800
        }
      },
      {
        id: 'elec-002',
        name: 'Residential Block 1',
        type: 'Residential',
        zone: 'Zone B',
        accountNumber: 'E12346',
        consumption: {
          'Jan-25': 8900,
          'Feb-25': 9200
        }
      },
      {
        id: 'elec-003',
        name: 'Pump Station',
        type: 'Infrastructure',
        zone: 'Zone C',
        accountNumber: 'E12347',
        consumption: {
          'Jan-25': 5600,
          'Feb-25': 5800
        }
      }
    ];
  }
  
  // Default empty response
  return {};
}
