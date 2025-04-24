
import { fetchData } from './dataService';

/**
 * Service for retrieving property data
 */

/**
 * Fetches property data
 * @returns Promise with property data
 */
export async function fetchPropertyData(): Promise<any> {
  try {
    const data = await fetchData<any>('property/property-units.json');
    return data;
  } catch (error) {
    console.error('Error fetching property data:', error);
    throw new Error('Failed to load property data');
  }
}

/**
 * Fetches property owner data
 * @returns Promise with property owner data
 */
export async function fetchPropertyOwners(): Promise<any> {
  try {
    const data = await fetchData<any>('property/property-owners.json');
    return data;
  } catch (error) {
    console.error('Error fetching property owners data:', error);
    throw new Error('Failed to load property owners data');
  }
}

/**
 * Fetches property by type summary
 * @returns Promise with property by type summary
 */
export async function fetchPropertyByType(): Promise<any> {
  try {
    const data = await fetchData<any>('property/by-type.json');
    return data;
  } catch (error) {
    console.error('Error fetching property by type:', error);
    throw new Error('Failed to load property by type data');
  }
}

/**
 * Fetches property by status summary
 * @returns Promise with property by status summary
 */
export async function fetchPropertyByStatus(): Promise<any> {
  try {
    const data = await fetchData<any>('property/by-status.json');
    return data;
  } catch (error) {
    console.error('Error fetching property by status:', error);
    throw new Error('Failed to load property by status data');
  }
}

/**
 * Fetches property by sector summary
 * @returns Promise with property by sector summary
 */
export async function fetchPropertyBySector(): Promise<any> {
  try {
    const data = await fetchData<any>('property/by-sector.json');
    return data;
  } catch (error) {
    console.error('Error fetching property by sector:', error);
    throw new Error('Failed to load property by sector data');
  }
}
