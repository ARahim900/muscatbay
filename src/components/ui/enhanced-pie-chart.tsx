
import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, Sector, PieLabelRenderProps } from 'recharts';
import { ChartTooltip } from './chart';

interface EnhancedPieChartProps {
  data: Array<{
    name: string;
    value: number;
    color?: string;
  }>;
  colors?: string[];
  innerRadius?: number;
  outerRadius?: number;
  className?: string;
  showLegend?: boolean;
  showLabels?: boolean;
  valueFormatter?: (value: number) => string;
  labelFormatter?: (entry: any) => string;
  tooltipFormatter?: (value: number, name: string, props: any) => React.ReactNode;
}

// This helps avoid label collisions by calculating positions more carefully
const renderCustomizedLabel = (props: PieLabelRenderProps, formatter?: (entry: any) => string) => {
  const { cx, cy, midAngle, innerRadius, outerRadius, percent, index, name, value } = props;
  
  // Filter out small segments (less than 5%) to avoid label clutter
  if (percent < 0.05) return null;
  
  // Calculate position - move labels further out for clarity
  const radius = Number(outerRadius) + 25;
  const x = Number(cx) + radius * Math.cos(-midAngle * Math.PI / 180);
  const y = Number(cy) + radius * Math.sin(-midAngle * Math.PI / 180);
  
  // Determine text anchor based on angle
  const isRightSide = x > Number(cx);
  
  // Format the label
  const formattedLabel = formatter 
    ? formatter({ name, value, percent })
    : `${name}: ${(percent * 100).toFixed(1)}%`;
  
  return (
    <g>
      {/* Connecting line */}
      <path
        d={`M${Number(cx)},${Number(cy)} L${Number(cx) + (Number(outerRadius)) * Math.cos(-midAngle * Math.PI / 180)},${Number(cy) + (Number(outerRadius)) * Math.sin(-midAngle * Math.PI / 180)} L${x},${y}`}
        stroke="#888"
        fill="none"
        strokeWidth={1}
      />
      {/* Label */}
      <text
        x={x}
        y={y}
        fill="#333"
        textAnchor={isRightSide ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={12}
        fontWeight="500"
      >
        {formattedLabel}
      </text>
    </g>
  );
};

// Active shape for hover effect
const renderActiveShape = (props: any) => {
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
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

export const EnhancedPieChart: React.FC<EnhancedPieChartProps> = ({
  data,
  colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#FF6B6B'],
  innerRadius = 0,
  outerRadius = 80,
  className,
  showLegend = true,
  showLabels = true,
  valueFormatter,
  labelFormatter,
  tooltipFormatter
}) => {
  const [activeIndex, setActiveIndex] = React.useState<number | undefined>(undefined);
  
  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };
  
  const onPieLeave = () => {
    setActiveIndex(undefined);
  };

  return (
    <div className={className || 'w-full h-full min-h-[300px]'}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart margin={{ top: 20, right: 30, left: 30, bottom: 20 }}>
          <Pie
            activeIndex={activeIndex}
            activeShape={renderActiveShape}
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            dataKey="value"
            nameKey="name"
            onMouseEnter={onPieEnter}
            onMouseLeave={onPieLeave}
            labelLine={false}
            label={showLabels ? (props) => renderCustomizedLabel(props, labelFormatter) : false}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color || colors[index % colors.length]} 
              />
            ))}
          </Pie>
          
          <Tooltip
            content={({active, payload}) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                const value = valueFormatter ? valueFormatter(data.value) : data.value;
                
                if (tooltipFormatter) {
                  return tooltipFormatter(data.value, data.name, data);
                }
                
                return (
                  <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 shadow-md rounded-md">
                    <p className="font-medium">{data.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Value: <span className="font-medium">{value}</span>
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Percentage: <span className="font-medium">{(data.value / data.total * 100).toFixed(1)}%</span>
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          
          {showLegend && (
            <Legend 
              layout="horizontal" 
              verticalAlign="bottom" 
              align="center"
              wrapperStyle={{ paddingTop: '20px' }}
            />
          )}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default EnhancedPieChart;
