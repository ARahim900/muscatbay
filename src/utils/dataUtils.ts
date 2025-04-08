
/**
 * Helper function to add unique IDs to electricity data records
 */
export const addIdsToElectricityData = (data: any[]): any[] => {
  return data.map((item, index) => ({
    id: `${index + 1}`,
    ...item
  }));
};
