import * as React from "react"
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, LineChart as RechartsLineChart, Line } from "recharts"

interface ChartProps {
  data: any[]
  index: string
  categories: string[]
  colors?: string[]
  valueFormatter?: (value: number) => string
  yAxisWidth?: number
  showLabel?: boolean
  valueKey?: string
  categoryKey?: string
}

export function BarChart({
  data,
  index,
  categories,
  colors = ["blue", "green", "red", "yellow", "purple"],
  valueFormatter,
  yAxisWidth = 40,
}: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsBarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey={index} />
        <YAxis width={yAxisWidth} tickFormatter={valueFormatter} />
        <Tooltip
          formatter={(value, name, props) => {
            return [valueFormatter ? valueFormatter(Number(value)) : value, name]
          }}
        />
        <Legend />
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

export function PieChart({ data, valueKey, categoryKey, colors = ["blue", "green", "red"], showLabel = false }: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
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
          label={showLabel ? ({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%` : undefined}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={`var(--${colors[index % colors.length]}-500)`} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </RechartsPieChart>
    </ResponsiveContainer>
  );
}

export function LineChart({ data, index, categories, colors = ["blue", "green", "red"], valueFormatter }: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsLineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={index} />
        <YAxis tickFormatter={valueFormatter} />
        <Tooltip formatter={(value, name) => [valueFormatter ? valueFormatter(Number(value)) : value, name]} />
        <Legend />
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
