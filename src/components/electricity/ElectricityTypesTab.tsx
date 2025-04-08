
import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ElectricityRecord, TypeConsumption } from '@/types/electricity';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { ELECTRICITY_RATE } from '@/data/electricityMockData';
import { ChartContainer } from '@/components/ui/chart';
import { getTypeColor } from '@/utils/electricityDataUtils';

interface ElectricityTypesTabProps {
  electricityData: ElectricityRecord[];
  selectedMonth: string;
  selectedYear: string;
}

const ElectricityTypesTab: React.FC<ElectricityTypesTabProps> = ({
  electricityData,
  selectedMonth,
  selectedYear
}) => {
  // Format month string to match the consumption object keys (e.g., "Feb-25")
  const monthKey = `${selectedMonth}-${selectedYear.substring(2)}`;
  
  // Process data for type breakdown
  const typeData = useMemo(() => {
    const typeMap = new Map<string, number>();
    
    electricityData.forEach(facility => {
      const consumption = facility.consumption[monthKey] || 0;
      const type = facility.type || 'Unknown';
      
      if (!isNaN(consumption) && consumption > 0) {
        const currentConsumption = typeMap.get(type) || 0;
        typeMap.set(type, currentConsumption + consumption);
      }
    });
    
    const totalConsumption = Array.from(typeMap.values()).reduce((sum, value) => sum + value, 0);
    
    const typesArray: TypeConsumption[] = Array.from(typeMap.entries())
      .map(([type, consumption]) => ({
        type,
        consumption,
        cost: consumption * ELECTRICITY_RATE,
        percentage: totalConsumption > 0 ? (consumption / totalConsumption) * 100 : 0,
        color: getTypeColor(type)
      }))
      .sort((a, b) => b.consumption - a.consumption);
    
    return typesArray;
  }, [electricityData, monthKey]);
  
  // Monthly consumption by type for last 3 months
  const monthlyTypeData = useMemo(() => {
    // Get last 3 months
    const months = [];
    let currentMonthIndex = availableMonths.findIndex(m => m.value === selectedMonth);
    
    for (let i = 0; i < 3; i++) {
      if (currentMonthIndex - i >= 0) {
        months.push(availableMonths[currentMonthIndex - i].value);
      }
    }
    
    // Get unique types
    const types = Array.from(new Set(electricityData.map(facility => facility.type)));
    
    // Create monthly data
    return months.map(month => {
      const monthKey = `${month}-${selectedYear.substring(2)}`;
      const monthData: any = { month: month };
      
      types.forEach(type => {
        const consumption = electricityData
          .filter(facility => facility.type === type)
          .reduce((total, facility) => total + (facility.consumption[monthKey] || 0), 0);
        
        if (type) {
          monthData[type] = consumption;
        }
      });
      
      return monthData;
    });
  }, [electricityData, selectedMonth, selectedYear]);
  
  // Get available months for types (this is a simplified version for demo)
  const availableMonths = [
    { value: 'Apr', label: 'April' },
    { value: 'May', label: 'May' },
    { value: 'Jun', label: 'June' },
    { value: 'Jul', label: 'July' },
    { value: 'Aug', label: 'August' },
    { value: 'Sep', label: 'September' },
    { value: 'Oct', label: 'October' },
    { value: 'Nov', label: 'November' },
    { value: 'Dec', label: 'December' },
    { value: 'Jan', label: 'January' },
    { value: 'Feb', label: 'February' },
    { value: 'Mar', label: 'March' }
  ];
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium">Distribution by Facility Type</CardTitle>
            <CardDescription>
              Current month consumption breakdown by facility type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeData}
                    cx="50%"
                    cy="50%"
                    outerRadius={110}
                    innerRadius={60}
                    labelLine={false}
                    dataKey="consumption"
                    nameKey="type"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                  >
                    {typeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name, props) => {
                      return [`${Number(value).toLocaleString()} kWh`, props.payload.type];
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium">Type Consumption Breakdown</CardTitle>
            <CardDescription>
              Consumption and cost by facility type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="text-left bg-muted/50">
                  <tr>
                    <th className="px-4 py-2 text-sm font-medium">Facility Type</th>
                    <th className="px-4 py-2 text-sm font-medium text-right">Consumption (kWh)</th>
                    <th className="px-4 py-2 text-sm font-medium text-right">Cost (OMR)</th>
                    <th className="px-4 py-2 text-sm font-medium text-right">%</th>
                  </tr>
                </thead>
                <tbody>
                  {typeData.map((type, index) => (
                    <tr key={index} className="border-b">
                      <td className="px-4 py-2">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: type.color }}></div>
                          <span>{type.type}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-right">{type.consumption.toLocaleString()}</td>
                      <td className="px-4 py-2 text-right">{type.cost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                      <td className="px-4 py-2 text-right">{type.percentage.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium">Monthly Consumption by Type</CardTitle>
          <CardDescription>
            Comparing consumption across recent months
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTypeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `${value.toLocaleString()}`} />
                <Tooltip 
                  formatter={(value, name) => [
                    `${Number(value).toLocaleString()} kWh`, 
                    name
                  ]} 
                />
                <Legend />
                {Array.from(new Set(electricityData.map(facility => facility.type)))
                  .filter(Boolean)
                  .map((type, index) => (
                    <Bar 
                      key={`${type}-${index}`} 
                      dataKey={type as string} 
                      name={type as string} 
                      fill={getTypeColor(type as string)} 
                      stackId="a"
                    />
                  ))}
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default ElectricityTypesTab;
