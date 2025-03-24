
import React, { ReactNode } from "react";
import { 
  ResponsiveContainer, 
  BarChart as RechartsBarChart,
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  LineChart as RechartsLineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  AreaChart as RechartsAreaChart,
  Area,
  TooltipProps
} from "recharts";
import { cn } from "@/lib/utils";

type ChartProps = {
  data: any[];
  height?: number;
  className?: string;
  children?: ReactNode;
};

export const ChartContainer: React.FC<ChartProps> = ({ 
  data, 
  height = 300, 
  className,
  children
}: ChartProps) => {
  if (!data || data.length === 0) {
    return (
      <div className={cn("flex items-center justify-center w-full bg-muted/20 rounded-md", className)} style={{ height }}>
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        {React.Children.only(children as React.ReactElement)}
      </ResponsiveContainer>
    </div>
  );
};

type LineChartProps = ChartProps & {
  lines: Array<{
    dataKey: string;
    stroke?: string;
    name?: string;
    type?: "monotone" | "basis" | "linear" | "natural" | "step";
  }>;
  xAxisDataKey: string;
  grid?: boolean;
  tickFormatter?: (value: any) => string;
  tooltipFormatter?: (value: any) => [string, string];
  tooltipLabelFormatter?: (label: any) => string;
};

export const LineChart = ({ 
  data, 
  lines, 
  xAxisDataKey, 
  height,
  grid = true,
  tickFormatter,
  tooltipFormatter,
  tooltipLabelFormatter,
  className
}: LineChartProps) => {
  return (
    <ChartContainer data={data} height={height} className={className}>
      <RechartsLineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        {grid && <CartesianGrid strokeDasharray="3 3" />}
        <XAxis 
          dataKey={xAxisDataKey} 
          tick={{ fontSize: 12 }}
          tickLine={{ stroke: '#888' }}
          axisLine={{ stroke: '#888' }}
        />
        <YAxis 
          tick={{ fontSize: 12 }}
          tickLine={{ stroke: '#888' }}
          axisLine={{ stroke: '#888' }}
          tickFormatter={tickFormatter}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '6px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgb(226, 232, 240)'
          }}
          formatter={tooltipFormatter as any}
          labelFormatter={tooltipLabelFormatter}
        />
        <Legend />
        {lines.map((line, index) => (
          <Line
            key={index}
            type={line.type || "monotone"}
            dataKey={line.dataKey}
            stroke={line.stroke}
            name={line.name || line.dataKey}
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 6 }}
          />
        ))}
      </RechartsLineChart>
    </ChartContainer>
  );
};

type BarChartProps = ChartProps & {
  bars: Array<{
    dataKey: string;
    fill?: string;
    name?: string;
    stackId?: string;
  }>;
  xAxisDataKey: string;
  grid?: boolean;
  tickFormatter?: (value: any) => string;
  layout?: "horizontal" | "vertical";
  tooltipFormatter?: (value: any) => [string, string];
  tooltipLabelFormatter?: (label: string) => string;
};

export const BarChart = ({ 
  data, 
  bars, 
  xAxisDataKey, 
  height,
  grid = true,
  layout = "horizontal",
  tickFormatter,
  tooltipFormatter,
  tooltipLabelFormatter,
  className
}: BarChartProps) => {
  return (
    <ChartContainer data={data} height={height} className={className}>
      <RechartsBarChart 
        data={data} 
        layout={layout}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        {grid && <CartesianGrid strokeDasharray="3 3" />}
        <XAxis 
          dataKey={xAxisDataKey} 
          tick={{ fontSize: 12 }}
          tickLine={{ stroke: '#888' }}
          axisLine={{ stroke: '#888' }}
          type={layout === "horizontal" ? "category" : "number"}
        />
        <YAxis 
          tick={{ fontSize: 12 }}
          tickLine={{ stroke: '#888' }}
          axisLine={{ stroke: '#888' }}
          tickFormatter={tickFormatter}
          type={layout === "horizontal" ? "number" : "category"}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '6px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgb(226, 232, 240)'
          }}
          formatter={tooltipFormatter as any}
          labelFormatter={tooltipLabelFormatter as any}
        />
        <Legend />
        {bars.map((bar, index) => (
          <Bar 
            key={index} 
            dataKey={bar.dataKey} 
            fill={bar.fill} 
            name={bar.name || bar.dataKey}
            stackId={bar.stackId}
            radius={[4, 4, 0, 0]}
          />
        ))}
      </RechartsBarChart>
    </ChartContainer>
  );
};

const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', 
  '#82CA9D', '#FF6B6B', '#6A6AFF', '#FFAB6A', '#62DADD'
];

type PieChartProps = ChartProps & {
  dataKey: string;
  nameKey: string;
  colors?: string[];
  innerRadius?: number;
  outerRadius?: number;
  paddingAngle?: number;
  tooltipFormatter?: (value: number | string, name: string) => [string, string];
};

export const PieChart = ({
  data,
  dataKey,
  nameKey,
  height,
  colors = COLORS,
  innerRadius = 0,
  outerRadius = 80,
  paddingAngle = 2,
  tooltipFormatter,
  className
}: PieChartProps) => {
  return (
    <ChartContainer data={data} height={height} className={className}>
      <RechartsPieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          paddingAngle={paddingAngle}
          dataKey={dataKey}
          nameKey={nameKey}
          label={(entry) => entry.name}
        >
          {data.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={colors[index % colors.length]} 
            />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '6px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgb(226, 232, 240)'
          }}
          formatter={tooltipFormatter as any}
        />
        <Legend />
      </RechartsPieChart>
    </ChartContainer>
  );
};

type AreaChartProps = ChartProps & {
  areas: Array<{
    dataKey: string;
    fill?: string;
    stroke?: string;
    name?: string;
    stackId?: string;
    type?: "monotone" | "basis" | "linear" | "natural" | "step";
  }>;
  xAxisDataKey: string;
  grid?: boolean;
  tickFormatter?: (value: any) => string;
  tooltipFormatter?: (value: any) => [string, string];
  tooltipLabelFormatter?: (label: any) => string;
};

export const AreaChart = ({
  data,
  areas,
  xAxisDataKey,
  height,
  grid = true,
  tickFormatter,
  tooltipFormatter,
  tooltipLabelFormatter,
  className
}: AreaChartProps) => {
  return (
    <ChartContainer data={data} height={height} className={className}>
      <RechartsAreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        {grid && <CartesianGrid strokeDasharray="3 3" />}
        <XAxis 
          dataKey={xAxisDataKey} 
          tick={{ fontSize: 12 }}
          tickLine={{ stroke: '#888' }}
          axisLine={{ stroke: '#888' }}
        />
        <YAxis 
          tick={{ fontSize: 12 }}
          tickLine={{ stroke: '#888' }}
          axisLine={{ stroke: '#888' }}
          tickFormatter={tickFormatter}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '6px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgb(226, 232, 240)'
          }}
          formatter={tooltipFormatter as any}
          labelFormatter={tooltipLabelFormatter}
        />
        <Legend />
        {areas.map((area, index) => (
          <Area
            key={index}
            type={area.type || "monotone"}
            dataKey={area.dataKey}
            fill={area.fill}
            stroke={area.stroke || area.fill}
            name={area.name || area.dataKey}
            stackId={area.stackId}
            fillOpacity={0.6}
          />
        ))}
      </RechartsAreaChart>
    </ChartContainer>
  );
};
