
import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Sector } from 'recharts';
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

// Modern vibrant color palette with better contrast
const DEFAULT_COLORS = {
  'Retail': '#4285F4', // Bright blue
  'Residential (Villas)': '#34A853', // Green
  'Residential (Apart)': '#A142F4', // Purple
  'IRR_Services': '#FBBC05', // Yellow/Gold
  'MB_Common': '#EA4335', // Red
  'D_Building_Bulk': '#5570F6', // Indigo
  'D_Building_Common': '#FF64B4', // Pink
  'Loss': '#2BD9D0', // Teal
  // Zone colors
  'ZONE FM': '#4285F4',
  'ZONE 3A': '#34A853',
  'ZONE 3B': '#A142F4',
  'ZONE 5': '#FBBC05',
  'ZONE 8': '#EA4335',
  'Village Square': '#5570F6'
};

// Active shape for hover effect - creates the expanded slice on hover
const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        opacity={0.9}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 8}
        outerRadius={outerRadius + 12}
        fill={fill}
      />
    </g>
  );
};

export const ModernDonutChart: React.FC<ModernDonutChartProps> = ({ 
  data, 
  title,
  className 
}) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(null);
  };

  // Render label with line connector - this creates the labels outside the chart
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name, value }: any) => {
    // Filter out small segments (less than 3%) to avoid label clutter
    if (percent < 0.03) return null;
    
    const RADIAN = Math.PI / 180;
    // Position the label outside the pie with some extra space
    const radius = outerRadius * 1.2;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    // Determine which side of the chart we're on
    const isRightSide = x > cx;
    
    // Format the label with percentage
    const labelText = `${name} (${(percent * 100).toFixed(1)}%)`;
    
    // Draw line from segment to label
    const innerX = cx + (innerRadius + (outerRadius - innerRadius) * 0.5) * Math.cos(-midAngle * RADIAN);
    const innerY = cy + (innerRadius + (outerRadius - innerRadius) * 0.5) * Math.sin(-midAngle * RADIAN);
    
    const middleX = cx + (outerRadius + 30) * Math.cos(-midAngle * RADIAN);
    const middleY = cy + (outerRadius + 30) * Math.sin(-midAngle * RADIAN);
    
    const color = data[index].color || DEFAULT_COLORS[name as keyof typeof DEFAULT_COLORS] || '#666';
    
    return (
      <g>
        {/* Connector line from pie to label */}
        <path 
          d={`M${innerX},${innerY}L${middleX},${middleY}L${isRightSide ? x + 5 : x - 5},${middleY}`} 
          stroke={color}
          fill="none"
          strokeWidth={1}
        />
        
        {/* Label text */}
        <text 
          x={isRightSide ? x + 10 : x - 10} 
          y={middleY} 
          fill={color}
          textAnchor={isRightSide ? 'start' : 'end'}
          dominantBaseline="central"
          fontSize={12}
          fontWeight="500"
        >
          {labelText}
        </text>
      </g>
    );
  };

  return (
    <Card className={cn("w-full overflow-visible", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] relative overflow-visible">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 20, right: 80, bottom: 20, left: 80 }}>
              <Pie
                activeIndex={activeIndex !== null ? activeIndex : undefined}
                activeShape={renderActiveShape}
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={120}
                paddingAngle={2}
                dataKey="value"
                labelLine={true}
                label={renderCustomizedLabel}
                onMouseEnter={onPieEnter}
                onMouseLeave={onPieLeave}
                animationDuration={800}
                animationBegin={0}
                animationEasing="ease-out"
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`}
                    fill={entry.color || DEFAULT_COLORS[entry.name as keyof typeof DEFAULT_COLORS] || `#${Math.floor(Math.random()*16777215).toString(16)}`}
                    strokeWidth={2}
                    stroke="#fff"
                  />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    const percentage = ((data.value / total) * 100).toFixed(1);
                    
                    return (
                      <div className="bg-white p-3 shadow-lg rounded-lg border border-gray-200">
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
        </div>
      </CardContent>
    </Card>
  );
};

export default ModernDonutChart;
