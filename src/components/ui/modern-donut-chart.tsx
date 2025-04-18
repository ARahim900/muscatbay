
import React from 'react';
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

// Updated modern color palette with better visibility and contrast
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

// Active shape for hover effect
const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 6}
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
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
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
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(null);
  };

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name, value }: any) => {
    // Filter out small segments (less than 3%) to avoid label clutter
    if (percent < 0.03) return null;
    
    const RADIAN = Math.PI / 180;
    // Positioning the label outside the pie
    const radius = outerRadius * 1.15;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    // Determine text anchor based on quadrant
    const isRightSide = x > cx;
    
    // Label with percentage
    const labelText = `${name} (${(percent * 100).toFixed(1)}%)`;
    
    return (
      <text 
        x={x} 
        y={y} 
        fill={data[index].color || DEFAULT_COLORS[name as keyof typeof DEFAULT_COLORS] || '#666'}
        textAnchor={isRightSide ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={13}
        fontWeight="500"
      >
        {labelText}
      </text>
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
            <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
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
                labelLine={false}
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
          
          {/* Legend - Removed from inside chart for cleaner look, will appear below */}
          <div className="absolute bottom-0 left-0 right-0 flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4">
            {data.map((entry, index) => (
              <div key={index} className="flex items-center text-sm">
                <div 
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ 
                    backgroundColor: entry.color || DEFAULT_COLORS[entry.name as keyof typeof DEFAULT_COLORS] 
                  }}
                />
                <span className="text-gray-700 whitespace-nowrap">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ModernDonutChart;
