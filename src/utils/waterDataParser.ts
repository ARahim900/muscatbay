
/**
 * Parse CSV-formatted water meter data into structured records
 * @param csvData The CSV data as a string
 * @returns An array of structured water meter records
 */
export const parseWaterMeterData = (csvData: string) => {
  // Split the data into rows and remove any empty lines
  const rows = csvData.split('\n').filter(row => row.trim() !== '');
  
  // Extract the header row and remove it from the data
  const headerRow = rows[0];
  const dataRows = rows.slice(1);
  
  // Parse the header to identify column indices
  const headers = headerRow.split('\t');
  
  const meterLabelIndex = headers.indexOf('Meter Label');
  const accountNumberIndex = headers.indexOf('Acct #');
  const zoneIndex = headers.indexOf('Zone');
  const typeIndex = headers.indexOf('Type');
  const parentMeterIndex = headers.indexOf('Parent Meter');
  const labelIndex = headers.indexOf('Label');
  const janIndex = headers.indexOf('Jan-25');
  const febIndex = headers.indexOf('Feb-25');
  const marIndex = headers.indexOf('Mar-25');
  const totalIndex = headers.indexOf('Total');
  
  // Parse each data row
  return dataRows.map(row => {
    const columns = row.split('\t');
    
    // Create the record with appropriate data types
    return {
      meter_label: columns[meterLabelIndex],
      account_number: columns[accountNumberIndex],
      zone: columns[zoneIndex],
      type: columns[typeIndex],
      parent_meter: columns[parentMeterIndex],
      label: columns[labelIndex],
      jan_25: columns[janIndex] ? parseInt(columns[janIndex], 10) || 0 : 0,
      feb_25: columns[febIndex] ? parseInt(columns[febIndex], 10) || 0 : 0,
      mar_25: columns[marIndex] ? parseInt(columns[marIndex], 10) || 0 : 0,
      total: columns[totalIndex] ? parseInt(columns[totalIndex], 10) || 0 : 0
    };
  });
};

/**
 * Group water meter data by zone
 * @param waterData The water meter data to group
 * @returns An object with zones as keys and aggregated consumption as values
 */
export const aggregateWaterDataByZone = (waterData: any[]) => {
  const zones: { [key: string]: any } = {};

  waterData.forEach(meter => {
    const zone = meter.zone;
    
    if (!zones[zone]) {
      zones[zone] = {
        name: zone,
        jan_25: 0,
        feb_25: 0,
        mar_25: 0,
        total: 0
      };
    }
    
    zones[zone].jan_25 += meter.jan_25 || 0;
    zones[zone].feb_25 += meter.feb_25 || 0;
    zones[zone].mar_25 += meter.mar_25 || 0;
    zones[zone].total += meter.total || 0;
  });
  
  return Object.values(zones);
};

/**
 * Group water meter data by type
 * @param waterData The water meter data to group
 * @returns An object with types as keys and aggregated consumption as values
 */
export const aggregateWaterDataByType = (waterData: any[]) => {
  const types: { [key: string]: any } = {};

  waterData.forEach(meter => {
    const type = meter.type;
    
    if (!types[type]) {
      types[type] = {
        name: type,
        jan_25: 0,
        feb_25: 0,
        mar_25: 0,
        total: 0
      };
    }
    
    types[type].jan_25 += meter.jan_25 || 0;
    types[type].feb_25 += meter.feb_25 || 0;
    types[type].mar_25 += meter.mar_25 || 0;
    types[type].total += meter.total || 0;
  });
  
  return Object.values(types);
};

/**
 * Convert the provided CSV data into the format needed for the water dashboard
 * @param csvData The CSV data as a string
 * @returns An object with processed data ready for the dashboard
 */
export const processWaterDataForDashboard = (csvData: string) => {
  const parsedData = parseWaterMeterData(csvData);
  const zoneData = aggregateWaterDataByZone(parsedData);
  const typeData = aggregateWaterDataByType(parsedData);
  
  return {
    meters: parsedData,
    zones: zoneData,
    types: typeData
  };
};
