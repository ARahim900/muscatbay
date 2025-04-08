
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import EnhancedPieChart from '@/components/ui/enhanced-pie-chart';
import { ArrowDown, Info, ChartPie } from 'lucide-react';

interface ElectricityTypeDistributionProps {
  typeBreakdown: Array<{
    name: string;
    value: number;
    color: string;
  }>;
}

const ElectricityTypeDistribution: React.FC<ElectricityTypeDistributionProps> = ({ typeBreakdown }) => {
  // Calculate total consumption for percentage calculations
  const totalConsumption = typeBreakdown.reduce((sum, item) => sum + item.value, 0);
  
  // Check if we have valid data
  const hasData = typeBreakdown && typeBreakdown.length > 0 && totalConsumption > 0;

  // Format data for rendering - include percentage
  const formattedData = typeBreakdown.map(item => ({
    ...item,
    percentage: totalConsumption > 0 ? (item.value / totalConsumption * 100).toFixed(1) : '0.0'
  }));
  
  // Sort by value descending for better visualization
  formattedData.sort((a, b) => b.value - a.value);

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-indigo-100 p-1.5">
              <ChartPie className="h-4 w-4 text-indigo-600" />
            </div>
            <div>
              <CardTitle>Consumption by Type</CardTitle>
              <CardDescription>Distribution of electricity consumption by facility type</CardDescription>
            </div>
          </div>
          
          {!hasData && (
            <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200 flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5" />
              No data available
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          {hasData ? (
            <EnhancedPieChart
              data={formattedData}
              innerRadius={60}
              outerRadius={100}
              valueFormatter={(value) => `${Math.round(value).toLocaleString()} kWh`}
              tooltipFormatter={(value, name, props) => (
                <div className="bg-white p-3 border border-gray-200 shadow-md rounded-md">
                  <p className="font-medium text-sm">{name}</p>
                  <p className="text-sm text-gray-600">
                    {Math.round(value).toLocaleString()} kWh ({props.percentage}%)
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {(value * 0.025).toFixed(2)} OMR
                  </p>
                </div>
              )}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full bg-gray-50/50 rounded-lg">
              <ArrowDown className="h-8 w-8 text-gray-300 mb-2" />
              <p className="text-gray-500">No consumption data available for the selected period</p>
              <p className="text-xs text-gray-400 mt-1">Try selecting a different month or year</p>
            </div>
          )}
        </div>
        
        {hasData && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-4">
            {formattedData.slice(0, 8).map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                />
                <div className="overflow-hidden">
                  <p className="text-xs font-medium truncate">{item.name}</p>
                  <p className="text-xs text-gray-500">{item.percentage}%</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ElectricityTypeDistribution;
