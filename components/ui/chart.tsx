
import * as React from "react"
import { 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell, 
  LineChart as RechartsLineChart, 
  Line, 
  AreaChart as RechartsAreaChart, 
  Area 
} from "recharts"

export interface ChartProps {
  data: any[]
  index: string
  categories: string[]
  colors?: string[]
  valueFormatter?: (value: number) => string
  yAxisWidth?: number
  showLabel?: boolean
  valueKey?: string
  categoryKey?: string
  className?: string
  showLegend?: boolean
  showGridLines?: boolean
  startEndOnly?: boolean
}

export function BarChart({
  data,
  index,
  categories,
  colors = ["blue", "green", "red", "yellow", "purple"],
  valueFormatter,
  yAxisWidth = 40,
  className,
  showLegend = true,
  showGridLines = true,
  startEndOnly = false,
}: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%" className={className}>
      <RechartsBarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
        {showGridLines && <CartesianGrid strokeDasharray="3 3" vertical={false} />}
        <XAxis 
          dataKey={index} 
          tickFormatter={startEndOnly ? 
            (value, index) => index === 0 || index === data.length - 1 ? value : '' : 
            undefined
          } 
        />
        <YAxis width={yAxisWidth} tickFormatter={valueFormatter} />
        <Tooltip
          formatter={(value: number, name: string) => {
            return [valueFormatter ? valueFormatter(value) : value, name]
          }}
        />
        {showLegend && <Legend />}
        {categories.map((category, i) => (
          <Bar
            key={category}
            dataKey={category}
            fill={`var(--${colors[i % colors.length]}-500)`}
            name={category}
          />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  )
}

export function PieChart({ 
  data, 
  valueKey = "value", 
  categoryKey = "name", 
  colors = ["blue", "green", "red"], 
  showLabel = false,
  valueFormatter,
  className,
  index,
  categories,
  showLegend = true,
}: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%" className={className}>
      <RechartsPieChart>
        <Pie
          data={data}
          dataKey={valueKey}
          nameKey={categoryKey}
          cx="50%"
          cy="50%"
          outerRadius={80}
          fill="#8884d8"
          labelLine={false}
          label={showLabel ? ({ name, percent }: { name: string; percent: number }) => `${name} ${(percent * 100).toFixed(0)}%` : undefined}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={`var(--${colors[index % colors.length]}-500)`} />
          ))}
        </Pie>
        <Tooltip formatter={(value: number) => [valueFormatter ? valueFormatter(value) : value, ""]} />
        {showLegend && <Legend />}
      </RechartsPieChart>
    </ResponsiveContainer>
  );
}

export function LineChart({ 
  data, 
  index, 
  categories, 
  colors = ["blue", "green", "red"], 
  valueFormatter,
  className,
  showLegend = true,
  showGridLines = true,
  startEndOnly = false,
}: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%" className={className}>
      <RechartsLineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        {showGridLines && <CartesianGrid strokeDasharray="3 3" />}
        <XAxis 
          dataKey={index} 
          tickFormatter={startEndOnly ? 
            (value, index) => index === 0 || index === data.length - 1 ? value : '' : 
            undefined
          } 
        />
        <YAxis tickFormatter={valueFormatter} />
        <Tooltip formatter={(value: number, name: string) => [valueFormatter ? valueFormatter(value) : value, name]} />
        {showLegend && <Legend />}
        {categories.map((category, i) => (
          <Line
            key={category}
            type="monotone"
            dataKey={category}
            stroke={`var(--${colors[i % colors.length]}-500)`}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}

export function AreaChart({ 
  data, 
  index, 
  categories, 
  colors = ["blue", "green", "red"], 
  valueFormatter, 
  yAxisWidth = 40,
  className,
  showLegend = true,
  showGridLines = true,
  startEndOnly = false,
}: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%" className={className}>
      <RechartsAreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        {showGridLines && <CartesianGrid strokeDasharray="3 3" />}
        <XAxis 
          dataKey={index} 
          tickFormatter={startEndOnly ? 
            (value, index) => index === 0 || index === data.length - 1 ? value : '' : 
            undefined
          }
        />
        <YAxis width={yAxisWidth} tickFormatter={valueFormatter} />
        <Tooltip formatter={(value: number, name: string) => [valueFormatter ? valueFormatter(value) : value, name]} />
        {showLegend && <Legend />}
        {categories.map((category, i) => (
          <Area
            key={category}
            type="monotone"
            dataKey={category}
            stackId="1"
            stroke={`var(--${colors[i % colors.length]}-500)`}
            fill={`var(--${colors[i % colors.length]}-200)`}
            name={category}
          />
        ))}
      </RechartsAreaChart>
    </ResponsiveContainer>
  );
}
