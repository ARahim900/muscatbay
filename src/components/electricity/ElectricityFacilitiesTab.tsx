
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ElectricityFacilitiesTable } from './ElectricityFacilitiesTable';
import { ElectricityRecord } from '@/types/electricity';
import { ELECTRICITY_RATE } from '@/data/electricityMockData';

interface ElectricityFacilitiesTabProps {
  electricityData: ElectricityRecord[];
  selectedMonth: string;
  selectedYear: string;
}

const ElectricityFacilitiesTab: React.FC<ElectricityFacilitiesTabProps> = ({
  electricityData,
  selectedMonth,
  selectedYear
}) => {
  // Format month string to match the consumption object keys (e.g., "Feb-25")
  const monthKey = `${selectedMonth}-${selectedYear.substring(2)}`;
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium">Facilities Consumption</CardTitle>
          <CardDescription>
            View and analyze consumption data for all facilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ElectricityFacilitiesTable 
            electricityData={electricityData} 
            electricityRate={ELECTRICITY_RATE} 
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default ElectricityFacilitiesTab;
