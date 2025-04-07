
import React from 'react';
import {
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

interface ResponsiveBarChartProps {
  data: any[];
  xKey: string;
  yKey: string;
  horizontal?: boolean;
  barColor?: string;
  xLabel?: string;
  yLabel?: string;
  height?: number;
  barRadius?: [number, number, number, number];
  xFormatter?: (value: any) => string;
  yFormatter?: (value: any) => string;
  tooltip?: (props: any) => React.ReactNode;
}

const ResponsiveBarChart: React.FC<ResponsiveBarChartProps> = ({
  data,
  xKey,
  yKey,
  horizontal = false,
  barColor = '#0088FE',
  xLabel,
  yLabel,
  height = 300,
  barRadius = [0, 0, 0, 0],
  xFormatter,
  yFormatter,
  tooltip
}) => {
  if (!data || data.length === 0) {
    return (
      <div 
        style={{ height: height }} 
        className="flex items-center justify-center text-gray-500 bg-gray-50 rounded-lg"
      >
        No data available
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: height }}>
      <ResponsiveContainer>
        <RechartsBarChart
          data={data}
          layout={horizontal ? 'vertical' : 'horizontal'}
          margin={{ top: 10, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey={horizontal ? undefined : xKey}
            type={horizontal ? 'number' : 'category'}
            label={xLabel ? { value: xLabel, position: 'insideBottom', offset: -5 } : undefined}
            tickFormatter={xFormatter}
          />
          <YAxis 
            dataKey={horizontal ? xKey : undefined}
            type={horizontal ? 'category' : 'number'}
            label={yLabel ? { value: yLabel, angle: -90, position: 'insideLeft' } : undefined}
            tickFormatter={yFormatter}
          />
          <Tooltip content={tooltip} />
          <Legend />
          <Bar 
            dataKey={yKey} 
            name={yKey} 
            fill={barColor} 
            radius={barRadius}
          />
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ResponsiveBarChart;
