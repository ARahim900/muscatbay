import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ChartContainer } from '@/components/ui/chart';
import {
  BarChart, 
  Bar, 
  PieChart, 
  Pie,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { ElectricityRecord, TypeConsumption, TopConsumer } from '@/types/electricity';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface ElectricityComparisonProps {
  electricityData: ElectricityRecord[];
  electricityRate: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#FF6B6B'];

export const ElectricityComparison: React.FC<ElectricityComparisonProps> = ({
  electricityData,
  electricityRate
}) => {
  // Group consumption by facility type for Jan and Feb 2025
  const getConsumptionByType = (month: string): TypeConsumption[] => {
    const typeConsumption: Record<string, number> = {};
    
    electricityData.forEach(facility => {
      const type = facility.type;
      if (!type) return;
      
      const consumption = facility.consumption[month] || 0;
      if (!typeConsumption[type]) {
        typeConsumption[type] = 0;
      }
      
      typeConsumption[type] += consumption;
    });
    
    return Object.entries(typeConsumption)
      .map(([type, consumption]) => ({
        type,
        consumption,
        cost: consumption * electricityRate
      }))
      .sort((a, b) => b.consumption - a.consumption);
  };
  
  const typeConsumptionJan = getConsumptionByType('Jan-25');
  const typeConsumptionFeb = getConsumptionByType('Feb-25');
  
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
  
  // Calculate month-over-month changes by facility type
  const monthOverMonthChanges = typeConsumptionJan.map(janType => {
    const febType = typeConsumptionFeb.find(t => t.type === janType.type);
    const febConsumption = febType?.consumption || 0;
    const change = febConsumption - janType.consumption;
    const changePercent = (change / janType.consumption) * 100;
    
    return {
      type: janType.type,
      janConsumption: janType.consumption,
      febConsumption,
      change,
      changePercent
    };
  }).sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
  
  // Calculate total consumption for Jan and Feb
  const totalJanConsumption = typeConsumptionJan.reduce((sum, item) => sum + item.consumption, 0);
  const totalFebConsumption = typeConsumptionFeb.reduce((sum, item) => sum + item.consumption, 0);
  
  return (
    <div className="space-y-6">
      {/* Month-over-Month Change */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Month-over-Month Change by Facility Type</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ChartContainer className="h-96">
            <BarChart
              data={monthOverMonthChanges}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="type" width={150} />
              <Tooltip
                formatter={(value, name) => {
                  if (name === 'changePercent') {
                    return [`${Number(value).toFixed(1)}%`, 'Change %'];
                  }
                  return [Number(value).toLocaleString(), name];
                }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-3 border border-gray-200 shadow-md rounded-md">
                        <p className="font-medium">{data.type}</p>
                        <p className="text-sm">
                          Jan 2025: <span className="font-medium">{data.janConsumption.toLocaleString()} kWh</span>
                        </p>
                        <p className="text-sm">
                          Feb 2025: <span className="font-medium">{data.febConsumption.toLocaleString()} kWh</span>
                        </p>
                        <p className="text-sm">
                          Change: <span className={`font-medium ${data.change >= 0 ? 'text-amber-600' : 'text-green-600'}`}>
                            {data.change >= 0 ? '+' : ''}{data.change.toLocaleString()} kWh
                          </span>
                        </p>
                        <p className="text-sm">
                          Change %: <span className={`font-medium ${data.changePercent >= 0 ? 'text-amber-600' : 'text-green-600'}`}>
                            {data.changePercent >= 0 ? '+' : ''}{data.changePercent.toFixed(1)}%
                          </span>
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar 
                dataKey="changePercent" 
                name="Change %" 
                fill="#ff8042"
              >
                {monthOverMonthChanges.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.changePercent >= 0 ? '#ff8042' : '#00C49F'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
      
      {/* Facility Type Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">January 2025 Distribution</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ChartContainer className="h-80">
              <PieChart>
                <Pie
                  data={typeConsumptionJan}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="consumption"
                  nameKey="type"
                  label={({ type, percent }) => 
                    `${type}: ${(percent * 100).toFixed(1)}%`
                  }
                >
                  {typeConsumptionJan.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name, props) => {
                    if (name === "consumption") {
                      return [`${Number(value).toLocaleString()} kWh`, "Consumption"];
                    }
                    return [value, name];
                  }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 border border-gray-200 shadow-md rounded-md">
                          <p className="font-medium">{data.type}</p>
                          <p className="text-sm">
                            Consumption: <span className="font-medium">{data.consumption.toLocaleString()} kWh</span>
                          </p>
                          <p className="text-sm">
                            Cost: <span className="font-medium">{data.cost.toLocaleString()} OMR</span>
                          </p>
                          <p className="text-sm">
                            % of Total: <span className="font-medium">
                              {((data.consumption / totalJanConsumption) * 100).toFixed(1)}%
                            </span>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">February 2025 Distribution</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ChartContainer className="h-80">
              <PieChart>
                <Pie
                  data={typeConsumptionFeb}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="consumption"
                  nameKey="type"
                  label={({ type, percent }) => 
                    `${type}: ${(percent * 100).toFixed(1)}%`
                  }
                >
                  {typeConsumptionFeb.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name, props) => {
                    if (name === "consumption") {
                      return [`${Number(value).toLocaleString()} kWh`, "Consumption"];
                    }
                    return [value, name];
                  }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 border border-gray-200 shadow-md rounded-md">
                          <p className="font-medium">{data.type}</p>
                          <p className="text-sm">
                            Consumption: <span className="font-medium">{data.consumption.toLocaleString()} kWh</span>
                          </p>
                          <p className="text-sm">
                            Cost: <span className="font-medium">{data.cost.toLocaleString()} OMR</span>
                          </p>
                          <p className="text-sm">
                            % of Total: <span className="font-medium">
                              {((data.consumption / totalFebConsumption) * 100).toFixed(1)}%
                            </span>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
      
      {/* Top 5 Consumers Comparison */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Top 5 Consumers Comparison</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-md font-medium mb-4">January 2025</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100 text-left text-gray-600 text-xs">
                      <th className="px-4 py-2">Facility Name</th>
                      <th className="px-4 py-2">Type</th>
                      <th className="px-4 py-2 text-right">Consumption (kWh)</th>
                      <th className="px-4 py-2 text-right">Cost (OMR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topConsumersJan.map((consumer, index) => (
                      <tr 
                        key={`jan-${consumer.name}-${index}`}
                        className="border-b border-gray-200 hover:bg-gray-50"
                      >
                        <td className="px-4 py-2 font-medium">{consumer.name}</td>
                        <td className="px-4 py-2">
                          <span className="px-2 py-1 rounded-full text-xs bg-gray-100">
                            {consumer.type}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right">{consumer.consumption.toLocaleString()}</td>
                        <td className="px-4 py-2 text-right">{consumer.cost.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div>
              <h3 className="text-md font-medium mb-4">February 2025</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100 text-left text-gray-600 text-xs">
                      <th className="px-4 py-2">Facility Name</th>
                      <th className="px-4 py-2">Type</th>
                      <th className="px-4 py-2 text-right">Consumption (kWh)</th>
                      <th className="px-4 py-2 text-right">Cost (OMR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topConsumersFeb.map((consumer, index) => (
                      <tr 
                        key={`feb-${consumer.name}-${index}`}
                        className="border-b border-gray-200 hover:bg-gray-50"
                      >
                        <td className="px-4 py-2 font-medium">{consumer.name}</td>
                        <td className="px-4 py-2">
                          <span className="px-2 py-1 rounded-full text-xs bg-gray-100">
                            {consumer.type}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right">{consumer.consumption.toLocaleString()}</td>
                        <td className="px-4 py-2 text-right">{consumer.cost.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Summary Comparison */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Monthly Summary Comparison</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-6 rounded-lg flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">January 2025</h3>
                <p className="text-3xl font-bold mt-2">{totalJanConsumption.toLocaleString()} kWh</p>
                <p className="text-lg text-gray-500">{(totalJanConsumption * electricityRate).toLocaleString()} OMR</p>
              </div>
              <div className="text-gray-500">
                <p>Top Type: {typeConsumptionJan[0]?.type}</p>
                <p>Top Consumer: {topConsumersJan[0]?.name}</p>
              </div>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">February 2025</h3>
                <p className="text-3xl font-bold mt-2">{totalFebConsumption.toLocaleString()} kWh</p>
                <p className="text-lg text-gray-500">{(totalFebConsumption * electricityRate).toLocaleString()} OMR</p>
              </div>
              <div className="text-gray-500">
                <p>Top Type: {typeConsumptionFeb[0]?.type}</p>
                <p>Top Consumer: {topConsumersFeb[0]?.name}</p>
              </div>
            </div>
            
            <div className="md:col-span-2 bg-gray-50 p-6 rounded-lg">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Month-over-Month Change</h3>
                <div className="flex items-center">
                  {totalFebConsumption > totalJanConsumption ? (
                    <TrendingUp className="w-6 h-6 text-amber-600 mr-2" />
                  ) : (
                    <TrendingDown className="w-6 h-6 text-green-600 mr-2" />
                  )}
                  <span 
                    className={`text-xl font-bold ${
                      totalFebConsumption > totalJanConsumption ? 'text-amber-600' : 'text-green-600'
                    }`}
                  >
                    {totalFebConsumption > totalJanConsumption ? '+' : ''}
                    {(totalFebConsumption - totalJanConsumption).toLocaleString()} kWh
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4">
                <p className="text-gray-500">Cost Change</p>
                <span 
                  className={`font-medium ${
                    totalFebConsumption > totalJanConsumption ? 'text-amber-600' : 'text-green-600'
                  }`}
                >
                  {totalFebConsumption > totalJanConsumption ? '+' : ''}
                  {((totalFebConsumption - totalJanConsumption) * electricityRate).toLocaleString()} OMR
                </span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-gray-500">Percentage Change</p>
                <span 
                  className={`font-medium ${
                    totalFebConsumption > totalJanConsumption ? 'text-amber-600' : 'text-green-600'
                  }`}
                >
                  {totalFebConsumption > totalJanConsumption ? '+' : ''}
                  {((totalFebConsumption - totalJanConsumption) / totalJanConsumption * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
