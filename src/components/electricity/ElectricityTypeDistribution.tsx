
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import EnhancedPieChart from '@/components/ui/enhanced-pie-chart';

interface ElectricityTypeDistributionProps {
  typeBreakdown: Array<{
    name: string;
    value: number;
    color: string;
  }>;
}

const ElectricityTypeDistribution: React.FC<ElectricityTypeDistributionProps> = ({ typeBreakdown }) => {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Consumption by Type</CardTitle>
        <CardDescription>Distribution of electricity consumption by type</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          {typeBreakdown && typeBreakdown.length > 0 ? (
            <EnhancedPieChart
              data={typeBreakdown}
              innerRadius={60}
              outerRadius={100}
              valueFormatter={(value) => `${Math.round(value).toLocaleString()} kWh`}
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
              <p className="text-gray-500">No data available for the selected month</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ElectricityTypeDistribution;
