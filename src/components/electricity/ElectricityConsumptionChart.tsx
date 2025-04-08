
import React, { useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface ElectricityConsumptionChartProps {
  data: any[];
}

const ElectricityConsumptionChart: React.FC<ElectricityConsumptionChartProps> = ({ data }) => {
  // Process the data for the chart
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const year = '25'; // Assuming data is for 2025
    
    // Create a map of monthly consumption
    const monthlyConsumption = new Map<string, number>();
    
    // Initialize all months with 0
    months.forEach(month => {
      monthlyConsumption.set(`${month}-${year}`, 0);
    });
    
    // Aggregate consumption by month
    data.forEach(record => {
      months.forEach(month => {
        const monthColumn = `${month}-${year}`;
        if (record[monthColumn]) {
          const consumption = parseFloat(record[monthColumn]);
          if (!isNaN(consumption)) {
            monthlyConsumption.set(
              monthColumn, 
              (monthlyConsumption.get(monthColumn) || 0) + consumption
            );
          }
        }
      });
    });
    
    // Convert to array for the chart
    return Array.from(monthlyConsumption.entries())
      .map(([month, consumption]) => ({
        month: month.split('-')[0], // Just get the month abbreviation
        consumption
      }))
      .sort((a, b) => months.indexOf(a.month) - months.indexOf(b.month));
  }, [data]);

  // Custom tooltip formatter
  const tooltipFormatter = (value: number) => {
    return `${value.toLocaleString()} kWh`;
  };

  // If no data is available
  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] bg-gray-50 rounded-lg">
        <p className="text-gray-500">No consumption data available</p>
      </div>
    );
  }

  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorConsumption" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="month" 
            tick={{ fill: '#64748b', fontSize: 12 }} 
            axisLine={{ stroke: '#cbd5e1' }} 
          />
          <YAxis 
            tick={{ fill: '#64748b', fontSize: 12 }} 
            axisLine={{ stroke: '#cbd5e1' }} 
            tickFormatter={value => value === 0 ? '0' : `${(value / 1000).toFixed(1)}k`} 
          />
          <Tooltip 
            formatter={tooltipFormatter}
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              border: '1px solid #e2e8f0'
            }} 
            labelStyle={{
              fontWeight: 'bold',
              color: '#334155',
              marginBottom: '5px',
              borderBottom: '1px solid #e2e8f0',
              paddingBottom: '4px'
            }}
          />
          <Legend />
          <Area 
            type="monotone" 
            dataKey="consumption" 
            name="Consumption" 
            stroke="#f59e0b" 
            fillOpacity={1} 
            fill="url(#colorConsumption)" 
            strokeWidth={2}
            activeDot={{ r: 6, strokeWidth: 1, stroke: '#fff' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ElectricityConsumptionChart;
