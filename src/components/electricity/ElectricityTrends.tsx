import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ChartContainer } from '@/components/ui/chart';
import {
  BarChart, 
  Bar, 
  LineChart, 
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { ElectricityRecord, MonthlyTypeConsumption, TopConsumer } from '@/types/electricity';

interface ElectricityTrendsProps {
  electricityData: ElectricityRecord[];
  electricityRate: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#FF6B6B'];

export const ElectricityTrends: React.FC<ElectricityTrendsProps> = ({
  electricityData,
  electricityRate
}) => {
  // Group consumption by facility type for Jan and Feb 2025
  const facilityTypes = Array.from(new Set(electricityData.map(item => item.type))).filter(Boolean);
  
  const typeConsumptionData = [
    { 
      month: 'Jan 2025',
      ...facilityTypes.reduce((acc, type) => {
        acc[type] = electricityData
          .filter(facility => facility.type === type)
          .reduce((sum, facility) => sum + (facility.consumption['Jan-25'] || 0), 0);
        return acc;
      }, {} as Record<string, number>)
    },
    { 
      month: 'Feb 2025',
      ...facilityTypes.reduce((acc, type) => {
        acc[type] = electricityData
          .filter(facility => facility.type === type)
          .reduce((sum, facility) => sum + (facility.consumption['Feb-25'] || 0), 0);
        return acc;
      }, {} as Record<string, number>)
    }
  ];
  
  // Get top 5 consumers for both months
  const getTopConsumers = (month: string): TopConsumer[] => {
    return electricityData
      .filter(facility => facility.name && facility.consumption[month] > 0)
      .map(facility => ({
        name: facility.name,
        type: facility.type,
        consumption: facility.consumption[month] || 0,
        cost: (facility.consumption[month] || 0) * electricityRate
      }))
      .sort((a, b) => b.consumption - a.consumption)
      .slice(0, 5);
  };
  
  const topConsumersJan = getTopConsumers('Jan-25');
  const topConsumersFeb = getTopConsumers('Feb-25');
  
  // Combine unique top consumers from both months
  const uniqueTopConsumers = [...new Set([
    ...topConsumersJan.map(c => c.name),
    ...topConsumersFeb.map(c => c.name)
  ])];
  
  // Create data for the line chart
  const topConsumersTrend = uniqueTopConsumers.map(name => {
    const facility = electricityData.find(f => f.name === name);
    return {
      name,
      type: facility?.type || '',
      janConsumption: facility?.consumption['Jan-25'] || 0,
      febConsumption: facility?.consumption['Feb-25'] || 0,
    };
  }).sort((a, b) => 
    (b.janConsumption + b.febConsumption) - (a.janConsumption + a.febConsumption)
  ).slice(0, 5);
  
  // Transform data for line chart
  const monthlyVariationData = [
    { month: 'Jan 2025', ...topConsumersTrend.reduce((acc, consumer) => {
        acc[consumer.name] = consumer.janConsumption;
        return acc;
      }, {} as Record<string, number>) 
    },
    { month: 'Feb 2025', ...topConsumersTrend.reduce((acc, consumer) => {
        acc[consumer.name] = consumer.febConsumption;
        return acc;
      }, {} as Record<string, number>) 
    }
  ];
  
  return (
    <div className="space-y-6">
      {/* Monthly Consumption by Facility Type */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Monthly Consumption by Facility Type</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ChartContainer className="h-96">
            <BarChart
              data={typeConsumptionData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `${value.toLocaleString()}`} />
              <Tooltip
                formatter={(value, name) => [
                  `${Number(value).toLocaleString()} kWh (${(Number(value) * electricityRate).toLocaleString()} OMR)`,
                  name
                ]}
              />
              <Legend />
              {facilityTypes.map((type, index) => (
                <Bar
                  key={type}
                  dataKey={type}
                  stackId="a"
                  fill={COLORS[index % COLORS.length]}
                  name={type}
                />
              ))}
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
      
      {/* Monthly Variation for Top Consumers */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Monthly Variation for Top Consumers</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ChartContainer className="h-96">
            <LineChart
              data={monthlyVariationData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `${value.toLocaleString()}`} />
              <Tooltip
                formatter={(value, name) => [
                  `${Number(value).toLocaleString()} kWh (${(Number(value) * electricityRate).toLocaleString()} OMR)`,
                  name
                ]}
              />
              <Legend />
              {topConsumersTrend.map((consumer, index) => (
                <Line
                  key={consumer.name}
                  type="monotone"
                  dataKey={consumer.name}
                  stroke={COLORS[index % COLORS.length]}
                  activeDot={{ r: 8 }}
                />
              ))}
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
      
      {/* Consumption Patterns Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Consumption Patterns - Top Facilities</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 text-left text-gray-600 text-xs">
                  <th className="px-4 py-2">Facility Name</th>
                  <th className="px-4 py-2">Type</th>
                  <th className="px-4 py-2 text-right">Jan 2025 (kWh)</th>
                  <th className="px-4 py-2 text-right">Feb 2025 (kWh)</th>
                  <th className="px-4 py-2 text-right">Change</th>
                  <th className="px-4 py-2 text-right">Change %</th>
                </tr>
              </thead>
              <tbody>
                {topConsumersTrend.map((facility, index) => {
                  const change = facility.febConsumption - facility.janConsumption;
                  const changePercent = facility.janConsumption > 0 
                    ? (change / facility.janConsumption) * 100 
                    : facility.febConsumption > 0 ? 100 : 0;
                  
                  return (
                    <tr 
                      key={`${facility.name}-${index}`}
                      className="border-b border-gray-200 hover:bg-gray-50"
                    >
                      <td className="px-4 py-2 font-medium">{facility.name}</td>
                      <td className="px-4 py-2">
                        <span className="px-2 py-1 rounded-full text-xs bg-gray-100">
                          {facility.type}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right">{facility.janConsumption.toLocaleString()}</td>
                      <td className="px-4 py-2 text-right">{facility.febConsumption.toLocaleString()}</td>
                      <td className="px-4 py-2 text-right">
                        <span className={change >= 0 ? 'text-amber-600' : 'text-green-600'}>
                          {change >= 0 ? '+' : ''}{change.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <span className={changePercent >= 0 ? 'text-amber-600' : 'text-green-600'}>
                          {changePercent >= 0 ? '+' : ''}{changePercent.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
