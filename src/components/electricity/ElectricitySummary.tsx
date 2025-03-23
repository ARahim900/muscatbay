
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Zap, TrendingUp, TrendingDown } from 'lucide-react';
import StatCard from '@/components/dashboard/StatCard';
import { ElectricityRecord } from '@/types/electricity';

interface ElectricitySummaryProps {
  electricityData: ElectricityRecord[];
  electricityRate: number;
  selectedMonth: string;
}

export const ElectricitySummary: React.FC<ElectricitySummaryProps> = ({
  electricityData,
  electricityRate,
  selectedMonth
}) => {
  // Calculate total consumption for Jan-Feb 2025
  const totalConsumption2025 = electricityData.reduce((total, facility) => {
    return total + (facility.consumption['Jan-25'] || 0) + (facility.consumption['Feb-25'] || 0);
  }, 0);

  // Calculate total consumption for Feb 2025
  const febConsumption = electricityData.reduce((total, facility) => {
    return total + (facility.consumption['Feb-25'] || 0);
  }, 0);

  // Calculate total consumption for Jan 2025
  const janConsumption = electricityData.reduce((total, facility) => {
    return total + (facility.consumption['Jan-25'] || 0);
  }, 0);

  // Calculate month over month change
  const momChange = janConsumption > 0 ? ((febConsumption - janConsumption) / janConsumption) * 100 : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard
        title="Total Consumption (Jan-Feb 2025)"
        value={`${totalConsumption2025.toLocaleString()} kWh`}
        description={`${(totalConsumption2025 * electricityRate).toLocaleString()} OMR`}
        icon={Zap}
        color="primary"
      />
      
      <StatCard
        title="February 2025 Consumption"
        value={`${febConsumption.toLocaleString()} kWh`}
        description={`${(febConsumption * electricityRate).toLocaleString()} OMR`}
        icon={Zap}
        color="teal"
      />
      
      <StatCard
        title="January 2025 Consumption"
        value={`${janConsumption.toLocaleString()} kWh`}
        description={`${(janConsumption * electricityRate).toLocaleString()} OMR`}
        icon={Zap}
        color="lavender"
      />
      
      <StatCard
        title="Month-over-Month Change"
        value={`${momChange.toFixed(1)}%`}
        icon={momChange >= 0 ? TrendingUp : TrendingDown}
        trend={{
          value: Math.abs(parseFloat(momChange.toFixed(1))),
          isPositive: momChange >= 0
        }}
        color="gold"
      />
    </div>
  );
};
