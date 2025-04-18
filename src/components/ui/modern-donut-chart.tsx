
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ModernDonutChartProps {
  data: Array<{
    name: string;
    value: number;
    color?: string;
  }>;
  title?: string;
  className?: string;
}

const DEFAULT_COLORS = {
  'Retail': '#6366f1',
  'Residential (Villas)': '#22c55e',
  'Residential (Apart)': '#a855f7',
  'IRR_Services': '#f59e0b',
  'MB_Common': '#ef4444',
  'D_Building_Bulk': '#3b82f6',
  'D_Building_Common': '#ec4899',
  'Loss': '#64748b'
};

export const ModernDonutChart: React.FC<ModernDonutChartProps> = ({ 
  data, 
  title,
  className 
}) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={120}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`}
                    fill={entry.color || DEFAULT_COLORS[entry.name as keyof typeof DEFAULT_COLORS] || `#${Math.floor(Math.random()*16777215).toString(16)}`}
                    strokeWidth={1}
                    stroke="white"
                  />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    const percentage = ((data.value / total) * 100).toFixed(1);
                    
                    return (
                      <div className="bg-white p-2 shadow-lg rounded-lg border border-gray-200">
                        <p className="font-medium text-sm">{data.name}</p>
                        <p className="text-sm text-gray-600">
                          {data.value.toLocaleString()} m³ ({percentage}%)
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          
          {/* Center Stats */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-3xl font-bold">{total.toLocaleString()}</div>
              <div className="text-sm text-gray-500">Total m³</div>
            </div>
          </div>
          
          {/* Legend */}
          <div className="absolute top-0 right-0 space-y-1">
            {data.map((entry, index) => (
              <div key={index} className="flex items-center text-sm gap-2">
                <div 
                  className="w-3 h-3 rounded"
                  style={{ 
                    backgroundColor: entry.color || DEFAULT_COLORS[entry.name as keyof typeof DEFAULT_COLORS] 
                  }}
                />
                <span className="text-gray-700">{entry.name}</span>
                <span className="text-gray-500">
                  {((entry.value / total) * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ModernDonutChart;
