
/**
 * Central data service for fetching data from JSON files
 */

/**
 * Fetches data from a JSON file in the database folder
 * @param path Path to the JSON file relative to the database folder
 * @returns Promise with parsed JSON data
 */
export async function fetchData<T>(path: string): Promise<T> {
  try {
    // In a real app, this would typically be an API call
    // For this project, we're loading local JSON files
    const response = await fetch(`/database/${path}`);
    
    if (!response.ok) {
      throw new Error(`Failed to load data: ${response.statusText}`);
    }
    
    return await response.json() as T;
  } catch (error) {
    console.error(`Error fetching data from ${path}:`, error);
    throw new Error(`Failed to load data from ${path}`);
  }
}

/**
 * Fetches data with a simulated delay (useful for testing loading states)
 * @param path Path to the JSON file relative to the database folder
 * @param delayMs Delay in milliseconds
 * @returns Promise with parsed JSON data
 */
export async function fetchDataWithDelay<T>(path: string, delayMs: number = 1000): Promise<T> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, delayMs));
  return fetchData<T>(path);
}

/**
 * Checks if the browser is in development mode
 * @returns True if in development mode
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}
