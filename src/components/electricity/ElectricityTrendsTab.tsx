
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ElectricityRecord } from '@/types/electricity';
import { ELECTRICITY_RATE } from '@/data/electricityMockData';
import { ElectricityTrends } from './ElectricityTrends';

interface ElectricityTrendsTabProps {
  electricityData: ElectricityRecord[];
  selectedMonth: string;
  selectedYear: string;
}

const ElectricityTrendsTab: React.FC<ElectricityTrendsTabProps> = ({
  electricityData,
  selectedMonth,
  selectedYear
}) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium">Consumption Trends Analysis</CardTitle>
          <CardDescription>
            Monthly trends and consumption patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ElectricityTrends 
            electricityData={electricityData}
            electricityRate={ELECTRICITY_RATE}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default ElectricityTrendsTab;
