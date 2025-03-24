import * as React from "react";
import { Bar, BarChart, CartesianGrid, Cell, Label, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Sector, Tooltip, XAxis, YAxis } from "recharts";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";

interface ChartProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
}

export function Chart({
  title,
  description,
  className,
  children,
  ...props
}: ChartProps) {
  return (
    <div className={cn("space-y-3", className)} {...props}>
      {title && <h4 className="text-sm font-medium">{title}</h4>}
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      <div className="h-[200px]">{children}</div>
    </div>
  );
}

// Add ChartContainer component that was missing but is being imported by other files
export function ChartContainer({
  children,
  className,
  config = {},
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  config?: Record<string, Record<string, unknown>>;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("h-80 w-full", className)} {...props}>
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}

// Add missing ChartTooltip component
export function ChartTooltip({
  children,
  ...props
}: React.PropsWithChildren<{ className?: string }>) {
  return <div className="rounded-lg border bg-background p-2 shadow-md" {...props}>{children}</div>;
}

// Add missing ChartTooltipContent
export function ChartTooltipContent({
  label,
  payload,
  formatter,
}: {
  label?: string;
  payload?: Array<{ value: number; name: string; }>;
  formatter?: (value: number, name: string) => [string, string];
}) {
  if (!payload || payload.length === 0) return null;
  
  return (
    <div className="space-y-1.5">
      {label && <p className="text-xs font-medium">{label}</p>}
      {payload.map((item, index) => (
        <div key={`tooltip-item-${index}`} className="flex items-center justify-between gap-2 text-xs">
          <span className="font-medium">{item.name}:</span>
          <span>{
            formatter 
              ? formatter(Number(item.value), item.name)[0] 
              : typeof item.value === 'number' 
                ? item.value.toLocaleString() 
                : item.value
          }</span>
        </div>
      ))}
    </div>
  );
}

interface ChartBarProps {
  data: any[];
  xAxisKey: string;
  yAxisKey: string;
  colors?: string[];
  gradientColors?: string[];
  showXAxis?: boolean;
  showYAxis?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  showGrid?: boolean;
  stack?: boolean;
  horizontal?: boolean;
  hideGridLines?: boolean;
  chartHeight?: number;
  showLabels?: boolean;
  formatValue?: (value: number) => string;
  formatLabel?: (label: string) => string;
  formatTooltip?: (value: number, name: string) => React.ReactNode;
  onClick?: (data: any) => void;
}

export function ChartBar({
  data,
  xAxisKey,
  yAxisKey,
  colors = ["#3b82f6", "#34d399", "#f59e0b", "#ef4444"],
  gradientColors,
  showXAxis = true,
  showYAxis = true,
  showLegend = false,
  showTooltip = true,
  showGrid = true,
  stack = false,
  horizontal = false,
  hideGridLines = false,
  chartHeight = 200,
  showLabels = false,
  formatValue,
  formatLabel,
  formatTooltip,
  onClick,
}: ChartBarProps) {
  // Use the theme hook to get the current theme
  const { theme } = useTheme();
  
  // Define theme-based colors
  const textColor = "#666666"; // Light mode text color
  const gridColor = "#e5e7eb"; // Light mode grid color
  const tooltipBg = "#ffffff"; // Light mode tooltip background

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <BarChart
        data={data}
        layout={horizontal ? "vertical" : "horizontal"}
        onClick={onClick}
      >
        {showGrid && !hideGridLines && (
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke={gridColor} 
            vertical={!horizontal} 
            horizontal={horizontal} 
          />
        )}
        {showTooltip && (
          <Tooltip
            cursor={{ fill: "rgba(0, 0, 0, 0.05)" }}
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="rounded-lg border bg-background shadow-md p-2 min-w-[150px]">
                    <div className="text-xs font-medium mb-1">
                      {formatLabel ? formatLabel(label) : label}
                    </div>
                    {payload.map((item, index) => (
                      <div
                        key={`tooltip-item-${index}`}
                        className="flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-1">
                          <div
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <span>{item.name}</span>
                        </div>
                        <div className="font-medium">
                          {formatTooltip
                            ? formatTooltip(Number(item.value), item.name)
                            : formatValue
                            ? formatValue(Number(item.value))
                            : item.value}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              }
              return null;
            }}
          />
        )}
        {horizontal ? (
          <>
            <XAxis
              type="number"
              tick={{ fill: textColor, fontSize: 12 }}
              tickFormatter={formatValue}
              stroke={gridColor}
              hide={!showXAxis}
            />
            <YAxis
              type="category"
              dataKey={xAxisKey}
              tick={{ fill: textColor, fontSize: 12 }}
              tickFormatter={formatLabel}
              stroke={gridColor}
              hide={!showYAxis}
              width={80}
            />
          </>
        ) : (
          <>
            <XAxis
              type="category"
              dataKey={xAxisKey}
              tick={{ fill: textColor, fontSize: 12 }}
              tickFormatter={formatLabel}
              stroke={gridColor}
              hide={!showXAxis}
            />
            <YAxis
              type="number"
              tick={{ fill: textColor, fontSize: 12 }}
              tickFormatter={formatValue}
              stroke={gridColor}
              hide={!showYAxis}
              width={50}
            />
          </>
        )}
        {showLegend && (
          <Legend
            wrapperStyle={{ fontSize: 12 }}
            formatter={(value) => (
              <span style={{ color: textColor }}>{value}</span>
            )}
          />
        )}
        <Bar
          dataKey={yAxisKey}
          fill={colors[0]}
          radius={[4, 4, 0, 0]}
          maxBarSize={60}
        >
          {showLabels && (
            <Label
              position="top"
              content={({ x, y, width, height, value }) => {
                return (
                  <text
                    x={x + width / 2}
                    y={y - 10}
                    fill={textColor}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-xs"
                  >
                    {formatValue ? formatValue(Number(value)) : value}
                  </text>
                );
              }}
            />
          )}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

interface ChartLineProps {
  data: any[];
  xAxisKey: string;
  yAxisKey: string | string[];
  colors?: string[];
  showXAxis?: boolean;
  showYAxis?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  showGrid?: boolean;
  showDots?: boolean;
  hideGridLines?: boolean;
  chartHeight?: number;
  smooth?: boolean;
  formatValue?: (value: number) => string;
  formatLabel?: (label: string) => string;
  onClick?: (data: any) => void;
}

export function ChartLine({
  data,
  xAxisKey,
  yAxisKey,
  colors = ["#3b82f6", "#10b981", "#ef4444", "#f59e0b", "#a855f7"],
  showXAxis = true,
  showYAxis = true,
  showLegend = true,
  showTooltip = true,
  showGrid = true,
  showDots = true,
  hideGridLines = false,
  chartHeight = 200,
  smooth = true,
  formatValue,
  formatLabel,
  onClick,
}: ChartLineProps) {
  // Use the theme hook to get the current theme
  const { theme } = useTheme();
  
  // Define theme-based colors for light theme
  const textColor = "#666666";
  const gridColor = "#e5e7eb";
  const tooltipBg = "#ffffff";

  // Convert single yAxisKey to array for consistent processing
  const yAxisKeys = Array.isArray(yAxisKey) ? yAxisKey : [yAxisKey];

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <LineChart data={data} onClick={onClick}>
        {showGrid && !hideGridLines && (
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
        )}
        <XAxis
          dataKey={xAxisKey}
          tick={{ fill: textColor, fontSize: 12 }}
          tickFormatter={formatLabel}
          stroke={gridColor}
          hide={!showXAxis}
          padding={{ left: 10, right: 10 }}
        />
        <YAxis
          tick={{ fill: textColor, fontSize: 12 }}
          tickFormatter={formatValue}
          stroke={gridColor}
          hide={!showYAxis}
          width={50}
        />
        {showTooltip && (
          <Tooltip
            contentStyle={{
              backgroundColor: tooltipBg,
              border: "1px solid #e2e8f0",
              borderRadius: "0.375rem",
              fontSize: "0.75rem",
            }}
            formatter={(value: number, name: string) => [
              formatValue ? formatValue(value) : value,
              name,
            ]}
            labelFormatter={(label) =>
              formatLabel ? formatLabel(label) : label
            }
          />
        )}
        {showLegend && (
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            formatter={(value) => (
              <span style={{ color: textColor }}>{value}</span>
            )}
          />
        )}
        {yAxisKeys.map((key, index) => (
          <Line
            key={`line-${key}-${index}`}
            type={smooth ? "monotone" : "linear"}
            dataKey={key}
            stroke={colors[index % colors.length]}
            strokeWidth={2}
            dot={showDots ? { stroke: colors[index % colors.length], strokeWidth: 2, r: 3 } : false}
            activeDot={{ r: 6, stroke: colors[index % colors.length], strokeWidth: 1 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

interface ChartPieProps {
  data: Array<{ name: string; value: number }>;
  colors?: string[];
  showTooltip?: boolean;
  showLegend?: boolean;
  chartHeight?: number;
  innerRadius?: number;
  outerRadius?: number;
  paddingAngle?: number;
  formatValue?: (value: number) => string;
  formatName?: (name: string) => string;
  onClick?: (data: any) => void;
}

export function ChartPie({
  data,
  colors = ["#3b82f6", "#10b981", "#ef4444", "#f59e0b", "#a855f7", "#0ea5e9", "#8b5cf6", "#ec4899"],
  showTooltip = true,
  showLegend = true,
  chartHeight = 200,
  innerRadius = 0,
  outerRadius = 80,
  paddingAngle = 0,
  formatValue,
  formatName,
  onClick,
}: ChartPieProps) {
  // Use the theme hook to get the current theme
  const { theme } = useTheme();
  
  // Define theme-based colors for light theme
  const textColor = "#666666";
  const tooltipBg = "#ffffff";

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          paddingAngle={paddingAngle}
          dataKey="value"
          onClick={onClick}
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={colors[index % colors.length]}
            />
          ))}
        </Pie>
        {showTooltip && (
          <Tooltip
            contentStyle={{
              backgroundColor: tooltipBg,
              border: "1px solid #e2e8f0",
              borderRadius: "0.375rem",
              fontSize: "0.75rem",
            }}
            formatter={(value: number) =>
              formatValue ? [formatValue(value), ""] : [value, ""]
            }
            labelFormatter={(name) =>
              formatName ? formatName(name) : name
            }
          />
        )}
        {showLegend && (
          <Legend
            layout="vertical"
            verticalAlign="middle"
            align="right"
            wrapperStyle={{ fontSize: 12, paddingLeft: 20 }}
            formatter={(value) => (
              <span style={{ color: textColor }}>
                {formatName ? formatName(value) : value}
              </span>
            )}
          />
        )}
      </PieChart>
    </ResponsiveContainer>
  );
}
