
/**
 * Core data service for fetching data from the API or local JSON files
 */

/**
 * Options for fetching data
 */
interface FetchDataOptions {
  signal?: AbortSignal;
  errorMessage?: string;
}

/**
 * Fetches data from the API or local JSON files
 * @param path Path to the data resource
 * @param options Fetch options
 * @returns Promise with the fetched data
 */
export async function fetchData<T>(path: string, options: FetchDataOptions = {}): Promise<T> {
  const { signal, errorMessage } = options;
  
  try {
    // In a real application, this would fetch from an API
    // For development, we'll simulate a delay and return mock data
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock implementation for development
    // In a real app, this would be something like:
    // const response = await fetch(`/api/${path}`, { signal });
    // return response.json();
    
    return {} as T; // Return empty object as mock data
  } catch (error) {
    console.error(`Error fetching data from ${path}:`, error);
    throw new Error(errorMessage || `Failed to fetch data from ${path}`);
  }
}
