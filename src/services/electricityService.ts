
import { ElectricityRecord } from '@/types/electricity';

/**
 * Function to generate a random color
 * @returns Random hex color
 */
export const getRandomColor = (): string => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

/**
 * Fetches electricity data
 * @returns Array of electricity records
 */
export const fetchElectricityData = async (): Promise<any[]> => {
  // Mock data
  return [
    { id: 'e1', zone: 'Residential', consumption: 1500, cost: 135 },
    { id: 'e2', zone: 'Commercial', consumption: 2800, cost: 252 },
    { id: 'e3', zone: 'Common Areas', consumption: 950, cost: 85.5 }
  ];
};

/**
 * Safely parse number values
 * @param value Value to parse
 * @returns Parsed number or 0 if invalid
 */
export const safeParseNumber = (value: any): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};
