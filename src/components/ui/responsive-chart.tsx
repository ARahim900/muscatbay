
import React from 'react';
import { useIsMobile, useIsTablet } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps
} from 'recharts';

// Enhanced responsive bar chart component
export const ResponsiveBarChart = ({
  data,
  xKey,
  yKey,
  barColor = '#0088FE',
  className,
  xLabel,
  yLabel,
  xFormatter,
  yFormatter,
  barSize,
  legend,
  tooltip,
  horizontal = false,
  height = 300,
  margin,
  barRadius = [0, 0, 0, 0]
}: {
  data: any[];
  xKey: string;
  yKey: string;
  barColor?: string;
  className?: string;
  xLabel?: string;
  yLabel?: string;
  xFormatter?: (value: any) => string;
  yFormatter?: (value: any) => string;
  barSize?: number;
  legend?: boolean;
  tooltip?: React.FC<TooltipProps<any, any>>;
  horizontal?: boolean;
  height?: number;
  margin?: { top?: number; right?: number; bottom?: number; left?: number };
  barRadius?: [number, number, number, number]; // top-left, top-right, bottom-right, bottom-left
}) => {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  
  // Default margins that work well on different screen sizes
  const defaultMargin = {
    top: 20,
    right: isMobile ? 10 : 30,
    left: isMobile ? (horizontal ? 60 : 10) : (horizontal ? 100 : 40),
    bottom: isMobile ? 60 : 30,
    ...margin
  };
  
  // Adjust tick sizes for mobile
  const tickFontSize = isMobile ? 10 : 12;

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        {horizontal ? (
          <BarChart
            data={data}
            layout="vertical"
            margin={defaultMargin}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              type="number"
              tick={{ fontSize: tickFontSize }}
              label={xLabel && !isMobile ? { value: xLabel, position: 'bottom', offset: 0 } : undefined}
              tickFormatter={xFormatter}
            />
            <YAxis 
              type="category" 
              dataKey={xKey}
              width={defaultMargin.left}
              tick={{ fontSize: tickFontSize }}
              label={yLabel && !isMobile ? { value: yLabel, angle: -90, position: 'left', offset: -10 } : undefined}
            />
            {tooltip ? <Tooltip content={tooltip} /> : <Tooltip />}
            {legend && <Legend wrapperStyle={{ fontSize: tickFontSize }} />}
            <Bar 
              dataKey={yKey} 
              fill={barColor} 
              barSize={barSize || (isMobile ? 20 : 30)} 
              radius={barRadius}
            />
          </BarChart>
        ) : (
          <BarChart
            data={data}
            margin={defaultMargin}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey={xKey} 
              tick={{ fontSize: tickFontSize }}
              label={xLabel && !isMobile ? { value: xLabel, position: 'bottom', offset: 0 } : undefined}
              tickFormatter={xFormatter}
              angle={isMobile ? -45 : undefined}
              textAnchor={isMobile ? "end" : "middle"}
              height={isMobile ? 80 : 30}
            />
            <YAxis 
              tick={{ fontSize: tickFontSize }}
              label={yLabel && !isMobile ? { value: yLabel, angle: -90, position: 'left', offset: -10 } : undefined}
              tickFormatter={yFormatter}
            />
            {tooltip ? <Tooltip content={tooltip} /> : <Tooltip />}
            {legend && <Legend wrapperStyle={{ fontSize: tickFontSize }} />}
            <Bar 
              dataKey={yKey} 
              fill={barColor} 
              barSize={barSize || (isMobile ? 20 : 30)} 
              radius={barRadius}
            />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

export default ResponsiveBarChart;
