
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TypeConsumption } from '@/types/electricity';
import { formatNumber, formatCurrency } from '@/utils/electricityDataUtils';

interface ElectricityTypeDistributionProps {
  data: TypeConsumption[];
}

const ElectricityTypeDistribution: React.FC<ElectricityTypeDistributionProps> = ({ data }) => {
  // Custom tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 shadow-md rounded-md">
          <p className="font-medium">{item.type}</p>
          <p className="text-sm">{formatNumber(item.consumption)} kWh</p>
          <p className="text-sm">{formatCurrency(item.cost)} OMR</p>
          <p className="text-sm">{item.percentage?.toFixed(1)}% of total</p>
        </div>
      );
    }
    return null;
  };

  // Custom legend with percentages
  const renderCustomizedLegend = ({ payload }: any) => {
    return (
      <ul className="flex flex-wrap justify-center gap-4 pt-4">
        {payload.map((entry: any, index: number) => (
          <li key={`item-${index}`} className="flex items-center text-sm">
            <div
              className="w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs md:text-sm">
              {entry.value}: {entry.payload.percentage?.toFixed(1)}%
            </span>
          </li>
        ))}
      </ul>
    );
  };

  if (!data || data.length === 0) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Consumption by Type</CardTitle>
          <CardDescription>Distribution of electricity consumption by type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex flex-col items-center justify-center text-gray-500">
            <p>No data available for the selected month</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Consumption by Type</CardTitle>
        <CardDescription>Distribution of electricity consumption by type</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                fill="#8884d8"
                paddingAngle={1}
                dataKey="consumption"
                nameKey="type"
                label={({ name, percent }) => `${percent.toFixed(0)}%`}
                labelLine={false}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color} 
                    stroke="transparent"
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                content={renderCustomizedLegend}
                verticalAlign="bottom"
                align="center"
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default ElectricityTypeDistribution;
