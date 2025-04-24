
/**
 * Core data fetching utility for Muscat Bay operations web application
 */
import { toast } from "@/components/ui/use-toast";

export interface FetchDataOptions {
  signal?: AbortSignal;
  errorMessage?: string;
}

/**
 * Fetches data from a JSON file in the database directory
 * @param path Path to the JSON file relative to the database directory
 * @param options Fetch options including AbortSignal and custom error message
 * @returns Promise with the parsed JSON data
 */
export async function fetchData<T>(path: string, options: FetchDataOptions = {}): Promise<T> {
  try {
    const response = await fetch(`/database/${path}`, {
      signal: options.signal,
      headers: {
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
    }

    return await response.json() as T;
  } catch (error) {
    const errorMessage = options.errorMessage || 'Error fetching data. Please try again later.';
    console.error(`Error fetching ${path}:`, error);
    
    // Display toast notification for user
    toast({
      variant: "destructive",
      title: "Data Loading Error",
      description: errorMessage,
    });
    
    throw error;
  }
}

/**
 * Updates data in a JSON file
 * @param path Path to the JSON file relative to the database directory
 * @param data New data to write
 * @returns Promise with the success status
 */
export async function updateData<T>(path: string, data: T): Promise<{ success: boolean; message?: string }> {
  try {
    // This is a placeholder as direct file writing is not possible in the browser
    // In a real implementation, this would send the data to a backend API
    console.log(`Update data for ${path}:`, data);
    
    // Simulated success response
    return { success: true, message: "Data updated successfully" };
  } catch (error) {
    console.error(`Error updating ${path}:`, error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}
