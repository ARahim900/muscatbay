
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Zap, TrendingUp, TrendingDown } from 'lucide-react';
import StatCard from '@/components/dashboard/StatCard';
import { ElectricityRecord } from '@/types/electricity';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();

  // Get all available months from the data
  const allMonths = [
    { value: 'Apr-24', label: 'April 2024' },
    { value: 'May-24', label: 'May 2024' },
    { value: 'Jun-24', label: 'June 2024' },
    { value: 'Jul-24', label: 'July 2024' },
    { value: 'Aug-24', label: 'August 2024' },
    { value: 'Sep-24', label: 'September 2024' },
    { value: 'Oct-24', label: 'October 2024' },
    { value: 'Nov-24', label: 'November 2024' },
    { value: 'Dec-24', label: 'December 2024' },
    { value: 'Jan-25', label: 'January 2025' },
    { value: 'Feb-25', label: 'February 2025' }
  ];

  // If 'all' is selected, show Jan-Feb 2025 data
  // Otherwise, show the selected month and the previous month
  let currentMonthConsumption = 0;
  let previousMonthConsumption = 0;
  let totalConsumption = 0;
  let currentMonthLabel = '';
  let previousMonthLabel = '';
  let periodLabel = '';

  if (selectedMonth === 'all') {
    // Calculate total consumption for Jan-Feb 2025
    totalConsumption = electricityData.reduce((total, facility) => {
      return total + (facility.consumption['Jan-25'] || 0) + (facility.consumption['Feb-25'] || 0);
    }, 0);

    // Calculate total consumption for Feb 2025
    currentMonthConsumption = electricityData.reduce((total, facility) => {
      return total + (facility.consumption['Feb-25'] || 0);
    }, 0);

    // Calculate total consumption for Jan 2025
    previousMonthConsumption = electricityData.reduce((total, facility) => {
      return total + (facility.consumption['Jan-25'] || 0);
    }, 0);

    currentMonthLabel = 'February 2025';
    previousMonthLabel = 'January 2025';
    periodLabel = 'Total (Jan-Feb 2025)';
  } else {
    // Get month index to determine previous month
    const monthIndex = allMonths.findIndex(m => m.value === selectedMonth);
    const previousMonthIndex = monthIndex > 0 ? monthIndex - 1 : -1;
    const previousMonth = previousMonthIndex >= 0 ? allMonths[previousMonthIndex].value : null;
    
    // Calculate consumption for selected month
    currentMonthConsumption = electricityData.reduce((total, facility) => {
      return total + (facility.consumption[selectedMonth] || 0);
    }, 0);

    // Total consumption is just the current month in this case
    totalConsumption = currentMonthConsumption;
    
    // If there's a previous month, calculate its consumption
    if (previousMonth) {
      previousMonthConsumption = electricityData.reduce((total, facility) => {
        return total + (facility.consumption[previousMonth] || 0);
      }, 0);
      previousMonthLabel = allMonths.find(m => m.value === previousMonth)?.label || previousMonth;
    } else {
      previousMonthLabel = 'No Previous Month';
    }

    currentMonthLabel = allMonths.find(m => m.value === selectedMonth)?.label || selectedMonth;
    periodLabel = currentMonthLabel;
  }

  // Calculate month over month change
  const momChange = previousMonthConsumption > 0 ? ((currentMonthConsumption - previousMonthConsumption) / previousMonthConsumption) * 100 : 0;

  // Format numbers for better readability
  const formatNumber = (num: number): string => {
    return num.toLocaleString(undefined, { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 0 
    });
  };

  // Format currency for better readability
  const formatCurrency = (num: number): string => {
    return num.toLocaleString(undefined, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
      <StatCard
        title={periodLabel}
        value={`${formatNumber(totalConsumption)} kWh`}
        description={`${formatCurrency(totalConsumption * electricityRate)} OMR`}
        icon={Zap}
        color="primary"
      />
      
      <StatCard
        title={currentMonthLabel}
        value={`${formatNumber(currentMonthConsumption)} kWh`}
        description={`${formatCurrency(currentMonthConsumption * electricityRate)} OMR`}
        icon={Zap}
        color="teal"
      />
      
      <StatCard
        title={previousMonthLabel}
        value={`${formatNumber(previousMonthConsumption)} kWh`}
        description={`${formatCurrency(previousMonthConsumption * electricityRate)} OMR`}
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
