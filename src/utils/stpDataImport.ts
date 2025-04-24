
import Papa from 'papaparse';
import { STPDailyData } from '@/types/stp';

export const parseSTPCSV = (csvText: string): STPDailyData[] => {
  const { data } = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true
  });
  
  return data.map((row: any) => ({
    date: row.Date || new Date().toISOString().split('T')[0],
    tankerTrips: parseInt(row['Tanker Trips'] || '0'),
    expectedVolumeTankers: parseFloat(row['Expected Volume'] || '0'),
    directSewageMB: parseFloat(row['Direct Sewage'] || '0'),
    totalInfluent: parseFloat(row['Total Influent'] || '0'),
    totalWaterProcessed: parseFloat(row['Water Processed'] || '0'),
    tseToIrrigation: parseFloat(row['TSE to Irrigation'] || '0')
  }));
};

export const validateSTPData = (data: STPDailyData[]): string[] => {
  const errors: string[] = [];
  
  if (!data.length) {
    errors.push("No data found in the CSV file.");
    return errors;
  }
  
  data.forEach((record, index) => {
    if (!record.date) errors.push(`Row ${index + 1}: Missing date.`);
    if (isNaN(record.tankerTrips)) errors.push(`Row ${index + 1}: Invalid tanker trips value.`);
    if (isNaN(record.totalInfluent)) errors.push(`Row ${index + 1}: Invalid total influent value.`);
    if (isNaN(record.totalWaterProcessed)) errors.push(`Row ${index + 1}: Invalid water processed value.`);
    if (isNaN(record.tseToIrrigation)) errors.push(`Row ${index + 1}: Invalid TSE to irrigation value.`);
  });
  
  return errors;
};
