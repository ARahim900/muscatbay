
import React, { useMemo } from 'react';
import { processElectricityData } from '@/utils/electricityDataUtils';
import ElectricityMetricCards from './ElectricityMetricCards';
import ElectricityTypeDistribution from './ElectricityTypeDistribution';
import ElectricityConsumersTable from './ElectricityConsumersTable';

interface ElectricityOverviewProps {
  electricityData: any[];
  selectedMonth: string;
  selectedYear: string;
}

const ElectricityOverview: React.FC<ElectricityOverviewProps> = ({ 
  electricityData, 
  selectedMonth,
  selectedYear 
}) => {
  // Process the raw data using our utility function
  const processedData = useMemo(() => {
    return processElectricityData(electricityData, selectedMonth, selectedYear);
  }, [electricityData, selectedMonth, selectedYear]);

  return (
    <div className="space-y-8">
      {/* Key Metrics */}
      <ElectricityMetricCards data={processedData} />
      
      {/* Type Distribution */}
      <ElectricityTypeDistribution data={processedData.typeBreakdown} />
      
      {/* Top Consumers */}
      <ElectricityConsumersTable data={processedData.topConsumers} />
    </div>
  );
};

export default ElectricityOverview;
