
import React, { useMemo } from 'react';
import { processAirtableData } from '@/utils/electricityDataUtils';
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
  // Add logging to debug the data structure
  console.log("Raw electricity data:", electricityData);
  console.log("Selected Month/Year:", selectedMonth, selectedYear);
  
  // Process the raw data from Airtable using our utility function
  const processedData = useMemo(() => {
    try {
      // Define electricity rate
      const electricityRate = 0.025; // OMR per kWh
      
      return processAirtableData(electricityData, selectedMonth, selectedYear, electricityRate);
    } catch (error) {
      console.error("Error processing electricity data:", error);
      // Return default data structure in case of errors
      return {
        totalConsumption: 0,
        totalCost: 0,
        averageConsumption: 0,
        maxConsumption: 0,
        maxConsumer: 'N/A',
        typeBreakdown: [],
        topConsumers: []
      };
    }
  }, [electricityData, selectedMonth, selectedYear]);

  return (
    <div className="space-y-8">
      {/* Key Metrics */}
      <ElectricityMetricCards 
        totalConsumption={processedData.totalConsumption} 
        totalCost={processedData.totalCost}
        averageConsumption={processedData.averageConsumption}
        maxConsumption={processedData.maxConsumption}
        maxConsumer={processedData.maxConsumer}
      />
      
      {/* Type Distribution */}
      <ElectricityTypeDistribution 
        typeBreakdown={processedData.typeBreakdown} 
      />
      
      {/* Top Consumers */}
      <ElectricityConsumersTable 
        topConsumers={processedData.topConsumers} 
      />
    </div>
  );
};

export default ElectricityOverview;
