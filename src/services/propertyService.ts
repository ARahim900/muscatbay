
/**
 * Property management service for Muscat Bay operations web application
 */
import { fetchData } from './dataService';
import { PropertyUnit } from '@/types/property';

/**
 * Fetches property unit data
 * @param options Filter options for properties
 * @param signal Optional AbortSignal for request cancellation
 * @returns Promise with property unit data
 */
export async function fetchPropertyUnits(
  options: { 
    zone?: string, 
    sector?: string, 
    unitType?: string,
    status?: string
  } = {},
  signal?: AbortSignal
): Promise<PropertyUnit[]> {
  try {
    const response = await fetchData<{metadata: any, data: PropertyUnit[]}>(
      'property/units.json',
      {
        signal,
        errorMessage: 'Failed to load property units data'
      }
    );
    
    let filteredData = response.data || [];
    
    // Apply filters if provided
    if (options.zone) {
      filteredData = filteredData.filter(unit => unit.zone === options.zone);
    }
    
    if (options.sector) {
      filteredData = filteredData.filter(unit => unit.sector === options.sector);
    }
    
    if (options.unitType) {
      filteredData = filteredData.filter(unit => unit.unitType === options.unitType);
    }
    
    if (options.status) {
      filteredData = filteredData.filter(unit => unit.status === options.status);
    }
    
    return filteredData;
  } catch (error) {
    console.error('Error in fetchPropertyUnits:', error);
    return [];
  }
}

/**
 * Gets available zones from property data
 * @param signal Optional AbortSignal for request cancellation
 * @returns Promise with available zones
 */
export async function getAvailableZones(signal?: AbortSignal): Promise<string[]> {
  try {
    const properties = await fetchPropertyUnits({}, signal);
    
    const zones = new Set<string>();
    properties.forEach(property => {
      if (property.zone) {
        zones.add(property.zone);
      }
    });
    
    return Array.from(zones).sort();
  } catch (error) {
    console.error('Error in getAvailableZones:', error);
    return [];
  }
}

/**
 * Gets available sectors from property data
 * @param zone Optional zone filter
 * @param signal Optional AbortSignal for request cancellation
 * @returns Promise with available sectors
 */
export async function getAvailableSectors(zone?: string, signal?: AbortSignal): Promise<string[]> {
  try {
    const properties = await fetchPropertyUnits({ zone }, signal);
    
    const sectors = new Set<string>();
    properties.forEach(property => {
      if (property.sector) {
        sectors.add(property.sector);
      }
    });
    
    return Array.from(sectors).sort();
  } catch (error) {
    console.error('Error in getAvailableSectors:', error);
    return [];
  }
}

/**
 * Gets available unit types from property data
 * @param zone Optional zone filter
 * @param sector Optional sector filter
 * @param signal Optional AbortSignal for request cancellation
 * @returns Promise with available unit types
 */
export async function getAvailableUnitTypes(
  zone?: string,
  sector?: string,
  signal?: AbortSignal
): Promise<string[]> {
  try {
    const properties = await fetchPropertyUnits({ zone, sector }, signal);
    
    const unitTypes = new Set<string>();
    properties.forEach(property => {
      if (property.unitType) {
        unitTypes.add(property.unitType);
      }
    });
    
    return Array.from(unitTypes).sort();
  } catch (error) {
    console.error('Error in getAvailableUnitTypes:', error);
    return [];
  }
}
